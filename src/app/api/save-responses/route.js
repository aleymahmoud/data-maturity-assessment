// src/app/api/save-responses/route.js
import { NextResponse } from 'next/server';
import { saveAssessmentResponses } from '../../../lib/database.js';

export async function POST(request) {
  try {
    const { sessionId, responses, code } = await request.json();

    console.log('💾 SAVE-RESPONSES API CALLED:', {
      sessionId,
      code,
      responseCount: Object.keys(responses || {}).length,
      responses: responses ? Object.keys(responses) : 'no responses',
      timestamp: new Date().toISOString()
    });

    if (!sessionId || !responses) {
      console.log('❌ SAVE-RESPONSES - Missing required data');
      return NextResponse.json({
        success: false,
        error: 'Session ID and responses are required'
      }, { status: 400 });
    }

    // Save responses to database with assessment code if provided
    const saveResult = await saveAssessmentResponses(sessionId, responses, code);

    console.log('📊 SAVE-RESPONSES RESULT:', {
      success: saveResult.success,
      savedCount: saveResult.savedCount,
      error: saveResult.error
    });

    if (!saveResult.success) {
      console.log('❌ SAVE-RESPONSES FAILED:', saveResult.error);
      return NextResponse.json({
        success: false,
        error: saveResult.error
      }, { status: 500 });
    }

    console.log('✅ SAVE-RESPONSES SUCCESS:', saveResult.savedCount, 'responses saved');
    return NextResponse.json({
      success: true,
      savedCount: saveResult.savedCount,
      message: `Saved ${saveResult.savedCount} responses`
    });

  } catch (error) {
    console.error('Save responses error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error occurred'
    }, { status: 500 });
  }
}