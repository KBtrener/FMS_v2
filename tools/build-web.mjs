import { cp, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve('.'), out = resolve('dist/web');
await mkdir(out, { recursive: true });
await cp(resolve(root, 'web'), out, { recursive: true, filter: name => !name.endsWith('config.js') && !name.endsWith('config.example.js') });
const url = process.env.SUPABASE_PROJECT_URL || ''; const key = process.env.SUPABASE_PUBLISHABLE_KEY || '';
await writeFile(resolve(out, 'config.js'), `window.__SUPABASE_CONFIG__=${JSON.stringify({ url, key })};\n`);
console.log(`Built web app to ${out}`);
