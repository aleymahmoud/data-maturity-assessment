import fs from 'fs';
import path from 'path';
import { openDatabase } from './database.js';

export async function initializeDatabase() {
  try {
    console.log('Initializing MySQL database...');

    // Read the MySQL SQL file
    const sqlFilePath = path.join(process.cwd(), 'data_maturity_mysql.sql');

    if (!fs.existsSync(sqlFilePath)) {
      console.error('MySQL SQL file not found at:', sqlFilePath);
      throw new Error('Database SQL file not found');
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Split SQL content by statements (basic approach)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    const db = await openDatabase();

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await db.execute(statement);
        } catch (error) {
          // Log but continue - some statements might already exist
          console.log('Statement execution note:', error.message);
        }
      }
    }

    console.log('MySQL database initialized successfully');
    return { success: true };

  } catch (error) {
    console.error('MySQL database initialization error:', error);
    return { success: false, error: error.message };
  }
}

// Check if database needs initialization
export async function checkDatabaseStatus() {
  try {
    const db = await openDatabase();

    // Check if assessment_codes table exists and has data
    const [tableResult] = await db.execute(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assessment_codes'
    `);

    if (tableResult.length === 0) {
      return { initialized: false, message: 'Database tables not found' };
    }

    const [codeCountResult] = await db.execute('SELECT COUNT(*) as count FROM assessment_codes');
    const codeCount = codeCountResult[0];

    return {
      initialized: true,
      message: `Database ready with ${codeCount.count} assessment codes`
    };

  } catch (error) {
    return {
      initialized: false,
      message: `Database check failed: ${error.message}`
    };
  }
}