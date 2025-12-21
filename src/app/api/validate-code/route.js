import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma.js';

export async function POST(request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({
        valid: false,
        error: 'Assessment code is required'
      }, { status: 400 });
    }

    // Simple code validation - just check if the code exists and is not expired
    const codeRecord = await prisma.assessmentCode.findUnique({
      where: { code }
    });

    if (!codeRecord) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid assessment code'
      });
    }

    // Check if expired
    if (codeRecord.expiresAt && new Date(codeRecord.expiresAt) < new Date()) {
      return NextResponse.json({
        valid: false,
        error: 'Assessment code has expired'
      });
    }

    // Check if there's an existing session for this code
    const existingSession = await prisma.assessmentSession.findFirst({
      where: { code },
      include: {
        user: true
      },
      orderBy: { sessionStart: 'desc' }
    });

    // If there's a completed session, redirect to results
    if (existingSession && existingSession.status === 'completed') {
      console.log('✅ Found completed assessment for code:', code, 'sessionId:', existingSession.id);

      return NextResponse.json({
        valid: true,
        isCompleted: true,
        hasUserData: true,
        organizationName: codeRecord.organizationName,
        assessmentType: codeRecord.assessmentType,
        sessionId: existingSession.id,
        userData: {
          name: existingSession.user.name,
          email: existingSession.user.email,
          organization: existingSession.user.organization,
          roleTitle: existingSession.user.roleTitle,
          selectedRole: existingSession.user.selectedRoleId
        }
      });
    }

    // If there's an existing session (in progress), check if user has data
    if (existingSession) {
      return NextResponse.json({
        valid: true,
        isCompleted: false,
        hasUserData: true,
        organizationName: codeRecord.organizationName,
        assessmentType: codeRecord.assessmentType,
        existingUser: {
          name: existingSession.user.name,
          email: existingSession.user.email,
          organization: existingSession.user.organization,
          roleTitle: existingSession.user.roleTitle,
          selectedRole: existingSession.user.selectedRoleId
        }
      });
    }

    // Code is valid but no existing data - fresh start
    return NextResponse.json({
      valid: true,
      isCompleted: false,
      hasUserData: false,
      organizationName: codeRecord.organizationName,
      assessmentType: codeRecord.assessmentType
    });

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json({
      valid: false,
      error: 'Database error occurred'
    }, { status: 500 });
  }
}
