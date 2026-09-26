import SftpClient from 'ssh2-sftp-client';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(projectDir, '../..');
const env = {};
for (const line of (await readFile(join(rootDir, '.env.deploy.local'), 'utf8')).split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (match) env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
}
const required = ['OVH_DEPLOY_HOST', 'OVH_DEPLOY_USER', 'OVH_DEPLOY_PASSWORD', 'OVH_DEPLOY_PATH'];
if (required.some(key => !env[key])) throw new Error('Brak konfiguracji OVH w .env.deploy.local.');

const client = new SftpClient();
client.client.on('keyboard-interactive', (_name, _instructions, _language, prompts, finish) => finish(prompts.map(() => env.OVH_DEPLOY_PASSWORD)));
await client.connect({
  host: env.OVH_DEPLOY_HOST,
  port: Number(env.OVH_DEPLOY_PORT || 22),
  username: env.OVH_DEPLOY_USER,
  password: env.OVH_DEPLOY_PASSWORD,
  tryKeyboard: true,
  readyTimeout: 20000,
});

const remoteRoot = posix.join(env.OVH_DEPLOY_PATH, 'quickscreen v2');
const allowedRoots = new Set(['index.html', '.htaccess', 'css', 'js', 'assets']);
async function uploadTree(localDir, remoteDir) {
  if (!(await client.exists(remoteDir))) await client.mkdir(remoteDir, true);
  for (const entry of await readdir(localDir, { withFileTypes: true })) {
    const local = join(localDir, entry.name);
    const remote = posix.join(remoteDir, entry.name);
    if (entry.isDirectory()) await uploadTree(local, remote);
    else await client.fastPut(local, remote);
  }
}

try {
  if (!(await client.exists(remoteRoot))) await client.mkdir(remoteRoot, true);
  for (const entry of await readdir(projectDir, { withFileTypes: true })) {
    if (!allowedRoots.has(entry.name)) continue;
    const local = join(projectDir, entry.name);
    const remote = posix.join(remoteRoot, entry.name);
    if (entry.isDirectory()) {
      if (!(await client.exists(remote))) await client.mkdir(remote, true);
      await uploadTree(local, remote);
    } else await client.fastPut(local, remote);
  }
  console.log(JSON.stringify({ published: remoteRoot, files: 'index.html, css/, js/, assets/, .htaccess' }));
} finally {
  await client.end();
}
