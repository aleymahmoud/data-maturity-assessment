// src/app/api/complete-assessment/route.js
import { NextResponse } from 'next/server';
import { markCodeAsUsed, saveAssessmentResponses, generateAssessmentResults } from '../../../lib/database.js';

export async function POST(request) {
  try {
    const { code, sessionId, responses } = await request.json();

    console.log('🏁 COMPLETE-ASSESSMENT API CALLED:', {
      code,
      sessionId,
      responseCount: Object.keys(responses || {}).length,
      timestamp: new Date().toISOString()
    });

    if (!code || !sessionId || !responses) {
      console.log('❌ COMPLETE-ASSESSMENT - Missing required data');
      return NextResponse.json({
        success: false,
        error: 'Code, session ID, and responses are required'
      }, { status: 400 });
    }

    // First save all responses with assessment code
    const saveResult = await saveAssessmentResponses(sessionId, responses, code);

    console.log('📊 SAVE RESULT IN COMPLETE:', saveResult);

    if (!saveResult.success) {
      console.log('❌ COMPLETE-ASSESSMENT - Save failed:', saveResult.error);
      return NextResponse.json({
        success: false,
        error: 'Failed to save responses: ' + saveResult.error
      }, { status: 500 });
    }

    // Mark code as used and session as completed
    console.log('🔒 Marking code as used:', code);
    const completeResult = await markCodeAsUsed(code, sessionId);

    console.log('📋 COMPLETE RESULT:', completeResult);

    if (!completeResult.success) {
      console.log('❌ COMPLETE-ASSESSMENT - Mark as used failed:', completeResult.error);
      return NextResponse.json({
        success: false,
        error: 'Failed to complete assessment: ' + completeResult.error
      }, { status: 500 });
    }

    console.log('✅ COMPLETE-ASSESSMENT SUCCESS');
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