// src/app/api/auth/forgot-password/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPasswordResetToken } from '@/lib/token';
import { sendEmail, generatePasswordResetEmail } from '@/lib/email';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = forgotPasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = result.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, username: true, isActive: true }
    });

    // Always return success to prevent email enumeration
    // But only send email if user exists and is active
    if (user && user.isActive) {
      try {
        // Generate reset token
        const token = await createPasswordResetToken(email);
        
        // Create reset URL
        const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
        
        // Send email
        const emailHtml = generatePasswordResetEmail(resetUrl, user.username);
        const emailResult = await sendEmail({
          to: email,
          subject: 'ClientPlus - Password Reset Request',
          html: emailHtml,
        });

        if (!emailResult.success) {
          console.error('Failed to send password reset email:', emailResult.error);
          return NextResponse.json(
            { error: 'Failed to send reset email. Please try again.' },
            { status: 500 }
          );
        }

        console.log(`Password reset email sent to ${email}`);
      } catch (error) {
        console.error('Password reset process error:', error);
        return NextResponse.json(
          { error: 'Failed to process password reset request' },
          { status: 500 }
        );
      }
    }

    // Always return success message
    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Forgot password API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}