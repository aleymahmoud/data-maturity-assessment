// src/app/api/admin/users/[id]/reset-password/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { sendEmail, generatePasswordResetEmail } from '@/lib/email';

const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  sendEmail: z.boolean().default(false),
});

const generatePasswordSchema = z.object({
  sendEmail: z.boolean().default(true),
});

// POST /api/admin/users/[id]/reset-password - Admin reset user password
export async function POST(
  request: Request,
{ params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    const { id } = await params; // Add this line
    const body = await request.json();
    const { action } = body;

    if (action === 'generate') {
      return await generateAndSendPassword(id, body);
    } else {
      return await setSpecificPassword(id, body);
    }
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}

// Generate random password and optionally send via email
async function generateAndSendPassword(userId: string, body: any) {
  const result = generatePasswordSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { sendEmail: shouldSendEmail } = result.data;

  // Get user details
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      isActive: true
    }
  });

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  if (!user.isActive) {
    return NextResponse.json(
      { error: 'Cannot reset password for inactive user' },
      { status: 400 }
    );
  }

  // Generate random password
  const newPassword = generateSecurePassword();
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Update password in database
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });

  // Send email if requested
  let emailSent = false;
  if (shouldSendEmail && user.email) {
    try {
      const emailHtml = generatePasswordResetNotification(user.username, newPassword);
      const emailResult = await sendEmail({
        to: user.email,
        subject: 'ClientPlus - Your Password Has Been Reset',
        html: emailHtml,
      });
      emailSent = emailResult.success;
    } catch (error) {
      console.error('Email sending failed:', error);
    }
  }

  return NextResponse.json({
    message: 'Password reset successfully',
    newPassword: emailSent ? undefined : newPassword, // Only return password if email wasn't sent
    emailSent,
    username: user.username
  });
}

// Set specific password
async function setSpecificPassword(userId: string, body: any) {
  const result = resetPasswordSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { newPassword, sendEmail: shouldSendEmail } = result.data;

  // Get user details
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      isActive: true
    }
  });

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  if (!user.isActive) {
    return NextResponse.json(
      { error: 'Cannot reset password for inactive user' },
      { status: 400 }
    );
  }

  // Hash and update password
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });

  // Send email if requested
  let emailSent = false;
  if (shouldSendEmail && user.email) {
    try {
      const emailHtml = generatePasswordResetNotification(user.username, newPassword);
      const emailResult = await sendEmail({
        to: user.email,
        subject: 'ClientPlus - Your Password Has Been Reset',
        html: emailHtml,
      });
      emailSent = emailResult.success;
    } catch (error) {
      console.error('Email sending failed:', error);
    }
  }

  return NextResponse.json({
    message: 'Password updated successfully',
    emailSent,
    username: user.username
  });
}

// Generate secure random password
function generateSecurePassword(): string {
  const length = 12;
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  let password = '';
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  const allChars = lowercase + uppercase + numbers + symbols;
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Generate email template for admin password reset
function generatePasswordResetNotification(username: string, newPassword: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset - ClientPlus</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 4px solid #dc3545;">
        <h1 style="color: #dc3545; margin-bottom: 20px;">ClientPlus Password Reset</h1>
        
        <p>Hello <strong>${username}</strong>,</p>
        
        <p>Your password has been reset by an administrator. Your new temporary password is:</p>
        
        <div style="background-color: #ffffff; border: 2px solid #dc3545; padding: 15px; margin: 20px 0; text-align: center; border-radius: 5px;">
          <code style="font-size: 18px; font-weight: bold; color: #dc3545; letter-spacing: 1px;">
            ${newPassword}
          </code>
        </div>
        
        <p><strong>Important Security Instructions:</strong></p>
        <ul style="color: #666;">
          <li>Log in immediately and change this temporary password</li>
          <li>Do not share this password with anyone</li>
          <li>Choose a strong, unique password for your account</li>
          <li>If you didn't expect this reset, contact your administrator immediately</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/login" 
             style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Login Now
          </a>
        </div>
        
        <hr style="margin: 30px 0; border: none; height: 1px; background-color: #e5e7eb;">
        
        <p style="color: #666; font-size: 14px;">
          This is an automated message. Please do not reply to this email.
          <br><br>
          Best regards,<br>
          ClientPlus Admin Team
        </p>
      </div>
    </body>
    </html>
  `;
}