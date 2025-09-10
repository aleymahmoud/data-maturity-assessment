import { NextResponse } from 'next/server';
import { createAssessmentCodes } from '../../../../lib/database.js';

export async function POST(request) {
  try {
    const { codes } = await request.json();

    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid codes data' },
        { status: 400 }
      );
    }

    // Validate required fields
    for (const code of codes) {
      if (!code.organizationName || !code.createdBy) {
        return NextResponse.json(
          { success: false, error: 'Organization name and creator are required' },
          { status: 400 }
        );
      }
    }

    const result = await createAssessmentCodes(codes);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      codes: result.codes
    });

  } catch (error) {
    console.error('Create codes error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}