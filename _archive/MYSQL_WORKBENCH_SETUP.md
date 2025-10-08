# MySQL Workbench Setup Guide

## Download and Install MySQL Workbench
1. Download from: https://dev.mysql.com/downloads/workbench/
2. Install with default settings

## Create Connection in Workbench

### Step 1: Open MySQL Workbench
- Launch MySQL Workbench

### Step 2: Create New Connection
- Click the "+" button next to "MySQL Connections"
- Enter connection details:

```
Connection Name: Data Maturity Local
Connection Method: Standard (TCP/IP)
Hostname: localhost (or 127.0.0.1)
Port: 3306
Username: data_maturity_user (or root)
Password: [Click "Store in Keychain" and enter your password]
Default Schema: data_maturity
```

### Step 3: Test Connection
- Click "Test Connection"
- Should show "Successfully made the MySQL connection"

### Step 4: Connect and Explore
- Double-click your connection to open
- Expand "data_maturity" schema in Navigator
- You'll see all tables: users, assessment_codes, questions, etc.

## What You Can Do in Workbench

### View Tables
```sql
-- See all tables
SHOW TABLES;

-- View table structure
DESCRIBE users;
DESCRIBE assessment_codes;
DESCRIBE questions;
```

### Monitor Data in Real-Time
```sql
-- Check users created by the app
SELECT * FROM users ORDER BY created_at DESC;

-- Check assessment sessions
SELECT * FROM assessment_sessions ORDER BY session_start DESC;

-- Check user responses
SELECT * FROM user_responses ORDER BY answered_at DESC;

-- Check assessment results
SELECT * FROM assessment_results ORDER BY completion_date DESC;
```

### Create Sample Data (for testing)
```sql
-- Insert a test assessment code
INSERT INTO assessment_codes (code, organization_name, intended_recipient, created_by, expires_at)
VALUES ('TEST001', 'Test Organization', 'John Doe', 'admin', DATE_ADD(NOW(), INTERVAL 30 DAY));

-- View the inserted code
SELECT * FROM assessment_codes WHERE code = 'TEST001';
```

## Useful Queries for Testing

### Check App Activity
```sql
-- See recent activity
SELECT
    u.name,
    u.organization,
    s.status,
    s.completion_percentage,
    s.session_start
FROM users u
JOIN assessment_sessions s ON u.id = s.user_id
ORDER BY s.session_start DESC
LIMIT 10;

-- Count responses per session
SELECT
    session_id,
    COUNT(*) as response_count,
    MAX(answered_at) as last_answer
FROM user_responses
GROUP BY session_id
ORDER BY last_answer DESC;
```

### Database Health Check
```sql
-- Table sizes
SELECT
    table_name,
    table_rows,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'data_maturity'
ORDER BY table_rows DESC;
```

## Tips for Development Testing

1. **Real-time Monitoring**: Keep a query tab open with `SELECT * FROM users ORDER BY created_at DESC` and refresh to see new users
2. **Clear Test Data**: Use `DELETE FROM users WHERE name LIKE 'Test%'` to clean up test data
3. **Backup Before Testing**: `mysqldump -u root -p data_maturity > backup.sql`
4. **Performance Monitoring**: Use the Performance tab in Workbench to monitor query performance

## Troubleshooting Connection Issues

### Can't Connect to MySQL
```bash
# Check if MySQL is running (Windows)
sc query mysql80  # or mysql57

# Start MySQL service
net start mysql80

# Check port 3306 is open
netstat -an | findstr 3306
```

### Authentication Issues
```sql
-- Reset user password
ALTER USER 'data_maturity_user'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

### Permission Issues
```sql
-- Grant all permissions
GRANT ALL PRIVILEGES ON data_maturity.* TO 'data_maturity_user'@'localhost';
FLUSH PRIVILEGES;
```