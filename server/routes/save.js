import { Router } from 'express';
import { GameSave } from '../models/GameSave.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const doc = await GameSave.findOne({ wallet: req.wallet }).lean();
  if (!doc) return res.json({ state: null, updatedAt: 0, clientUpdatedAt: 0 });
  res.json({
    state: doc.state,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).getTime() : 0,
    clientUpdatedAt: doc.clientUpdatedAt || 0,
  });
});

router.put('/', requireAuth, async (req, res) => {
  const { state, clientUpdatedAt } = req.body || {};
  if (!state || state.version !== 2) return res.status(400).json({ error: 'Invalid save payload' });
  const ts = Number(clientUpdatedAt) || Date.now();
  const doc = await GameSave.findOneAndUpdate(
    { wallet: req.wallet },
    { state, clientUpdatedAt: ts },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json({
    ok: true,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).getTime() : ts,
    clientUpdatedAt: doc.clientUpdatedAt,
  });
});

export default router;
