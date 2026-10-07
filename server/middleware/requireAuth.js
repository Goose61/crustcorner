import { verifySession } from '../lib/auth.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.crust_token;
  const wallet = verifySession(token);
  if (!wallet) return res.status(401).json({ error: 'Unauthorized' });
  req.wallet = wallet;
  next();
}
