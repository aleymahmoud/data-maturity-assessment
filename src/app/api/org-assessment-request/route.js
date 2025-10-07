import { NextResponse } from 'next/server';
import { openDatabase } from '../../../lib/database.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      sessionId,
      userName,
      userEmail,
      organizationName,
      organizationSize,
      industry,
      country,
      phoneNumber,
      jobTitle,
      message
    } = body;

    // Validate required fields
    if (!userName || !userEmail || !organizationName) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    const database = await openDatabase();

    // Generate unique request ID
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // Insert request into database
    await database.execute(`
      INSERT INTO organization_assessment_requests (
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
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      requestId,
      sessionId || null,
      userName,
      userEmail,
      organizationName,
      organizationSize || null,
      industry || null,
      country || null,
      phoneNumber || null,
      jobTitle || null,
      message || null
    ]);

    console.log('✅ Organization assessment request created:', requestId);

    return NextResponse.json({
      success: true,
      requestId: requestId,
      message: 'Request submitted successfully'
    });

  } catch (error) {
    console.error('Error creating organization assessment request:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to submit request'
    }, { status: 500 });
  }
}
