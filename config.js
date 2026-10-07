'use strict';

function defaultApiBase() {
  const host = window.location.hostname;
  if (host === 'play.thecrust.io') return 'https://api.thecrust.io';
  if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:8787';
  if (host.endsWith('.vercel.app')) return 'https://api.thecrust.io';
  return '';
}

const metaApi = document.querySelector('meta[name="crust-api-base"]')?.getAttribute('content');
window.CRUST_CONFIG = {
  apiBase: window.CRUST_API_BASE || metaApi || defaultApiBase(),
};
