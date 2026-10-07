'use strict';
const TOKEN_KEY = 'crust-auth-token';
const WALLET_KEY = 'crust-wallet';

function apiBase() {
  return (window.CRUST_CONFIG?.apiBase || '').replace(/\/$/, '');
}

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function sigToBase64(sig) {
  if (typeof sig === 'string') return sig;
  let bin = '';
  const bytes = sig instanceof Uint8Array ? sig : new Uint8Array(sig);
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${apiBase()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText || 'Request failed');
  return data;
}

let syncTimer = null;

window.CrustApi = {
  TOKEN_KEY,
  WALLET_KEY,
  apiBase,
  isAuthed() {
    return Boolean(localStorage.getItem(TOKEN_KEY) && localStorage.getItem(WALLET_KEY));
  },
  wallet() {
    return localStorage.getItem(WALLET_KEY);
  },
  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(WALLET_KEY);
  },
  async health() {
    return apiFetch('/api/health');
  },
  async getNonce(wallet) {
    return apiFetch(`/api/auth/nonce?wallet=${encodeURIComponent(wallet)}`);
  },
  async verify(wallet, message, signature) {
    const data = await apiFetch('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ wallet, message, signature: sigToBase64(signature) }),
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(WALLET_KEY, data.wallet);
    return data;
  },
  async pullSave() {
    return apiFetch('/api/save');
  },
  async pushSave(state) {
    return apiFetch('/api/save', {
      method: 'PUT',
      body: JSON.stringify({ state, clientUpdatedAt: state.savedAt || Date.now() }),
    });
  },
  queueSync(state) {
    if (!window.CrustApi.isAuthed()) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      window.CrustApi.pushSave(state).catch(() => {});
    }, 1200);
  },
  async mintRecipeNft(recipeIndex) {
    return apiFetch('/api/nft/mint', {
      method: 'POST',
      body: JSON.stringify({ recipeIndex }),
    });
  },
  async listNfts() {
    return apiFetch('/api/nft/mine');
  },
};
