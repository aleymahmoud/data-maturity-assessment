// Enhanced database functions for MySQL
import mysql from 'mysql2/promise';

let pool = null;

export async function openDatabase() {
  if (pool) {
    return pool;
  }

  try {
    // Load environment variables from .env.local if not in environment
    if (typeof window === 'undefined' && !process.env.DB_HOST) {
      const { config } = await import('dotenv');
      config({ path: '.env.local' });
    }

    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'data_maturity',
      connectionLimit: 5,
      acquireTimeout: 60000,
      timeout: 60000,
      charset: 'utf8mb4',
      reconnect: true
    });

    // Test the connection
    const connection = await pool.getConnection();
    await connection.release();

    console.log('MySQL database connected successfully');
    return pool;
  } catch (error) {
    console.error('MySQL connection error:', error);
    throw error;
  }
}

export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function getConnection() {
  if (!pool) {
    await openDatabase();
  }
  return pool.getConnection();
}

// Enhanced code validation with session checking
export async function validateAssessmentCode(code) {
  const database = await openDatabase();

  try {
    const [rows] = await database.execute(`
      SELECT code, organization_name, intended_recipient, expires_at, is_used, assessment_type
      FROM assessment_codes
      WHERE code = ?
    `, [code]);

    const codeRecord = rows[0];

    if (!codeRecord) {
      return { valid: false, error: 'Invalid assessment code' };
    }

    // Check expiration
    if (codeRecord.expires_at && new Date(codeRecord.expires_at) < new Date()) {
      return { valid: false, error: 'Assessment code has expired' };
    }

    // Allow used codes - they will be handled in the validation API to redirect to results
    // No longer block used codes here

    // Check for existing session (simplified - we'll allow new sessions for now)
    const existingSession = null;

    return {
      valid: true,
      data: {
        code: codeRecord.code,
        organizationName: codeRecord.organization_name,
        intendedRecipient: codeRecord.intended_recipient,
        isUsed: codeRecord.is_used,
        assessmentType: codeRecord.assessment_type || 'full',
        existingSession: existingSession
      }
    };
  } catch (error) {
    console.error('Error validating assessment code:', error);
    return { valid: false, error: 'Database error occurred' };
  }
}

// Create fresh user session (check for existing user first)
export async function createOrResumeSession(code, userData, language = 'en') {
  console.log('🗄️ DATABASE createOrResumeSession CALLED:', {
    code,
    userData: { name: userData.name, email: userData.email },
    language,
    timestamp: new Date().toISOString()
  });

  const database = await openDatabase();
  const connection = await database.getConnection();

  try {
    // Use FOR UPDATE to lock the rows and prevent concurrent modifications
    await connection.beginTransaction();

    // Get assessment code details including question list
    const [codeDetails] = await connection.execute(`
      SELECT assessment_type, question_list FROM assessment_codes WHERE code = ?
    `, [code]);

    if (codeDetails.length === 0) {
      await connection.rollback();
      await connection.release();
      return { success: false, error: 'Invalid assessment code' };
    }

    const codeInfo = codeDetails[0];
    // MySQL JSON column is already parsed, no need for JSON.parse()
    const questionList = Array.isArray(codeInfo.question_list) ? codeInfo.question_list : JSON.parse(codeInfo.question_list || '[]');
    const totalQuestions = questionList.length;

    // Check for ANY existing sessions with this code (regardless of status)
    // Use FOR UPDATE to lock the rows and prevent duplicate creation
    const [existingSessions] = await connection.execute(`
      SELECT s.*, u.name, u.email, u.organization, u.role_title, u.selected_role_id
      FROM assessment_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.code = ?
      ORDER BY s.session_start DESC
      LIMIT 1
      FOR UPDATE
    `, [code]);

    console.log('🔍 EXISTING SESSIONS FOUND:', existingSessions.length, existingSessions.length > 0 ? existingSessions[0] : 'none');

    let userId, sessionId, isResume = false;

    if (existingSessions.length > 0) {
      // Found existing session - code has been used before
      const existingSession = existingSessions[0];

      console.log('👤 USER MATCHING CHECK:', {
        existing: { name: existingSession.name, email: existingSession.email, org: existingSession.organization },
        incoming: { name: userData.name, email: userData.email, org: userData.organization },
        nameMatch: existingSession.name === userData.name,
        emailMatch: existingSession.email === userData.email,
        orgMatch: existingSession.organization === userData.organization
      });

      // Check if user data matches (for same user returning)
      if (existingSession.name === userData.name &&
          existingSession.email === userData.email &&
          existingSession.organization === userData.organization) {

        console.log('✅ SAME USER RETURNING - RESUMING');
        // Same user returning - allow them to resume/view results
        userId = existingSession.user_id;
        sessionId = existingSession.id;
        isResume = true;

        // Update user info if provided and different
        const updates = [];
        const values = [];

        if (userData.roleTitle && userData.roleTitle !== existingSession.role_title) {
          updates.push('role_title = ?');
          values.push(userData.roleTitle);
        }

        if (userData.selectedRole && userData.selectedRole !== existingSession.selected_role_id) {
          updates.push('selected_role_id = ?');
          values.push(userData.selectedRole);
        }

        if (updates.length > 0) {
          values.push(userId);
          await connection.execute(`
            UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?
          `, values);
        }

        console.log('Resuming session:', sessionId, 'for user:', userId);
      } else {
        // Different user trying to use already used code - REJECT
        console.log('❌ DIFFERENT USER TRYING TO USE USED CODE');
        await connection.rollback();
        await connection.release();
        return {
          success: false,
          error: 'This assessment code has already been used by another user. Each code can only be used once.',
          codeAlreadyUsed: true
        };
      }
    }

    if (!isResume) {
      // Double-check that no session exists for this code before creating new
      const [doubleCheck] = await connection.execute(`
        SELECT COUNT(*) as count FROM assessment_sessions WHERE code = ?
      `, [code]);

      if (doubleCheck[0].count > 0) {
        console.log('⚠️ RACE CONDITION DETECTED - Session already exists for this code');
        await connection.rollback();
        await connection.release();

        // Try to get the existing session instead
        const [existingSession] = await connection.execute(`
          SELECT s.*, u.name, u.email, u.organization
          FROM assessment_sessions s
          JOIN users u ON s.user_id = u.id
          WHERE s.code = ?
          LIMIT 1
        `, [code]);

        if (existingSession.length > 0) {
          return {
            success: true,
            sessionId: existingSession[0].id,
            userId: existingSession[0].user_id,
            isResume: true,
            completionPercentage: 0
          };
        }
      }

      // Create new user and session
      console.log('🆕 CREATING NEW USER AND SESSION');
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log('🔧 INSERTING NEW USER:', userId);
      await connection.execute(`
        INSERT INTO users (id, name, organization, role_title, email, selected_role_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [userId, userData.name, userData.organization, userData.roleTitle, userData.email, userData.selectedRole || null]);

      console.log('🔧 INSERTING NEW SESSION:', sessionId);
      await connection.execute(`
        INSERT INTO assessment_sessions (
          id, user_id, code, status, total_questions, questions_answered
        )
        VALUES (?, ?, ?, 'in_progress', ?, 0)
      `, [sessionId, userId, code, totalQuestions]);

      console.log('✅ Created new user:', userId, 'and session:', sessionId);
    }

    await logAction('user', userId, isResume ? 'session_resumed' : 'session_created',
                   `Code: ${code}, Session: ${sessionId}`, '', connection);

    // Get current completion percentage
    const [responses] = await connection.execute(
      'SELECT COUNT(*) as count FROM user_responses WHERE session_id = ?',
      [sessionId]
    );
    const completionPercentage = Math.round((responses[0].count / totalQuestions) * 100);

    await connection.commit();
    await connection.release();

    const result = {
      success: true,
      sessionId: sessionId,
      userId: userId,
      isResume: isResume,
      completionPercentage: completionPercentage
    };

    console.log('🎯 DATABASE FUNCTION RETURNING:', result);
    return result;
  } catch (error) {
    await connection.rollback();
    await connection.release();
    console.error('Error creating/resuming session:', error);
    return { success: false, error: 'Failed to create or resume session' };
  }
}

// Update user's selected role
export async function updateUserSelectedRole(userId, selectedRole) {
  const database = await openDatabase();

  try {
    await database.execute(`
      UPDATE users
      SET selected_role_id = ?, updated_at = NOW()
      WHERE id = ?
    `, [selectedRole, userId]);

    return { success: true };
  } catch (error) {
    console.error('Error updating user selected role:', error);
    return { success: false, error: 'Failed to update selected role' };
  }
}

// Mark code as used (called on assessment completion)
export async function markCodeAsUsed(code, sessionId) {
  const database = await openDatabase();
  const connection = await database.getConnection();

  try {
    await connection.beginTransaction();

    // Update code to mark as used
    await connection.execute(`
      UPDATE assessment_codes
      SET is_used = 1, usage_count = usage_count + 1
      WHERE code = ?
    `, [code]);

    // Update session to completed
    await connection.execute(`
      UPDATE assessment_sessions
      SET status = 'completed', session_end = NOW(), completion_percentage = 100
      WHERE id = ?
    `, [sessionId]);

    await logAction('user', null, 'assessment_completed', `Code: ${code}, Session: ${sessionId}`, '', connection);

    await connection.commit();
    await connection.release();

    return { success: true };
  } catch (error) {
    await connection.rollback();
    await connection.release();
    console.error('Error marking code as used:', error);
    return { success: false, error: 'Failed to complete assessment' };
  }
}

// Save assessment responses (bulk save for save/exit functionality)
export async function saveAssessmentResponses(sessionId, responses, assessmentCode = null) {
  const database = await openDatabase();
  const connection = await database.getConnection();

  try {
    await connection.beginTransaction();

    // Get total questions from session
    const [sessionInfo] = await connection.execute(`
      SELECT total_questions FROM assessment_sessions WHERE id = ?
    `, [sessionId]);

    if (!sessionInfo || sessionInfo.length === 0) {
      throw new Error('Session not found');
    }

    const totalQuestions = sessionInfo[0]?.total_questions || 35;

    for (const [questionId, response] of Object.entries(responses)) {
      const scoreValue = (response === 'na' || response === 'ns') ? 0 : parseInt(response);

      // Use REPLACE INTO or INSERT ... ON DUPLICATE KEY UPDATE
      await connection.execute(`
        INSERT INTO user_responses (
          session_id, question_id, selected_option, score_value, assessment_code
        )
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          selected_option = VALUES(selected_option),
          score_value = VALUES(score_value),
          answered_at = CURRENT_TIMESTAMP
      `, [sessionId, questionId, response, scoreValue, assessmentCode]);
    }

    // Update session progress
    const totalAnswered = Object.keys(responses).length;
    const completionPercentage = Math.round((totalAnswered / totalQuestions) * 100);

    await connection.execute(`
      UPDATE assessment_sessions
      SET questions_answered = ?, completion_percentage = ?
      WHERE id = ?
    `, [totalAnswered, completionPercentage, sessionId]);

    await logAction('user', null, 'responses_saved', `Session: ${sessionId}, Responses: ${totalAnswered}`, '', connection);

    await connection.commit();
    await connection.release();

    console.log('✅ Successfully saved responses:', totalAnswered);
    return { success: true, savedCount: totalAnswered };
  } catch (error) {
    if (connection) {
      await connection.rollback();
      await connection.release();
    }
    console.error('Error saving responses:', error);
    return { success: false, error: error.message || 'Failed to save responses' };
  }
}

// Get saved responses for session resume
export async function getSavedResponses(sessionId) {
  const database = await openDatabase();

  try {
    const [rows] = await database.execute(`
      SELECT question_id, selected_option, score_value, assessment_code
      FROM user_responses
      WHERE session_id = ?
      ORDER BY answered_at
    `, [sessionId]);

    // Convert to object format for easy lookup
    const responseMap = {};
    rows.forEach(response => {
      responseMap[response.question_id] = response.selected_option;
    });

    return { success: true, responses: responseMap, count: rows.length };
  } catch (error) {
    console.error('Error getting saved responses:', error);
    return { success: false, error: 'Failed to retrieve saved responses' };
  }
}

// Find first unanswered question by session ID
export async function getFirstUnansweredQuestion(sessionId, totalQuestions = 35) {
  const database = await openDatabase();

  try {
    const [rows] = await database.execute(`
      SELECT question_id
      FROM user_responses
      WHERE session_id = ?
    `, [sessionId]);

    const answeredIds = rows.map(row => row.question_id);

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
export async function getFirstUnansweredQuestionByCode(code) {
  const database = await openDatabase();

  try {
    // First validate the code and get question list
    const codeValidation = await validateAssessmentCode(code);

    if (!codeValidation.valid) {
      return { success: false, error: codeValidation.error };
    }

    // Get snapshotted question list
    const [codeRows] = await database.execute(`
      SELECT question_list FROM assessment_codes WHERE code = ?
    `, [code]);

    const questionList = Array.isArray(codeRows[0]?.question_list) ? codeRows[0].question_list : JSON.parse(codeRows[0]?.question_list || '[]');
    const totalQuestions = questionList.length;

    if (totalQuestions === 0) {
      return { success: false, error: 'No questions found for this assessment code' };
    }

    const [rows] = await database.execute(`
      SELECT question_id
      FROM user_responses
      WHERE assessment_code = ?
    `, [code]);

    const answeredIds = rows.map(row => row.question_id);

    // Find first unanswered question from the snapshotted list
    for (let i = 0; i < questionList.length; i++) {
      const questionId = questionList[i];
      if (!answeredIds.includes(questionId)) {
        return {
          success: true,
          questionNumber: i, // Return 0-based index
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

    await database.execute(`
      INSERT INTO users (id, name, organization, role_title, email, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
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

    await database.execute(`
      INSERT INTO assessment_sessions (
        id, user_id, session_start, status, language_preference,
        total_questions, questions_answered, completion_percentage
      )
      VALUES (?, ?, NOW(), 'in_progress', ?, ?, 0, 0)
    `, [sessionId, userId, language, totalQuestions]);

    return { success: true, sessionId };
  } catch (error) {
    console.error('Error creating assessment session:', error);
    return { success: false, error: 'Failed to create session' };
  }
}

export async function logAction(userType, userId, action, details, ipAddress, connection = null) {
  const database = connection || await openDatabase();

  try {
    const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (connection) {
      await connection.execute(`
        INSERT INTO audit_logs (id, user_type, user_id, action, details, ip_address, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [logId, userType, userId, action, details, ipAddress]);
    } else {
      await database.execute(`
        INSERT INTO audit_logs (id, user_type, user_id, action, details, ip_address, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [logId, userType, userId, action, details, ipAddress]);
    }

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

    // Get snapshotted question list
    const [codeRows] = await database.execute(`
      SELECT question_list FROM assessment_codes WHERE code = ?
    `, [code]);

    const questionList = Array.isArray(codeRows[0]?.question_list) ? codeRows[0].question_list : JSON.parse(codeRows[0]?.question_list || '[]');

    if (questionList.length === 0) {
      return { success: false, error: 'No questions found for this assessment code' };
    }

    // Get answered questions for this code
    const [answeredRows] = await database.execute(`
      SELECT DISTINCT question_id
      FROM user_responses
      WHERE assessment_code = ?
    `, [code]);

    const answeredIds = answeredRows.map(row => row.question_id);

    // Filter out answered questions from the snapshotted list
    const unansweredQuestions = questionList.filter(questionId => !answeredIds.includes(questionId));

    return {
      success: true,
      code: code,
      unansweredQuestions: unansweredQuestions,
      totalUnanswered: unansweredQuestions.length,
      totalQuestions: questionList.length
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
    // Complete query with all fields - find users through sessions
    const [rows] = await database.execute(`
      SELECT
        u.id as user_id,
        u.name,
        u.email,
        u.organization,
        u.role_title,
        u.selected_role_id,
        s.id as session_id,
        s.status as session_status,
        s.completion_percentage,
        s.language_preference,
        s.code as assessment_code,
        ac.is_used as code_is_used
      FROM assessment_sessions s
      JOIN users u ON s.user_id = u.id
      JOIN assessment_codes ac ON s.code = ac.code
      WHERE s.code = ?
      ORDER BY u.created_at DESC,
               CASE WHEN s.status = 'completed' THEN 1 ELSE 2 END,
               s.session_end DESC, s.session_start DESC
      LIMIT 1
    `, [code]);

    const userData = rows[0];

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
        selectedRole: userData.selected_role_id,
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

// Get final assessment results for a user
export async function getAssessmentResults(userId, assessmentCode) {
  const database = await openDatabase();

  try {
    const [rows] = await database.execute(`
      SELECT ar.*, u.name, u.email, r.name_en as role_name
      FROM assessment_results ar
      JOIN users u ON ar.user_id = u.id
      LEFT JOIN roles r ON u.selected_role_id = r.id
      WHERE ar.user_id = ? AND ar.assessment_code = ?
    `, [userId, assessmentCode]);

    const result = rows[0];

    return { success: true, result };
  } catch (error) {
    console.error('Error getting assessment results:', error);
    return { success: false, error: 'Failed to retrieve results' };
  }
}

// Calculate and store final results when assessment is complete
export async function generateAssessmentResults(userId, assessmentCode) {
  const database = await openDatabase();

  try {
    // Get all responses for this user/code
    const [rows] = await database.execute(`
      SELECT question_id, score_value
      FROM user_responses ur
      JOIN assessment_sessions s ON ur.session_id = s.id
      WHERE s.user_id = ? AND ur.assessment_code = ?
      AND score_value > 0
    `, [userId, assessmentCode]);

    if (rows.length === 0) {
      return { success: false, error: 'No responses found' };
    }

    // Calculate overall score
    const totalScore = rows.reduce((sum, r) => sum + r.score_value, 0);
    const averageScore = totalScore / rows.length;

    // Determine maturity level
    let maturityLevel = 'Initial';
    if (averageScore >= 4.3) maturityLevel = 'Optimized';
    else if (averageScore >= 3.5) maturityLevel = 'Advanced';
    else if (averageScore >= 2.7) maturityLevel = 'Defined';
    else if (averageScore >= 1.9) maturityLevel = 'Developing';

    // Store results
    const resultId = `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await database.execute(`
      INSERT INTO assessment_results (
        id, user_id, assessment_code, overall_score, overall_maturity_level,
        completion_date, total_questions_answered, results_data
      ) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)
      ON DUPLICATE KEY UPDATE
        overall_score = VALUES(overall_score),
        overall_maturity_level = VALUES(overall_maturity_level),
        completion_date = VALUES(completion_date),
        total_questions_answered = VALUES(total_questions_answered),
        results_data = VALUES(results_data)
    `, [resultId, userId, assessmentCode, averageScore, maturityLevel, rows.length, JSON.stringify({
      responses: rows,
      calculatedAt: new Date().toISOString()
    })]);

    return {
      success: true,
      results: {
        overallScore: averageScore,
        maturityLevel: maturityLevel,
        questionsAnswered: rows.length
      }
    };
  } catch (error) {
    console.error('Error generating results:', error);
    return { success: false, error: 'Failed to generate results' };
  }
}