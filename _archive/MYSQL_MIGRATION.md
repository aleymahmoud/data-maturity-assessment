# MySQL Migration Guide

The application has been successfully converted from SQLite to MySQL. This guide covers the complete setup process.

## Why MySQL?

✅ **No Database Locking**: Multiple users can access simultaneously without database locks
✅ **Better Concurrent Performance**: Superior handling of multiple simultaneous assessments
✅ **Production Ready**: Enterprise-grade reliability and scaling
✅ **Better Backup/Recovery**: Professional database management tools

## Prerequisites

1. **MySQL Server** (5.7+ or 8.0+ recommended)
2. **Node.js** 18+
3. **npm** package manager

## Setup Steps

### 1. Install MySQL Server

**Windows:**
```bash
# Download from https://dev.mysql.com/downloads/mysql/
# Or use Chocolatey
choco install mysql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

**macOS:**
```bash
# Using Homebrew
brew install mysql
brew services start mysql
```

### 2. Create Database

```sql
-- Connect to MySQL as root
mysql -u root -p

-- Create database
CREATE DATABASE data_maturity CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (optional, recommended for production)
CREATE USER 'data_maturity_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON data_maturity.* TO 'data_maturity_user'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

### 3. Import Database Schema

```bash
# Import the MySQL schema
mysql -u root -p data_maturity < data_maturity_mysql.sql
```

### 4. Configure Environment Variables

```bash
# Copy MySQL environment template
cp .env.mysql .env.local

# Edit .env.local with your MySQL credentials:
DB_HOST=localhost
DB_PORT=3306
DB_USER=root  # or data_maturity_user
DB_PASSWORD=your_mysql_password
DB_NAME=data_maturity
```

### 5. Install Dependencies

```bash
# Dependencies are already updated to use mysql2
npm install
```

### 6. Initialize Database (if needed)

```bash
# The app will create tables automatically, but you can also initialize manually:
curl -X POST http://localhost:3001/api/init-db
```

### 7. Start the Application

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Key Changes Made

### Database Connection
- **Old**: SQLite with `better-sqlite3`
- **New**: MySQL with `mysql2/promise` (connection pooling)

### SQL Syntax Updates
- `datetime('now')` → `NOW()`
- `INSERT OR REPLACE` → `INSERT ... ON DUPLICATE KEY UPDATE`
- `AUTOINCREMENT` → `AUTO_INCREMENT`
- `TEXT` → `VARCHAR(255)` or `TEXT` based on content length
- `BOOLEAN` → `BOOLEAN` (MySQL native support)

### Connection Management
- **Connection Pooling**: Automatic connection pool management
- **Transactions**: Proper transaction handling with connection management
- **Error Handling**: Improved error handling for connection issues

## File Changes Summary

### Updated Files:
1. `src/lib/database.js` - Complete rewrite for MySQL
2. `src/lib/initDatabase.js` - Updated for MySQL
3. `package.json` - Replaced SQLite with MySQL dependencies
4. `data_maturity_mysql.sql` - New MySQL schema

### New Files:
1. `.env.mysql` - MySQL environment template
2. `MYSQL_MIGRATION.md` - This guide

## Production Deployment

### Environment Variables for Production:
```bash
# Production MySQL settings
DB_HOST=your_production_mysql_host
DB_PORT=3306
DB_USER=your_production_mysql_user
DB_PASSWORD=your_secure_production_password
DB_NAME=data_maturity
NODE_ENV=production
```

### Database Backup (Production):
```bash
# Create backup
mysqldump -u username -p data_maturity > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
mysql -u username -p data_maturity < backup_file.sql
```

## Testing the Migration

1. **Start the application**:
   ```bash
   npm run dev
   ```

2. **Check database connection**:
   ```bash
   curl http://localhost:3001/api/init-db
   ```

3. **Test assessment flow**:
   - Generate assessment codes (if admin features enabled)
   - Test code validation
   - Complete an assessment
   - Verify results are saved

## Troubleshooting

### Common Issues:

1. **Connection Refused**:
   ```bash
   # Check if MySQL is running
   systemctl status mysql  # Linux
   brew services list | grep mysql  # macOS
   ```

2. **Access Denied**:
   - Verify username/password in `.env.local`
   - Check user permissions in MySQL

3. **Database Not Found**:
   ```sql
   -- Create database if missing
   CREATE DATABASE data_maturity CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

4. **Table Doesn't Exist**:
   ```bash
   # Re-import schema
   mysql -u root -p data_maturity < data_maturity_mysql.sql
   ```

## Performance Benefits

After migration, you should experience:
- ✅ No more "database locked" errors
- ✅ Faster response times with multiple users
- ✅ Better data integrity with ACID compliance
- ✅ Professional database management capabilities
- ✅ Better scaling options for future growth

## Data Migration (if needed)

If you have existing SQLite data to migrate:
1. Export data from SQLite using SQL dumps
2. Convert data format to MySQL-compatible
3. Import using MySQL commands

The application is now ready for production use with MySQL!