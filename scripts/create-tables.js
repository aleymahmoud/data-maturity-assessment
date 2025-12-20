import pg from 'pg';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const { Client } = pg;

const createTablesSQL = `
-- Create tables for Data Maturity Assessment

-- Assessment Codes table
CREATE TABLE IF NOT EXISTS assessment_codes (
  code VARCHAR(255) PRIMARY KEY,
  organization_name VARCHAR(255),
  intended_recipient VARCHAR(255),
  expires_at TIMESTAMP,
  is_used BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  assessment_type VARCHAR(50) DEFAULT 'full',
  question_list TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  organization VARCHAR(255),
  organization_size VARCHAR(100),
  industry VARCHAR(255),
  country VARCHAR(100),
  role_title VARCHAR(255),
  selected_role_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  dimensions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessment Sessions table
CREATE TABLE IF NOT EXISTS assessment_sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  code VARCHAR(255) NOT NULL REFERENCES assessment_codes(code),
  status VARCHAR(50) DEFAULT 'in_progress',
  total_questions INTEGER DEFAULT 35,
  questions_answered INTEGER DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0,
  language_preference VARCHAR(10) DEFAULT 'en',
  session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  session_end TIMESTAMP
);

-- User Responses table
CREATE TABLE IF NOT EXISTS user_responses (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_id VARCHAR(255) NOT NULL REFERENCES assessment_sessions(id),
  question_id VARCHAR(50) NOT NULL,
  selected_option VARCHAR(50) NOT NULL,
  score_value INTEGER DEFAULT 0,
  assessment_code VARCHAR(255) REFERENCES assessment_codes(code),
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, question_id)
);

-- Assessment Results table
CREATE TABLE IF NOT EXISTS assessment_results (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  assessment_code VARCHAR(255) NOT NULL REFERENCES assessment_codes(code),
  overall_score DECIMAL(5,2) NOT NULL,
  overall_maturity_level VARCHAR(50) NOT NULL,
  completion_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_questions_answered INTEGER NOT NULL,
  results_data TEXT,
  UNIQUE(user_id, assessment_code)
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(255) PRIMARY KEY,
  user_type VARCHAR(50) NOT NULL,
  user_id VARCHAR(255),
  action VARCHAR(255) NOT NULL,
  details TEXT,
  ip_address VARCHAR(50),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_code ON assessment_sessions(code);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON assessment_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_responses_session ON user_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_code ON user_responses(assessment_code);
CREATE INDEX IF NOT EXISTS idx_results_user ON assessment_results(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
`;

async function createTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');

    console.log('Creating tables...');
    await client.query(createTablesSQL);
    console.log('✅ All tables created successfully!');

    // Verify tables
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\n📋 Tables in database:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createTables();
