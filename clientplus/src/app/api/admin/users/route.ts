// src/app/api/admin/users/route.ts - Enhanced CREATE USER API
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// Enhanced schema to handle password options
const createUserSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['SUPER_USER', 'LEAD_CONSULTANT', 'CONSULTANT', 'SUPPORTING']),
  isActive: z.boolean().default(true),
  domainIds: z.array(z.number()).optional(),
  passwordMethod: z.enum(['generate', 'set']),
  password: z.string().optional(),
  sendEmail: z.boolean().default(false),
}).refine((data) => {
  if (data.passwordMethod === 'set' && (!data.password || data.password.length < 8)) {
    return false;
  }
  return true;
}, {
  message: 'Password must be at least 8 characters when setting manually',
  path: ['password'],
});

// Function to generate secure password
function generateSecurePassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  
  // Ensure at least one of each type
  password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // lowercase
  password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // uppercase
  password += "0123456789"[Math.floor(Math.random() * 10)]; // number
  password += "!@#$%^&*"[Math.floor(Math.random() * 8)]; // special
  
  // Fill remaining length
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Mock email sending function (replace with real implementation)
async function sendPasswordEmail(email: string, password: string, username: string): Promise<boolean> {
  // TODO: Implement real email sending
  console.log(`Would send email to ${email}:`);
  console.log(`Subject: Welcome to ClientPlus - Login Credentials`);
  console.log(`Username: ${username}`);
  console.log(`Password: ${password}`);
  
  // Simulate email sending
  return new Promise(resolve => {
    setTimeout(() => resolve(true), 1000);
  });
}

// GET /api/admin/users - Get all users (existing code)
export async function GET() {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const usersWithCounts = await Promise.all(
      users.map(async (user: any) => {
        const entryCount = await prisma.histData.count({
          where: { consultant: user.username }
        });

        const userDomains = await prisma.userDomain.findMany({
          where: { userId: user.id },
          include: {
            domain: { select: { domainName: true } }
          }
        });

        return {
          ...user,
          entryCount,
          domains: userDomains.map((ud:any) => ud.domain.domainName),
        };
      })
    );

    return NextResponse.json(usersWithCounts);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create new user with enhanced password handling
export async function POST(request: Request) {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    const body = await request.json();
    const result = createUserSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { 
      username, 
      email, 
      role, 
      isActive, 
      domainIds, 
      passwordMethod, 
      password: providedPassword, 
      sendEmail 
    } = result.data;

    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: existingUser.username === username 
          ? 'Username already exists'
          : 'Email already exists' 
        },
        { status: 400 }
      );
    }

    // Determine password to use
    const passwordToUse = passwordMethod === 'generate' 
      ? generateSecurePassword() 
      : providedPassword!;

    // Hash password
    const hashedPassword = await bcrypt.hash(passwordToUse, 12);

    // Create user with transaction
    const result_data = await prisma.$transaction(async (tx: any) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          role,
          isActive,
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        }
      });

      // Handle super user status
      if (role === 'SUPER_USER') {
        await tx.superUser.create({
          data: {
            userId: newUser.id,
            username: newUser.username,
          }
        });
      }

      // Add domain assignments if provided
      if (domainIds && domainIds.length > 0) {
        await tx.userDomain.createMany({
          data: domainIds.map(domainId => ({
            userId: newUser.id,
            username: newUser.username,
            domainId,
          }))
        });
      }

      return newUser;
    });

    // Prepare response data
    const responseData: any = {
      message: 'User created successfully',
      user: result_data
    };

    // Handle email sending and password sharing
    if (passwordMethod === 'generate') {
      responseData.generatedPassword = passwordToUse;
      
      if (sendEmail) {
        try {
          const emailSent = await sendPasswordEmail(email, passwordToUse, username);
          responseData.emailSent = emailSent;
          if (emailSent) {
            // Don't include password in response if email was sent
            delete responseData.generatedPassword;
          }
        } catch (emailError) {
          console.error('Email sending failed:', emailError);
          responseData.emailSent = false;
          responseData.emailError = 'Failed to send email';
        }
      }
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}