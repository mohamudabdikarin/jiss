# Vercel (client + admin)

Deploy **two** Vercel projects from this repo:

| Project   | Root directory | Build output |
|-----------|----------------|--------------|
| Public site | `client`     | `dist`       |
| Admin       | `admin`      | `dist`       |

The **API** (`server/`) must run elsewhere (Railway, Render, VPS, Docker). The browser talks to that API origin directly, so CORS and cookie rules apply there.

## Build-time: `VITE_API_URL`

Vite inlines this at build time. Change it → **redeploy** the frontend.

| App    | Set `VITE_API_URL` to |
|--------|------------------------|
| **client** | `https://<your-api-host>/api/v1/public` |
| **admin**  | `https://<your-api-host>/api/v1` (**no** `/public`) |

Wrong suffixes cause 404s, auth on the wrong router, or CORS that looks “random” because the failing URL is different from what you tested.

## Runtime (on the API): CORS

Set these on the **API** host (not on Vercel), using the **exact** origins the browser uses (scheme + host + port, **no trailing slash**):

- `CLIENT_URL` — public site, e.g. `https://ijcds.vercel.app`
- `ADMIN_URL` — admin app, e.g. `https://ijcds-admin.vercel.app`
- `CORS_EXTRA_ORIGINS` (optional) — comma-separated extra origins (e.g. a second domain or preview URL)

If the API logs `[cors] blocked origin: …`, add that origin via one of the variables above or set `ALLOW_VERCEL_PREVIEW_CORS=true` to allow any `https://*.vercel.app` (broader surface; useful for previews).

## Admin refresh token (“No refresh token provided”)

The refresh token is an **httpOnly** cookie set by the API on login. For **admin on Vercel** calling **API on another host**, the cookie must be **`SameSite=None; Secure`**. In this codebase, **production** defaults to that unless `REFRESH_COOKIE_STRICT=true`.

Requirements:

1. API served over **HTTPS**
2. **`cookie-parser`** enabled on the API (already wired in `app.js`)
3. After deploying API cookie changes, **log in again** so the browser stores a new cookie

## Quick checklist

1. API: `CLIENT_URL` and `ADMIN_URL` match the live Vercel URLs.
2. Client project: `VITE_API_URL` ends with `/api/v1/public`.
3. Admin project: `VITE_API_URL` ends with `/api/v1` only.
4. Redeploy both frontends after changing `VITE_API_URL`.

See also **[deploy.env.example](../deploy.env.example)** and **[API_HOSTING.md](./API_HOSTING.md)**.
