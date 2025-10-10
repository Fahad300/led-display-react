# Database & File Storage Guide

## 🗄️ What We Store

### **Database Tables**

#### 1. **users** - Authentication
```sql
- id (UUID)
- username (unique)
- password (hashed)
- createdAt
```

#### 2. **sessions** - User Sessions & Slideshow Data
```sql
- id (UUID)
- sessionToken
- userId (FK to users)
- slideshowData (JSON)  ← Slides + Display Settings
- isActive
- lastActivity
- deviceInfo
- ipAddress
```

**`slideshowData` contains:**
```json
{
  "slides": [...],           // All slides (active + inactive)
  "displaySettings": {...},  // Display configuration
  "lastUpdated": "...",
  "version": "1.0.0"
}
```

#### 3. **files** - Uploaded Media
```sql
- id (UUID)
- filename
- originalName
- mimeType
- filePath              ← Physical location on server
- size
- description
- uploadedBy (FK to users)
- createdAt
```

---

## 💾 File Storage

### **Physical Files Location**

**Path:** `server/uploads/`

**Structure:**
```
server/uploads/
├── abc123-image.jpg
├── def456-video.mp4
├── ghi789-document.pdf
└── ... (all uploaded files)
```

### **How Files Work**

**Upload Flow:**
```
1. User uploads file in AdminPage
2. Server saves to server/uploads/ ✅
3. Server saves metadata to database (files table) ✅
4. Server returns URL: /api/files/{id}
5. User creates slide with this URL
6. Slide saved to database ✅
```

**Display Flow:**
```
1. DisplayPage receives slide via Socket.IO
2. Slide contains file URL: /api/files/abc123
3. Browser requests: GET /api/files/abc123
4. Server reads from server/uploads/abc123-image.jpg
5. Server streams file to browser ✅
```

---

## 🤔 Why Database + Files?

### **Q: Can we just use Socket.IO?**

**A: NO!** Socket.IO is for real-time **notifications**, not data **storage**.

### **What Happens Without Database:**

```
Scenario 1: Server Restarts
1. Server crashes (power outage, deployment)
2. Socket.IO connections lost
3. All slides GONE! 💥
4. All settings GONE! 💥
5. Start from scratch 😢

Scenario 2: HomePage Reload
1. User refreshes browser
2. Local state cleared
3. All slides GONE! 💥
4. Start from scratch 😢

Scenario 3: DisplayPage Opens Independently
1. Display opens directly (/display)
2. No Socket.IO data available yet
3. Black screen 💥
4. Nothing to show 😢
```

### **With Database:**

```
✅ Server restarts → Load from database
✅ Page reloads → Load from database
✅ Independent loads → Load from database
✅ Data always available!
```

---

## 🎯 Socket.IO + Database = Perfect Combo

### **Socket.IO Role:**
- ✅ Instant notifications (real-time updates)
- ✅ Network-wide broadcasting
- ✅ Fast synchronization (<1s)
- ❌ NOT for data storage (temporary, lost on disconnect)

### **Database Role:**
- ✅ Persistent storage (survive restarts)
- ✅ Recovery from crashes
- ✅ Independent page loads
- ✅ Historical data
- ❌ NOT for real-time (polling is slow)

### **Combined Benefits:**

```
HomePage makes change
    ↓
Save to Database (Persistence) ←─── If server crashes, data is safe!
    ↓
Broadcast via Socket.IO (Speed) ←─── Instant update across network!
    ↓
DisplayPage receives & renders ←─── <1s real-time sync!
    ↓
If DisplayPage reloads later ←────── Loads from database!
```

**Best of both worlds! 🎉**

---

## 📊 Data Flow

### **Create/Edit Slide:**

```
HomePage/AdminPage
    ↓
1. Save to database FIRST (persistence)
2. Broadcast via Socket.IO (instant update)
    ↓
DisplayPage
    ↓
3. Receive Socket.IO event (<1s)
4. Update local state
5. Render immediately ✅
```

### **Server Restart Recovery:**

```
Server crashes
    ↓
Socket.IO lost
    ↓
HomePage reloads → Load from database ✅
DisplayPage reloads → Load from database ✅
    ↓
All data recovered! 🎉
```

---

## 🗂️ File Management

### **File Upload**

```
1. User uploads image.jpg in AdminPage
2. Server saves to: server/uploads/abc123-image.jpg ✅
3. Server saves metadata to database:
   {
     id: "abc123",
     filename: "abc123-image.jpg",
     originalName: "image.jpg",
     mimeType: "image/jpeg",
     filePath: "uploads/abc123-image.jpg",
     size: 2048576,
     uploadedBy: "user123"
   } ✅
4. Server returns URL: /api/files/abc123
5. Slide saved with this URL
6. File is permanent! Can be reused! ✅
```

### **File Access**

```
DisplayPage needs image
    ↓
Request: GET /api/files/abc123
    ↓
Server looks up file in database
    ↓
Database returns: filePath = "uploads/abc123-image.jpg"
    ↓
Server reads file from filesystem
    ↓
Server streams to browser ✅
```

---

## 📋 What's Saved Where

| Data | Socket.IO | Database | Filesystem |
|------|-----------|----------|------------|
| **Slides** | Broadcast only | ✅ Persistent | - |
| **Settings** | Broadcast only | ✅ Persistent | - |
| **Files (metadata)** | - | ✅ Persistent | - |
| **Files (actual data)** | - | - | ✅ server/uploads/ |
| **Users** | - | ✅ Persistent | - |
| **Sessions** | Track connections | ✅ Persistent | - |

---

## ✅ Summary

### **Database is ESSENTIAL for:**
1. ✅ Persistent storage (survive restarts)
2. ✅ Recovery from crashes
3. ✅ Independent page loads
4. ✅ File metadata tracking
5. ✅ User authentication
6. ✅ Session management

### **Socket.IO is ESSENTIAL for:**
1. ✅ Real-time updates (<1s)
2. ✅ Network-wide broadcasting
3. ✅ Instant synchronization
4. ✅ No polling delays

### **Both Work Together:**

**Socket.IO = Speed** (instant notifications)  
**Database = Safety** (permanent storage)

You need **BOTH** for a reliable production system!

---

## 🔍 FAQs

**Q: Can we remove database and just use Socket.IO?**  
**A:** NO - You'll lose all data on server restart/reload.

**Q: Can we remove Socket.IO and just use database?**  
**A:** YES, but updates will be slow (5-minute polling instead of <1s instant).

**Q: Why store files in filesystem AND database?**  
**A:** Database stores metadata (tracking), filesystem stores actual file data (can't put 100MB video in database!).

**Q: What happens if database fails?**  
**A:** App won't start - database is required for authentication and data persistence.

**Q: What happens if Socket.IO fails?**  
**A:** App still works, but updates are slower (falls back to 5-minute polling).

---

**Recommendation:** Keep both database and Socket.IO for optimal performance and reliability! ✅

