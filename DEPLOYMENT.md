# Quick Deployment Checklist

## Before Deployment

### 1. Prepare Your Domains
Set up DNS A records pointing to your Dokploy server:
- `yourdomain.com` → Dokploy IP
- `admin.yourdomain.com` → Dokploy IP
- `api.yourdomain.com` → Dokploy IP

### 2. Generate JWT Secrets
```bash
# Generate two random secrets (32+ characters each)
openssl rand -base64 32
openssl rand -base64 32
```

### 3. Set Up Cloudflare R2 (Optional but Recommended)
- Create R2 bucket in Cloudflare dashboard
- Generate API tokens (Access Key ID + Secret)
- Note your bucket's public URL

## Dokploy Deployment Steps

### Step 1: Create Compose Project
1. Login to Dokploy
2. Create new project → "Compose"
3. Name: `ijcds-cms`
4. Connect Git repo or upload files

### Step 2: Set Environment Variables
Copy and fill these in Dokploy project settings:

```env
# REQUIRED
JWT_SECRET=<generated-secret-1>
JWT_REFRESH_SECRET=<generated-secret-2>
CLIENT_URL=https://yourdomain.com
ADMIN_URL=https://admin.yourdomain.com
CLIENT_VITE_API_URL=https://api.yourdomain.com/api/v1/public
ADMIN_VITE_API_URL=https://api.yourdomain.com/api/v1
ADMIN_DOMAIN=admin.yourdomain.com
MONGODB_URI=mongodb://mongo:27017/ijcds-cms

# OPTIONAL - Cloudflare R2
CLOUDFLARE_R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=xxx
CLOUDFLARE_R2_SECRET_ACCESS_KEY=xxx
CLOUDFLARE_R2_BUCKET_NAME=xxx
CLOUDFLARE_R2_PUBLIC_URL=https://xxx

# OPTIONAL - Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

### Step 3: Configure Domains
In Dokploy, assign domains to services:

| Service | Domain | Port |
|---------|--------|------|
| api | api.yourdomain.com | 5000 |
| client | yourdomain.com | 80 |
| admin | admin.yourdomain.com | 80 |

### Step 4: Deploy
Click "Deploy" and wait for build to complete (5-10 minutes)

### Step 5: Create Admin User
```bash
docker exec -it ijcds-cms-api-1 npm run seed:admin
```

Login: `admin@ijcds.com` / `Admin@123` (change password immediately!)

## Post-Deployment

### Test the Setup
1. Visit `https://yourdomain.com` → Should show public site
2. Visit `https://yourdomain.com/admin` → Should redirect to admin panel
3. Visit `https://admin.yourdomain.com` → Should show admin login
4. Visit `https://api.yourdomain.com/api/v1/public/health` → Should return `{"status":"ok"}`

### Configure Your Site
1. Login to admin panel
2. Go to Settings → Site Settings
3. Update site name, logo, metadata
4. Create navigation items
5. Add pages and articles

## Important Notes

### /admin Redirect
- Visiting `yourdomain.com/admin` automatically redirects to `admin.yourdomain.com`
- This is handled by nginx in the client container
- Requires `ADMIN_DOMAIN` environment variable to be set

### SSL Certificates
- Dokploy automatically provisions Let's Encrypt certificates
- May take 2-5 minutes after first deployment
- Ensure DNS is properly configured before deploying

### Data Persistence
- MongoDB data stored in Docker volume `mongo_data`
- Survives container restarts and redeployments
- Backup regularly using MongoDB tools

### Media Files
- **Without R2**: Files stored in container (lost on rebuild) ⚠️
- **With R2**: Files stored in Cloudflare R2 (persistent) ✓

## Troubleshooting

**Services won't start:**
- Check all required environment variables are set
- View logs in Dokploy dashboard

**Can't access admin panel:**
- Verify DNS records are correct
- Check SSL certificate status in Dokploy
- Ensure ADMIN_URL matches your domain exactly

**Images not uploading:**
- Verify R2 credentials are correct
- Check R2 bucket CORS settings allow your domains
- Test R2 connection in admin panel

**MongoDB connection failed:**
- Wait for mongo service to be healthy (check `docker ps`)
- Verify MONGODB_URI is correct
- Check mongo logs: `docker logs ijcds-cms-mongo-1`

## Backup & Restore

### Backup MongoDB
```bash
docker exec ijcds-cms-mongo-1 mongodump --archive > backup-$(date +%Y%m%d).archive
```

### Restore MongoDB
```bash
docker exec -i ijcds-cms-mongo-1 mongorestore --archive < backup-20260327.archive
```

### Backup Media Files (if not using R2)
```bash
docker cp ijcds-cms-api-1:/app/uploads ./uploads-backup
```

## Updating

1. Push code changes to Git repository
2. In Dokploy, click "Redeploy"
3. Services rebuild automatically
4. Zero downtime (rolling restart)

## Need Help?

- Dokploy Docs: https://docs.dokploy.com
- Check service logs in Dokploy dashboard
- Verify environment variables are correct
- Test MongoDB: `docker exec -it ijcds-cms-mongo-1 mongosh`
