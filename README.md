# LED Display System - Enterprise Dashboard

A comprehensive React TypeScript application for managing and displaying dynamic content on LED displays in enterprise environments. Features real-time data integration, multiple slide types, and advanced display management capabilities.

## 🚀 Key Features

### **Multi-Slide Type Support**
- **Image Slides**: High-resolution images with captions and effects
- **Video Slides**: MP4 video playback with custom controls
- **News Slides**: RSS feed integration with real-time updates
- **Event Slides**: Employee celebrations (birthdays, anniversaries) with live API data
- **Graph Slides**: Interactive charts with real-time data visualization
- **Team Comparison Slides**: Performance metrics and escalation tracking
- **Current Escalations**: Live ticket status and priority management
- **Document Slides**: PDF and document display capabilities

### **Real-Time Data Integration**
- **Employee API**: Live employee data for celebrations and events
- **Graph API**: Real-time performance metrics and team comparisons
- **News API**: Dynamic news feed updates
- **Backend Proxy**: CORS-free external API integration
- **Auto-refresh**: Configurable polling for live data updates

### **Advanced Display Management**
- **Responsive LED Display**: Optimized for large screens and LED walls
- **Dynamic Scaling**: Automatic text and element scaling for various display sizes
- **Multiple Transitions**: Fade, cube, coverflow, flip, and card effects
- **Auto-play Control**: Configurable slide timing and transitions
- **Fullscreen Mode**: Dedicated display page for LED screens

### **Admin Interface**
- **Slide Management**: Create, edit, delete, and organize slides
- **Drag & Drop**: Intuitive slide reordering
- **Real-time Preview**: Live preview of slide changes
- **Bulk Operations**: Mass slide activation/deactivation
- **Settings Panel**: Comprehensive display and behavior configuration

### **Enterprise Features**
- **User Authentication**: JWT-based secure login system
- **Role-based Access**: Admin and display user roles
- **Database Integration**: Persistent slide and user data storage
- **Session Management**: Cross-device synchronization
- **Error Handling**: Robust error recovery and fallback mechanisms

## 🛠 Technology Stack

### **Frontend**
- **React 18** with TypeScript for type safety
- **TailwindCSS** for responsive, utility-first styling
- **Swiper.js** for advanced slideshow functionality
- **Chart.js** for interactive data visualization
- **Framer Motion** for smooth animations
- **Axios** for HTTP client and API integration

### **Backend**
- **Node.js** with Express.js server
- **TypeScript** for type-safe server development
- **SQLite** database with Knex.js ORM
- **JWT** authentication with Passport.js
- **File upload** handling with multer
- **CORS** and proxy management

### **Development Tools**
- **Vite** for fast development and building
- **ESLint** and **Prettier** for code quality
- **Hot reload** for rapid development
- **Environment variables** for configuration management

## 📦 Installation & Setup

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn package manager

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd led-display-react
   ```

2. **Install dependencies**
   ```bash
   # Install client dependencies
   cd client
   npm install
   
   # Install server dependencies
   cd ../server
   npm install
   ```

3. **Environment Configuration**
   ```bash
   # Client environment (.env in client directory)
   REACT_APP_BACKEND_URL=http://localhost:3001
   REACT_APP_EXTERNAL_API_URL=https://your-api-endpoint.com
   REACT_APP_API_TOKEN=your-api-token
   
   # Server environment (.env in server directory)
   PORT=3001
   JWT_SECRET=your-jwt-secret
   DATABASE_URL=./database.sqlite
   ```

4. **Database Setup**
   ```bash
   cd server
   npm run setup-db
   npm run seed
   ```

5. **Start the application**
   ```bash
   # Start backend server
   cd server
   npm run dev
   
   # Start frontend (in new terminal)
   cd client
   npm start
   ```

6. **Access the application**
   - **Admin Interface**: `http://localhost:3000`
   - **Display Page**: `http://localhost:3000/display`
   - **API Server**: `http://localhost:3001`

## 🎯 Usage Guide

### **Admin Interface** (`/`)
- **Slide Management**: Create and organize different types of slides
- **Real-time Preview**: See changes immediately in the preview panel
- **Settings Configuration**: Adjust display behavior and appearance
- **User Management**: Manage user accounts and permissions

### **Display Page** (`/display`)
- **Fullscreen Mode**: Optimized for LED displays
- **Auto-play Slideshow**: Automatic transition between active slides
- **Real-time Updates**: Live data integration and updates
- **Responsive Design**: Adapts to various screen sizes

### **Slide Types**

#### **Event Slides**
- **Birthday Celebrations**: Automatic detection of employee birthdays
- **Work Anniversaries**: Recognition of employee milestones
- **Live API Integration**: Real-time employee data updates
- **Custom Styling**: Responsive design for LED displays

#### **Graph Slides**
- **Team Performance**: Real-time team comparison data
- **Escalation Trends**: Priority-based escalation tracking
- **Interactive Charts**: Clickable chart elements
- **Dynamic Updates**: Live data refresh capabilities

#### **News Slides**
- **RSS Integration**: Real-time news feed updates
- **Custom Styling**: Responsive text and layout
- **Auto-scroll**: Smooth text scrolling for long content

#### **Media Slides**
- **Image Support**: High-resolution image display
- **Video Support**: MP4 video playback
- **Document Support**: PDF and document viewing

## 🔧 Configuration

### **Display Settings**
- **Transition Effects**: Choose from multiple slide transition types
- **Auto-play Timing**: Configure slide duration and transition speed
- **Display Options**: Show/hide pagination, arrows, and timestamps
- **Responsive Scaling**: Automatic text and element scaling

### **API Configuration**
- **External APIs**: Configure employee and graph data sources
- **Proxy Settings**: Backend proxy for CORS-free API calls
- **Authentication**: JWT token management for secure API access
- **Polling Intervals**: Configurable data refresh rates

### **Database Management**
- **Slide Storage**: Persistent slide configuration and data
- **User Management**: User accounts and authentication data
- **Session Tracking**: Cross-device synchronization
- **Backup & Restore**: Database backup and recovery options

## 🏗 Project Structure

```
led-display-react/
├── client/                          # Frontend React application
│   ├── public/                      # Static assets
│   │   ├── images/                  # Logo and default images
│   │   ├── videos/                  # Background videos
│   │   └── index.html              # HTML template
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── slides/            # Slide type components
│   │   │   ├── layout/            # Layout components
│   │   │   └── ...                # Other components
│   │   ├── contexts/              # React Context providers
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── pages/                 # Page components
│   │   ├── services/              # API and external services
│   │   ├── types/                 # TypeScript definitions
│   │   ├── utils/                 # Utility functions
│   │   └── App.tsx               # Main application
│   └── package.json
├── server/                         # Backend Node.js server
│   ├── src/
│   │   ├── config/               # Database and environment config
│   │   ├── middleware/           # Express middleware
│   │   ├── models/               # Database models
│   │   ├── routes/               # API routes
│   │   ├── services/             # Business logic
│   │   └── server.ts            # Server entry point
│   ├── uploads/                  # File upload directory
│   └── package.json
└── README.md
```

## 🔄 Development Workflow

### **Adding New Slide Types**
1. Define the slide type in `client/src/types/index.ts`
2. Create the slide component in `client/src/components/slides/`
3. Add the slide to the render function in `SlidesDisplay.tsx`
4. Update the admin interface for slide creation/editing

### **API Integration**
1. Add API service in `client/src/services/`
2. Create context provider for state management
3. Update components to use the new data source
4. Configure backend proxy if needed

### **Database Changes**
1. Create migration in `server/src/migrations/`
2. Update models in `server/src/models/`
3. Add API routes in `server/src/routes/`
4. Test with sample data

## 🚀 Deployment

### **Production Build**
```bash
# Build frontend
cd client
npm run build

# Build backend
cd ../server
npm run build
```

### **Environment Variables**
- Configure production API endpoints
- Set secure JWT secrets
- Configure database connections
- Set up SSL certificates

### **Docker Deployment**
```bash
# Build and run with Docker
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **TailwindCSS** for the utility-first CSS framework
- **Swiper.js** for advanced slideshow functionality
- **Chart.js** for interactive data visualization
- **Express.js** for the robust backend framework
