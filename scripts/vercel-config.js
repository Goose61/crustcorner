import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, '..');
const indexPath = join(repoRoot, 'index.html');

if (!existsSync(indexPath)) {
  console.error(
    'Vercel: index.html not found at',
    indexPath,
    '\n→ Settings → General → Root Directory must be empty (repository root), NOT "server".',
    '\n→ The API lives on Render; Vercel only hosts the static game files at the repo root.'
  );
  process.exit(1);
}

if (process.env.VERCEL === '1' && !existsSync(join(process.cwd(), 'index.html'))) {
  console.error(
    'Vercel Root Directory is set to a subfolder (e.g. "server"), but the game lives at the repo root.',
    '\n→ Settings → General → Root Directory: clear the field and redeploy.',
    '\n→ Use Render (or similar) for the API only.'
  );
  process.exit(1);
}

const api = process.env.CRUST_API_BASE || process.env.VITE_CRUST_API_BASE || '';
let html = readFileSync(indexPath, 'utf8');
const tag = `<meta name="crust-api-base" content="${api.replace(/"/g, '')}">`;
if (html.includes('name="crust-api-base"')) {
  html = html.replace(/<meta name="crust-api-base" content="[^"]*">/, tag);
} else {
  html = html.replace('</head>', `  ${tag}\n</head>`);
}
writeFileSync(indexPath, html);
console.log('CRUST_API_BASE', api || '(empty — set CRUST_API_BASE in Vercel env, e.g. https://api.thecrust.io)');
