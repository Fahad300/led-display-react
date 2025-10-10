# Persivia LED Display System

A modern, full-stack LED display management system with real-time Socket.IO updates. Manage dynamic slideshow content, display real-time data visualizations, and celebrate employee milestones on LED screens across your organization.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-Proprietary-red)
![React](https://img.shields.io/badge/React-19.1-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue)
![Node](https://img.shields.io/badge/Node-18+-green)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7-black)

---

## ✨ Features

### 📺 Display Capabilities
- **Real-Time Updates**: Socket.IO provides instant sync across network (<1s)
- **Multiple Slide Types**: Images, videos, news, events, documents, graphs, and rich text
- **Live Data**: Employee celebrations, escalations, and performance metrics
- **Responsive Design**: Optimized for LED screens of any size
- **Smooth Transitions**: Multiple effect options (fade, slide, cube, flip, cards)
- **Auto-Play Slideshow**: Individual slide durations with smooth playback

### 🎛️ Management Interface
- **Drag & Drop**: Intuitive slide reordering
- **Live Preview**: See changes before publishing
- **Rich Text Editor**: Create formatted content with images and links
- **Media Library**: Centralized file management
- **Instant Sync**: Changes appear on displays within 1-2 seconds

### 🔒 Security & Authentication
- **JWT Authentication**: Secure user login
- **Protected Routes**: Role-based access control
- **Session Management**: Multi-device support
- **Secure File Upload**: Validated and sanitized uploads

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18 or higher
- **PostgreSQL** 12 or higher
- **npm** 7 or higher
- **Windows** 10/11 or **Linux** server

### Installation

1. **Clone and install dependencies**
   ```bash
   cd LED
   
   # Install server dependencies
   cd server && npm install
   
   # Install client dependencies
   cd ../client && npm install
   ```

2. **Configure environment variables**
   
   **Server** (`server/.env`):
   ```env
   NODE_ENV=production
   PORT=5000
   
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=led_user
   DB_PASSWORD=your_secure_password
   DB_DATABASE=led_display
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key-change-this
   
   # Server URL (replace with your actual IP)
   SERVER_URL=http://192.168.1.100:5000
   CLIENT_URL=http://192.168.1.100:3000
   ```
   
   **Client** (`client/.env`):
   ```env
   REACT_APP_BACKEND_URL=http://192.168.1.100:5000
   ```

3. **Set up database**
   ```bash
   cd server
   npm run setup:db     # Creates database and tables
   npm run seed         # Creates default admin user
   ```

4. **Start the application**
   
   **Development:**
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev
   
   # Terminal 2 - Frontend
   cd client && npm start
   ```
   
   **Production:**
   ```bash
   # Build frontend
   cd client && npm run build
   
   # Start backend (serves frontend)
   cd ../server && npm start
   ```

5. **Access the application**
   - **Admin**: `http://192.168.1.100:5000`
   - **Display**: `http://192.168.1.100:5000/display`
   - **Login**: `admin` / `admin123` (⚠️ Change immediately!)

---

## 📖 Documentation

### Essential Guides

| Document | Purpose |
|----------|---------|
| **[Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)** | Production deployment instructions |
| **[Quick Start](./docs/QUICK_START.md)** | Developer guide and common patterns |
| **[Socket.IO Setup](./docs/SOCKET_IO_SETUP.md)** | Real-time updates configuration |
| **[Troubleshooting](./docs/TROUBLESHOOTING.md)** | Common issues and solutions |
| **[Architecture](./docs/architecture.md)** | System design and data flow |

**➡️ Start with [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md) for production setup**

---

## 🎨 Usage

### Creating & Managing Slides

**AdminPage** (Content Creation):
1. Navigate to **Admin** page
2. Click "Add New [Type] Slide"
3. Upload media or enter content
4. Save (slides created as **inactive**)

**HomePage** (Display Management):
1. Navigate to **Home** page
2. Find slide in inactive section
3. Toggle switch to **activate**
4. Displays update **instantly** via Socket.IO ✅
5. Drag & drop to reorder

**DisplayPage** (LED Display):
- Opens at `/display` route
- Auto-refreshes when content changes
- Fullscreen mode (press F11)
- No interaction needed - pure display

---

## 🛠️ Technology Stack

**Frontend:** React 19 · TypeScript · TailwindCSS · React Query · Zustand · Socket.IO Client · Swiper  
**Backend:** Node.js · Express · TypeORM · PostgreSQL · Socket.IO Server · JWT  
**Real-Time:** Socket.IO for instant network-wide updates

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Slides not updating | Check Socket.IO connection (see console logs) |
| "Cannot connect to backend" | Verify `REACT_APP_BACKEND_URL` in client/.env |
| Files not displaying | Check `SERVER_URL` in server/.env matches your IP |
| Video not playing | Use MP4 format, <100MB, ensure muted is enabled |
| Database connection error | Verify PostgreSQL is running and credentials are correct |

**➡️ See [Troubleshooting Guide](./docs/TROUBLESHOOTING.md) for complete list**

---

## 📁 Project Structure

```
LED/
├── client/              # React frontend (Socket.IO client)
│   ├── src/
│   │   ├── pages/      # HomePage, AdminPage, DisplayPage
│   │   ├── utils/      # socket.ts, updateEvents.ts
│   │   └── stores/     # Zustand state management
│   └── package.json
│
├── server/              # Node.js backend (Socket.IO server)
│   ├── src/
│   │   ├── models/     # Database models
│   │   ├── routes/     # API endpoints
│   │   └── utils/      # socketManager.ts
│   ├── uploads/        # Uploaded files storage
│   └── package.json
│
└── docs/               # Documentation
    ├── DEPLOYMENT_GUIDE.md
    ├── QUICK_START.md
    ├── SOCKET_IO_SETUP.md
    └── TROUBLESHOOTING.md
```

---

## 🔧 Configuration

### Display Settings (Homepage)
- **Transition Effect**: `fade`, `slide`, `cube`, `flip`, `cards`, `coverflow`
- **Show Date Stamp**: Display current time on LED
- **Hide Pagination/Arrows**: Clean fullscreen display
- **Development Mode**: Show debugging overlay

### Slide Types
- **Image** - Static images with captions
- **Video** - MP4 videos with auto-play
- **News** - Announcements with background images
- **Event** - Birthday/anniversary celebrations
- **Document** - PDF, Excel, PowerPoint files
- **Text** - Rich formatted text content
- **Graph** - Team performance charts
- **Escalations** - Live ticket data

---

## 🔄 Real-Time Architecture

```
HomePage/AdminPage
    ↓ (Save + Broadcast)
    ├─→ Database (Persistence)
    └─→ Socket.IO (Real-time)
            ↓ (<1s update)
        DisplayPage
```

**Socket.IO provides instant updates, Database ensures recovery!**

---

## 📞 Support

**Documentation:** All guides are in the `docs/` folder  
**Issues:** Check [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)  
**Setup Help:** See [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)  
**Development:** Read [Quick Start](./docs/QUICK_START.md)

---

## 🎯 Default Credentials

**⚠️ IMPORTANT: Change these immediately after first login!**

- **Username:** `admin`
- **Password:** `admin123`

After login, click user menu (top right) → Add User to create additional accounts.

---

**Version:** 1.0.0  
**Release Date:** January 10, 2025  
**Status:** ✅ Production Ready  
**Copyright:** © 2025 Persivia. All rights reserved.
