# 🔧 Troubleshooting Guide

Common issues and solutions for the LED Display System.

---

## 📑 Table of Contents

1. [Authentication Issues](#authentication-issues)
2. [File Upload & Display](#file-upload--display)
3. [Slideshow Problems](#slideshow-problems)
4. [Video Playback Issues](#video-playback-issues)
5. [Real-Time Data Issues](#real-time-data-issues)
6. [Performance Problems](#performance-problems)
7. [Development Mode](#development-mode)

---

## 🔐 Authentication Issues

### 401 Unauthorized Errors

**Symptoms:**
- Console shows `401 Unauthorized` errors
- Redirected to login page unexpectedly
- "Session expired" messages

**Solutions:**

1. **Login again** - Session may have expired (24h default)
2. **Check token** in browser:
   ```javascript
   // Open console (F12)
   localStorage.getItem('token')
   // Should show a JWT token string
   ```
3. **Verify backend is running**:
   ```bash
   curl http://localhost:5000/api/auth/me
   ```
4. **Check JWT_SECRET** matches in backend `.env`

**Note:** Some 401 errors are expected (e.g., remote sync when not authenticated). These are handled gracefully and won't affect functionality.

### Cannot Login

**Symptoms:**
- Login button doesn't work
- "Invalid credentials" message

**Solutions:**

1. **Verify credentials**:
   - Default: `admin` / `admin123`
   - Check with database admin if changed

2. **Check backend connection**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```

3. **Reset admin password** (if needed):
   ```bash
   cd server
   npm run reset-password
   ```

---

## 📁 File Upload & Display

### Files Not Uploading

**Symptoms:**
- Upload button doesn't work
- "Upload failed" error message

**Solutions:**

1. **Check file size** - Must be under 100MB (default)
2. **Check file format**:
   - Images: JPG, PNG, GIF, WebP
   - Videos: MP4, WebM
   - Documents: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
3. **Verify uploads directory exists**:
   ```bash
   ls -la server/uploads/
   # Should exist and be writable
   ```
4. **Check server logs** for multer errors:
   ```bash
   tail -f server/error.log
   ```

### Files Not Displaying

**Symptoms:**
- Broken image icons
- Videos don't play
- Files show as "not found"

**Solutions:**

1. **Check file URLs** in Network tab (F12):
   - Should use server IP, not `localhost`
   - Format: `http://YOUR_SERVER_IP:5000/api/files/FILE_ID`

2. **Verify SERVER_URL** in `server/.env`:
   ```env
   SERVER_URL=http://YOUR_ACTUAL_IP:5000
   BACKEND_URL=http://YOUR_ACTUAL_IP:5000
   ```

3. **Restart backend** after changing SERVER_URL:
   ```bash
   cd server
   pm2 restart led-backend
   # or
   npm start
   ```

4. **Test direct file access**:
   ```bash
   curl http://YOUR_SERVER_IP:5000/api/files/FILE_ID
   # Should return file data
   ```

### File URL Mismatch

**Problem:** URLs showing `localhost` instead of server IP

**Solution:**

Update `server/src/utils/urlUtils.ts` to use correct base URL:

```typescript
export const getBackendUrl = (): string => {
    return process.env.SERVER_URL || process.env.BACKEND_URL || "http://localhost:5000";
};
```

Then restart the backend.

---

## 🎬 Slideshow Problems

### Slides Not Showing

**Symptoms:**
- Display page is blank
- Only logo animation shows
- No slides appear

**Solutions:**

1. **Check slides are active**:
   - Go to Admin page
   - Verify toggle switch is ON (green)
   - Check slide duration > 0

2. **Verify at least one active slide**:
   ```javascript
   // Console (F12)
   // Should show active slides
   ```

3. **Check for JavaScript errors**:
   - Open console (F12)
   - Look for red error messages
   - Fix errors or report them

4. **Refresh display page**:
   - Press `Ctrl+F5` (hard refresh)
   - Or clear cache and refresh

### Slides Not Transitioning

**Symptoms:**
- Slideshow stuck on one slide
- Auto-play not working
- Timer not counting down

**Solutions:**

1. **Enable Development Mode**:
   - Home page → Settings → Toggle "Development Mode"
   - Check overlay for countdown timer

2. **Check slide durations**:
   - Each slide must have duration > 0
   - Recommended: 10-15 seconds

3. **Verify multiple active slides**:
   - Need at least 2 active slides for transitions
   - Check slide toggle switches

4. **Check console for errors**:
   ```javascript
   // Look for:
   // - Video buffering errors
   // - Swiper initialization errors
   // - Timeout errors
   ```

### Slides in Wrong Order

**Symptoms:**
- Slides display in unexpected order

**Solutions:**

1. **Use drag & drop** to reorder:
   - Home page → Drag slides to desired position
   - Order saves automatically

2. **Verify order persisted**:
   - Refresh page
   - Check order remains

---

## 🎥 Video Playback Issues

### Videos Not Playing

**Symptoms:**
- Video shows loading spinner forever
- Black screen instead of video
- "Video error" message

**Solutions:**

1. **Check video format**:
   - Must be MP4 (H.264 codec)
   - Use [HandBrake](https://handbrake.fr/) to convert

2. **Check video size**:
   - Should be under 50MB
   - Compress large videos

3. **Verify muted enabled**:
   - Admin page → Edit video slide
   - Ensure "Muted" is checked
   - Browsers require muted for autoplay

4. **Test video directly**:
   - Copy video URL
   - Open in new browser tab
   - Verify it plays

5. **Check browser console**:
   ```javascript
   // Look for:
   // - CORS errors
   // - Video codec errors
   // - Network errors
   ```

### Video Stuttering/Buffering

**Symptoms:**
- Video pauses during playback
- Choppy playback
- Loading spinner appears mid-video

**Solutions:**

1. **Compress video**:
   - Target bitrate: 5000 kbps or lower
   - Use H.264 codec
   - Resolution: 1920x1080 max

2. **Preload videos**:
   - System automatically preloads next 2 videos
   - Ensure network speed is adequate

3. **Check network speed**:
   ```bash
   # Test download speed to server
   wget http://YOUR_SERVER_IP:5000/api/files/VIDEO_ID
   ```

4. **Increase slide duration**:
   - Give videos more time to buffer
   - Add 2-3 seconds buffer to video length

### Video Slide Duration Issues

**Problem:** Slideshow advances before video ends

**Solutions:**

1. **Set correct duration**:
   - Admin page → Edit video slide
   - Duration should be: `video length + 2 seconds`

2. **Check video metadata**:
   - Enable Development Mode
   - Console shows actual video duration
   - Update slide duration accordingly

3. **Use auto-duration**:
   - System detects video length automatically
   - Manual override only if needed

---

## 📊 Real-Time Data Issues

### Employee Data Not Showing

**Symptoms:**
- Birthday/Anniversary slides show "No data"
- Employee names missing

**Solutions:**

1. **Check API endpoint**:
   ```bash
   curl http://localhost:5000/api/proxy/celebrations
   # Should return employee data
   ```

2. **Verify proxy configuration**:
   - Check `server/src/routes/proxy.ts`
   - Ensure external API URL is correct
   - Check API credentials

3. **Check cache status**:
   ```bash
   curl http://localhost:5000/api/dashboard/cache-status
   ```

4. **Enable logging**:
   - Check `server/error.log` for API errors
   - Look for timeout or connection errors

### Graph Data Not Updating

**Symptoms:**
- Escalation chart shows "No data"
- Team comparison empty

**Solutions:**

1. **Test graph endpoint**:
   ```bash
   curl http://localhost:5000/api/proxy/jira-chart
   ```

2. **Check external API**:
   - Verify API is reachable
   - Check authentication tokens
   - Test API directly (Postman/curl)

3. **Review cache behavior**:
   - System serves stale cache if API fails
   - Check cache age in console logs
   - Verify "Zero Downtime" mode working

4. **Check failures array**:
   ```javascript
   // Console should show if specific APIs failed
   // Example: "❌ API Endpoint Failures: jira-chart"
   ```

### Stale Data Warning

**Symptoms:**
- Console shows "Using stale cache" warnings
- Data seems outdated

**This is normal behavior!**

The system uses "Zero Downtime" caching:
- ✅ Fresh data served when available (< 60 seconds old)
- ✅ Stale cache served when API fails (prevents data loss)
- ⚠️ Warning shown when cache is old (> 10 minutes)

**When to worry:**
- Cache age > 30 minutes consistently
- External APIs are down

**Solutions:**
1. Check external API availability
2. Review backend logs for connection errors
3. Verify network connectivity
4. Check API credentials and endpoints

---

## ⚡ Performance Problems

### Slow Page Loading

**Symptoms:**
- Pages take long to load
- Sluggish UI interactions

**Solutions:**

1. **Check network speed**:
   - Ensure server has good bandwidth
   - Test latency: `ping YOUR_SERVER_IP`

2. **Optimize media files**:
   - Compress images (use WebP format)
   - Reduce video sizes (target < 20MB)
   - Limit active slides (10-15 recommended)

3. **Clear browser cache**:
   - Press `Ctrl+Shift+Delete`
   - Clear cache and reload

4. **Check database performance**:
   ```sql
   -- Run database vacuum
   VACUUM ANALYZE;
   ```

### High Memory Usage

**Symptoms:**
- Server memory usage > 2GB
- Application crashes

**Solutions:**

1. **Restart application**:
   ```bash
   pm2 restart led-backend
   ```

2. **Check for memory leaks**:
   ```bash
   pm2 monit
   # Watch memory over time
   ```

3. **Limit cache size**:
   - Review `client/src/utils/localFileServer.ts`
   - Default cache limit: 100MB

4. **Clean up old files**:
   - Media page → Delete unused files
   - Or manually: `find server/uploads -mtime +90 -delete`

### Excessive API Calls

**Symptoms:**
- Network tab shows many API requests
- Server logs show frequent hits

**Expected behavior:**
- Dashboard API: 1 request per 60 seconds
- File API: Only on demand

**If excessive:**

1. **Check React Query DevTools**:
   - Should show `refetchInterval: 60000`
   - Not refetching on every component render

2. **Verify not using old polling**:
   ```typescript
   // BAD (old code)
   useEffect(() => {
       const interval = setInterval(fetchData, 1000);
   }, []);

   // GOOD (new code)
   const { data } = useDashboardData();
   ```

---

## 🧪 Development Mode

### Enable Development Mode

**Purpose:** Show debugging overlay on display page

**How to Enable:**
1. Home page → Settings
2. Toggle "Development Mode" to ON
3. Go to /display page

**What You'll See:**
- Slide counter (e.g., "Slide: 3 / 10")
- Current slide name
- Slide type
- Duration and countdown timer
- Next slide preview
- Transition effect

**Overlay Information:**
```
📊 Slide: 3 / 10
📝 Current Escalations
🏷️ Current Escalations
⏱️ Duration: 10s
⏰ Next: 7s
➡️ Next: Team Performance Comparison
🎭 Effect: fade
```

**Bottom Banner:**
```
⚠️ TESTING ENVIRONMENT ⚠️
This is NOT real data - Do not take photos or videos
```

**When to Use:**
- Testing new slides
- Debugging transition issues
- Verifying slide timing
- Training users

**When to Disable:**
- Production environments
- Client presentations
- Public displays

---

## 🎬 Video Optimization Tips

### Best Practices

**Format:**
- Container: MP4
- Video codec: H.264 (x264)
- Audio codec: AAC (or remove audio)
- Resolution: 1920x1080 (Full HD)
- Frame rate: 30 fps
- Bitrate: 3000-5000 kbps

**Recommended Tools:**
- **HandBrake** (free, cross-platform)
- **FFmpeg** (command-line)
- **Adobe Media Encoder** (professional)

### FFmpeg Optimization

```bash
# Optimize video for LED display
ffmpeg -i input.mp4 \
  -c:v libx264 \
  -preset medium \
  -crf 23 \
  -vf scale=1920:1080 \
  -r 30 \
  -b:v 4000k \
  -maxrate 5000k \
  -bufsize 10000k \
  -c:a aac \
  -b:a 128k \
  -movflags +faststart \
  output.mp4
```

### HandBrake Settings

1. **Open HandBrake**
2. **Source**: Select your video
3. **Preset**: Use "Fast 1080p30"
4. **Video tab**:
   - Encoder: H.264 (x264)
   - Framerate: 30 fps constant
   - Quality: Constant Quality 23
5. **Audio tab**:
   - Codec: AAC
   - Bitrate: 128 kbps
   - Or remove audio track
6. **Start encode**

### Video Preloading

The system automatically preloads videos for smooth playback:

- **Current video**: Fully loaded before display
- **Next video**: Preloaded in background
- **Next+1 video**: Preloaded for queue

**Cache Management:**
- Cache limit: 100MB
- Automatic cleanup: Old files removed
- Manual clear: Refresh page

---

## 📡 Network & Connectivity

### CORS Errors

**Symptoms:**
- Console shows "CORS policy" errors
- External APIs fail to load

**Solutions:**

1. **Use backend proxy** (recommended):
   - External APIs called from backend
   - No CORS issues
   - Already configured

2. **Check proxy routes**:
   ```typescript
   // server/src/routes/proxy.ts
   router.get('/celebrations', ...)
   router.get('/jira-chart', ...)
   router.get('/ongoing-escalations', ...)
   ```

### Timeout Errors

**Symptoms:**
- "Request timeout" errors
- API calls take too long

**Solutions:**

1. **Check network latency**:
   ```bash
   ping YOUR_SERVER_IP
   # Should be < 50ms
   ```

2. **Increase timeout** (if needed):
   ```typescript
   // client/src/api/backendApi.ts
   timeout: 30000, // 30 seconds (default)
   ```

3. **Check external API response times**:
   - Use browser Network tab
   - Look for slow endpoints

---

## 🎨 Display & Rendering

### Slides Look Different on LED Screen

**Symptoms:**
- Text too small/large
- Layout broken
- Colors look different

**Solutions:**

1. **Check display resolution**:
   - LED screen should be 1920x1080 or higher
   - Browser zoom should be 100%

2. **Verify responsive scaling**:
   ```css
   /* Uses clamp() for responsive sizing */
   font-size: clamp(1rem, 4vw, 3rem);
   ```

3. **Test on actual LED screen**:
   - Don't rely on desktop preview
   - LED screens may have different color profiles

4. **Adjust text sizes** in slide configuration

### Animations Not Smooth

**Symptoms:**
- Stuttering transitions
- Choppy animations

**Solutions:**

1. **Use Fade effect**:
   - Smoothest transition
   - Least CPU intensive

2. **Reduce active slides**:
   - Limit to 10-15 slides
   - Deactivate unused slides

3. **Check GPU acceleration**:
   - Enable hardware acceleration in browser
   - Chrome: `chrome://settings` → Advanced → System

4. **Close other applications** on display computer

---

## 🔍 Debugging Tools

### Browser Console

**Access:** Press `F12` in browser

**What to Look For:**

**✅ Good Signs:**
```
✅ Successfully fetched dashboard data
✅ Dashboard data from cache (valid, age: 30s)
✅ Display settings saved successfully
```

**❌ Error Signs:**
```
❌ Failed to fetch dashboard data
❌ API Endpoint Failures Detected
❌ Network error - backend may be offline
```

### React Query DevTools

**Access:** Bottom left corner (development mode only)

**What to Check:**
- Query status: `success`, `loading`, `error`
- Cache age: Should be < 60 seconds
- Refetch interval: Should be 60000ms
- Data preview: Click query to see data

### Network Tab

**Access:** F12 → Network tab

**What to Monitor:**
- API calls frequency (should be ~1/minute)
- File URLs (should use server IP)
- Response times (should be < 1 second)
- Failed requests (4xx/5xx errors)

### Server Logs

```bash
# View all logs
tail -f server/combined.log

# View only errors
tail -f server/error.log

# Search for specific errors
grep "ERROR" server/combined.log
grep "401" server/combined.log
```

---

## 🛠️ Advanced Troubleshooting

### Database Connection Issues

```bash
# Test database connection
cd server
npm run test-db

# Check PostgreSQL is running
# Linux
sudo systemctl status postgresql
# Windows
Get-Service -Name postgresql*

# Verify database exists
psql -U led_user -d led_display -c "SELECT COUNT(*) FROM users;"
```

### Port Already in Use

```bash
# Find process using port 5000
# Linux
sudo lsof -i :5000
sudo kill -9 <PID>

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Module Not Found Errors

```bash
# Reinstall dependencies
cd client
rm -rf node_modules package-lock.json
npm install

cd ../server
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 Performance Monitoring

### Key Metrics to Monitor

**Backend:**
- Response time: < 500ms
- Memory usage: < 2GB
- CPU usage: < 50%
- Cache hit rate: > 90%

**Frontend:**
- Page load time: < 2 seconds
- API calls: ~1 per minute
- Component re-renders: Minimal
- Memory usage: < 500MB

**Database:**
- Query time: < 100ms
- Connection pool: < 10 active
- Table size: Monitor growth

### Monitoring Commands

```bash
# Check server performance
pm2 monit

# Check disk usage
df -h

# Check memory usage
free -h

# Check process list
pm2 list
```

---

## 🆘 Emergency Recovery

### Application Completely Broken

```bash
# 1. Stop everything
pm2 stop all

# 2. Restore from backup
psql -U led_user led_display < backup_latest.sql

# 3. Reset to clean state
cd server
npm run reset-db
npm run migrate
npm run seed

# 4. Restart
pm2 restart all
```

### Lost Admin Access

```bash
# Reset admin password via database
cd server
npm run reset-password
# Follow prompts to create new admin user
```

### Corrupted Database

```bash
# 1. Backup current state (even if corrupted)
pg_dump led_display > corrupted_backup.sql

# 2. Drop and recreate database
dropdb led_display
createdb led_display

# 3. Restore from last known good backup
psql led_display < backup_good.sql

# 4. Or start fresh
cd server
npm run setup-db
npm run seed
```

---

## 📝 Getting Help

### Information to Provide

When reporting issues, include:

1. **Error messages** from console/logs
2. **Steps to reproduce** the issue
3. **Environment details**:
   - OS and version
   - Node.js version (`node --version`)
   - Browser and version
4. **Configuration**:
   - Deployment method
   - Database type
   - Network setup
5. **Screenshots** (if applicable)

### Diagnostic Commands

```bash
# System information
node --version
npm --version
pg_config --version

# Application status
pm2 status
pm2 logs led-backend --lines 100

# Database status
psql -U led_user led_display -c "SELECT COUNT(*) FROM sessions;"

# Network status
curl -I http://YOUR_SERVER_IP:5000
```

---

## ✅ Health Check Script

Save as `health-check.sh`:

```bash
#!/bin/bash

echo "🔍 LED Display System Health Check"
echo "===================================="

# Check backend
echo -n "Backend Server: "
if curl -s http://localhost:5000/health > /dev/null; then
    echo "✅ Running"
else
    echo "❌ Not responding"
fi

# Check database
echo -n "Database: "
if psql -U led_user -d led_display -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Connected"
else
    echo "❌ Connection failed"
fi

# Check disk space
echo -n "Disk Space: "
USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $USAGE -lt 80 ]; then
    echo "✅ ${USAGE}% used"
else
    echo "⚠️ ${USAGE}% used (HIGH)"
fi

# Check uploads directory
echo -n "Uploads Directory: "
UPLOAD_SIZE=$(du -sh server/uploads/ 2>/dev/null | cut -f1)
echo "📁 $UPLOAD_SIZE"

# Check cache status
echo -n "API Cache: "
CACHE=$(curl -s http://localhost:5000/api/dashboard/cache-status | grep -o '"fresh":[^,]*' | cut -d: -f2)
if [ "$CACHE" == "true" ]; then
    echo "✅ Fresh"
else
    echo "⚠️ Stale"
fi

echo "===================================="
echo "Health check complete"
```

Run daily:
```bash
chmod +x health-check.sh
./health-check.sh
```

---

**Need more help?** Check the [documentation](./README.md) or enable Development Mode for detailed logs.

---

**Last Updated**: January 2025  
**Version**: 1.9.0

