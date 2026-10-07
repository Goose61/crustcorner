import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const api = process.env.CRUST_API_BASE || process.env.VITE_CRUST_API_BASE || '';
const indexPath = join(process.cwd(), 'index.html');
let html = readFileSync(indexPath, 'utf8');
const tag = `<meta name="crust-api-base" content="${api.replace(/"/g, '')}">`;
if (html.includes('name="crust-api-base"')) {
  html = html.replace(/<meta name="crust-api-base" content="[^"]*">/, tag);
} else {
  html = html.replace('</head>', `  ${tag}\n</head>`);
}
writeFileSync(indexPath, html);
console.log('CRUST_API_BASE', api || '(same origin — use only if API is co-hosted)');
