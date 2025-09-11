// src/app/api/admin/users/[id]/route.ts - Complete Fix with Imports
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth'; // ADD THIS IMPORT
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  role: z.enum(['SUPER_USER', 'LEAD_CONSULTANT', 'CONSULTANT', 'SUPPORTING']).optional(),
  isActive: z.boolean().optional(),
  domainIds: z.array(z.number()).optional(),
});

const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
});

// GET /api/admin/users/[id] - Get user details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    const { id } = await params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        userDomains: {
          include: {
            domain: {
              select: {
                id: true,
                domainName: true
              }
            }
          }
        },
        histDataEntries: {
          select: {
            id: true,
            workingHours: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Transform data
    const transformedUser = {
      ...user,
      domains: user.userDomains.map((ud: any) => ({
        id: ud.domain.id,
        name: ud.domain.domainName
      })),
      recentEntries: user.histDataEntries,
      totalHours: user.histDataEntries.reduce((sum: number, entry: any) => sum + (entry.workingHours || 0), 0),
      userDomains: undefined, // Remove from response
    };

    return NextResponse.json(transformedUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    const { id } = await params;
    
    const body = await request.json();
    const result = updateUserSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, role, isActive, domainIds } = result.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check email uniqueness if email is being updated
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          id: { not: id }
        }
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    // Use transaction to update user and related data
    const updatedUser = await prisma.$transaction(async (tx: any) => {
      // Update user basic info
      const user = await tx.user.update({
        where: { id },
        data: {
          ...(email && { email }),
          ...(role !== undefined && { role }),
          ...(isActive !== undefined && { isActive }),
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          updatedAt: true,
        }
      });

      // Handle super user status
      if (role !== undefined) {
        if (role === 'SUPER_USER') {
          // Add to super users if not exists
          await tx.superUser.upsert({
            where: { userId: id },
            update: {},
            create: {
              userId: id,
              username: user.username,
            }
          });
        } else {
          // Remove from super users if exists
          await tx.superUser.deleteMany({
            where: { userId: id }
          });
        }
      }

      // Update domain assignments if provided
      if (domainIds !== undefined) {
        // Remove existing domain assignments
        await tx.userDomain.deleteMany({
          where: { userId: id }
        });

        // Add new domain assignments (only if user is active)
        if (isActive !== false && domainIds.length > 0) {
          await tx.userDomain.createMany({
            data: domainIds.map(domainId => ({
              userId: id,
              username: user.username,
              domainId,
            }))
          });
        }
      }

      // If user is being deactivated, remove all their domain assignments
      if (isActive === false) {
        await tx.userDomain.deleteMany({
          where: { userId: id }
        });
      }

      return user;
    });

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user (soft delete by deactivating)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    const { id } = await params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: { username: true, role: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deleting the last super user
    if (user.role === 'SUPER_USER') {
      const superUserCount = await prisma.user.count({
        where: {
          role: 'SUPER_USER',
          isActive: true
        }
      });

      if (superUserCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot deactivate the last super user' },
          { status: 400 }
        );
      }
    }

    // Soft delete by deactivating
    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({
      message: 'User deactivated successfully'
    });

  } catch (error) {
    console.error('Error deactivating user:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate user' },
      { status: 500 }
    );
  }
}

// Add this PATCH function to your existing route.ts file
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    const { id } = await params;
    const body = await request.json();
    const { isActive } = body;

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}