import { build } from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

async function envFile(path) {
  const values = {};
  try { for (const line of (await readFile(path, 'utf8')).split(/\r?\n/)) { const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/); if (match) values[match[1]] = match[2].replace(/^['"]|['"]$/g, ''); } } catch {}
  return values;
}

const local = await envFile('.env.local');
const url = process.env.SUPABASE_PROJECT_URL || process.env.SUPABASE_API_URL || local.SUPABASE_PROJECT_URL || local.SUPABASE_API_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY || local.SUPABASE_PUBLISHABLE_KEY;
const projectUrl = url?.replace(/\/(?:rest|auth|storage)\/v1\/?$/, '').replace(/\/+$/, '');
if (!projectUrl || !key) throw new Error('Brak SUPABASE_API_URL/SUPABASE_PROJECT_URL lub SUPABASE_PUBLISHABLE_KEY.');
const out = resolve('dist/web');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await Promise.all(['index.html', 'styles.css', '.htaccess'].map(name => cp(resolve('web', name), resolve(out, name))));
await cp(resolve('08_manual_criteria_and_report_text.md'), resolve(out, 'manual.md'));
await build({ entryPoints: [resolve('web/app.js')], outfile: resolve(out, 'app.js'), bundle: true, minify: true, sourcemap: false, format: 'esm', target: ['es2022'], define: { 'process.env.NODE_ENV': '"production"' } });
await writeFile(resolve(out, 'config.js'), `window.__SUPABASE_CONFIG__=${JSON.stringify({ url: projectUrl, key })};\n`);
console.log('Production build ready: dist/web (base /quickscreen/)');
