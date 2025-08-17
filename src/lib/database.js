import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

let db = null;

export async function openDatabase() {
  if (db) {
    return db;
  }

  try {
    // Create database file in project root
    const dbPath = path.join(process.cwd(), 'data_maturity.db');
    
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    console.log('Database connected successfully');
    return db;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

export async function closeDatabase() {
  if (db) {
    await db.close();
    db = null;
  }
}

// Assessment Codes functions
export async function validateAssessmentCode(code) {
  const database = await openDatabase();
  
  try {
    const codeRecord = await database.get(`
      SELECT code, organization_name, intended_recipient, expires_at, is_used, usage_count, max_uses
      FROM assessment_codes 
      WHERE code = ? AND is_used = 0
    `, [code]);

    if (!codeRecord) {
      return { valid: false, error: 'Invalid or already used assessment code' };
    }

    // Check expiration
    if (codeRecord.expires_at && new Date(codeRecord.expires_at) < new Date()) {
      return { valid: false, error: 'Assessment code has expired' };
    }

    // Check usage limit
    if (codeRecord.usage_count >= codeRecord.max_uses) {
      return { valid: false, error: 'Assessment code has reached maximum uses' };
    }

    return { 
      valid: true, 
      data: {
        code: codeRecord.code,
        organizationName: codeRecord.organization_name,
        intendedRecipient: codeRecord.intended_recipient
      }
    };
  } catch (error) {
    console.error('Error validating assessment code:', error);
    return { valid: false, error: 'Database error occurred' };
  }
}

export async function markCodeAsUsed(code) {
  const database = await openDatabase();
  
  try {
    await database.run(`
      UPDATE assessment_codes 
      SET is_used = 1, usage_count = usage_count + 1
      WHERE code = ?
    `, [code]);
    
    return { success: true };
  } catch (error) {
    console.error('Error marking code as used:', error);
    return { success: false, error: 'Failed to update code status' };
  }
}

// User and Session functions
export async function createUser(userData) {
  const database = await openDatabase();
  
  try {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await database.run(`
      INSERT INTO users (id, name, organization, role_title, email, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [userId, userData.name, userData.organization, userData.roleTitle, userData.email]);
    
    return { success: true, userId };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: 'Failed to create user' };
  }
}

export async function createAssessmentSession(userId, totalQuestions = 35) {
  const database = await openDatabase();
  
  try {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await database.run(`
      INSERT INTO assessment_sessions (
        id, user_id, session_start, status, language_preference, 
        total_questions, answered_questions, completion_percentage
      )
      VALUES (?, ?, datetime('now'), 'in_progress', 'en', ?, 0, 0)
    `, [sessionId, userId, totalQuestions]);
    
    return { success: true, sessionId };
  } catch (error) {
    console.error('Error creating assessment session:', error);
    return { success: false, error: 'Failed to create session' };
  }
}

export async function saveUserResponse(sessionId, questionId, optionKey, scoreValue) {
  const database = await openDatabase();
  
  try {
    await database.run(`
      INSERT OR REPLACE INTO user_responses (
        id, session_id, question_id, option_key, score_value, answered_at
      )
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `, [`response_${sessionId}_${questionId}`, sessionId, questionId, optionKey, scoreValue]);
    
    // Update session progress
    const totalAnswered = await database.get(`
      SELECT COUNT(*) as count FROM user_responses WHERE session_id = ?
    `, [sessionId]);
    
    const session = await database.get(`
      SELECT total_questions FROM assessment_sessions WHERE id = ?
    `, [sessionId]);
    
    const completionPercentage = (totalAnswered.count / session.total_questions) * 100;
    
    await database.run(`
      UPDATE assessment_sessions 
      SET answered_questions = ?, completion_percentage = ?
      WHERE id = ?
    `, [totalAnswered.count, completionPercentage, sessionId]);
    
    return { success: true };
  } catch (error) {
    console.error('Error saving user response:', error);
    return { success: false, error: 'Failed to save response' };
  }
}

export async function getSessionResponses(sessionId) {
  const database = await openDatabase();
  
  try {
    const responses = await database.all(`
      SELECT question_id, option_key, score_value, answered_at
      FROM user_responses 
      WHERE session_id = ?
      ORDER BY answered_at
    `, [sessionId]);
    
    return { success: true, responses };
  } catch (error) {
    console.error('Error getting session responses:', error);
    return { success: false, error: 'Failed to retrieve responses' };
  }
}

// Audit logging
export async function logAction(userType, userId, action, details, ipAddress) {
  const database = await openDatabase();
  
  try {
    const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await database.run(`
      INSERT INTO audit_logs (id, user_type, user_id, action, details, ip_address, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [logId, userType, userId, action, details, ipAddress]);
    
    return { success: true };
  } catch (error) {
    console.error('Error logging action:', error);
    return { success: false };
  }
}