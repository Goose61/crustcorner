'use strict';
const metaApi = document.querySelector('meta[name="crust-api-base"]')?.getAttribute('content');
window.CRUST_CONFIG = {
  apiBase: window.CRUST_API_BASE || metaApi || '',
};
