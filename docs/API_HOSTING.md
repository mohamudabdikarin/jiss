# Where to host the API (Node + MongoDB)

The **public client** and **admin** can live on **Vercel** (static). The **server** in `server/` is a normal **Express** app: it listens on a **port**, keeps a **MongoDB** connection open, handles **file uploads** (e.g. R2), and runs **cron**-style jobs. That shape does **not** map cleanly to how **Vercel** runs apps.

## Can I put the API on Vercel?

**Not as-is.** Vercel is built around **serverless functions** and short-lived workers, not a long-running `node src/server.js` process. Moving this API to Vercel would mean **rewriting** routes into serverless handlers, redoing DB connection handling for cold starts, and rethinking uploads — a large project.

**Practical split:** keep **Vercel** for **client + admin** only; host the **API** on a **Node host** below.

---

## Alternatives if Render is not an option

These are common “Render-like” choices. Pick one, set `MONGODB_URI` (usually **MongoDB Atlas**), deploy the **`server/`** folder, then point `VITE_API_URL` on Vercel at your API.

| Platform | Notes |
|----------|--------|
| **[Railway](https://railway.app/)** | Connect repo, set **root directory** to `server`, **start** `node src/server.js`, add env vars. Often straightforward if Render is painful. |
| **[Fly.io](https://fly.io/)** | Docker or buildpack; good for always-on small APIs. Use `Dockerfile` in `server/` or Nixpacks with root `server`. |
| **[DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform)** | Web Service, Node, root `server`, same env pattern as Render. |
| **[Dokploy](https://dokploy.com/) / VPS + Docker** | You already have **`docker-compose.yml`** — deploy the stack on your own server. See **[DOKPLOY.md](./DOKPLOY.md)**. |
| **Any VPS** (Hetzner, Linode, etc.) | Install Node 20, clone repo, `cd server && npm ci --omit=dev`, `node src/server.js` behind **Caddy** or **nginx** + **pm2** or **systemd**. |

### Minimal env on the API host

- `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `CLIENT_URL` = your **Vercel client** URL (e.g. `https://….vercel.app`)
- `ADMIN_URL` = your **Vercel admin** URL (if separate project)
- `PORT` — many hosts set this automatically; the app reads `process.env.PORT`
- Optional: R2, SMTP — see `server/.env.example`

### After the API is live

1. **`VITE_API_URL`** on the **client** Vercel project:  
   `https://<your-api-host>/api/v1/public`
2. **`VITE_API_URL`** on the **admin** Vercel project:  
   `https://<your-api-host>/api/v1`
3. **Redeploy** both frontends so Vite picks up the vars.

---

## MongoDB

Use **[MongoDB Atlas](https://www.mongodb.com/atlas)** (free tier) or another managed Mongo. Put the connection string in `MONGODB_URI` on whatever hosts the API — you do **not** need Mongo on the same machine as Vercel.

---

## Related

- **[VERCEL.md](./VERCEL.md)** — frontends only  
- **[RENDER.md](./RENDER.md)** — if you try Render again later  
- **[SETUP.md](./SETUP.md)** — full env reference  
