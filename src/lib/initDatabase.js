import fs from 'fs';
import path from 'path';
import { openDatabase } from './database.js';

export async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'data_maturity.db.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error('SQL file not found at:', sqlFilePath);
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
          await db.exec(statement);
        } catch (error) {
          // Log but continue - some statements might already exist
          console.log('Statement execution note:', error.message);
        }
      }
    }
    
    console.log('Database initialized successfully');
    return { success: true };
    
  } catch (error) {
    console.error('Database initialization error:', error);
    return { success: false, error: error.message };
  }
}

// Check if database needs initialization
export async function checkDatabaseStatus() {
  try {
    const db = await openDatabase();
    
    // Check if assessment_codes table exists and has data
    const result = await db.get(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='assessment_codes'
    `);
    
    if (!result) {
      return { initialized: false, message: 'Database tables not found' };
    }
    
    const codeCount = await db.get('SELECT COUNT(*) as count FROM assessment_codes');
    
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