// src/lib/token.ts
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createPasswordResetToken(email: string): Promise<string> {
  const token = generateResetToken();
  const expiryMinutes = parseInt(process.env.PASSWORD_RESET_EXPIRY || '15');
  const expires = new Date(Date.now() + expiryMinutes * 60 * 1000);

  // Delete any existing tokens for this email
  await prisma.passwordResetToken.deleteMany({
    where: { email }
  });

  // Create new token
  await prisma.passwordResetToken.create({
    data: {
      email,
      token,
      expires,
    }
  });

  return token;
}

export async function validateResetToken(token: string) {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token }
  });

  if (!resetToken) {
    return { valid: false, error: 'Invalid token' };
  }

  if (resetToken.used) {
    return { valid: false, error: 'Token already used' };
  }

  if (resetToken.expires < new Date()) {
    return { valid: false, error: 'Token expired' };
  }

  return { valid: true, email: resetToken.email };
}

export async function markTokenAsUsed(token: string) {
  await prisma.passwordResetToken.update({
    where: { token },
    data: { used: true }
  });
}

export async function cleanupExpiredTokens() {
  await prisma.passwordResetToken.deleteMany({
    where: {
      expires: {
        lt: new Date()
      }
    }
  });
}