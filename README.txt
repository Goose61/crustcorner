Crust Corner — Complete Game

Quick start (local only):
1. Open index.html in Chrome or Edge (progress in localStorage).

Cloud saves + wallet + recipe NFTs (Part B & D):
Option A — Docker: docker compose up --build  then open http://localhost:8787
Option B — Manual:
1. Install MongoDB locally or use MongoDB Atlas.
2. cd server && cp .env.example .env && npm install
3. Edit .env (MONGODB_URI, JWT_SECRET; optional MINTER_SECRET_KEY for devnet SPL mints)
4. npm start
5. Open http://localhost:8787
6. Connect Phantom or Solflare — sign in links your wallet to your MongoDB save.
7. Tap 🎴 for recipe NFTs (10 rated servings per pizza recipe to mint).

Main files:
world.js — items, recipes, economy, ratings, NFT eligibility
game.js — drawing, customers, chef
shop.js / orders.js — shop and orders
api-client.js / wallet.js / nft.js — cloud sync and Solana wallet
server/ — Express API + MongoDB

On-chain mints use Solana devnet by default when MINTER_SECRET_KEY is set (minter wallet needs SOL).
