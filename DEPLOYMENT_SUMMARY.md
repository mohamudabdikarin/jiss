# Deployment Setup Summary

## ✅ What Has Been Configured

### 1. /admin Redirect Feature
- **Client nginx config** (`client/nginx.conf`) now redirects `/admin` to admin panel
- **Environment variable** `ADMIN_DOMAIN` must be set in Dokploy
- **Docker entrypoint** (`client/docker-entrypoint.sh`) handles runtime configuration
- **Docker Compose** updated to pass `ADMIN_DOMAIN` to client container

**How it works:**
- User visits `https://yourdomain.com/admin`
- Nginx redirects to `https://admin.yourdomain.com`
- Seamless navigation between public site and admin panel

### 2. Deployment Documentation
Created comprehensive guides for easy deployment:

| File | Purpose |
|------|---------|
| `DEPLOY_NOW.md` | **Quick 5-minute deployment guide** (start here!) |
| `DEPLOYMENT.md` | Detailed deployment checklist with troubleshooting |
| `docs/DOKPLOY.md` | Complete Dokploy guide with architecture diagrams |
| `deploy.env.example` | Environment variables template |

### 3. Updated Files

**Client:**
- `client/nginx.conf` - Added /admin redirect rules
- `client/Dockerfile` - Added entrypoint script support
- `client/docker-entrypoint.sh` - Runtime nginx configuration

**Docker:**
- `docker-compose.yml` - Added ADMIN_DOMAIN environment variable

**Documentation:**
- `README.md` - Added deployment section
- `DEPLOY_NOW.md` - Quick deployment guide
- `DEPLOYMENT.md` - Detailed checklist
- `docs/DOKPLOY.md` - Complete guide
- `deploy.env.example` - Updated template

## 🚀 How to Deploy

### Quick Start (5 minutes)
```bash
# 1. Set up DNS
yourdomain.com → Dokploy IP
admin.yourdomain.com → Dokploy IP
api.yourdomain.com → Dokploy IP

# 2. Generate secrets
openssl rand -base64 32  # JWT_SECRET
openssl rand -base64 32  # JWT_REFRESH_SECRET

# 3. Deploy in Dokploy
- Create Compose project
- Set environment variables (see DEPLOY_NOW.md)
- Configure domains
- Click Deploy

# 4. Create admin user
docker exec -it ijcds-cms-api-1 npm run seed:admin
```

### Required Environment Variables
```env
JWT_SECRET=<generated>
JWT_REFRESH_SECRET=<generated>
CLIENT_URL=https://yourdomain.com
ADMIN_URL=https://admin.yourdomain.com
CLIENT_VITE_API_URL=https://api.yourdomain.com/api/v1/public
ADMIN_VITE_API_URL=https://api.yourdomain.com/api/v1
ADMIN_DOMAIN=admin.yourdomain.com
MONGODB_URI=mongodb://mongo:27017/ijcds-cms
```

## 📋 Deployment Checklist

- [ ] DNS records configured (3 domains)
- [ ] JWT secrets generated
- [ ] Dokploy project created
- [ ] Environment variables set
- [ ] Domains assigned to services
- [ ] Deployment successful
- [ ] Admin user created
- [ ] All URLs tested
- [ ] Admin password changed
- [ ] Cloudflare R2 configured (optional)
- [ ] SMTP configured (optional)

## 🔍 Testing Your Deployment

After deployment, verify these URLs:

1. **Public Site:** `https://yourdomain.com`
   - Should show journal homepage
   
2. **Admin Redirect:** `https://yourdomain.com/admin`
   - Should redirect to `https://admin.yourdomain.com`
   
3. **Admin Panel:** `https://admin.yourdomain.com`
   - Should show login page
   
4. **API Health:** `https://api.yourdomain.com/api/v1/public/health`
   - Should return `{"status":"ok"}`

## 🎯 Key Features

### /admin Redirect
- Automatic redirect from public site to admin panel
- No manual URL typing needed
- Configured via `ADMIN_DOMAIN` environment variable

### SSL/HTTPS
- Dokploy handles SSL automatically via Let's Encrypt
- Certificates issued within 2-5 minutes
- Auto-renewal configured

### Data Persistence
- MongoDB data stored in Docker volume
- Survives container restarts
- Regular backups recommended

### Media Storage
- **Without R2:** Files in container (lost on rebuild) ⚠️
- **With R2:** Files in Cloudflare R2 (persistent) ✓

## 📚 Documentation Guide

**For quick deployment:**
1. Read `DEPLOY_NOW.md` (5-minute guide)
2. Follow the steps
3. Done!

**For detailed setup:**
1. Read `DEPLOYMENT.md` (checklist with troubleshooting)
2. Reference `docs/DOKPLOY.md` for architecture details
3. Use `deploy.env.example` as template

**For development:**
1. Read `README.md` (local development setup)
2. Reference `docs/SETUP.md` for environment variables

## 🔧 Troubleshooting

### Services won't start
- Check all required environment variables are set
- View logs in Dokploy dashboard
- Verify MongoDB is healthy: `docker ps`

### Can't access admin panel
- Verify DNS records are correct
- Check SSL certificate status in Dokploy
- Ensure ADMIN_URL matches domain exactly

### /admin redirect not working
- Verify `ADMIN_DOMAIN` environment variable is set
- Check it's set WITHOUT `https://` prefix
- Example: `admin.yourdomain.com` ✓
- Example: `https://admin.yourdomain.com` ✗

### Images not uploading
- Configure Cloudflare R2 credentials
- Check R2 bucket CORS settings
- Verify R2_PUBLIC_URL is correct

## 💾 Backup & Maintenance

### Backup MongoDB
```bash
docker exec ijcds-cms-mongo-1 mongodump --archive > backup-$(date +%Y%m%d).archive
```

### Restore MongoDB
```bash
docker exec -i ijcds-cms-mongo-1 mongorestore --archive < backup.archive
```

### Update Application
1. Push changes to Git repository
2. Click "Redeploy" in Dokploy
3. Zero downtime (rolling restart)

## 🎉 You're Ready!

Everything is configured and ready for deployment. Follow the guides in order:

1. **DEPLOY_NOW.md** - Quick 5-minute deployment
2. **DEPLOYMENT.md** - Detailed checklist
3. **docs/DOKPLOY.md** - Complete reference

Good luck with your deployment! 🚀
