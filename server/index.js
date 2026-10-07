import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import saveRoutes from './routes/save.js';
import nftRoutes from './routes/nft.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const PORT = Number(process.env.PORT) || 8787;
const ORIGIN = process.env.CLIENT_ORIGIN || `http://localhost:${PORT}`;
const extraOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();
app.use(
  cors({
    origin: [ORIGIN, ...extraOrigins, 'http://localhost:8000', 'http://127.0.0.1:8000', 'http://localhost:8787'],
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    mongo: mongoose.connection.readyState === 1,
    onChainMint: Boolean(process.env.MINTER_SECRET_KEY),
    network: process.env.NFT_NETWORK || 'devnet',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/save', saveRoutes);
app.use('/api/nft', nftRoutes);

app.use(express.static(rootDir));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(rootDir, 'index.html'));
});

async function start() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crust_corner';
  await mongoose.connect(uri);
  console.log('MongoDB connected');
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Crust Corner server http://localhost:${PORT}`);
    console.log(`API health http://localhost:${PORT}/api/health`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
