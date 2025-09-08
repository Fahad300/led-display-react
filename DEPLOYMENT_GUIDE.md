# LED Display Application - Windows VM Deployment Guide

## File Upload/Display Issues Fix

This guide addresses the file upload and display issues when deploying to a Windows VM.

## Problem
- Images, videos, and documents are not displaying correctly
- File URLs are showing localhost URLs that don't work on the VM
- Media files appear broken or don't load

## Solution

### 1. Environment Configuration

#### Server Environment Variables
Create a `.env` file in the `server` directory:

```env
# Server Configuration
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=led_display
DB_SYNCHRONIZE=false

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Logging Configuration
LOG_LEVEL=info

# Server URL Configuration (IMPORTANT: Replace with your VM's IP)
SERVER_URL=http://YOUR_VM_IP:5000
BACKEND_URL=http://YOUR_VM_IP:5000
```

#### Client Environment Variables
Create a `.env` file in the `client` directory:

```env
# React App Configuration
REACT_APP_BACKEND_URL=http://YOUR_VM_IP:5000
REACT_APP_BACKEND_PORT=5000
```

### 2. Deployment Steps

1. **Replace `YOUR_VM_IP`** with your actual Windows VM IP address in both `.env` files

2. **Build the client**:
   ```bash
   cd client
   npm run build
   ```

3. **Start the server**:
   ```bash
   cd server
   npm install
   npm run migrate
   npm run seed
   npm run dev
   ```

4. **Serve the client** (you can use a simple HTTP server):
   ```bash
   cd client/build
   npx serve -s . -l 3000
   ```

### 3. Network Configuration

Ensure your Windows VM allows connections on:
- Port 5000 (Backend API)
- Port 3000 (Frontend - if serving separately)

### 4. Testing

1. Access your application at `http://YOUR_VM_IP:3000`
2. Try uploading an image/video
3. Check that the file URLs are using your VM IP instead of localhost
4. Verify that uploaded files display correctly

### 5. Troubleshooting

If files still don't display:

1. **Check browser console** for CORS or network errors
2. **Verify file URLs** in the network tab - they should use your VM IP
3. **Test direct file access**: `http://YOUR_VM_IP:5000/api/files/FILE_ID`
4. **Check server logs** for any file serving errors

### 6. Alternative: Use Domain Name

If you have a domain name pointing to your VM:

```env
# Server
SERVER_URL=http://yourdomain.com:5000
BACKEND_URL=http://yourdomain.com:5000

# Client
REACT_APP_BACKEND_URL=http://yourdomain.com:5000
```

## Key Changes Made

1. **Dynamic URL Resolution**: The application now detects the environment and uses appropriate URLs
2. **Fallback URL Construction**: If a file URL fails, the app tries to construct a working URL
3. **Environment-based Configuration**: Different settings for development vs production
4. **Better Error Handling**: More detailed logging for file loading issues

## Files Modified

- `server/src/utils/urlUtils.ts` - Dynamic backend URL resolution
- `client/src/services/api.ts` - Dynamic client API URL resolution
- `client/src/components/MediaSelector.tsx` - Better file URL handling
- `client/src/pages/MediaPage.tsx` - Fallback URL construction for images
