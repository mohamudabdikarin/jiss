# Journal of Information Systems and Sustainability (JISS) — Client Setup

> **Generic install, environment variables, and troubleshooting** are documented in the repo root **[README.md](README.md)** and **[docs/SETUP.md](docs/SETUP.md)**.  
> **Multilingual / Translation Manager** behavior is in **[docs/TRANSLATIONS.md](docs/TRANSLATIONS.md)**.  
> This file is a **journal-specific checklist** for JISS (`jiss.my`); adapt domains and names for other journals.

---

**Client info:**
- **Journal name:** Journal of Information Systems and Sustainability
- **Domain:** jiss.my

---

## 1. Admin panel (Settings → General)

Update these in **Admin** → **Settings**:

| Field | Value |
|-------|-------|
| Site Name | Journal of Information Systems and Sustainability |
| Site URL | https://jiss.my |
| Site Description | (Add your journal description) |
| Contact Email | (JISS contact email) |

Also set ISSN, DOI, and other journal metadata in the same page.

---

## 2. Production `.env` URLs

For production on **jiss.my**, update:

```env
CLIENT_URL=https://jiss.my
ADMIN_URL=https://admin.jiss.my
```

*(Adjust if admin is on a different subdomain or path.)*

---

## 3. R2 public URL (for file uploads)

**Option A — Development URL (current):**  
Already set to `https://pub-42c81cc8165a4df2bcfe2a7239dfb7e7.r2.dev`

**Option B — Custom domain (recommended for production):**
1. Cloudflare Dashboard → R2 → bucket **jmisis** → Settings → **Connect Custom Domain**
2. Add subdomain: **cdn.jiss.my** (or **assets.jiss.my**)
3. Update `.env`:
   ```env
   CLOUDFLARE_R2_PUBLIC_URL=https://cdn.jiss.my
   ```

---

## 4. MongoDB

Update `MONGODB_URI` when moving to production, for example:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/jiss-cms
```

---

## 5. Admin email CC

```env
ADMIN_EMAIL_CC=committee@jiss.my
```

This address receives a CC of admin-related emails (e.g. password reset requests). Use comma-separated values for multiple addresses.

---

## 6. Admin credentials (for initial seed)

```env
ADMIN_EMAIL=admin@jiss.my
ADMIN_PASSWORD=YourSecurePassword123!
```

Run `node server/src/seeds/seedAdmin.js` to create the initial superadmin with these credentials. If a superadmin already exists, the seed is skipped.

### Navigation only (restore classic header + sidebar menu)

```bash
cd server && node src/seeds/seedNavigation.js
```

Replace existing nav links with defaults:

```bash
node src/seeds/seedNavigation.js --force
```

---

## 7. JWT secrets

Generate new secrets and replace placeholders before production:

```env
JWT_SECRET=<generate-a-long-random-string>
JWT_REFRESH_SECRET=<generate-another-long-random-string>
```

---

## Quick checklist

- [ ] Update Site Name, Site URL, Contact in Admin → Settings
- [ ] Set ADMIN_EMAIL_CC=committee@jiss.my (already in .env)
- [ ] Set production CLIENT_URL and ADMIN_URL in `.env`
- [ ] Connect custom domain for R2 (cdn.jiss.my) when ready for production
- [ ] Configure production MongoDB
- [ ] Change JWT secrets
- [ ] Configure SMTP for forgot-password emails (optional)
