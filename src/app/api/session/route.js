// src/app/api/session/route.js
import { NextResponse } from 'next/server';
import { createOrResumeSession } from '../../../lib/database.js';



// REPLACE the entire POST function with this simplified version:

export async function POST(request) {
  try {
    const { code, userData, language } = await request.json();

    console.log('🚨 SESSION API CALLED:', {
      code,
      userData: userData ? { name: userData.name, email: userData.email } : 'no userData',
      language,
      timestamp: new Date().toISOString()
    });

    if (!code || !userData) {
      console.log('❌ SESSION API - Missing required data');
      return NextResponse.json({
        success: false,
        error: 'Assessment code and user data are required'
      }, { status: 400 });
    }

    // Create or resume session based on existing data
    const sessionResult = await createOrResumeSession(code, userData, language);

    console.log('📊 SESSION RESULT:', {
      success: sessionResult.success,
      sessionId: sessionResult.sessionId,
      userId: sessionResult.userId,
      isResume: sessionResult.isResume,
      error: sessionResult.error
    });

    if (!sessionResult.success) {
      console.log('❌ SESSION CREATION FAILED:', sessionResult.error);
      return NextResponse.json({
        success: false,
        error: sessionResult.error
      }, { status: 500 });
    }

    // Return session data with correct resume status
    const responseData = {
      success: true,
      sessionId: sessionResult.sessionId,
      userId: sessionResult.userId,
      isResume: sessionResult.isResume || false,
      savedResponses: {},        // Will be populated if resuming
      startQuestion: 0,          // Will be updated if resuming
      completionPercentage: sessionResult.completionPercentage || 0
    };

    console.log('✅ SESSION API SUCCESS:', responseData);
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Session management error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error occurred'
    }, { status: 500 });
  }
}