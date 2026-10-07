import { Router } from 'express';
import {
  buildSignInMessage,
  consumeNonce,
  issueNonce,
  signSession,
  verifyWalletSignature,
} from '../lib/auth.js';

const router = Router();

router.get('/nonce', (req, res) => {
  const wallet = String(req.query.wallet || '').trim();
  if (!wallet || wallet.length < 32) return res.status(400).json({ error: 'Invalid wallet' });
  const nonce = issueNonce(wallet);
  const message = buildSignInMessage(wallet, nonce);
  res.json({ wallet, nonce, message });
});

router.post('/verify', (req, res) => {
  const { wallet, message, signature } = req.body || {};
  if (!wallet || !message || !signature) return res.status(400).json({ error: 'Missing fields' });
  const nonce = (message.match(/Nonce: (.+)$/m) || [])[1];
  if (!nonce || !consumeNonce(wallet, nonce)) return res.status(400).json({ error: 'Invalid or expired nonce' });
  if (!verifyWalletSignature(wallet, message, signature)) {
    return res.status(401).json({ error: 'Signature verification failed' });
  }
  const token = signSession(wallet);
  res.json({ token, wallet });
});

export default router;
