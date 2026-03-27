# Dokploy Deployment Guide

This guide walks you through deploying the IJCDS CMS platform on Dokploy.

## Prerequisites

- Dokploy instance running and accessible
- Three domains/subdomains configured:
  - `yourdomain.com` (client/public site)
  - `admin.yourdomain.com` (admin panel)
  - `api.yourdomain.com` (backend API)
- Cloudflare R2 bucket for media storage (optional but recommended)
- SMTP credentials for email notifications (optional)

## Quick Start

### 1. Create Compose Project in Dokploy

1. Log into your Dokploy dashboard
2. Click "Create Project" → "Compose"
3. Name it `ijcds-cms`
4. Connect your Git repository or upload the project files

### 2. Configure Environment Variables

In Dokploy project settings, add these environment variables:

```bash
# Required - JWT Secrets (generate random strings)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars

# Required - URLs (use your actual domains)
CLIENT_URL=https://yourdomain.com
ADMIN_URL=https://admin.yourdomain.com
CLIENT_VITE_API_URL=https://api.yourdomain.com/api/v1/public
ADMIN_VITE_API_URL=https://api.yourdomain.com/api/v1
ADMIN_DOMAIN=admin.yourdomain.com

# MongoDB (default is fine for Docker Compose)
MONGODB_URI=mongodb://mongo:27017/ijcds-cms

# Optional - Cloudflare R2 for media storage
CLOUDFLARE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=your-r2-access-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-r2-secret-key
CLOUDFLARE_R2_BUCKET_NAME=your-bucket-name
CLOUDFLARE_R2_PUBLIC_URL=https://your-public-r2-url.com

# Optional - SMTP for emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com
ADMIN_EMAIL_CC=admin@yourdomain.com

# Optional - JWT expiration
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Optional - CORS settings
CORS_EXTRA_ORIGINS=
ALLOW_VERCEL_PREVIEW_CORS=false
REFRESH_COOKIE_STRICT=false
CROSS_SITE_REFRESH_COOKIES=false
```

### 3. Configure Domain Routing in Dokploy

For each service, assign the appropriate domain:

**API Service:**
- Domain: `api.yourdomain.com`
- Port: `5000`
- Path: `/` (all traffic)

**Client Service:**
- Domain: `yourdomain.com`
- Port: `80`
- Path: `/` (all traffic)

**Admin Service:**
- Domain: `admin.yourdomain.com`
- Port: `80`
- Path: `/` (all traffic)

### 4. Deploy

1. Click "Deploy" in Dokploy
2. Wait for all services to build and start
3. Check logs for any errors

### 5. Initialize Admin User

After first deployment, create the admin user:

```bash
# SSH into your Dokploy server
docker exec -it ijcds-cms-api-1 npm run seed:admin
```

Default credentials:
- Email: `admin@ijcds.com`
- Password: `Admin@123`

**IMPORTANT:** Change the password immediately after first login!

## Service Architecture

```
┌─────────────────────────────────────────────┐
│  yourdomain.com (Client)                    │
│  - Public website                           │
│  - /admin → redirects to admin.yourdomain.com│
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  api.yourdomain.com (API)                   │
│  - Backend REST API                         │
│  - /api/v1/public (public endpoints)        │
│  - /api/v1/admin (admin endpoints)          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  admin.yourdomain.com (Admin)               │
│  - Admin dashboard                          │
│  - Content management                       │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  MongoDB (Internal)                         │
│  - Database                                 │
│  - Persistent volume                        │
└─────────────────────────────────────────────┘
```

## Important Notes

### /admin Redirect
- When users visit `yourdomain.com/admin`, they are automatically redirected to `admin.yourdomain.com`
- Make sure `ADMIN_DOMAIN` environment variable is set correctly (without https://)
- Example: `ADMIN_DOMAIN=admin.yourdomain.com`

### SSL/HTTPS
- Dokploy handles SSL certificates automatically via Let's Encrypt
- Make sure all three domains point to your Dokploy server IP
- Wait a few minutes after deployment for certificates to be issued

### MongoDB Data Persistence
- MongoDB data is stored in a Docker volume `mongo_data`
- Data persists across container restarts
- To backup: `docker exec ijcds-cms-mongo-1 mongodump --archive > backup.archive`
- To restore: `docker exec -i ijcds-cms-mongo-1 mongorestore --archive < backup.archive`

### Media Storage
- Without R2: Files stored in container (lost on rebuild)
- With R2: Files stored in Cloudflare R2 (persistent, recommended)
- Configure R2 in environment variables above

### Logs
View logs in Dokploy dashboard or via CLI:
```bash
docker logs ijcds-cms-api-1
docker logs ijcds-cms-client-1
docker logs ijcds-cms-admin-1
docker logs ijcds-cms-mongo-1
```

## Troubleshooting

### Services won't start
- Check environment variables are set correctly
- Verify MongoDB is healthy: `docker ps` (should show "healthy")
- Check logs for specific errors

### Can't login to admin
- Verify API URL is correct in admin environment
- Check CORS settings (CLIENT_URL and ADMIN_URL must match your domains)
- Ensure JWT secrets are set

### Images not loading
- Check Cloudflare R2 credentials
- Verify R2 bucket is public or has correct CORS settings
- Check R2_PUBLIC_URL matches your bucket's public URL

### /admin redirect not working
- Verify ADMIN_DOMAIN environment variable is set
- Check nginx logs: `docker logs ijcds-cms-client-1`
- Ensure admin domain DNS is pointing to Dokploy server

## Updating the Application

1. Push changes to your Git repository
2. In Dokploy, click "Redeploy"
3. Dokploy will rebuild and restart affected services
4. Zero-downtime deployment (services restart one at a time)

## Scaling

To handle more traffic:
- Increase API replicas in Dokploy
- Add Redis for caching (update docker-compose.yml)
- Use CDN for static assets
- Consider MongoDB Atlas for managed database

## Security Checklist

- [ ] Changed default admin password
- [ ] Set strong JWT secrets (32+ characters)
- [ ] Configured HTTPS/SSL for all domains
- [ ] Set up regular MongoDB backups
- [ ] Configured CORS correctly (only your domains)
- [ ] Enabled rate limiting (already configured in API)
- [ ] Set up monitoring/alerts in Dokploy

## Support

For issues or questions:
- Check Dokploy documentation: https://docs.dokploy.com
- Review application logs in Dokploy dashboard
- Check MongoDB connection: `docker exec -it ijcds-cms-mongo-1 mongosh`
