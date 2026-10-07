# Full stack (API + static game). Build from repo root: docker compose up --build
FROM node:20-alpine
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev
COPY server/ ./
WORKDIR /app
COPY index.html config.js api-client.js game.js wallet.js nft.js shop.js orders.js world.js style.css ./
COPY assets ./assets
WORKDIR /app/server
ENV PORT=8787
EXPOSE 8787
CMD ["node", "index.js"]
