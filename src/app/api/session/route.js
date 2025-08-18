// src/app/api/session/route.js
import { NextResponse } from 'next/server';
import { createOrResumeSession, getSavedResponses, getFirstUnansweredQuestion, getFirstUnansweredQuestionByCode } from '../../../lib/database.js';

export async function POST(request) {
  try {
    const { code, userData, language, resumeByCode } = await request.json();
    
    if (!code) {
      return NextResponse.json({
        success: false,
        error: 'Assessment code is required'
      }, { status: 400 });
    }
    
    // If not resuming by code, userData is required
    if (!resumeByCode && !userData) {
      return NextResponse.json({
        success: false,
        error: 'User data is required'
      }, { status: 400 });
    }

    // Create or resume session
    const sessionResult = await createOrResumeSession(code, userData, language);
    
    if (!sessionResult.success) {
      return NextResponse.json({
        success: false,
        error: sessionResult.error
      }, { status: 500 });
    }

    let responseData = {
      success: true,
      sessionId: sessionResult.sessionId,
      userId: sessionResult.userId,
      isResume: sessionResult.isResume
    };

    // If resuming by code, use code-based functions
    if (resumeByCode) {
      const firstUnanswered = await getFirstUnansweredQuestionByCode(code);
      
      if (!firstUnanswered.success) {
        return NextResponse.json({
          success: false,
          error: firstUnanswered.error || 'Failed to retrieve questions for this code'
        }, { status: 400 });
      }
      
      responseData.isResume = true;
      responseData.savedResponses = {}; // Will be populated on the client side
      responseData.startQuestion = firstUnanswered.questionNumber;
      responseData.completionPercentage = (firstUnanswered.totalAnswered / firstUnanswered.totalQuestions) * 100;
    }
    // If resuming session normally, get saved responses and first unanswered question
    else if (sessionResult.isResume) {
      const savedResponses = await getSavedResponses(sessionResult.sessionId);
      const firstUnanswered = await getFirstUnansweredQuestion(sessionResult.sessionId);
      
      responseData.savedResponses = savedResponses.success ? savedResponses.responses : {};
      responseData.startQuestion = firstUnanswered.success ? firstUnanswered.questionNumber : 0;
      responseData.completionPercentage = sessionResult.completionPercentage;
    } else {
      responseData.savedResponses = {};
      responseData.startQuestion = 0;
      responseData.completionPercentage = 0;
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Session management error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error occurred'
    }, { status: 500 });
  }
}