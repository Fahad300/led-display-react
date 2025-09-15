# Database Migrations

This folder contains clean, minimal database migrations for the LED Display System.

## Migration Files

### 001_create_users_table.ts
- Creates the `users` table for user authentication
- Fields: `id`, `username`, `password`, `createdAt`

### 002_create_sessions_table.ts  
- Creates the `sessions` table for user sessions
- Contains unified `slideshowData` field (JSON) for all slideshow information
- Fields: `id`, `sessionToken`, `userId`, `slideshowData`, `isActive`, `lastActivity`, `deviceInfo`, `ipAddress`, `createdAt`, `updatedAt`

### 003_create_files_table.ts
- Creates the `files` table for media storage
- Fields: `id`, `filename`, `originalName`, `mimeType`, `data`, `size`, `description`, `uploaded_by`, `createdAt`, `updatedAt`

## Database Schema Summary

**Only 4 tables:**
1. `users` - User authentication
2. `sessions` - User sessions with unified slideshow data
3. `files` - File storage for media
4. `migrations` - Migration history (auto-generated)

**Key Features:**
- Clean, minimal schema
- Unified slideshow data storage in `sessions.slideshowData`
- No redundant tables or fields
- Proper foreign key relationships

## Running Migrations

```bash
# Reset database with clean migrations
npm run db:reset

# Run migrations only
npm run migrate

# Seed with sample data
npm run seed
```
