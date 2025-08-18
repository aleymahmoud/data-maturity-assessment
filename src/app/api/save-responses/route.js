// src/app/api/save-responses/route.js
import { NextResponse } from 'next/server';
import { saveAssessmentResponses } from '../../../lib/database.js';

export async function POST(request) {
  try {
    const { sessionId, responses } = await request.json();
    
    if (!sessionId || !responses) {
      return NextResponse.json({
        success: false,
        error: 'Session ID and responses are required'
      }, { status: 400 });
    }

    // Save responses to database
    const saveResult = await saveAssessmentResponses(sessionId, responses);
    
    if (!saveResult.success) {
      return NextResponse.json({
        success: false,
        error: saveResult.error
      }, { status: 500 });
    }

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