import { NextResponse } from 'next/server';
import { validateAssessmentCode, logAction } from '../../../lib/database.js';

export async function POST(request) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json({
        success: false,
        error: 'Assessment code is required'
      }, { status: 400 });
    }

    // Validate the code
    const validation = await validateAssessmentCode(code.toUpperCase());
    
    // Log the validation attempt
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    await logAction(
      'user', 
      null, 
      'code_validation_attempt', 
      `Code: ${code}, Valid: ${validation.valid}`,
      clientIP
    );

    if (validation.valid) {
      return NextResponse.json({
        success: true,
        data: validation.data
      });
    } else {
      return NextResponse.json({
        success: false,
        error: validation.error
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Code validation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error occurred'
    }, { status: 500 });
  }
}