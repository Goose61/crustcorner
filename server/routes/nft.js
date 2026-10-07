import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { GameSave } from '../models/GameSave.js';
import { RecipeNft } from '../models/RecipeNft.js';
import { mintRecipeTokenToWallet } from '../lib/solanaMint.js';

const router = Router();
const REVIEW_MIN = 10;

function statsFromState(state, recipeIndex) {
  const rev = state?.recipeReviews?.[String(recipeIndex)] || [];
  if (!rev.length) return { count: 0, avg: 0 };
  const avg = rev.reduce((a, b) => a + b, 0) / rev.length;
  return { count: rev.length, avg: +avg.toFixed(2) };
}

router.get('/metadata/:cardId', async (req, res) => {
  const card = await RecipeNft.findOne({ cardId: Number(req.params.cardId) }).lean();
  if (!card) return res.status(404).json({ error: 'Not found' });
  res.json({
    name: `Crust Corner · ${card.name}`,
    symbol: 'PIZZA',
    description: `Recipe NFT · ${card.avg}★ average from ${card.reviews} reviews · value ${card.value}`,
    image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    attributes: [
      { trait_type: 'Recipe', value: card.name },
      { trait_type: 'Average rating', value: String(card.avg) },
      { trait_type: 'Value', value: String(card.value) },
    ],
  });
});

router.get('/mine', requireAuth, async (req, res) => {
  const list = await RecipeNft.find({ wallet: req.wallet }).sort({ mintedAt: -1 }).lean();
  res.json({ nfts: list });
});

router.post('/mint', requireAuth, async (req, res) => {
  const recipeIndex = Number(req.body?.recipeIndex);
  const SIDE_RECIPES = new Set([6, 7]);
  if (!Number.isInteger(recipeIndex) || recipeIndex < 0 || SIDE_RECIPES.has(recipeIndex)) {
    return res.status(400).json({ error: 'Invalid recipeIndex' });
  }

  const saveDoc = await GameSave.findOne({ wallet: req.wallet });
  const state = saveDoc?.state;
  if (!state) return res.status(400).json({ error: 'No cloud save found. Play and sync first.' });

  const recipes = state.recipeReviews || {};
  const { count, avg } = statsFromState(state, recipeIndex);
  if (count < REVIEW_MIN) {
    return res.status(400).json({ error: `Need ${REVIEW_MIN - count} more rated servings.` });
  }
  if (avg < 2) return res.status(400).json({ error: 'Recipe average below 2★ — cannot mint.' });

  const existing = await RecipeNft.findOne({ wallet: req.wallet, recipeIndex, retired: false });
  if (existing) return res.status(400).json({ error: 'Already minted for this recipe.' });

  const recipeName =
    state.objects && Array.isArray(state.objects)
      ? ['Margherita', 'Pepperoni', 'Garden Party', 'Gustav Special Pizza', 'AB Pizza', 'Hap Special Pizza', 'Crispy fries', 'Ice-cold cola', '1996 Special Pizza'][recipeIndex]
      : 'Recipe';

  const costTable = [12, 20, 28, 50, 75, 110, 8, 4, 140];
  const cost = costTable[recipeIndex] || 12;
  const value = cost + Math.round(avg * 10);
  const cardId = Date.now();

  let onChain = null;
  const mintResult = await mintRecipeTokenToWallet({ recipientWallet: req.wallet });
  if (mintResult.ok) {
    onChain = {
      mint: mintResult.mint,
      signature: mintResult.signature,
      network: mintResult.network,
    };
  }

  const card = await RecipeNft.create({
    wallet: req.wallet,
    cardId,
    recipeIndex,
    name: recipeName || `Recipe ${recipeIndex}`,
    avg,
    value,
    reviews: count,
    retired: avg < 2,
    onChain,
  });

  state.nfts = Array.isArray(state.nfts) ? state.nfts : [];
  state.nfts.push({
    id: cardId,
    recipeIndex,
    name: card.name,
    cost,
    avg,
    value,
    reviews: count,
    retired: card.retired,
    mintedAt: cardId,
    onChain,
  });
  saveDoc.state = state;
  saveDoc.clientUpdatedAt = Date.now();
  await saveDoc.save();

  res.json({
    card,
    onChainConfigured: Boolean(process.env.MINTER_SECRET_KEY),
    onChain: onChain || { skipped: true, reason: mintResult.reason },
  });
});

export default router;
