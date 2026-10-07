# Hosting Crust Corner (GitHub + Vercel + Cloudflare)

The game is **two parts**:

| Part | What | Where to host |
|------|------|----------------|
| **Frontend** | `index.html`, `game.js`, `assets/`, etc. | **Vercel** (static) |
| **API** | `server/` — Express, wallet auth, MongoDB, NFT mint | **Railway**, **Render**, or **Fly.io** (not Vercel serverless without a rewrite) |

MongoDB lives in **[MongoDB Atlas](https://www.mongodb.com/cloud/atlas)** (free M0 cluster). Vercel does not run your database.

---

## 1. GitHub

1. Create a repo and push this project.
2. Do **not** commit `server/.env` or wallet secret keys.

---

## 2. MongoDB Atlas

1. Create a free cluster.
2. Database Access → user + password.
3. Network Access → allow `0.0.0.0/0` (or your API host IPs only).
4. Connect → copy URI, e.g. `mongodb+srv://user:pass@cluster.mongodb.net/crust_corner`

---

## 3. API host (Railway example)

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub repo.
2. Set **root directory** to `server` (or deploy with Docker from repo root using `docker-compose.yml` on a VPS).
3. **Variables:**

   | Variable | Example |
   |----------|---------|
   | `MONGODB_URI` | Atlas URI |
   | `JWT_SECRET` | long random string |
   | `CLIENT_ORIGIN` | `https://play.yourdomain.com` |
   | `ALLOWED_ORIGINS` | `https://play.yourdomain.com,https://www.yourdomain.com` |
   | `SOLANA_RPC` | `https://api.devnet.solana.com` |
   | `MINTER_SECRET_KEY` | optional; devnet minter wallet (secret) |
   | `NFT_NETWORK` | `devnet` or `mainnet-beta` |
   | `PORT` | often set by platform |

4. Generate a public URL, e.g. `https://crust-api-production.up.railway.app`
5. Health check: `GET https://YOUR-API/api/health` → `{ ok: true, mongo: true }`

**Render / Fly:** same env vars; start command `node index.js` in `server/`.

---

## 4. Frontend on Vercel

1. [vercel.com](https://vercel.com) → Import GitHub repo.
2. **Root directory:** project root (not `server`).
3. Framework: **Other** (uses [`vercel.json`](vercel.json)).
4. **Environment variable (Production):**

   `CRUST_API_BASE` = `https://YOUR-API-URL` (no trailing slash)

   The build script injects this into `index.html` as `meta name="crust-api-base"`.

5. Deploy. You get something like `https://crust-corner.vercel.app`.

---

## 5. Cloudflare custom domain

Typical setup: **play.yourdomain.com** → game, **api.yourdomain.com** → API (optional but clean).

### Game (Vercel)

1. Vercel project → Settings → Domains → add `play.yourdomain.com`.
2. Cloudflare DNS → **CNAME** `play` → `cname.vercel-dns.com` (Vercel shows exact target).
3. SSL: Full (strict) is fine; Vercel provides HTTPS.

### API (Railway/Render)

1. Add custom domain in the API host panel, e.g. `api.yourdomain.com`.
2. Cloudflare → **CNAME** `api` → Railway/Render hostname.
3. Update env:
   - `CLIENT_ORIGIN=https://play.yourdomain.com`
   - `ALLOWED_ORIGINS=https://play.yourdomain.com`
4. Update Vercel `CRUST_API_BASE=https://api.yourdomain.com` and **redeploy**.

---

## 6. Wallet + CORS checklist

- Game and API must both use **HTTPS** in production.
- `ALLOWED_ORIGINS` must include the exact URL players use (scheme + host, no path).
- Players use **Phantom / Solflare**; the site origin must be allowed by the wallet (normal HTTPS domain is fine).
- Never put `MINTER_SECRET_KEY` or `JWT_SECRET` in the frontend or Vercel public env for the game only — API secrets stay on the API host.

---

## 7. Single-server alternative (no Vercel)

Run `docker compose up` on a VPS (Hetzner, DigitalOcean, etc.):

- Point Cloudflare **A** or **CNAME** to the VPS.
- One URL serves game + API (`CRUST_API_BASE` empty = same origin).
- Set `CLIENT_ORIGIN` and `ALLOWED_ORIGINS` to that URL.
- Use Atlas for MongoDB anyway.

---

## 8. After deploy — smoke test

1. Open `https://play.yourdomain.com`
2. **Connect wallet** → sign message → no CORS errors in browser console (F12).
3. Play → status should show **Cloud +** when synced.
4. 🎴 Recipe NFTs → mint after 10 rated servings (with wallet connected).

If saves fail: check `/api/health` (`mongo: true`) and CORS origins.
