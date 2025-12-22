// Database functions using Prisma
import prisma from './prisma.js';

// Enhanced code validation with session checking
export async function validateAssessmentCode(code) {
  try {
    const codeRecord = await prisma.assessmentCode.findUnique({
      where: { code }
    });

    if (!codeRecord) {
      return { valid: false, error: 'Invalid assessment code' };
    }

    // Check expiration
    if (codeRecord.expiresAt && new Date(codeRecord.expiresAt) < new Date()) {
      return { valid: false, error: 'Assessment code has expired' };
    }

    return {
      valid: true,
      data: {
        code: codeRecord.code,
        organizationName: codeRecord.organizationName,
        intendedRecipient: codeRecord.intendedRecipient,
        isUsed: codeRecord.isUsed,
        assessmentType: codeRecord.assessmentType || 'full',
        existingSession: null
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

  try {
    // Get assessment code details including question list
    const codeDetails = await prisma.assessmentCode.findUnique({
      where: { code }
    });

    if (!codeDetails) {
      return { success: false, error: 'Invalid assessment code' };
    }

    // Handle question_list
    let questionList = [];
    if (Array.isArray(codeDetails.questionList)) {
      questionList = codeDetails.questionList;
    } else if (typeof codeDetails.questionList === 'string') {
      const listStr = codeDetails.questionList.trim();
      if (listStr.startsWith('[')) {
        questionList = JSON.parse(listStr);
      } else if (listStr.length > 0) {
        questionList = listStr.split(',').map(q => q.trim()).filter(q => q.length > 0);
      }
    }
    const totalQuestions = questionList.length;

    // Check for existing sessions with this code
    const existingSession = await prisma.assessmentSession.findFirst({
      where: { code },
      include: { user: true },
      orderBy: { sessionStart: 'desc' }
    });

    console.log('🔍 EXISTING SESSIONS FOUND:', existingSession ? 1 : 0);

    let userId, sessionId, isResume = false;

    if (existingSession) {
      const existingUser = existingSession.user;

      console.log('👤 USER MATCHING CHECK:', {
        existing: { name: existingUser.name, email: existingUser.email, org: existingUser.organization },
        incoming: { name: userData.name, email: userData.email, org: userData.organization }
      });

      // Check if user data matches
      if (existingUser.name === userData.name &&
          existingUser.email === userData.email &&
          existingUser.organization === userData.organization) {

        console.log('✅ SAME USER RETURNING - RESUMING');
        userId = existingUser.id;
        sessionId = existingSession.id;
        isResume = true;

        // Update user info if provided and different
        const updates = {};
        if (userData.roleTitle && userData.roleTitle !== existingUser.roleTitle) {
          updates.roleTitle = userData.roleTitle;
        }
        if (userData.selectedRole && userData.selectedRole !== existingUser.selectedRoleId) {
          updates.selectedRoleId = userData.selectedRole;
        }

        if (Object.keys(updates).length > 0) {
          await prisma.user.update({
            where: { id: userId },
            data: updates
          });
        }

        console.log('Resuming session:', sessionId, 'for user:', userId);
      } else {
        // Different user trying to use already used code - REJECT
        console.log('❌ DIFFERENT USER TRYING TO USE USED CODE');
        return {
          success: false,
          error: 'This assessment code has already been used by another user. Each code can only be used once.',
          codeAlreadyUsed: true
        };
      }
    }

    if (!isResume) {
      // Create new user and session
      console.log('🆕 CREATING NEW USER AND SESSION');
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log('🔧 INSERTING NEW USER:', userId);
      await prisma.user.create({
        data: {
          id: userId,
          name: userData.name,
          organization: userData.organization,
          organizationSize: userData.organizationSize || null,
          industry: userData.industry || null,
          country: userData.country || null,
          roleTitle: userData.roleTitle,
          email: userData.email,
          selectedRoleId: userData.selectedRole || null
        }
      });

      console.log('🔧 INSERTING NEW SESSION:', sessionId);
      await prisma.assessmentSession.create({
        data: {
          id: sessionId,
          userId: userId,
          code: code,
          status: 'in_progress',
          totalQuestions: totalQuestions,
          questionsAnswered: 0
        }
      });

      console.log('✅ Created new user:', userId, 'and session:', sessionId);
    }

    await logAction('user', userId, isResume ? 'session_resumed' : 'session_created',
                   `Code: ${code}, Session: ${sessionId}`, '');

    // Get current completion percentage
    const responseCount = await prisma.userResponse.count({
      where: { sessionId }
    });
    const completionPercentage = totalQuestions > 0 ? Math.round((responseCount / totalQuestions) * 100) : 0;

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
    console.error('Error creating/resuming session:', error);
    return { success: false, error: 'Failed to create or resume session' };
  }
}

// Update user's selected role
export async function updateUserSelectedRole(userId, selectedRole) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { selectedRoleId: selectedRole }
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating user selected role:', error);
    return { success: false, error: 'Failed to update selected role' };
  }
}

// Mark code as used (called on assessment completion)
export async function markCodeAsUsed(code, sessionId) {
  try {
    await prisma.$transaction([
      prisma.assessmentCode.update({
        where: { code },
        data: {
          isUsed: true,
          usageCount: { increment: 1 }
        }
      }),
      prisma.assessmentSession.update({
        where: { id: sessionId },
        data: {
          status: 'completed',
          sessionEnd: new Date(),
          completionPercentage: 100
        }
      })
    ]);

    await logAction('user', null, 'assessment_completed', `Code: ${code}, Session: ${sessionId}`, '');

    return { success: true };
  } catch (error) {
    console.error('Error marking code as used:', error);
    return { success: false, error: 'Failed to complete assessment' };
  }
}

// Save assessment responses (bulk save for save/exit functionality)
export async function saveAssessmentResponses(sessionId, responses, assessmentCode = null) {
  try {
    // Get total questions from session
    const sessionInfo = await prisma.assessmentSession.findUnique({
      where: { id: sessionId }
    });

    if (!sessionInfo) {
      throw new Error('Session not found');
    }

    const totalQuestions = sessionInfo.totalQuestions || 35;

    // Upsert each response
    for (const [questionId, response] of Object.entries(responses)) {
      try {
        const scoreValue = (response === 'na' || response === 'ns') ? 0 : parseInt(response);

        console.log(`Saving response for question ${questionId}:`, {
          sessionId,
          questionId,
          response,
          scoreValue,
          assessmentCode
        });

        await prisma.userResponse.upsert({
          where: {
            sessionId_questionId: {
              sessionId,
              questionId
            }
          },
          update: {
            selectedOption: String(response),
            scoreValue: scoreValue,
            answeredAt: new Date()
          },
          create: {
            sessionId,
            questionId,
            selectedOption: String(response),
            scoreValue: scoreValue,
            assessmentCode: assessmentCode
          }
        });
      } catch (error) {
        console.error(`Error saving response for question ${questionId}:`, error);
        throw error;
      }
    }

    // Update session progress
    const totalAnswered = Object.keys(responses).length;
    const completionPercentage = Math.round((totalAnswered / totalQuestions) * 100);

    await prisma.assessmentSession.update({
      where: { id: sessionId },
      data: {
        questionsAnswered: totalAnswered,
        completionPercentage: completionPercentage
      }
    });

    await logAction('user', null, 'responses_saved', `Session: ${sessionId}, Responses: ${totalAnswered}`, '');

    console.log('✅ Successfully saved responses:', totalAnswered);
    return { success: true, savedCount: totalAnswered };
  } catch (error) {
    console.error('Error saving responses:', error);
    return { success: false, error: error.message || 'Failed to save responses' };
  }
}

// Get saved responses for session resume
export async function getSavedResponses(sessionId) {
  try {
    const rows = await prisma.userResponse.findMany({
      where: { sessionId },
      orderBy: { answeredAt: 'asc' }
    });

    // Convert to object format for easy lookup
    const responseMap = {};
    rows.forEach(response => {
      responseMap[response.questionId] = response.selectedOption;
    });

    return { success: true, responses: responseMap, count: rows.length };
  } catch (error) {
    console.error('Error getting saved responses:', error);
    return { success: false, error: 'Failed to retrieve saved responses' };
  }
}

// Find first unanswered question by session ID
export async function getFirstUnansweredQuestion(sessionId, totalQuestions = 35) {
  try {
    const rows = await prisma.userResponse.findMany({
      where: { sessionId },
      select: { questionId: true }
    });

    const answeredIds = rows.map(row => row.questionId);

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
  try {
    // First validate the code and get question list
    const codeValidation = await validateAssessmentCode(code);

    if (!codeValidation.valid) {
      return { success: false, error: codeValidation.error };
    }

    // Get snapshotted question list
    const codeRecord = await prisma.assessmentCode.findUnique({
      where: { code }
    });

    // Handle question_list
    let questionList = [];
    const questionData = codeRecord?.questionList;
    if (Array.isArray(questionData)) {
      questionList = questionData;
    } else if (typeof questionData === 'string') {
      const listStr = questionData.trim();
      if (listStr.startsWith('[')) {
        questionList = JSON.parse(listStr);
      } else if (listStr.length > 0) {
        questionList = listStr.split(',').map(q => q.trim()).filter(q => q.length > 0);
      }
    }
    const totalQuestions = questionList.length;

    if (totalQuestions === 0) {
      return { success: false, error: 'No questions found for this assessment code' };
    }

    const rows = await prisma.userResponse.findMany({
      where: { assessmentCode: code },
      select: { questionId: true }
    });

    const answeredIds = rows.map(row => row.questionId);

    // Find first unanswered question from the snapshotted list
    for (let i = 0; i < questionList.length; i++) {
      const questionId = questionList[i];
      if (!answeredIds.includes(questionId)) {
        return {
          success: true,
          questionNumber: i,
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

// Create user
export async function createUser(userData) {
  try {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await prisma.user.create({
      data: {
        id: userId,
        name: userData.name,
        organization: userData.organization,
        roleTitle: userData.roleTitle,
        email: userData.email
      }
    });

    return { success: true, userId };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: 'Failed to create user' };
  }
}

// Create assessment session
export async function createAssessmentSession(userId, totalQuestions = 35, language = 'en') {
  try {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await prisma.assessmentSession.create({
      data: {
        id: sessionId,
        userId: userId,
        code: '', // Will need to be updated
        status: 'in_progress',
        languagePreference: language,
        totalQuestions: totalQuestions,
        questionsAnswered: 0,
        completionPercentage: 0
      }
    });

    return { success: true, sessionId };
  } catch (error) {
    console.error('Error creating assessment session:', error);
    return { success: false, error: 'Failed to create session' };
  }
}

// Log action
export async function logAction(userType, userId, action, details, ipAddress) {
  try {
    const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await prisma.auditLog.create({
      data: {
        id: logId,
        userType: userType,
        userId: userId,
        action: action,
        details: details,
        ipAddress: ipAddress
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error logging action:', error);
    return { success: false };
  }
}

// Get unanswered questions for a specific assessment code
export async function getUnansweredQuestionsByCode(code) {
  try {
    // First validate the code
    const codeValidation = await validateAssessmentCode(code);

    if (!codeValidation.valid) {
      return { success: false, error: codeValidation.error };
    }

    // Get snapshotted question list
    const codeRecord = await prisma.assessmentCode.findUnique({
      where: { code }
    });

    // Handle question_list
    let questionList = [];
    const questionData = codeRecord?.questionList;
    if (Array.isArray(questionData)) {
      questionList = questionData;
    } else if (typeof questionData === 'string') {
      const listStr = questionData.trim();
      if (listStr.startsWith('[')) {
        questionList = JSON.parse(listStr);
      } else if (listStr.length > 0) {
        questionList = listStr.split(',').map(q => q.trim()).filter(q => q.length > 0);
      }
    }

    if (questionList.length === 0) {
      return { success: false, error: 'No questions found for this assessment code' };
    }

    // Get answered questions for this code
    const answeredRows = await prisma.userResponse.findMany({
      where: { assessmentCode: code },
      select: { questionId: true },
      distinct: ['questionId']
    });

    const answeredIds = answeredRows.map(row => row.questionId);

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
  try {
    const session = await prisma.assessmentSession.findFirst({
      where: { code },
      include: {
        user: true,
        codeRef: true
      },
      orderBy: [
        { status: 'desc' },
        { sessionEnd: 'desc' },
        { sessionStart: 'desc' }
      ]
    });

    if (!session) {
      return { success: true, hasUserData: false };
    }

    return {
      success: true,
      hasUserData: true,
      userData: {
        userId: session.user.id,
        name: session.user.name,
        email: session.user.email,
        organization: session.user.organization,
        roleTitle: session.user.roleTitle,
        selectedRole: session.user.selectedRoleId,
        sessionId: session.id,
        sessionStatus: session.status || 'not_started',
        completionPercentage: session.completionPercentage || 0,
        language: session.languagePreference || 'en',
        codeIsUsed: session.codeRef?.isUsed
      }
    };
  } catch (error) {
    console.error('Error getting user data by code:', error);
    return { success: false, error: 'Failed to retrieve user data' };
  }
}

// Get final assessment results for a user
export async function getAssessmentResults(userId, assessmentCode) {
  try {
    const result = await prisma.assessmentResult.findUnique({
      where: {
        userId_assessmentCode: {
          userId,
          assessmentCode
        }
      },
      include: {
        user: true
      }
    });

    // Get role info if needed
    let roleName = null;
    if (result?.user?.selectedRoleId) {
      const role = await prisma.role.findUnique({
        where: { id: result.user.selectedRoleId }
      });
      roleName = role?.title;
    }

    return {
      success: true,
      result: result ? {
        ...result,
        role_name: roleName
      } : null
    };
  } catch (error) {
    console.error('Error getting assessment results:', error);
    return { success: false, error: 'Failed to retrieve results' };
  }
}

// Calculate and store final results when assessment is complete
export async function generateAssessmentResults(userId, assessmentCode) {
  try {
    // Get all responses for this user/code
    const sessions = await prisma.assessmentSession.findMany({
      where: { userId },
      select: { id: true }
    });

    const sessionIds = sessions.map(s => s.id);

    const rows = await prisma.userResponse.findMany({
      where: {
        sessionId: { in: sessionIds },
        assessmentCode: assessmentCode,
        scoreValue: { gt: 0 }
      }
    });

    if (rows.length === 0) {
      return { success: false, error: 'No responses found' };
    }

    // Calculate overall score
    const totalScore = rows.reduce((sum, r) => sum + r.scoreValue, 0);
    const averageScore = totalScore / rows.length;

    // Determine maturity level
    let maturityLevel = 'Initial';
    if (averageScore >= 4.3) maturityLevel = 'Optimized';
    else if (averageScore >= 3.5) maturityLevel = 'Advanced';
    else if (averageScore >= 2.7) maturityLevel = 'Defined';
    else if (averageScore >= 1.9) maturityLevel = 'Developing';

    // Store results
    const resultId = `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await prisma.assessmentResult.upsert({
      where: {
        userId_assessmentCode: {
          userId,
          assessmentCode
        }
      },
      update: {
        overallScore: averageScore,
        overallMaturityLevel: maturityLevel,
        completionDate: new Date(),
        totalQuestionsAnswered: rows.length,
        resultsData: JSON.stringify({
          responses: rows,
          calculatedAt: new Date().toISOString()
        })
      },
      create: {
        id: resultId,
        userId,
        assessmentCode,
        overallScore: averageScore,
        overallMaturityLevel: maturityLevel,
        totalQuestionsAnswered: rows.length,
        resultsData: JSON.stringify({
          responses: rows,
          calculatedAt: new Date().toISOString()
        })
      }
    });

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

// Legacy compatibility exports
export async function openDatabase() {
  return prisma;
}

export async function closeDatabase() {
  await prisma.$disconnect();
}

export async function getConnection() {
  return prisma;
}
