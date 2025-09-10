import { NextResponse } from 'next/server';
import { deleteAssessmentCode } from '../../../../../lib/database.js';

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const { adminId } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Code ID is required' },
        { status: 400 }
      );
    }

    if (!adminId) {
      return NextResponse.json(
        { success: false, error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    const result = await deleteAssessmentCode(id, adminId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('Delete code error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}