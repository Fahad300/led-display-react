# MySQL Migration Guide

## Overview
This guide provides step-by-step instructions for migrating your LED Display application from SQLite to MySQL for production and scalability.

## Benefits of MySQL Migration

### Performance Improvements
- **Concurrent Access**: MySQL handles multiple simultaneous connections efficiently
- **Connection Pooling**: Built-in connection pooling for better resource management
- **Query Optimization**: Advanced query optimizer for complex queries
- **Indexing**: Better indexing capabilities for large datasets

### Scalability Features
- **Horizontal Scaling**: Support for read replicas and clustering
- **Vertical Scaling**: Better performance with increased resources
- **Partitioning**: Table partitioning for large datasets
- **Replication**: Master-slave replication for high availability

### Production Features
- **ACID Compliance**: Full ACID transaction support
- **Backup & Recovery**: Robust backup and recovery mechanisms
- **Monitoring**: Comprehensive monitoring and logging
- **Security**: Advanced security features and user management

## Prerequisites

### System Requirements
- MySQL 8.0 or higher
- Node.js 18 or higher
- Docker (optional, for containerized deployment)

### Required Software
1. **MySQL Server**: Install MySQL Community Server
2. **MySQL Client**: For database administration
3. **Node.js**: For running the application

## Installation Steps

### 1. Install MySQL Server

#### Windows
```bash
# Download MySQL Installer from https://dev.mysql.com/downloads/installer/
# Run the installer and follow the setup wizard
```

#### macOS
```bash
# Using Homebrew
brew install mysql
brew services start mysql
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 2. Configure MySQL

#### Secure Installation
```bash
sudo mysql_secure_installation
```

#### Create Database and User
```sql
CREATE DATABASE led_display_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'led_display_user'@'%' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON led_display_db.* TO 'led_display_user'@'%';
FLUSH PRIVILEGES;
```

### 3. Environment Configuration

Create a `.env` file in the server directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=led_display_user
DB_PASSWORD=your_secure_password
DB_DATABASE=led_display_db
DB_SYNCHRONIZE=false

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3001
NODE_ENV=production

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Logging Configuration
LOG_LEVEL=info
```

## Migration Process

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Run Database Setup

```bash
# Complete setup (creates database, runs migrations, seeds data)
npm run setup-db

# Or run steps individually:
npm run migrate  # Run migrations only
npm run seed     # Seed data only
```

### 3. Verify Migration

```bash
# Check database connection
npm run setup-db

# Verify data
mysql -u led_display_user -p led_display_db -e "SELECT COUNT(*) as user_count FROM users;"
```

## Docker Deployment

### 1. Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 2. Environment Variables for Docker

Create a `.env` file in the root directory:

```env
# MySQL Configuration
MYSQL_ROOT_PASSWORD=your_root_password
DB_USERNAME=led_display_user
DB_PASSWORD=your_secure_password
DB_DATABASE=led_display_db

# Application Configuration
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=production
```

## Performance Optimization

### 1. Database Configuration

#### MySQL Configuration File (`my.cnf`)
```ini
[mysqld]
# Connection settings
max_connections = 200
max_connect_errors = 100000

# Buffer settings
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_log_buffer_size = 16M

# Query cache
query_cache_type = 1
query_cache_size = 128M

# Character set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
```

### 2. Application Optimization

#### Connection Pooling
The application is configured with connection pooling:
- Connection limit: 10
- Acquire timeout: 60 seconds
- Reconnection: enabled

#### Indexing Strategy
- Primary keys on all tables
- Indexes on frequently queried columns
- Composite indexes for complex queries

## Monitoring and Maintenance

### 1. Database Monitoring

#### Performance Monitoring
```sql
-- Check slow queries
SHOW VARIABLES LIKE 'slow_query_log';
SHOW VARIABLES LIKE 'long_query_time';

-- Monitor connections
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Max_used_connections';
```

#### Health Checks
```sql
-- Check table sizes
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'led_display_db';
```

### 2. Backup Strategy

#### Automated Backups
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u led_display_user -p led_display_db > backup_$DATE.sql
```

#### Cron Job
```bash
# Add to crontab
0 2 * * * /path/to/backup.sh
```

## Troubleshooting

### Common Issues

#### 1. Connection Refused
```bash
# Check MySQL service status
sudo systemctl status mysql

# Check port availability
netstat -tlnp | grep 3306
```

#### 2. Authentication Errors
```sql
-- Reset user password
ALTER USER 'led_display_user'@'%' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

#### 3. Character Set Issues
```sql
-- Check character set
SHOW VARIABLES LIKE 'character_set%';
SHOW VARIABLES LIKE 'collation%';
```

### Performance Issues

#### 1. Slow Queries
```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
```

#### 2. High Memory Usage
```sql
-- Check buffer pool usage
SHOW ENGINE INNODB STATUS;
```

## Security Considerations

### 1. User Permissions
- Use least privilege principle
- Regular password rotation
- Network access restrictions

### 2. Network Security
- Use SSL/TLS connections
- Firewall configuration
- VPN access for remote administration

### 3. Data Encryption
- Encrypt sensitive data at rest
- Use encrypted connections
- Regular security audits

## Migration Checklist

- [ ] Install MySQL Server
- [ ] Configure MySQL security
- [ ] Create database and user
- [ ] Update environment variables
- [ ] Install new dependencies
- [ ] Run database migrations
- [ ] Seed initial data
- [ ] Test application functionality
- [ ] Configure monitoring
- [ ] Set up backup strategy
- [ ] Performance testing
- [ ] Security review
- [ ] Documentation update

## Support

For additional support:
1. Check the application logs
2. Review MySQL error logs
3. Consult MySQL documentation
4. Contact the development team

## Next Steps

After successful migration:
1. Monitor performance metrics
2. Optimize queries based on usage patterns
3. Implement advanced features (replication, clustering)
4. Plan for future scaling needs 