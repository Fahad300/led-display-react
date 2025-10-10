# 🚀 LED Display System - Production Deployment Guide

Complete guide for deploying the Persivia LED Display System to production environments.

---

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Installation Steps](#installation-steps)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Building for Production](#building-for-production)
7. [Deployment Methods](#deployment-methods)
8. [LED Display Configuration](#led-display-configuration)
9. [Security Hardening](#security-hardening)
10. [Monitoring & Maintenance](#monitoring--maintenance)
11. [Troubleshooting](#troubleshooting)

---

## 💻 System Requirements

### Minimum Requirements
- **OS**: Windows 10/11, Ubuntu 20.04+, or CentOS 8+
- **CPU**: 2 cores, 2.0 GHz
- **RAM**: 4 GB
- **Storage**: 20 GB available space
- **Network**: 100 Mbps connection

### Recommended Requirements
- **OS**: Windows Server 2019+, Ubuntu 22.04 LTS
- **CPU**: 4 cores, 2.5 GHz
- **RAM**: 8 GB
- **Storage**: 50 GB SSD
- **Network**: 1 Gbps connection

### Software Requirements
- **Node.js**: Version 18.x or higher
- **npm**: Version 7.x or higher
- **PostgreSQL**: Version 14+ (production) or SQLite (development)
- **Web Browser**: Chrome 90+, Firefox 88+, Edge 90+

---

## ✅ Pre-Deployment Checklist

Before deploying to production:

### Infrastructure
- [ ] Server/VM is provisioned and accessible
- [ ] Database server is set up and running
- [ ] Firewall rules configured for ports 5000 and 3000
- [ ] Network connectivity verified
- [ ] Domain name configured (optional)

### Security
- [ ] Generated strong JWT secret
- [ ] Configured secure database password
- [ ] SSL certificate obtained (recommended)
- [ ] Admin password changed from default
- [ ] File upload limits configured

### Code
- [ ] Latest code pulled from repository
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Build process tested

---

## 📦 Installation Steps

### Step 1: Clone Repository

```bash
# Clone the repository
git clone <repository-url>
cd LED

# Verify you have the correct version
git branch
# Should show: * master
```

### Step 2: Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install

# Return to root
cd ..
```

**Verify installation:**
```bash
cd server && npm list --depth=0
cd ../client && npm list --depth=0
```

---

## ⚙️ Environment Configuration

### Server Environment (`server/.env`)

Create `server/.env` file:

```env
# ==================== SERVER CONFIGURATION ====================
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# ==================== DATABASE CONFIGURATION ====================
# PostgreSQL (Production)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=led_user
DB_PASSWORD=CHANGE_THIS_SECURE_PASSWORD
DB_DATABASE=led_display
DB_SYNCHRONIZE=false

# ==================== JWT AUTHENTICATION ====================
JWT_SECRET=CHANGE_THIS_TO_RANDOM_64_CHARACTER_STRING
JWT_EXPIRES_IN=24h

# ==================== FILE UPLOAD ====================
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=104857600

# ==================== LOGGING ====================
LOG_LEVEL=info

# ==================== SERVER URL ====================
# CRITICAL: Replace with your actual server IP or domain
SERVER_URL=http://YOUR_SERVER_IP:5000
BACKEND_URL=http://YOUR_SERVER_IP:5000
```

### Client Environment (`client/.env`)

Create `client/.env` file:

```env
# ==================== BACKEND API ====================
# CRITICAL: Must match server's external URL
REACT_APP_BACKEND_URL=http://YOUR_SERVER_IP:5000
```

### Environment Variable Examples

#### Windows VM Deployment
```env
# If your Windows VM IP is 192.168.1.100
SERVER_URL=http://192.168.1.100:5000
REACT_APP_BACKEND_URL=http://192.168.1.100:5000
```

#### Domain Name Deployment
```env
# If you have a domain name
SERVER_URL=http://led.yourcompany.com
REACT_APP_BACKEND_URL=http://led.yourcompany.com
```

#### HTTPS Deployment
```env
# With SSL certificate
SERVER_URL=https://led.yourcompany.com
REACT_APP_BACKEND_URL=https://led.yourcompany.com
```

---

## 🗄️ Database Setup

### Option 1: PostgreSQL (Recommended for Production)

```bash
# Install PostgreSQL (Ubuntu)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE led_display;
CREATE USER led_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE led_display TO led_user;
\q

# Run migrations
cd server
npm run migrate

# Seed with default admin user
npm run seed
```

### Option 2: SQLite (Development Only)

```bash
# SQLite is automatically created
cd server
npm run migrate
npm run seed
```

### Verify Database Setup

```bash
cd server
npm run test-db
# Should show: ✅ Database connection successful
```

---

## 🏗️ Building for Production

### Build Frontend

   ```bash
   cd client
   npm run build
   ```

This creates an optimized build in `client/build/` directory.

**Verify build:**
```bash
ls -la build/
# Should see: index.html, static/js/, static/css/
```

### Build Backend (Optional)

   ```bash
   cd server
npm run build
```

TypeScript compiles to JavaScript in `server/dist/` directory.

---

## 🌐 Deployment Methods

### Method 1: Direct Node.js (Recommended)

**Advantages:** Simple, full control, easy debugging

```bash
# Start backend (serves frontend automatically in production)
cd server
npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start npm --name "led-backend" -- start
pm2 save
pm2 startup
```

### Method 2: Separate Frontend Server

**Advantages:** Better scalability, CDN support

```bash
# Serve frontend with nginx or Apache
# Copy client/build/ to /var/www/html/

# Start backend separately
cd server
npm start
```

### Method 3: Docker (Advanced)

**Advantages:** Containerized, portable, easy scaling

```bash
# Build and run containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Method 4: Windows Service

**Advantages:** Auto-start on Windows Server

```bash
# Install node-windows globally
npm install -g node-windows

# Create Windows service (run as Administrator)
cd server
npm run install-service

# Start service
npm run start-service
```

---

## 🖥️ LED Display Configuration

### Browser Setup on Display Computer

1. **Install Chrome** (recommended) or Edge
2. **Disable popup blocker** for the display URL
3. **Enable autoplay** for videos:
   - Chrome: `chrome://flags/#autoplay-policy` → Set to "No user gesture required"
4. **Disable browser updates during business hours**

### Windows Display Computer

```powershell
# Disable screensaver
powercfg /change standby-timeout-ac 0
powercfg /change monitor-timeout-ac 0

# Disable Windows Update during work hours
# Control Panel → Windows Update → Advanced Options → Active Hours

# Set browser to auto-start
# Create shortcut in: C:\Users\[User]\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup
# Target: "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --app=http://YOUR_SERVER_IP:5000/display
```

### Linux Display Computer

```bash
# Disable screensaver
gsettings set org.gnome.desktop.screensaver idle-activation-enabled false

# Auto-start browser in kiosk mode
# Add to ~/.config/autostart/led-display.desktop:
[Desktop Entry]
Type=Application
Exec=chromium-browser --kiosk --app=http://YOUR_SERVER_IP:5000/display
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
Name=LED Display
```

### Fullscreen Mode

**Manual:**
- Press `F11` in the browser

**Automatic (Kiosk Mode):**
- Use `--kiosk` flag when launching browser
- Or use `--start-fullscreen` flag

---

## 🔒 Security Hardening

### 1. Change Default Credentials

```bash
# Login to admin panel
# Go to user menu → Add User
# Create new admin with secure password
# Delete default admin user
```

### 2. Secure Environment Variables

```bash
# Generate secure JWT secret (64 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update server/.env
JWT_SECRET=<generated-secret>
```

### 3. Configure HTTPS (Recommended)

```bash
# Option 1: Use reverse proxy (nginx/Apache)
# Option 2: Use Let's Encrypt SSL

# Update .env files to use https://
SERVER_URL=https://led.yourcompany.com
REACT_APP_BACKEND_URL=https://led.yourcompany.com
```

### 4. Firewall Configuration

**Windows Firewall:**
```powershell
# Allow port 5000
netsh advfirewall firewall add rule name="LED Display Backend" dir=in action=allow protocol=TCP localport=5000

# Allow port 3000 (if serving frontend separately)
netsh advfirewall firewall add rule name="LED Display Frontend" dir=in action=allow protocol=TCP localport=3000
```

**Linux Firewall (ufw):**
```bash
sudo ufw allow 5000/tcp
sudo ufw allow 3000/tcp
sudo ufw enable
```

### 5. Database Security

```sql
-- Create dedicated database user with limited permissions
CREATE USER led_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE led_display TO led_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO led_user;
```

---

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Check backend health
curl http://YOUR_SERVER_IP:5000/health

# Check database connection
cd server
npm run test-db

# Check file uploads
ls -lh server/uploads/
```

### Log Management

**Backend logs:**
```bash
# View logs
cd server
tail -f combined.log
tail -f error.log

# Rotate logs (Linux)
sudo logrotate /etc/logrotate.d/led-display
```

**Frontend logs:**
- Browser console (F12 → Console)
- Enable Development Mode for detailed logs

### Database Backups

```bash
# PostgreSQL backup
pg_dump -U led_user led_display > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql -U led_user led_display < backup_20250109_120000.sql
```

### File Storage Management

```bash
# Check upload directory size
du -sh server/uploads/

# Clean up unused files (via admin panel)
# Media page → Select files → Delete

# Or manually clean old files
find server/uploads/ -mtime +90 -type f -delete
```

---

## 🚨 Troubleshooting

### Issue: Backend Won't Start

**Symptoms:** Server exits immediately or shows database errors

**Solutions:**
```bash
# Check database connection
cd server
npm run test-db

# Check environment variables
cat .env

# Check port is not in use
# Windows
netstat -ano | findstr :5000
# Linux
sudo lsof -i :5000

# View full error logs
   npm run dev
   ```

### Issue: Frontend Build Fails

**Symptoms:** `npm run build` shows errors

**Solutions:**
```bash
cd client

# Clear cache and rebuild
rm -rf node_modules build
npm install
npm run build

# Check for TypeScript errors
npm run build 2>&1 | grep "error TS"
```

### Issue: Files Not Displaying on LED Screen

**Symptoms:** Images/videos show broken icon

**Solutions:**
1. **Check file URLs** in browser Network tab (F12)
2. **Verify SERVER_URL** in `server/.env` matches actual IP
3. **Test direct file access**: `http://YOUR_SERVER_IP:5000/api/files/FILE_ID`
4. **Check CORS** headers in server response
5. **Restart backend** after changing SERVER_URL

### Issue: Slideshow Not Auto-Playing

**Symptoms:** Slides don't transition automatically

**Solutions:**
1. **Check slides are active** (toggle switch on)
2. **Verify slide duration** is > 0 seconds
3. **Enable Development Mode** to see countdown timer
4. **Check browser console** for JavaScript errors
5. **Refresh display page** (Ctrl+F5)

### Issue: Real-Time Data Not Updating

**Symptoms:** Employee/graph data doesn't refresh

**Solutions:**
1. **Check backend logs** for API errors
2. **Verify proxy endpoints** in `server/src/routes/proxy.ts`
3. **Test API directly**: `curl http://localhost:5000/api/dashboard`
4. **Check cache status**: `curl http://localhost:5000/api/dashboard/cache-status`
5. **Review API credentials** in backend configuration

---

## 🔄 Updating the Application

### Update Process

```bash
# 1. Backup database
pg_dump led_display > backup_before_update.sql

# 2. Pull latest code
git pull origin master

# 3. Update dependencies
cd server && npm install
cd ../client && npm install

# 4. Run new migrations
cd server && npm run migrate

# 5. Rebuild frontend
cd ../client && npm run build

# 6. Restart backend
cd ../server
pm2 restart led-backend
```

---

## 🌐 Production Optimizations

### Enable Compression

Add to `server/src/server.ts`:

```typescript
import compression from "compression";
app.use(compression());
```

### Enable Caching Headers

Static files are automatically cached. For API responses:

```typescript
// Already implemented in dashboard route
// Cache-Control: max-age=60
```

### Optimize Database

```sql
-- Create indexes for frequently queried fields
CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_files_user ON files(uploaded_by);
```

### Enable PM2 Cluster Mode

   ```bash
pm2 start server/src/server.ts -i max --name led-backend
```

---

## 🔐 Security Best Practices

### 1. Environment Security
- ✅ Never commit `.env` files to git
- ✅ Use strong, random JWT secrets (64+ characters)
- ✅ Use secure database passwords
- ✅ Limit file upload size (default: 100MB)

### 2. Network Security
- ✅ Use HTTPS in production
- ✅ Enable CORS only for trusted domains
- ✅ Implement rate limiting (future enhancement)
- ✅ Use firewall to restrict access

### 3. Application Security
- ✅ Change default admin password immediately
- ✅ Validate all user inputs
- ✅ Sanitize file uploads
- ✅ Implement session timeouts (24h default)

### 4. Database Security
- ✅ Use least-privilege database users
- ✅ Enable SSL for database connections
- ✅ Regular backups
- ✅ Audit logs enabled

---

## 📈 Performance Tuning

### Backend Optimization

```env
# Increase file upload limit if needed
MAX_FILE_SIZE=209715200  # 200MB

# Adjust cache settings
CACHE_TTL=60000  # 60 seconds
```

### Frontend Optimization

- **Use optimized images** (WebP format, compressed)
- **Limit video file sizes** (50MB or less)
- **Use appropriate slide durations** (10-15 seconds)
- **Enable lazy loading** for images

### Database Optimization

```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM sessions WHERE session_token = 'xxx';

-- Vacuum database regularly
VACUUM ANALYZE;
```

---

## 🎯 Windows Server Deployment

### IIS Configuration (Optional)

If using IIS as reverse proxy:

1. **Install IIS** with URL Rewrite and ARR modules
2. **Configure reverse proxy** to `http://localhost:5000`
3. **Set up SSL** certificate
4. **Configure application pool** for Node.js

### Windows Service Setup

```bash
# Install node-windows
npm install -g node-windows

# Create service installation script (server/install-service.js)
# Then run as Administrator:
node install-service.js
```

---

## 🐧 Linux Server Deployment

### SystemD Service

Create `/etc/systemd/system/led-display.service`:

```ini
[Unit]
Description=LED Display Backend
After=network.target postgresql.service

[Service]
Type=simple
User=led
WorkingDirectory=/opt/led-display/server
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable led-display
sudo systemctl start led-display
sudo systemctl status led-display
```

### Nginx Reverse Proxy

Create `/etc/nginx/sites-available/led-display`:

```nginx
server {
    listen 80;
    server_name led.yourcompany.com;

    # Frontend (built files)
    location / {
        root /opt/led-display/client/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/led-display /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🎨 LED Display Best Practices

### Content Guidelines

- **Videos**: MP4 format, H.264 codec, 1920x1080, under 50MB
- **Images**: JPEG/PNG, 1920x1080, under 5MB
- **Slide Duration**: 10-15 seconds (optimal)
- **Total Slides**: 10-15 active slides (prevents long loops)

### Display Settings

**Recommended for Production:**
```
Transition Effect: Fade (smoothest)
Show Date Stamp: Yes
Hide Pagination: Yes
Hide Arrows: Yes
Development Mode: No
```

### Browser Configuration

- **Disable browser updates** during business hours
- **Enable autoplay** for videos
- **Set homepage** to display URL
- **Enable full-screen mode** (F11 or kiosk mode)
- **Clear cache** regularly (weekly)

---

## 🔄 Backup & Recovery

### Automated Backup Script

Create `backup.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/led-display"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U led_user led_display > $BACKUP_DIR/db_$DATE.sql

# Backup uploads folder
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz server/uploads/

# Keep only last 30 days of backups
find $BACKUP_DIR -mtime +30 -delete

echo "Backup completed: $DATE"
```

Schedule with cron:
```bash
# Daily backup at 2 AM
0 2 * * * /opt/led-display/backup.sh
```

### Recovery Process

```bash
# Stop application
pm2 stop led-backend

# Restore database
psql -U led_user led_display < db_20250109_020000.sql

# Restore uploads
tar -xzf uploads_20250109_020000.tar.gz -C server/

# Start application
pm2 start led-backend
```

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks

**Daily:**
- [ ] Check application is running
- [ ] Verify displays are showing content
- [ ] Monitor disk space

**Weekly:**
- [ ] Review server logs for errors
- [ ] Check database backup succeeded
- [ ] Clean up old uploaded files
- [ ] Test slide creation and updates

**Monthly:**
- [ ] Update Node.js and npm packages
- [ ] Review and optimize database
- [ ] Audit user accounts
- [ ] Test disaster recovery process

### Monitoring Checklist

```bash
# Check server health
curl http://YOUR_SERVER_IP:5000/health

# Check cache status
curl http://YOUR_SERVER_IP:5000/api/dashboard/cache-status

# Check disk space
df -h

# Check memory usage
free -h

# Check process status
pm2 status
```

---

## 🆘 Emergency Procedures

### Application Won't Start

```bash
# 1. Check logs
cd server
cat error.log

# 2. Verify database connection
npm run test-db

# 3. Check port availability
# Windows
netstat -ano | findstr :5000
# Linux
sudo lsof -i :5000

# 4. Restart with verbose logging
NODE_ENV=development npm run dev
```

### Display Shows No Content

```bash
# 1. Check backend is running
curl http://YOUR_SERVER_IP:5000/api/dashboard

# 2. Verify slides are active
# Login to admin → Check slide toggles

# 3. Clear browser cache on display
# Ctrl+Shift+Delete

# 4. Hard refresh display page
# Ctrl+F5 or F5
```

### Database Corruption

```bash
# 1. Stop application
pm2 stop led-backend

# 2. Restore from latest backup
psql -U led_user led_display < latest_backup.sql

# 3. Verify data integrity
psql -U led_user led_display
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM sessions;
\q

# 4. Restart application
pm2 start led-backend
```

---

## 📝 Deployment Summary

### Production Deployment Checklist

- [ ] ✅ All prerequisites installed
- [ ] ✅ Environment variables configured
- [ ] ✅ Database set up and migrated
- [ ] ✅ Frontend built successfully
- [ ] ✅ Backend running in production mode
- [ ] ✅ Default admin password changed
- [ ] ✅ Firewall configured
- [ ] ✅ SSL certificate installed (recommended)
- [ ] ✅ Backup system configured
- [ ] ✅ Monitoring set up
- [ ] ✅ LED displays configured
- [ ] ✅ Browser kiosk mode enabled
- [ ] ✅ Application tested end-to-end

### Post-Deployment Verification

1. **Access admin panel** from your computer
2. **Create a test slide** (News or Image slide)
3. **Activate the slide**
4. **Check display screen** shows the slide within 60 seconds
5. **Toggle settings** and verify they apply
6. **Upload a file** and verify it displays
7. **Monitor for 24 hours** to ensure stability

---

## 📚 Additional Resources

- **[START_HERE.md](./START_HERE.md)** - Quick overview
- **[docs/QUICK_START.md](./docs/QUICK_START.md)** - Developer guide
- **[docs/architecture.md](./docs/architecture.md)** - System architecture
- **Server Logs**: `server/combined.log` and `server/error.log`

---

## ✅ Success Criteria

Your deployment is successful when:

✅ Admin panel is accessible from your network  
✅ Login works without errors  
✅ Slides can be created and edited  
✅ Files upload successfully  
✅ Display page shows slideshow  
✅ Slideshow transitions work smoothly  
✅ Real-time data updates (if configured)  
✅ No errors in browser console  
✅ No errors in server logs  
✅ Changes sync to display within 60 seconds  

---

**Congratulations! Your LED Display System is now deployed! 🎉**

---

**Version**: 1.9.0  
**Last Updated**: January 2025  
**Support**: Check docs/ folder for detailed guides
