# IJCDS Journal CMS

Monorepo for the **International Journal of Computing and Digital Systems (IJCDS)**-style academic journal stack: a public React site, an admin CMS, and a Node.js API backed by MongoDB.

## What is in this repository

| Package | Path | Role |
|--------|------|------|
| **Server** | `server/` | REST API (`/api/v1/...`), auth, pages, articles, media (Cloudflare R2), site settings |
| **Public client** | `client/` | Hash-routed journal website (Vite + React) |
| **Admin** | `admin/` | Staff CMS: pages, sections, translations, articles, navigation (Vite + React) |

## Prerequisites

- **Node.js** 18+ (20 LTS recommended)
- **MongoDB** 6+ (local install or Atlas)
- Optional: **Cloudflare R2** (or compatible S3 API) for file uploads

## Quick start (local development)

### 1. Clone and install dependencies

```bash
cd ijcds
npm install --prefix server
npm install --prefix client
npm install --prefix admin
```

### 2. Configure the API

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and set at least:

- `MONGODB_URI`
- `JWT_SECRET` and `JWT_REFRESH_SECRET` (long random strings)

See **[docs/SETUP.md](docs/SETUP.md)** for every variable and optional services (R2, SMTP).

### 3. Seed the database

From the **server** directory (with `server/.env` present):

```bash
cd server
npm run seed
```

This creates a superadmin (using `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` if set), default navigation, sample pages, settings, and optional demo content.

To create or update **only** the admin user:

```bash
npm run seed:admin
```

### 4. Run the three processes

Use three terminals:

```bash
# Terminal 1 — API (default http://localhost:5000)
cd server && npm run dev

# Terminal 2 — public site (http://localhost:3000)
cd client && npm run dev

# Terminal 3 — admin CMS (http://localhost:3001)
cd admin && npm run dev
```

- **Public site:** http://localhost:3000 — Vite proxies `/api` to the server.
- **Admin:** http://localhost:3001 — sign in with the seeded superadmin credentials.

### 5. Verify the API

```bash
curl -s http://localhost:5000/api/v1/health | jq
```

## Production Deployment

### Dokploy (Recommended - Easiest)
Complete Docker Compose deployment with automatic SSL:

**Quick Deploy:**
1. Set up 3 domains pointing to Dokploy server
2. Create Compose project in Dokploy
3. Set environment variables (see [DEPLOYMENT.md](DEPLOYMENT.md))
4. Deploy and create admin user

**Full Guide:** [docs/DOKPLOY.md](docs/DOKPLOY.md)  
**Quick Checklist:** [DEPLOYMENT.md](DEPLOYMENT.md)

## Documentation

| Document | Contents |
|----------|----------|
| **[docs/SETUP.md](docs/SETUP.md)** | Environment variables, MongoDB, R2, SMTP, CORS, production notes, troubleshooting |
| **[docs/DOKPLOY.md](docs/DOKPLOY.md)** | Docker Compose on [Dokploy](https://dokploy.com/): three domains, `VITE_*` API URLs, Mongo options |
| **[docs/RENDER.md](docs/RENDER.md)** | [Render](https://render.com/) Web Service (API) + optional Static Sites for client/admin |
| **[docs/VERCEL.md](docs/VERCEL.md)** | [Vercel](https://vercel.com/) for **client** and **admin** only |
| **[docs/API_HOSTING.md](docs/API_HOSTING.md)** | **Where to host the Node API** (Vercel is not suited as-is); Render alternatives (Railway, Fly, VPS, Dokploy) |
| **[docs/TRANSLATIONS.md](docs/TRANSLATIONS.md)** | Translation Manager, multilingual public site, CMS “source” prefill API |
| **[JISS_CLIENT_SETUP.md](JISS_CLIENT_SETUP.md)** | Example checklist for another journal deployment (JISS); generic steps are in **docs/SETUP.md** |

## Production builds

```bash
cd client && npm run build   # output: client/dist
cd admin && npm run build    # output: admin/dist
```

Serve `dist/` behind your web server and reverse-proxy `/api` to the Node server, or serve the API and static sites from the same host. Details: **[docs/SETUP.md](docs/SETUP.md#production-deployment-outline)**.

## Docker & [Dokploy](https://dokploy.com/)

The repo includes **production Dockerfiles** for the API, public client, and admin, plus **`docker-compose.yml`** (API + both frontends + MongoDB).

- **Compose file:** `docker-compose.yml` at the repository root  
- **Example env for deploy:** [`deploy.env.example`](deploy.env.example)  
- **Step-by-step (domains, `VITE_*` URLs, Mongo options, seeding):** **[docs/DOKPLOY.md](docs/DOKPLOY.md)**  

**Quick reference:** assign three public URLs (e.g. `api.*`, `www` journal, `admin.*`), set `CLIENT_URL` / `ADMIN_URL` for CORS, and set `CLIENT_VITE_API_URL` / `ADMIN_VITE_API_URL` to those same API public URLs (client must use the `.../api/v1/public` suffix). Rebuild client/admin images whenever those `VITE_*` values change.

Local test with published ports:

```bash
docker compose -f docker-compose.yml -f docker-compose.ports.yml up --build
```

## Render & Vercel

- **Vercel** is for the **client** and **admin** static sites only. The **Express API cannot be deployed on Vercel without a major rewrite** — use another host for `server/`. See **[docs/API_HOSTING.md](docs/API_HOSTING.md)**.
- **Render:** Root **`render.yaml`** defines the **API** Web Service (`server/`). Add **Static Sites** for `client/` and `admin/` in the dashboard (or a second blueprint) — see **[docs/RENDER.md](docs/RENDER.md)**.
- **Vercel:** Create **two** projects with root directories **`client`** and **`admin`**. Set **`VITE_API_URL`** at build time to your deployed API (`.../api/v1/public` vs `.../api/v1`). See **[docs/VERCEL.md](docs/VERCEL.md)**.
- **CORS:** Set **`CLIENT_URL`**, **`ADMIN_URL`**, and optionally **`CORS_EXTRA_ORIGINS`** (comma-separated) on the API for Vercel/Render front-end URLs.

## Key features (high level)

- **Pages & sections** — Flexible section types (rich text, stats, contact, team, etc.) edited in admin.
- **Articles** — Preprints and published articles with categories, PDFs, and public listings.
- **Translations** — Four languages (en, ar, ms, zh); overrides merge with CMS content; language choice persisted in the browser.
- **Translation Manager** — Empty fields can be prefilled from **live published CMS content** via `GET /api/v1/settings/translation-sources` (see **docs/TRANSLATIONS.md**).
- **/admin redirect** — Visiting `yourdomain.com/admin` automatically redirects to admin panel (requires `ADMIN_DOMAIN` env var in deployment).

## License / attribution

Use and adapt per your institution’s policy. Internal configuration files such as `.env` must not be committed; use `server/.env.example` as a template.
