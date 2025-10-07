import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { openDatabase } from '../../../../lib/database';

export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const database = await openDatabase();

    // Fetch all organization assessment requests
    const [requests] = await database.execute(`
      SELECT
        id,
        session_id,
        user_name,
        user_email,
        organization_name,
        organization_size,
        industry,
        country,
        phone_number,
        job_title,
        message,
        status,
        created_at,
        updated_at
      FROM organization_assessment_requests
      ORDER BY created_at DESC
    `);

    return NextResponse.json({
      success: true,
      requests: requests
    });

  } catch (error) {
    console.error('Error fetching organization requests:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch requests'
    }, { status: 500 });
  }
}

// Update request status
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { requestId, status } = body;

    if (!requestId || !status) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['pending', 'contacted', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid status'
      }, { status: 400 });
    }

    const database = await openDatabase();

    await database.execute(`
      UPDATE organization_assessment_requests
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, requestId]);

    return NextResponse.json({
      success: true,
      message: 'Status updated successfully'
    });

  } catch (error) {
    console.error('Error updating request status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update status'
    }, { status: 500 });
  }
}
