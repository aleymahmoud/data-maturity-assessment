// src/app/api/session/route.js
import { NextResponse } from 'next/server';
import { createOrResumeSession } from '../../../lib/database.js';



// REPLACE the entire POST function with this simplified version:

export async function POST(request) {
  try {
    const { code, userData, language } = await request.json();
    
    if (!code || !userData) {
      return NextResponse.json({
        success: false,
        error: 'Assessment code and user data are required'
      }, { status: 400 });
    }

    // Always create fresh session (no resume logic)
    const sessionResult = await createOrResumeSession(code, userData, language);
    
    if (!sessionResult.success) {
      return NextResponse.json({
        success: false,
        error: sessionResult.error
      }, { status: 500 });
    }

    // Always return fresh session data
    const responseData = {
      success: true,
      sessionId: sessionResult.sessionId,
      userId: sessionResult.userId,
      isResume: false,           // Always false
      savedResponses: {},        // Always empty
      startQuestion: 0,          // Always start from beginning
      completionPercentage: 0    // Always 0
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Session management error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error occurred'
    }, { status: 500 });
  }
}