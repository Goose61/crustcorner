import jwt from 'jsonwebtoken';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me';
const nonces = new Map();

export function issueNonce(wallet) {
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  nonces.set(wallet, { nonce, at: Date.now() });
  return nonce;
}

export function buildSignInMessage(wallet, nonce) {
  return `Sign in to Crust Corner\nWallet: ${wallet}\nNonce: ${nonce}`;
}

export function verifyWalletSignature(wallet, message, signature) {
  try {
    const pubkey = bs58.decode(wallet);
    let sig;
    if (typeof signature === 'string' && signature.length > 80 && !signature.includes('=')) {
      sig = bs58.decode(signature);
    } else {
      sig = Buffer.from(signature, 'base64');
    }
    const msg = new TextEncoder().encode(message);
    return nacl.sign.detached.verify(msg, sig, pubkey);
  } catch {
    return false;
  }
}

export function consumeNonce(wallet, nonce) {
  const entry = nonces.get(wallet);
  if (!entry || entry.nonce !== nonce) return false;
  if (Date.now() - entry.at > 10 * 60 * 1000) {
    nonces.delete(wallet);
    return false;
  }
  nonces.delete(wallet);
  return true;
}

export function signSession(wallet) {
  return jwt.sign({ wallet }, JWT_SECRET, { expiresIn: '30d' });
}

export function verifySession(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload.wallet;
  } catch {
    return null;
  }
}
