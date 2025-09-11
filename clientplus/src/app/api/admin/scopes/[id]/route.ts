// src/app/api/admin/scopes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { z } from 'zod';

const updateScopeSchema = z.object({
  scopeName: z.string().min(1, 'Scope name is required').max(100, 'Scope name too long'),
});

// PUT /api/admin/scopes/[id] - Update scope
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid scope ID' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateScopeSchema.parse(body);

    // Check if scope exists
    const existingScope = await prisma.scope.findUnique({
      where: { id },
      include: {
        subdomain: true
      }
    });

    if (!existingScope) {
      return NextResponse.json(
        { error: 'Scope not found' },
        { status: 404 }
      );
    }

    // Check if new name conflicts with existing scope in same subdomain
    if (existingScope.scopeName !== validatedData.scopeName) {
      const conflictingScope = await prisma.scope.findFirst({
        where: {
          subdomainId: existingScope.subdomainId,
          scopeName: validatedData.scopeName,
          id: { not: id }
        }
      });

      if (conflictingScope) {
        return NextResponse.json(
          { error: 'Scope name already exists in this subdomain' },
          { status: 400 }
        );
      }
    }

    const updatedScope = await prisma.scope.update({
      where: { id },
      data: {
        scopeName: validatedData.scopeName,
        updatedAt: new Date()
      },
      include: {
        subdomain: {
          include: {
            domain: true
          }
        },
        creator: {
          select: {
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return NextResponse.json(updatedScope);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating scope:', error);
    return NextResponse.json(
      { error: 'Failed to update scope' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/scopes/[id] - Delete scope
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid scope ID' }, { status: 400 });
    }

    // Check if scope exists
    const existingScope = await prisma.scope.findUnique({
      where: { id }
    });

    if (!existingScope) {
      return NextResponse.json(
        { error: 'Scope not found' },
        { status: 404 }
      );
    }

    // Check if scope is being used in hist_data
    const usageCount = await prisma.histData.count({
      where: {
        scope: existingScope.scopeName
      }
    });

    if (usageCount > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete scope with existing time entries',
          details: `This scope has ${usageCount} time entries. Please reassign or delete them first.`
        },
        { status: 400 }
      );
    }

    await prisma.scope.delete({
      where: { id }
    });

    return NextResponse.json({ 
      message: 'Scope deleted successfully',
      deletedScopeId: id 
    });

  } catch (error) {
    console.error('Error deleting scope:', error);
    return NextResponse.json(
      { error: 'Failed to delete scope' },
      { status: 500 }
    );
  }
}