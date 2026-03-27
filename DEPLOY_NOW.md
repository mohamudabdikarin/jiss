# Deploy to Dokploy - Complete Guide

## 🚀 Quick Deployment (5 Minutes)

### Step 1: Prepare Domains
Point these DNS A records to your Dokploy server IP:
```
yourdomain.com          → YOUR_DOKPLOY_IP
admin.yourdomain.com    → YOUR_DOKPLOY_IP
api.yourdomain.com      → YOUR_DOKPLOY_IP
```

### Step 2: Generate Secrets
```bash
openssl rand -base64 32  # Copy for JWT_SECRET
openssl rand -base64 32  # Copy for JWT_REFRESH_SECRET
```

### Step 3: Deploy in Dokploy

1. **Create Compose Project**
   - Login to Dokploy → "Create Project" → "Compose"
   - Name: `ijcds-cms`
   - Connect your Git repository

2. **Set Environment Variables**
   
   Copy and paste these in Dokploy project settings (replace with your values):
   
   ```env
   # REQUIRED
   JWT_SECRET=<paste-generated-secret-1>
   JWT_REFRESH_SECRET=<paste-generated-secret-2>
   CLIENT_URL=https://yourdomain.com
   ADMIN_URL=https://admin.yourdomain.com
   CLIENT_VITE_API_URL=https://api.yourdomain.com/api/v1/public
   ADMIN_VITE_API_URL=https://api.yourdomain.com/api/v1
   ADMIN_DOMAIN=admin.yourdomain.com
   MONGODB_URI=mongodb://mongo:27017/ijcds-cms
   
   # OPTIONAL - Cloudflare R2 (recommended for media storage)
   CLOUDFLARE_R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
   CLOUDFLARE_R2_ACCESS_KEY_ID=xxx
   CLOUDFLARE_R2_SECRET_ACCESS_KEY=xxx
   CLOUDFLARE_R2_BUCKET_NAME=xxx
   CLOUDFLARE_R2_PUBLIC_URL=https://xxx
   
   # OPTIONAL - Email (for password reset)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   EMAIL_FROM=noreply@yourdomain.com
   ```

3. **Configure Domains in Dokploy**
   
   Assign domains to each service:
   
   | Service | Domain | Port |
   |---------|--------|------|
   | api | api.yourdomain.com | 5000 |
   | client | yourdomain.com | 80 |
   | admin | admin.yourdomain.com | 80 |

4. **Deploy**
   - Click "Deploy" button
   - Wait 5-10 minutes for build to complete

5. **Create Admin User**
   ```bash
   docker exec -it ijcds-cms-api-1 npm run seed:admin
   ```
   
   Default login: `admin@ijcds.com` / `Admin@123`
   
   **⚠️ Change password immediately after first login!**

---

## ✅ Test Your Deployment

After deployment, verify these URLs work:

1. **Public Site:** `https://yourdomain.com`
   - Should show journal homepage
   
2. **Admin Redirect:** `https://yourdomain.com/admin`
   - Should automatically redirect to `https://admin.yourdomain.com`
   
3. **Admin Panel:** `https://admin.yourdomain.com`
   - Should show login page
   
4. **API Health:** `https://api.yourdomain.com/api/v1/public/health`
   - Should return `{"status":"ok"}`

---

## 📋 Important Notes

### /admin Redirect Feature
- Visiting `yourdomain.com/admin` automatically redirects to admin panel
- Requires `ADMIN_DOMAIN` environment variable (without https://)
- Example: `admin.yourdomain.com` ✓ NOT `https://admin.yourdomain.com` ✗

### SSL Certificates
- Dokploy automatically provisions Let's Encrypt certificates
- Takes 2-5 minutes after first deployment
- Ensure DNS is configured before deploying

### Data Persistence
- MongoDB data stored in Docker volume `mongo_data`
- Survives container restarts and redeployments
- **Backup regularly!**

### Media Storage
- **Without R2:** Files stored in container (lost on rebuild) ⚠️
- **With R2:** Files stored in Cloudflare R2 (persistent) ✓ Recommended

---

## 🔧 Troubleshooting

### Services won't start
- Check all required environment variables are set
- View logs in Dokploy dashboard
- Verify MongoDB is healthy: `docker ps` (should show "healthy")

### Can't access admin panel
- Verify DNS records point to Dokploy server
- Check SSL certificate status in Dokploy
- Ensure `ADMIN_URL` matches your domain exactly (with https://)

### /admin redirect not working
- Verify `ADMIN_DOMAIN` environment variable is set
- Must be WITHOUT `https://` prefix
- Check nginx logs: `docker logs ijcds-cms-client-1`

### Can't login to admin
- Verify `ADMIN_VITE_API_URL` is correct
- Check CORS settings (`CLIENT_URL` and `ADMIN_URL`)
- Ensure JWT secrets are set

### Images not uploading
- Add Cloudflare R2 credentials (see environment variables above)
- Verify R2 bucket CORS settings allow your domains
- Check R2_PUBLIC_URL matches your bucket's public URL

### MongoDB connection failed
- Wait for mongo service to be healthy (check `docker ps`)
- Verify `MONGODB_URI` is correct
- Check mongo logs: `docker logs ijcds-cms-mongo-1`

---

## 💾 Backup & Restore

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

---

## 🔄 Updating the Application

1. Push code changes to your Git repository
2. In Dokploy, click "Redeploy"
3. Services rebuild automatically
4. Zero downtime (rolling restart)

---

## 🎯 Post-Deployment Checklist

- [ ] All three URLs accessible (client, admin, api)
- [ ] SSL certificates issued (https working)
- [ ] Admin login successful
- [ ] Admin password changed from default
- [ ] /admin redirect working
- [ ] Cloudflare R2 configured (optional but recommended)
- [ ] SMTP configured (optional)
- [ ] First backup created
- [ ] Site settings configured (logo, name, etc.)
- [ ] Navigation items created
- [ ] First page/article published

---

## 📚 Additional Resources

- **Dokploy Documentation:** https://docs.dokploy.com
- **Project README:** See `README.md` for local development setup
- **Environment Variables:** See `deploy.env.example` for template

---

## 🎉 You're Done!

Your IJCDS CMS is now deployed and ready to use. Login to the admin panel and start configuring your journal website!

**Need help?** Check the troubleshooting section above or review service logs in Dokploy dashboard.
