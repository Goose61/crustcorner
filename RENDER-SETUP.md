# Render API setup (api.thecrust.io)

This is **only** the Node API in the `server/` folder. The game files stay on **Vercel**.

---

## Before you start

1. Code is on GitHub: `Goose61/crustcorner` (push your latest `main` first).
2. You have a MongoDB Atlas URI (database name `crust_corner`).
3. Copy `JWT_SECRET` from your local `server/.env` (or generate a new long random string).

---

## A. Create the web service (first time)

1. Open **[dashboard.render.com](https://dashboard.render.com)** and sign in.
2. Top right: **New +** → **Web Service**.
3. Under **Git Provider**, pick **GitHub** if needed, then find **crustcorner** → **Connect**.
4. You should land on a page titled something like **Create a Web Service** with a long form. Use these values:

| Field on the form | What to enter |
|-------------------|---------------|
| **Name** | `crustcorner-api` (any name you like) |
| **Region** | Any (e.g. Frankfurt or Oregon) |
| **Branch** | `main` |
| **Root Directory** | `server` ← type exactly this, no slash |
| **Language** / **Runtime** | **Node** (not Python, not Docker) |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free (or paid) |

5. **Environment variables** (same page, scroll down — **Environment Variables** or **Add Environment Variable**):

   Click **Add Environment Variable** for each row:

   | Key | Value |
   |-----|--------|
   | `MONGODB_URI` | Your Atlas connection string ending in `/crust_corner?...` |
   | `JWT_SECRET` | Same secret as local `server/.env` |
   | `CLIENT_ORIGIN` | `https://play.thecrust.io` |
   | `ALLOWED_ORIGINS` | `https://play.thecrust.io` |
   | `SOLANA_RPC` | `https://api.devnet.solana.com` |
   | `NFT_NETWORK` | `devnet` |

   Do **not** add `PORT` — Render sets it automatically.

6. Click **Create Web Service** (or **Deploy Web Service**) at the bottom.

7. Wait until the deploy finishes (green **Live**). Open:

   `https://YOUR-SERVICE-NAME.onrender.com/api/health`

   You want JSON like: `{ "ok": true, "mongo": true }`.

   If `mongo` is `false`, fix Atlas **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`).

---

## B. If Render is using Docker (build log mentions `Dockerfile`)

That happens when Render sees a Dockerfile or you picked Docker earlier.

1. Dashboard → click your **crustcorner-api** service (left sidebar under your project).
2. Left sidebar → **Settings** (near the bottom).
3. Scroll to **Build & Deploy**.
4. Set:
   - **Root Directory** → `server`
   - **Runtime** / **Environment** → **Node** (turn **off** Docker if there is a Docker toggle)
   - **Build Command** → `npm install`
   - **Start Command** → `npm start`
   - If you see **Dockerfile Path**, **clear** that field (empty).
5. **Save Changes**.
6. Top right **Manual Deploy** → **Deploy latest commit**.

The repo should **not** ship a `server/Dockerfile` anymore (Docker is only for local `docker compose` at the repo root).

---

## C. Health check (optional but recommended)

1. Service → **Settings** → **Health Checks** (or under Build & Deploy).
2. **Health Check Path** → `/api/health`
3. Save.

---

## D. Custom domain `api.thecrust.io`

1. Service → **Settings** → **Custom Domains**.
2. **Add Custom Domain** → `api.thecrust.io`.
3. Render shows a **CNAME** target (e.g. `crustcorner-api.onrender.com`).
4. In **Cloudflare** → **thecrust.io** → **DNS** → add:

   | Type | Name | Content | Proxy |
   |------|------|---------|-------|
   | CNAME | `api` | (target Render gave you) | **DNS only** (grey cloud) |

5. Wait for SSL, then test: `https://api.thecrust.io/api/health`

---

## E. Vercel (game) — one setting that breaks everything

Vercel must deploy the **whole repo**, not `server/`.

1. [vercel.com](https://vercel.com) → your **crustcorner** project.
2. **Settings** → **General**.
3. Find **Root Directory**:
   - If it shows `server` → click **Edit** → **delete** the text so it is **empty** → **Save**.
4. **Deployments** → latest deployment → **⋯** → **Redeploy**.

After you push the latest code, Vercel does **not** need a build script: `config.js` points `play.thecrust.io` at `https://api.thecrust.io` automatically.

Optional env var on Vercel: `CRUST_API_BASE` only if you use a different API URL (requires running `node scripts/vercel-config.js` locally before deploy, or add the meta tag in `index.html`).

---

## Quick checklist

| Platform | Root directory | Command |
|----------|----------------|---------|
| **Vercel** | *(empty)* | No build (static files) |
| **Render** | `server` | Build: `npm install`, Start: `npm start` |
