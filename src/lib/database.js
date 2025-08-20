// Enhanced database functions for code invalidation and session management
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

let db = null;

export async function openDatabase() {
  if (db) {
    return db;
  }

  try {
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

// Enhanced code validation with session checking
export async function validateAssessmentCode(code) {
  const database = await openDatabase();
  
  try {
    const codeRecord = await database.get(`
      SELECT code, organization_name, intended_recipient, expires_at, is_used, usage_count, max_uses
      FROM assessment_codes 
      WHERE code = ?
    `, [code]);

    if (!codeRecord) {
      return { valid: false, error: 'Invalid assessment code' };
    }

    // Check expiration
    if (codeRecord.expires_at && new Date(codeRecord.expires_at) < new Date()) {
      return { valid: false, error: 'Assessment code has expired' };
    }

    // Check if code has been used (completed assessment)
    if (codeRecord.is_used && codeRecord.usage_count >= codeRecord.max_uses) {
      return { valid: false, error: 'Assessment code has already been used' };
    }

    // Check for existing session
    const existingSession = await database.get(`
      SELECT s.id, s.status, s.completion_percentage, s.language_preference, u.id as user_id
      FROM assessment_sessions s
      JOIN users u ON s.user_id = u.id
      JOIN audit_logs a ON a.details LIKE '%' || ? || '%'
      WHERE s.status IN ('in_progress', 'completed')
      ORDER BY s.session_start DESC
      LIMIT 1
    `, [code]);

    return { 
      valid: true, 
      data: {
        code: codeRecord.code,
        organizationName: codeRecord.organization_name,
        intendedRecipient: codeRecord.intended_recipient,
        isUsed: codeRecord.is_used,
        existingSession: existingSession
      }
    };
  } catch (error) {
    console.error('Error validating assessment code:', error);
    return { valid: false, error: 'Database error occurred' };
  }
}

// src/lib/database.js
// FIND the createOrResumeSession function (around line 85-150)
// REPLACE it with this simplified version:

// Create fresh user session (no resume logic)
export async function createOrResumeSession(code, userData, language = 'en') {
  const database = await openDatabase();
  
  try {
    // Always create new user and session (no resume logic)
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create new user
    await database.run(`
      INSERT INTO users (id, name, organization, role_title, email, assessment_code, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [userId, userData.name, userData.organization, userData.roleTitle, userData.email, code]);

    // Create new session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await database.run(`
      INSERT INTO assessment_sessions (
        id, user_id, status, session_start, language_preference, 
        answered_questions, completion_percentage
      )
      VALUES (?, ?, 'in_progress', datetime('now'), ?, 0, 0)
    `, [sessionId, userId, language]);

    await logAction('user', userId, 'session_created', `Code: ${code}, Session: ${sessionId}`, '');

    return { 
      success: true, 
      sessionId: sessionId, 
      userId: userId, 
      isResume: false,           // Always false
      completionPercentage: 0    // Always 0
    };
  } catch (error) {
    console.error('Error creating session:', error);
    return { success: false, error: 'Failed to create session' };
  }
}

// Mark code as used (called on assessment completion)
export async function markCodeAsUsed(code, sessionId) {
  const database = await openDatabase();
  
  try {
    // Update code to mark as used
    await database.run(`
      UPDATE assessment_codes 
      SET is_used = 1, usage_count = usage_count + 1
      WHERE code = ?
    `, [code]);

    // Update session to completed
    await database.run(`
      UPDATE assessment_sessions 
      SET status = 'completed', session_end = datetime('now'), completion_percentage = 100
      WHERE id = ?
    `, [sessionId]);

    await logAction('user', null, 'assessment_completed', `Code: ${code}, Session: ${sessionId}`, '');
    
    return { success: true };
  } catch (error) {
    console.error('Error marking code as used:', error);
    return { success: false, error: 'Failed to complete assessment' };
  }
}

// Save assessment responses (bulk save for save/exit functionality)
export async function saveAssessmentResponses(sessionId, responses, assessmentCode = null) {
  const database = await openDatabase();
  
  try {
    await database.run('BEGIN TRANSACTION');

    for (const [questionId, response] of Object.entries(responses)) {
      const scoreValue = (response === 'na' || response === 'ns') ? 0 : parseInt(response);
      
      await database.run(`
        INSERT OR REPLACE INTO user_responses (
          id, session_id, question_id, option_key, score_value, assessment_code, answered_at
        )
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `, [`response_${sessionId}_${questionId}`, sessionId, questionId, response, scoreValue, assessmentCode]);
    }

    // Update session progress
    const totalAnswered = Object.keys(responses).length;
    const completionPercentage = (totalAnswered / 35) * 100;
    
    await database.run(`
      UPDATE assessment_sessions 
      SET answered_questions = ?, completion_percentage = ?
      WHERE id = ?
    `, [totalAnswered, completionPercentage, sessionId]);

    await database.run('COMMIT');

    await logAction('user', null, 'responses_saved', `Session: ${sessionId}, Responses: ${totalAnswered}`, '');

    return { success: true, savedCount: totalAnswered };
  } catch (error) {
    await database.run('ROLLBACK');
    console.error('Error saving responses:', error);
    return { success: false, error: 'Failed to save responses' };
  }
}

// Get saved responses for session resume
export async function getSavedResponses(sessionId) {
  const database = await openDatabase();
  
  try {
    const responses = await database.all(`
      SELECT question_id, option_key, score_value, assessment_code
      FROM user_responses 
      WHERE session_id = ?
      ORDER BY answered_at
    `, [sessionId]);
    
    // Convert to object format for easy lookup
    const responseMap = {};
    responses.forEach(response => {
      responseMap[response.question_id] = response.option_key;
    });

    return { success: true, responses: responseMap, count: responses.length };
  } catch (error) {
    console.error('Error getting saved responses:', error);
    return { success: false, error: 'Failed to retrieve saved responses' };
  }
}

// Find first unanswered question by session ID
export async function getFirstUnansweredQuestion(sessionId, totalQuestions = 35) {
  const database = await openDatabase();
  
  try {
    const answeredQuestions = await database.all(`
      SELECT question_id 
      FROM user_responses 
      WHERE session_id = ?
    `, [sessionId]);
    
    const answeredIds = answeredQuestions.map(row => row.question_id);
    
    // Find first unanswered question (Q1, Q2, Q3... Q35)
    for (let i = 1; i <= totalQuestions; i++) {
      const questionId = `Q${i}`;
      if (!answeredIds.includes(questionId)) {
        return { success: true, questionNumber: i - 1 }; // Return 0-based index
      }
    }
    
    // All questions answered
    return { success: true, questionNumber: totalQuestions - 1 };
  } catch (error) {
    console.error('Error finding unanswered question:', error);
    return { success: false, error: 'Failed to find unanswered question' };
  }
}

// Find first unanswered question by assessment code
export async function getFirstUnansweredQuestionByCode(code, totalQuestions = 35) {
  const database = await openDatabase();
  
  try {
    // First validate the code
    const codeValidation = await validateAssessmentCode(code);
    
    if (!codeValidation.valid) {
      return { success: false, error: codeValidation.error };
    }
    
    const answeredQuestions = await database.all(`
      SELECT question_id 
      FROM user_responses 
      WHERE assessment_code = ?
    `, [code]);
    
    const answeredIds = answeredQuestions.map(row => row.question_id);
    
    // Find first unanswered question (Q1, Q2, Q3... Q35)
    for (let i = 1; i <= totalQuestions; i++) {
      const questionId = `Q${i}`;
      if (!answeredIds.includes(questionId)) {
        return { 
          success: true, 
          questionNumber: i - 1, // Return 0-based index
          code: code,
          totalAnswered: answeredIds.length,
          totalQuestions: totalQuestions
        };
      }
    }
    
    // All questions answered
    return { 
      success: true, 
      questionNumber: totalQuestions - 1,
      code: code,
      totalAnswered: totalQuestions,
      totalQuestions: totalQuestions,
      completed: true
    };
  } catch (error) {
    console.error('Error finding unanswered question by code:', error);
    return { success: false, error: 'Failed to find unanswered question' };
  }
}

// Existing functions (keeping for compatibility)
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

export async function createAssessmentSession(userId, totalQuestions = 35, language = 'en') {
  const database = await openDatabase();
  
  try {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await database.run(`
      INSERT INTO assessment_sessions (
        id, user_id, session_start, status, language_preference, 
        total_questions, answered_questions, completion_percentage
      )
      VALUES (?, ?, datetime('now'), 'in_progress', ?, ?, 0, 0)
    `, [sessionId, userId, language, totalQuestions]);
    
    return { success: true, sessionId };
  } catch (error) {
    console.error('Error creating assessment session:', error);
    return { success: false, error: 'Failed to create session' };
  }
}

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

// Get unanswered questions for a specific assessment code
export async function getUnansweredQuestionsByCode(code) {
  const database = await openDatabase();
  
  try {
    // First validate the code
    const codeValidation = await validateAssessmentCode(code);
    
    if (!codeValidation.valid) {
      return { success: false, error: codeValidation.error };
    }
    
    // Get all questions
    const allQuestions = await database.all(`
      SELECT id FROM questions ORDER BY display_order
    `);
    
    // Get answered questions for this code
    const answeredQuestions = await database.all(`
      SELECT DISTINCT question_id 
      FROM user_responses 
      WHERE assessment_code = ?
    `, [code]);
    
    const answeredIds = answeredQuestions.map(row => row.question_id);
    
    // Filter out answered questions
    const unansweredQuestions = allQuestions.filter(q => !answeredIds.includes(q.id));
    
    return { 
      success: true, 
      code: code,
      unansweredQuestions: unansweredQuestions.map(q => q.id),
      totalUnanswered: unansweredQuestions.length,
      totalQuestions: allQuestions.length
    };
  } catch (error) {
    console.error('Error getting unanswered questions by code:', error);
    return { success: false, error: 'Failed to retrieve unanswered questions' };
  }
}

// Get user data and session info by assessment code
export async function getUserDataByCode(code) {
  const database = await openDatabase();
  
  try {
    // Simple check: Look for user with this assessment code
    const userData = await database.get(`
      SELECT 
        u.id as user_id,
        u.name,
        u.email,
        u.organization,
        u.role_title,
        u.assessment_code,
        s.id as session_id,
        s.status as session_status,
        s.completion_percentage,
        s.language_preference,
        ac.is_used as code_is_used
      FROM users u
      JOIN assessment_codes ac ON u.assessment_code = ac.code
      LEFT JOIN assessment_sessions s ON s.user_id = u.id
      WHERE u.assessment_code = ?
      ORDER BY u.created_at DESC
      LIMIT 1
    `, [code]);

    if (!userData) {
      return { success: true, hasUserData: false };
    }

    return {
      success: true,
      hasUserData: true,
      userData: {
        userId: userData.user_id,
        name: userData.name,
        email: userData.email,
        organization: userData.organization,
        roleTitle: userData.role_title,
        sessionId: userData.session_id,
        sessionStatus: userData.session_status || 'not_started',
        completionPercentage: userData.completion_percentage || 0,
        language: userData.language_preference || 'en',
        codeIsUsed: userData.code_is_used
      }
    };
  } catch (error) {
    console.error('Error getting user data by code:', error);
    return { success: false, error: 'Failed to retrieve user data' };
  }
}

