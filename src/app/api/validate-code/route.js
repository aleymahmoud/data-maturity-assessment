import { NextResponse } from 'next/server';
import { openDatabase } from '../../../lib/database.js';

export async function POST(request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({
        valid: false,
        error: 'Assessment code is required'
      }, { status: 400 });
    }

    // Simple code validation - just check if the code exists
    const database = await openDatabase();

    const [rows] = await database.execute(`
      SELECT code, organization_name, assessment_type
      FROM assessment_codes
      WHERE code = ? AND expires_at > NOW()
    `, [code]);

    const codeRecord = rows[0];

    if (!codeRecord) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid or expired assessment code'
      });
    }

    // Check if there's a completed assessment for this code
    const [sessionRows] = await database.execute(`
      SELECT s.*, u.name, u.email, u.organization, u.role_title, u.selected_role_id
      FROM assessment_sessions s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.code = ?
      ORDER BY s.session_start DESC
      LIMIT 1
    `, [code]);

    // If there's a completed session, redirect to results
    if (sessionRows.length > 0 && sessionRows[0].status === 'completed') {
      const session = sessionRows[0];

      console.log('✅ Found completed assessment for code:', code, 'sessionId:', session.id);

      return NextResponse.json({
        valid: true,
        isCompleted: true,
        hasUserData: true,
        organizationName: codeRecord.organization_name,
        assessmentType: codeRecord.assessment_type,
        sessionId: session.id,
        userData: {
          name: session.name,
          email: session.email,
          organization: session.organization,
          roleTitle: session.role_title,
          selectedRole: session.selected_role_id
        }
      });
    }

    // If there's an existing session, check if user has data
    if (sessionRows.length > 0) {
      const session = sessionRows[0];
      return NextResponse.json({
        valid: true,
        isCompleted: false,
        hasUserData: true,
        organizationName: codeRecord.organization_name,
        assessmentType: codeRecord.assessment_type,
        existingUser: {
          name: session.name,
          email: session.email,
          organization: session.organization,
          roleTitle: session.role_title,
          selectedRole: session.selected_role_id
        }
      });
    }

    // Code is valid but no existing data - fresh start
    return NextResponse.json({
      valid: true,
      isCompleted: false,
      hasUserData: false,
      organizationName: codeRecord.organization_name,
      assessmentType: codeRecord.assessment_type
    });

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json({
      valid: false,
      error: 'Database error occurred'
    }, { status: 500 });
  }
}