'use strict';

function walletProvider() {
  if (window.phantom?.solana?.isPhantom) return window.phantom.solana;
  if (window.solflare?.isSolflare) return window.solflare;
  return null;
}

function shortWallet(w) {
  return w ? `${w.slice(0, 4)}…${w.slice(-4)}` : '';
}

async function applyCloudSave(remote) {
  if (!remote?.state || remote.state.version !== 2) return false;
  const localTs = s.savedAt || 0;
  const remoteTs = remote.updatedAt || remote.clientUpdatedAt || 0;
  if (remoteTs <= localTs) return false;
  if (localTs > 0 && !confirm('Cloud save is newer than this device. Load cloud progress?')) return false;
  Object.assign(s, remote.state);
  W.normalize(s);
  save();
  hud();
  notify('Loaded progress from your wallet cloud save.');
  return true;
}

async function connectWallet() {
  const provider = walletProvider();
  if (!provider) {
    notify('Install Phantom or Solflare, then refresh.');
    window.open('https://phantom.app/', '_blank', 'noopener');
    return;
  }
  try {
    const resp = await provider.connect();
    const wallet = resp.publicKey?.toString?.() || provider.publicKey?.toString?.();
    if (!wallet) throw new Error('No public key');
    const { message } = await window.CrustApi.getNonce(wallet);
    const encoded = new TextEncoder().encode(message);
    const signed = await provider.signMessage(encoded, 'utf8');
    const signature = signed.signature || signed;
    await window.CrustApi.verify(wallet, message, signature);
    $('connectWallet').textContent = shortWallet(wallet);
    $('connectWallet').classList.add('connected');
    notify('Wallet connected. Your account is this address.');
    try {
      const remote = await window.CrustApi.pullSave();
      await applyCloudSave(remote);
    } catch {
      notify('Cloud save unavailable — playing locally until sync works.');
    }
    await window.CrustApi.pushSave(s).catch(() => {});
  } catch (err) {
    notify(err.message || 'Wallet connection cancelled.');
  }
}

function disconnectWallet() {
  window.CrustApi.clearSession();
  $('connectWallet').textContent = 'Connect wallet';
  $('connectWallet').classList.remove('connected');
  notify('Wallet disconnected. Local saves still work.');
}

function initWalletUi() {
  const btn = $('connectWallet');
  if (!btn) return;
  if (window.CrustApi.isAuthed()) {
    btn.textContent = shortWallet(window.CrustApi.wallet());
    btn.classList.add('connected');
  }
  btn.onclick = () => {
    if (window.CrustApi.isAuthed()) disconnectWallet();
    else connectWallet();
  };
}

document.addEventListener('DOMContentLoaded', () => {
  initWalletUi();
  if (window.CrustApi.isAuthed()) {
    window.CrustApi.pullSave()
      .then((remote) => applyCloudSave(remote))
      .catch(() => {});
  }
  window.CrustApi.health()
    .then((h) => {
      if (!h.ok) return;
      $('saveStatus').title = h.mongo
        ? 'Cloud saves available when wallet is connected'
        : 'Server up; MongoDB not connected';
    })
    .catch(() => {});
});
