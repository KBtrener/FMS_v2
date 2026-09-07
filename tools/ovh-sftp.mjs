import SftpClient from 'ssh2-sftp-client';
import { Client as FtpClient } from 'basic-ftp';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { basename, join, posix, resolve } from 'node:path';

async function localEnv() {
  const values = {};
  for (const line of (await readFile('.env.deploy.local', 'utf8')).split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match) values[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
  return values;
}

const env = await localEnv();
const required = ['OVH_DEPLOY_HOST', 'OVH_DEPLOY_USER', 'OVH_DEPLOY_PASSWORD', 'OVH_DEPLOY_PATH'];
if (required.some(key => !env[key])) throw new Error('Brak wymaganej konfiguracji OVH w .env.deploy.local.');
const command = process.argv[2] || 'audit';
const protocol = String(env.OVH_DEPLOY_PROTOCOL || 'sftp').toLowerCase();

if (protocol === 'ftp' || protocol === 'ftps') {
  const ftp = new FtpClient();
  ftp.ftp.verbose = false;
  try {
    await ftp.access({ host: env.OVH_DEPLOY_HOST, port: Number(env.OVH_DEPLOY_PORT || 21), user: env.OVH_DEPLOY_USER, password: env.OVH_DEPLOY_PASSWORD, secure: protocol === 'ftps' });
    const target = env.OVH_DEPLOY_PATH;
    if (command === 'audit') {
      const entries = await ftp.list(target);
      console.log(JSON.stringify({ documentRoot: target, entries: entries.map(x => ({ name: x.name, type: x.isDirectory ? 'd' : '-', size: x.size })) }, null, 2));
    } else if (command === 'download') {
      const remote = process.argv[3], local = process.argv[4]; if (!remote || !local) throw new Error('Użycie: download REMOTE LOCAL');
      await mkdir(resolve(local, '..'), { recursive: true }); await ftp.downloadTo(local, remote); console.log(JSON.stringify({ downloaded: remote, local }));
    } else if (command === 'mkdir-quickscreen') {
      await ftp.ensureDir(posix.join(target, 'quickscreen')); console.log(JSON.stringify({ directory: posix.join(target, 'quickscreen') }));
    } else if (command === 'upload-file') {
      const local = process.argv[3], remoteName = process.argv[4]; if (!local || !remoteName || remoteName.includes('..')) throw new Error('Nieprawidłowa ścieżka uploadu.');
      const remote = posix.join(target, 'quickscreen', remoteName.replaceAll('\\', '/')); await ftp.ensureDir(posix.dirname(remote)); await ftp.uploadFrom(local, remote); console.log(JSON.stringify({ uploaded: basename(local), remote }));
    } else if (command === 'upload-home') {
      const local = process.argv[3], remoteName = process.argv[4]; if (!local || !['index.html', 'index.htm', 'index.php'].includes(remoteName)) throw new Error('Dozwolona jest wyłącznie aktualizacja pliku startowego.');
      const remote = posix.join(target, remoteName); await ftp.uploadFrom(local, remote); console.log(JSON.stringify({ uploaded: remoteName, remote }));
    } else throw new Error('Nieznane polecenie.');
  } finally { ftp.close(); }
  process.exit(0);
}

const client = new SftpClient();
client.client.on('keyboard-interactive', (_name, _instructions, _language, prompts, finish) => finish(prompts.map(() => env.OVH_DEPLOY_PASSWORD)));
await client.connect({ host: env.OVH_DEPLOY_HOST, port: Number(env.OVH_DEPLOY_PORT || 22), username: env.OVH_DEPLOY_USER, password: env.OVH_DEPLOY_PASSWORD, tryKeyboard: true, readyTimeout: 20000 });
try {
  const home = await client.realPath('.');
  const target = await client.realPath(env.OVH_DEPLOY_PATH);
  if (command === 'audit') {
    const entries = await client.list(target);
    console.log(JSON.stringify({ home, documentRoot: target, entries: entries.map(x => ({ name: x.name, type: x.type, size: x.size })) }, null, 2));
  } else if (command === 'download') {
    const remote = process.argv[3]; const local = process.argv[4];
    if (!remote || !local) throw new Error('Użycie: download REMOTE LOCAL');
    await mkdir(resolve(local, '..'), { recursive: true }); await client.fastGet(remote, local);
    console.log(JSON.stringify({ downloaded: remote, local }));
  } else if (command === 'mkdir-quickscreen') {
    const dir = posix.join(target, 'quickscreen');
    if (!(await client.exists(dir))) await client.mkdir(dir, false);
    console.log(JSON.stringify({ directory: dir }));
  } else if (command === 'upload-file') {
    const local = process.argv[3]; const remoteName = process.argv[4];
    if (!local || !remoteName || remoteName.includes('..')) throw new Error('Nieprawidłowa ścieżka uploadu.');
    const quick = posix.join(target, 'quickscreen');
    if (!(await client.exists(quick))) await client.mkdir(quick, false);
    const remote = posix.join(quick, remoteName.replaceAll('\\', '/'));
    const parent = posix.dirname(remote); if (!(await client.exists(parent))) await client.mkdir(parent, true);
    await client.fastPut(local, remote); console.log(JSON.stringify({ uploaded: basename(local), remote }));
  } else if (command === 'patch-service-worker') {
    const remote = posix.join(target, 'sw.js');
    const source = (await client.get(remote)).toString('utf8');
    const needle = 'new e.NavigationRoute(e.createHandlerBoundToURL("index.html"))';
    const replacement = 'new e.NavigationRoute(e.createHandlerBoundToURL("index.html"),{denylist:[/^\\/quickscreen(?:\\/|$)/]})';
    if (!source.includes(needle) && !source.includes('/^\\/quickscreen(?:\\/|$)/')) throw new Error('Nie znaleziono oczekiwanej reguły nawigacji service workera.');
    const revision = process.argv[3];
    if (!revision || !/^[a-f0-9]{32}$/i.test(revision)) throw new Error('Wymagany jest poprawny hash rewizji index.html.');
    const revisionPattern = /\{url:"index\.html",revision:"[^"]+"\}/;
    const withRoute = source.replace(needle, replacement);
    if (!revisionPattern.test(withRoute)) throw new Error('Nie znaleziono rewizji index.html w service workerze.');
    const updated = withRoute.replace(revisionPattern, `{url:"index.html",revision:"${revision.toLowerCase()}"}`);
    await client.put(Buffer.from(updated, 'utf8'), remote);
    console.log(JSON.stringify({ patched: remote, excludedPath: '/quickscreen/', indexRevision: revision.toLowerCase() }));
  } else if (command === 'upload-home') {
    const local = process.argv[3]; const remoteName = process.argv[4];
    if (!local || !['index.html', 'index.htm', 'index.php'].includes(remoteName)) throw new Error('Dozwolona jest wyłącznie aktualizacja pliku startowego.');
    const remote = posix.join(target, remoteName); await client.fastPut(local, remote); console.log(JSON.stringify({ uploaded: remoteName, remote }));
  } else throw new Error('Nieznane polecenie.');
} finally { await client.end(); }
