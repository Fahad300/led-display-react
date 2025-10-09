# 🚀 Quick Start - LED Display System

**First time deploying?** This guide will get you up and running in minutes.

---

## 📋 Deployment Checklist

### 1. Prerequisites ✅

Before you begin, ensure you have:

- [ ] **Node.js 18+** installed ([download](https://nodejs.org/))
- [ ] **npm 7+** installed (comes with Node.js)
- [ ] **PostgreSQL** database set up
- [ ] **Administrator access** to server
- [ ] **Network access** to LED display screens

### 2. Installation Steps ✅

```bash
# Step 1: Navigate to project directory
cd LED

# Step 2: Install server dependencies
cd server
npm install

# Step 3: Install client dependencies
cd ../client
npm install
```

### 3. Configuration ✅

#### Server Configuration (`server/.env`)

Create a `.env` file in the `server` directory:

```env
# Server
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=led_user
DB_PASSWORD=your_secure_password
DB_DATABASE=led_display

# Security
JWT_SECRET=change-this-to-a-random-secret-key
JWT_EXPIRES_IN=24h

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=104857600

# URLs (IMPORTANT: Replace YOUR_SERVER_IP)
SERVER_URL=http://YOUR_SERVER_IP:5000
BACKEND_URL=http://YOUR_SERVER_IP:5000
```

#### Client Configuration (`client/.env`)

Create a `.env` file in the `client` directory:

```env
# Backend API URL (IMPORTANT: Replace YOUR_SERVER_IP)
REACT_APP_BACKEND_URL=http://YOUR_SERVER_IP:5000
```

**⚠️ IMPORTANT:** Replace `YOUR_SERVER_IP` with your actual:
- Windows VM IP address (e.g., `192.168.1.100`)
- Server domain name (e.g., `led.yourcompany.com`)
- Public IP address

### 4. Database Setup ✅

```bash
cd server

# Run migrations to create tables
npm run migrate

# Seed database with default admin user
npm run seed
```

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **CHANGE THE DEFAULT PASSWORD IMMEDIATELY AFTER FIRST LOGIN!**

### 5. Build & Deploy ✅

#### Production Deployment

```bash
# Build the frontend
cd client
npm run build

# Start the backend (serves frontend automatically)
cd ../server
npm start
```

#### Development Mode

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend  
cd client
npm start
```

### 6. Access the Application ✅

**Production:**
- Admin Panel: `http://YOUR_SERVER_IP:5000`
- LED Display: `http://YOUR_SERVER_IP:5000/display`

**Development:**
- Admin Panel: `http://localhost:3000`
- LED Display: `http://localhost:3000/display`

---

## 🖥️ LED Display Setup

### Setting Up Display Screens

1. **Open browser** on the LED display computer
2. **Navigate** to `http://YOUR_SERVER_IP:5000/display`
3. **Press F11** to enter fullscreen mode
4. **Disable** screensaver and sleep mode
5. **Set browser** to auto-start on system boot (optional)

### Testing the Display

1. **Login** to admin panel on your computer
2. **Go to Admin page**
3. **Create a test slide** (image or news slide recommended)
4. **Activate** the slide
5. **Check** the LED display - slide should appear within 60 seconds

---

## ⚙️ First-Time Configuration

### Step 1: Change Admin Password

1. Login with default credentials (`admin` / `admin123`)
2. Click user menu (top right)
3. Add a new admin user with a secure password
4. Logout and login with new credentials
5. Delete the default admin user (optional)

### Step 2: Upload Media

1. Go to **Media** page
2. Upload your company logo
3. Upload background images/videos
4. Note the file URLs for use in slides

### Step 3: Create Your First Slide

1. Go to **Admin** page
2. Click "Add New Slide"
3. Select **News Slide**
4. Fill in:
   - Title: "Welcome to Persivia LED Display"
   - Details: "Your message here"
   - Background Image: Select from uploaded media
5. Set duration: 10 seconds
6. Click Save
7. Toggle the slide to **Active**

### Step 4: Configure Display Settings

1. Go to **Home** page
2. Scroll to Settings panel
3. Configure:
   - ✅ Show Date Stamp (recommended)
   - ✅ Hide Pagination (for cleaner display)
   - ✅ Hide Arrows (for auto-play only)
   - ❌ Development Mode (disable in production)
4. Select transition effect (Fade recommended)

---

## 🔍 Verifying Everything Works

### Checklist

- [ ] Backend server is running (`http://YOUR_SERVER_IP:5000/api/auth/me` should respond)
- [ ] Frontend is accessible (`http://YOUR_SERVER_IP:5000` loads)
- [ ] Login works (no 401 errors)
- [ ] Can create slides
- [ ] Can upload files
- [ ] Display page shows slides (`http://YOUR_SERVER_IP:5000/display`)
- [ ] Slideshow transitions work
- [ ] Real-time data loads (if configured)

---

## 🚨 Common Issues & Solutions

### "Cannot connect to backend"
**Cause:** Backend server not running or wrong URL  
**Fix:** 
1. Check backend is running: `cd server && npm start`
2. Verify `REACT_APP_BACKEND_URL` in `client/.env`
3. Check firewall allows port 5000

### "Files not displaying"
**Cause:** Wrong `SERVER_URL` in backend `.env`  
**Fix:** 
1. Update `SERVER_URL` in `server/.env` with your actual IP
2. Restart backend server
3. Re-upload files

### "Slides not showing on display"
**Cause:** No active slides or slides have 0 duration  
**Fix:**
1. Go to Admin page
2. Check slide is **Active** (toggle switch)
3. Verify duration is > 0 seconds
4. Check display page refreshes data

### "401 Unauthorized errors"
**Cause:** Session expired or not logged in  
**Fix:**
1. Login again
2. Check token in localStorage (F12 → Application → Local Storage)
3. Verify backend is running

---

## 📚 Next Steps

### For Administrators
1. ✅ Complete first-time configuration above
2. ✅ Create your first slides
3. ✅ Set up LED display screens
4. ✅ Configure real-time data sources (optional)
5. ✅ Train team members on the admin interface

### For Developers
1. 📖 Read [Developer Quick Start](./docs/QUICK_START.md)
2. 🏗️ Review [Architecture Guide](./docs/architecture.md)
3. 🔧 Explore the codebase
4. 🧪 Run tests and development mode
5. 🚀 Start building features

### For DevOps
1. 📘 Review [Deployment Guide](./DEPLOYMENT_GUIDE.md)
2. 🔒 Secure the JWT secret
3. 🗄️ Set up database backups
4. 🌐 Configure domain and SSL
5. 📊 Set up monitoring and logs

---

## ⚡ Performance Tips

### For Best Performance

1. **Use MP4 videos** under 50MB
2. **Optimize images** to 1920x1080 or smaller
3. **Set appropriate slide durations** (10-15 seconds recommended)
4. **Limit active slides** to 10-15 for smooth transitions
5. **Use fade effect** for smoothest transitions
6. **Enable Development Mode** only for testing

### Recommended Settings

- **Transition Effect**: Fade (smoothest)
- **Slide Duration**: 10-15 seconds
- **Show Date Stamp**: Yes
- **Hide Pagination**: Yes (cleaner look)
- **Hide Arrows**: Yes (auto-play only)
- **Development Mode**: No (production)

---

## 🎓 Learn More

| Resource | Description |
|----------|-------------|
| [Quick Start](./docs/QUICK_START.md) | Developer quick start with code examples |
| [Architecture](./docs/architecture.md) | System architecture and data flow |
| [Deployment](./DEPLOYMENT_GUIDE.md) | Complete deployment instructions |
| [Migration](./docs/MIGRATION_GUIDE.md) | Migrating from old architecture |

---

## 📞 Need Help?

1. **Check documentation** in `docs/` folder
2. **Enable Development Mode** for detailed error logs
3. **Check browser console** (F12) for client-side errors
4. **Check server logs** for backend errors
5. **Verify environment variables** are set correctly

---

**Ready to deploy?** 🚀  
**Follow the steps above and you'll be running in 15 minutes!**

---

**Version**: 1.9.0  
**Status**: ✅ Production Ready  
**Last Updated**: January 2025
