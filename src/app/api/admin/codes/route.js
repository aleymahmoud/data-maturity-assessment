import { NextResponse } from 'next/server';
import { getAssessmentCodes } from '../../../../lib/database.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      type: searchParams.get('type') || '',
      status: searchParams.get('status') || '',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')) : null
    };

    const result = await getAssessmentCodes(filters);

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
    console.error('Get codes error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}