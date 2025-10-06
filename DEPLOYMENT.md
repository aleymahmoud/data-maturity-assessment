# Production Deployment Guide

## Prerequisites
- Node.js 18+
- npm
- **MySQL Server 5.7+ or 8.0+**

## Deployment Steps

### 1. **Set up MySQL Database**
   ```bash
   # Install MySQL server on your VPS
   sudo apt update
   sudo apt install mysql-server
   sudo mysql_secure_installation

   # Create database and user
   mysql -u root -p
   CREATE DATABASE data_maturity CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'data_maturity_user'@'localhost' IDENTIFIED BY 'your_secure_password';
   GRANT ALL PRIVILEGES ON data_maturity.* TO 'data_maturity_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

### 2. **Install dependencies**
   ```bash
   npm install
   ```

### 3. **Set up environment variables**
   ```bash
   # Copy MySQL environment template
   cp .env.mysql .env.local

   # Edit .env.local with your MySQL credentials:
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=data_maturity_user
   DB_PASSWORD=your_secure_password
   DB_NAME=data_maturity
   NODE_ENV=production
   ```

### 4. **Import database schema**
   ```bash
   mysql -u data_maturity_user -p data_maturity < data_maturity_mysql.sql
   ```

### 5. **Build the application**
   ```bash
   npm run build
   ```

### 6. **Start the production server**
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3001`

## Core Features Available
- Assessment code validation
- Role-based assessments (5 role types)
- Progress tracking and save/resume functionality
- Results generation and PDF export
- Multi-language support (English/Arabic)
- **No database locking issues** (MySQL advantage)
- **Better concurrent user handling**

## Database
- **MySQL database**: `data_maturity`
- Professional database with connection pooling
- Better performance with multiple simultaneous users
- Enterprise-grade reliability and backup options

## Production Benefits
✅ **No Database Locking**: Multiple users can take assessments simultaneously
✅ **Better Performance**: Superior handling of concurrent sessions
✅ **Professional Backup**: Use `mysqldump` for backups
✅ **Monitoring**: Professional MySQL monitoring tools available
✅ **Scalability**: Ready for high-traffic usage

## Important Notes
- Admin functionality has been temporarily removed for this production build
- Can be re-enabled later if needed
- The app is now production-ready with MySQL for real users
- See `MYSQL_MIGRATION.md` for detailed setup instructions