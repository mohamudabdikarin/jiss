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

### 3. Seed the database

```bash
cd server
npm run seed
```

Creates superadmin, navigation, sample pages, and settings.

### 4. Run the three processes

```bash
# Terminal 1 — API (http://localhost:5000)
cd server && npm run dev

# Terminal 2 — public site (http://localhost:3000)
cd client && npm run dev

# Terminal 3 — admin CMS (http://localhost:3001)
cd admin && npm run dev
```

## Production Deployment

**📖 [DEPLOY_NOW.md](DEPLOY_NOW.md)** - Complete Dokploy deployment guide

Deploys all services with Docker Compose, automatic SSL, and MongoDB. Takes ~5 minutes.

## Documentation

- **[DEPLOY_NOW.md](DEPLOY_NOW.md)** - Production deployment (Dokploy)
- **[docs/SETUP.md](docs/SETUP.md)** - Environment variables and local development
- **[docs/TRANSLATIONS.md](docs/TRANSLATIONS.md)** - Multilingual configuration

## Key features

- **Pages & sections** — Flexible section types edited in admin
- **Articles** — Preprints and published articles with categories and PDFs
- **Translations** — Four languages (en, ar, ms, zh) with browser persistence
- **/admin redirect** — `yourdomain.com/admin` redirects to admin panel automatically

## License

Use and adapt per your institution's policy. Do not commit `.env` files.
