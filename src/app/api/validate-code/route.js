import { NextResponse } from 'next/server';
import { validateAssessmentCode, getUserDataByCode, logAction } from '../../../lib/database.js';

export async function POST(request) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json({
        valid: false,
        error: 'Assessment code is required'
      }, { status: 400 });
    }

    // First validate the code
    const validation = await validateAssessmentCode(code);
    
    if (!validation.valid) {
      await logAction('user', null, 'code_validation_failed', `Code: ${code}, Error: ${validation.error}`, '');
      return NextResponse.json(validation);
    }

    // Check for existing user data with this code
    const userDataResult = await getUserDataByCode(code);
    
    if (!userDataResult.success) {
      return NextResponse.json({
        valid: false,
        error: userDataResult.error
      }, { status: 500 });
    }

    // If user data exists, check session status
    if (userDataResult.hasUserData) {
      const userData = userDataResult.userData;
      
      if (userData.sessionStatus === 'completed' || userData.codeIsUsed) {
        // Assessment is completed - should show results
        await logAction('user', userData.userId, 'code_validation_completed', `Code: ${code}`, '');
        return NextResponse.json({
          valid: true,
          isCompleted: true,
          sessionId: userData.sessionId,
          userData: {
            name: userData.name,
            email: userData.email,
            organization: userData.organization,
            roleTitle: userData.roleTitle
          }
        });
      } else {
        // Assessment in progress - should resume
        await logAction('user', userData.userId, 'code_validation_resume', `Code: ${code}`, '');
        return NextResponse.json({
          valid: true,
          isCompleted: false,
          hasUserData: true,
          resumeData: {
            sessionId: userData.sessionId,
            language: userData.language,
            userData: {
              name: userData.name,
              email: userData.email,
              organization: userData.organization,
              roleTitle: userData.roleTitle,
              selectedRole: userData.selectedRole,  
              userId: userData.userId
            }
          }
        });
      }
    }

    // No user data exists - first time use
    await logAction('user', null, 'code_validation_success', `Code: ${code}`, '');
    return NextResponse.json({
      valid: true,
      isCompleted: false,
      hasUserData: false,
      organizationName: validation.data.organizationName,
      assessmentType: validation.data.assessmentType
    });

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json({
      valid: false,
      error: 'Server error occurred'
    }, { status: 500 });
  }
}