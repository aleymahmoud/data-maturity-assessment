// src/app/api/session/route.js
import { NextResponse } from 'next/server';
import { createOrResumeSession, getSavedResponses, getFirstUnansweredQuestion } from '../../../lib/database.js';

export async function POST(request) {
  try {
    const { code, userData, language } = await request.json();
    
    if (!code || !userData) {
      return NextResponse.json({
        success: false,
        error: 'Code and user data are required'
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

    // If resuming session, get saved responses and first unanswered question
    if (sessionResult.isResume) {
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