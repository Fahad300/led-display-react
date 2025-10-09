# Persivia LED Display System

A modern, full-stack LED display management system built with React and Node.js. Manage dynamic slideshow content, display real-time data visualizations, and celebrate employee milestones on LED screens across your organization.

![Version](https://img.shields.io/badge/version-1.9.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-19.1-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue)
![Node](https://img.shields.io/badge/Node-18+-green)

---

## ✨ Features

### 📺 Display Capabilities
- **Multiple Slide Types**: Images, videos, news, events, documents, graphs, and rich text
- **Real-Time Data**: Live employee celebrations, escalations, and performance metrics
- **Responsive Design**: Optimized for LED screens of any size
- **Smooth Transitions**: Multiple effect options (fade, slide, cube, etc.)
- **Auto-Play Slideshow**: Configurable timing and automatic transitions

### 🎛️ Management Interface
- **Drag & Drop**: Intuitive slide reordering
- **Live Preview**: See changes before publishing
- **Rich Text Editor**: Create formatted content with images and links
- **Media Library**: Centralized file management
- **Display Settings**: Control transitions, pagination, and overlay elements

### 🔒 Security & Authentication
- **JWT Authentication**: Secure user login
- **Protected Routes**: Role-based access control
- **Session Management**: Multi-device support
- **Secure File Upload**: Validated and sanitized uploads

### ⚡ Performance
- **Smart Caching**: Zero-downtime data delivery
- **Automatic Polling**: Background data updates
- **Optimized Loading**: Video preloading and lazy loading
- **State Management**: React Query + Zustand for optimal performance

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18 or higher
- **npm** 7 or higher
- **Windows** 10/11 or **Linux** server

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LED
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Configure environment variables**
   
   **Server** (`server/.env`):
   ```env
   # Server Configuration
   NODE_ENV=production
   PORT=5000
   HOST=0.0.0.0

   # Database (TypeORM with PostgreSQL)
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=your_db_user
   DB_PASSWORD=your_db_password
   DB_DATABASE=led_display

   # JWT Authentication
   JWT_SECRET=your-super-secret-jwt-key-change-this
   JWT_EXPIRES_IN=24h

   # File Upload
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=104857600

   # Server URL (replace with your actual IP/domain)
   SERVER_URL=http://YOUR_SERVER_IP:5000
   BACKEND_URL=http://YOUR_SERVER_IP:5000
   ```

   **Client** (`client/.env`):
   ```env
   # Backend API URL (replace with your actual IP/domain)
   REACT_APP_BACKEND_URL=http://YOUR_SERVER_IP:5000
   ```

4. **Set up the database**
   ```bash
   cd server
   npm run migrate      # Run database migrations
   npm run seed         # Seed with default admin user
   ```

5. **Start the application**
   
   **Development Mode:**
   ```bash
   # Terminal 1 - Start backend
   cd server
   npm run dev
   
   # Terminal 2 - Start frontend
   cd client
   npm start
   ```

   **Production Mode:**
   ```bash
   # Build frontend
   cd client
   npm run build

   # Start backend (serves frontend automatically)
   cd ../server
   npm start
   ```

6. **Access the application**
   - **Admin Panel**: `http://localhost:3000` (development) or `http://YOUR_SERVER_IP:5000` (production)
   - **LED Display**: `http://localhost:3000/display`
   - **Default Login**: 
     - Username: `admin`
     - Password: `admin123` (⚠️ Change immediately!)

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** | Complete deployment instructions for Windows/Linux |
| **[START_HERE.md](./START_HERE.md)** | Quick overview and getting started |
| **[docs/QUICK_START.md](./docs/QUICK_START.md)** | Developer quick start guide |
| **[docs/architecture.md](./docs/architecture.md)** | System architecture and design |

---

## 🎨 Usage

### Creating Slides

1. **Login** to the admin panel
2. **Navigate** to the Admin page
3. **Click** "Add New Slide"
4. **Select** slide type (Image, Video, News, etc.)
5. **Configure** slide content and duration
6. **Save** and activate the slide

### Display Settings

Access settings from the **Home page**:

- **Transition Effect**: Choose fade, slide, cube, or other effects
- **Show Date Stamp**: Display current date/time on LED screen
- **Hide Pagination**: Remove navigation dots
- **Hide Arrows**: Remove navigation arrows
- **Development Mode**: Show debugging overlay for testing

### Managing Media

1. **Navigate** to Media page
2. **Upload** images, videos, or documents
3. **Preview** files before using in slides
4. **Copy URL** to use in slides or external sources
5. **Delete** unused files to save space

---

## 🛠️ Technology Stack

### Frontend
- **React 19** - Modern UI library
- **TypeScript** - Type-safe development
- **React Query v5** - Server state management
- **Zustand** - UI state management
- **TailwindCSS** - Utility-first styling
- **Swiper.js** - Advanced slideshow
- **Chart.js** - Data visualization
- **Framer Motion** - Smooth animations

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **TypeORM** - Database ORM
- **PostgreSQL** - Production database
- **JWT** - Authentication
- **Passport.js** - Auth middleware
- **Multer** - File uploads

---

## 📁 Project Structure

```
LED/
├── client/                    # React frontend
│   ├── public/               # Static assets
│   │   ├── images/          # Logos and default images
│   │   └── videos/          # Background videos
│   ├── src/
│   │   ├── api/            # API client (backendApi.ts)
│   │   ├── components/     # Reusable components
│   │   │   └── slides/    # Slide type components
│   │   ├── contexts/       # React contexts (deprecated)
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # Business logic
│   │   ├── stores/         # Zustand stores
│   │   ├── types/          # TypeScript definitions
│   │   └── utils/          # Utility functions
│   └── package.json
│
├── server/                    # Node.js backend
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── middleware/     # Express middleware
│   │   ├── migrations/     # Database migrations
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── scripts/        # Setup scripts
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── uploads/            # Uploaded files
│   └── package.json
│
├── docs/                      # Documentation
│   ├── QUICK_START.md        # Developer guide
│   ├── architecture.md       # System architecture
│   └── MIGRATION_GUIDE.md    # Migration instructions
│
├── DEPLOYMENT_GUIDE.md        # Deployment instructions
├── START_HERE.md              # Quick overview
└── README.md                  # This file
```

---

## 🔧 Configuration

### Environment Variables

#### Server Configuration
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | No |
| `PORT` | Server port | `5000` | No |
| `DB_HOST` | Database host | `localhost` | Yes |
| `DB_USERNAME` | Database user | - | Yes |
| `DB_PASSWORD` | Database password | - | Yes |
| `JWT_SECRET` | JWT signing key | - | Yes |
| `SERVER_URL` | Server URL | `http://localhost:5000` | Yes |

#### Client Configuration
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REACT_APP_BACKEND_URL` | Backend API URL | `http://localhost:5000` | Yes |

### Display Settings

Configure from the **Home page** Settings panel:
- **Swiper Effect**: `slide`, `fade`, `cube`, `coverflow`, `flip`, `cards`
- **Slide Duration**: Individual duration per slide (in seconds)
- **Show Date Stamp**: Display current date/time overlay
- **Development Mode**: Enable debugging overlay

---

## 🎯 Common Tasks

### Add a New User
1. Login as admin
2. Click user menu (top right)
3. Select "Add User"
4. Fill in username and password
5. Click "Register"

### Upload Media Files
1. Go to **Media** page
2. Click file input or drag & drop
3. Select image, video, or document
4. Wait for upload to complete
5. Use the file URL in your slides

### Activate/Deactivate Slides
1. Go to **Home** page
2. Find the slide you want to toggle
3. Click the switch to activate/deactivate
4. Changes save automatically

### Change Display Settings
1. Go to **Home** page
2. Scroll to Settings panel
3. Toggle any setting (Date Stamp, Pagination, etc.)
4. Settings sync automatically to all displays

---

## 🚨 Troubleshooting

### Issue: "Cannot connect to backend"
**Solution**: Check that the backend server is running and `REACT_APP_BACKEND_URL` is correct.

### Issue: "Files not displaying"
**Solution**: Verify `SERVER_URL` in server `.env` matches your actual IP address.

### Issue: "401 Unauthorized errors"
**Solution**: Login again - your session may have expired.

### Issue: "Slides not updating on display"
**Solution**: Enable Development Mode and check console for data loading errors.

### Issue: "Video not playing"
**Solution**: Ensure video is MP4 format, under 100MB, and muted is enabled.

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Dashboard
- `GET /api/dashboard` - Get all dashboard data (employees, graphs, escalations)
- `GET /api/dashboard/cache-status` - Check cache status

### Files
- `POST /api/files/upload` - Upload media file
- `GET /api/files` - List all files
- `GET /api/files/:id` - Get specific file
- `DELETE /api/files/:id` - Delete file

### Sessions
- `POST /api/sessions` - Create session
- `PUT /api/sessions/:token` - Update session data
- `POST /api/sessions/trigger-refresh` - Trigger remote display refresh

---

## 🔄 Deployment

### Production Deployment

See **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for complete instructions.

**Quick steps:**

1. **Configure environment** (set production URLs and secrets)
2. **Build frontend** (`npm run build` in client/)
3. **Start backend** (`npm start` in server/)
4. **Open display** in browser on LED screen
5. **Full-screen** the /display page (F11)

### Windows VM Deployment

1. Replace `YOUR_VM_IP` in both `.env` files with actual VM IP
2. Open ports 3000 and 5000 in Windows Firewall
3. Build and start both client and server
4. Access from LED screen browser

### Docker Deployment (Optional)

```bash
docker-compose up -d
```

---

## 🧪 Development

### Run in Development Mode
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm start
```

### Enable Development Mode
1. Login to application
2. Go to Home page
3. Scroll to Settings
4. Toggle "Development Mode"
5. Check console for detailed logs

### Testing
```bash
# Run frontend tests
cd client
npm test

# Run backend tests
cd server
npm test
```

---

## 📝 License

Copyright © 2025 Persivia. All rights reserved.

---

## 🆘 Support

For issues, questions, or feature requests:
1. Check the [documentation](./docs/)
2. Review the [deployment guide](./DEPLOYMENT_GUIDE.md)
3. Check browser console for errors
4. Enable Development Mode for detailed logs

---

## 🔗 Quick Links

- **[Quick Start Guide](./START_HERE.md)** - Get started quickly
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Deploy to production
- **[Developer Docs](./docs/)** - Technical documentation
- **[Architecture](./docs/architecture.md)** - System design

---

**Version**: 1.9.0  
**Last Updated**: January 2025  
**Status**: ✅ Production Ready
