// Create table to store AI-generated recommendations
import { openDatabase } from '../src/lib/database.js';

async function createRecommendationsTable() {
  const db = await openDatabase();

  try {
    console.log('Creating recommendations table...');

    // Create recommendations table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS recommendations (
        id VARCHAR(255) PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        recommendation_type ENUM('general', 'role') NOT NULL,
        priority ENUM('high', 'medium', 'low') NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        display_order INT NOT NULL,
        language VARCHAR(10) DEFAULT 'en',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES assessment_sessions(id) ON DELETE CASCADE,
        INDEX idx_session (session_id),
        INDEX idx_type (recommendation_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✓ Recommendations table created successfully');

    // Create metadata table to track when recommendations were generated
    await db.execute(`
      CREATE TABLE IF NOT EXISTS recommendation_metadata (
        session_id VARCHAR(255) PRIMARY KEY,
        generated_at TIMESTAMP NOT NULL,
        model_version VARCHAR(50) DEFAULT 'gemini-2.5-pro',
        language VARCHAR(10) DEFAULT 'en',
        overall_score DECIMAL(3,1),
        maturity_level VARCHAR(50),
        FOREIGN KEY (session_id) REFERENCES assessment_sessions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✓ Recommendation metadata table created successfully');
    console.log('\nDatabase schema ready for storing recommendations!');

  } catch (error) {
    console.error('Error creating tables:', error.message);
    throw error;
  } finally {
    await db.end();
  }
}

createRecommendationsTable();
