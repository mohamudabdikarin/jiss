# Deploy to Dokploy - Complete Guide

## 🚀 5-Minute Deployment

### Step 1: Prepare Domains (2 min)
Point these DNS A records to your Dokploy server IP:
```
yourdomain.com          → YOUR_DOKPLOY_IP
admin.yourdomain.com    → YOUR_DOKPLOY_IP
api.yourdomain.com      → YOUR_DOKPLOY_IP
```

### Step 2: Generate Secrets (1 min)
```bash
openssl rand -base64 32  # Copy this for JWT_SECRET
openssl rand -base64 32  # Copy this for JWT_REFRESH_SECRET
```

### Step 3: Deploy in Dokploy (2 min)

1. **Create Project**
   - Login to Dokploy → "Create Project" → "Compose"
   - Name: `ijcds-cms`
   - Connect your Git repo

2. **Set Environment Variables**
   
   Paste these in Dokploy project settings (replace with your values):
   
   ```env
   JWT_SECRET=<paste-generated-secret-1>
   JWT_REFRESH_SECRET=<paste-generated-secret-2>
   CLIENT_URL=https://yourdomain.com
   ADMIN_URL=https://admin.yourdomain.com
   CLIENT_VITE_API_URL=https://api.yourdomain.com/api/v1/public
   ADMIN_VITE_API_URL=https://api.yourdomain.com/api/v1
   ADMIN_DOMAIN=admin.yourdomain.com
   MONGODB_URI=mongodb://mongo:27017/ijcds-cms
   ```

3. **Configure Domains**
   
   In Dokploy, assign domains to services:
   
   | Service | Domain | Port |
   |---------|--------|------|
   | api | api.yourdomain.com | 5000 |
   | client | yourdomain.com | 80 |
   | admin | admin.yourdomain.com | 80 |

4. **Deploy**
   - Click "Deploy" button
   - Wait 5-10 minutes for build

5. **Create Admin User**
   ```bash
   docker exec -it ijcds-cms-api-1 npm run seed:admin
   ```
   
   Login: `admin@ijcds.com` / `Admin@123`

## ✅ Test Your Deployment

- `https://yourdomain.com` → Public site
- `https://yourdomain.com/admin` → Redirects to admin panel
- `https://admin.yourdomain.com` → Admin login
- `https://api.yourdomain.com/api/v1/public/health` → `{"status":"ok"}`

## 📦 Optional: Add Cloudflare R2 (Media Storage)

Without R2, uploaded files are lost when containers rebuild. Add these to environment:

```env
CLOUDFLARE_R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=xxx
CLOUDFLARE_R2_SECRET_ACCESS_KEY=xxx
CLOUDFLARE_R2_BUCKET_NAME=xxx
CLOUDFLARE_R2_PUBLIC_URL=https://xxx
```

## 📧 Optional: Add Email (SMTP)

For password reset emails:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

## 🔧 Common Issues

**Services won't start:**
- Check all required env vars are set
- View logs in Dokploy dashboard

**Can't login:**
- Verify API URL matches exactly
- Check CORS settings (CLIENT_URL, ADMIN_URL)

**/admin redirect not working:**
- Verify `ADMIN_DOMAIN` is set (without https://)
- Example: `admin.yourdomain.com` not `https://admin.yourdomain.com`

**Images not uploading:**
- Add Cloudflare R2 credentials (see above)

## 💾 Backup Database

```bash
docker exec ijcds-cms-mongo-1 mongodump --archive > backup.archive
```

## 🔄 Update Application

1. Push changes to Git
2. Click "Redeploy" in Dokploy
3. Done!

---

**Need more details?** See [docs/DOKPLOY.md](docs/DOKPLOY.md) for complete guide.
