import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function createOrgAssessmentRequestsTable() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('Connected to MySQL database');

    // Create organization_assessment_requests table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS organization_assessment_requests (
        id VARCHAR(255) PRIMARY KEY,
        session_id VARCHAR(255),
        user_name VARCHAR(255) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        organization_name VARCHAR(255) NOT NULL,
        organization_size VARCHAR(50),
        industry VARCHAR(100),
        country VARCHAR(100),
        phone_number VARCHAR(50),
        job_title VARCHAR(255),
        message TEXT,
        status ENUM('pending', 'contacted', 'completed', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_session (session_id),
        INDEX idx_email (user_email),
        INDEX idx_status (status),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ organization_assessment_requests table created successfully');

  } catch (error) {
    console.error('Error creating table:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

createOrgAssessmentRequestsTable();
