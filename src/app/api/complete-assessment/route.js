// src/app/api/complete-assessment/route.js
import { NextResponse } from 'next/server';
import { markCodeAsUsed, saveAssessmentResponses } from '../../../lib/database.js';

export async function POST(request) {
  try {
    const { code, sessionId, responses } = await request.json();
    
    if (!code || !sessionId || !responses) {
      return NextResponse.json({
        success: false,
        error: 'Code, session ID, and responses are required'
      }, { status: 400 });
    }

    // First save all responses
    const saveResult = await saveAssessmentResponses(sessionId, responses);
    
    if (!saveResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to save responses: ' + saveResult.error
      }, { status: 500 });
    }

    // Then mark code as used and session as completed
    const completeResult = await markCodeAsUsed(code, sessionId);
    
    if (!completeResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to complete assessment: ' + completeResult.error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Assessment completed successfully',
      savedResponses: saveResult.savedCount
    });

  } catch (error) {
    console.error('Complete assessment error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error occurred'
    }, { status: 500 });
  }
}