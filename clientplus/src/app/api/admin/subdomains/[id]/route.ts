// src/app/api/admin/subdomains/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { z } from 'zod';

const updateSubdomainSchema = z.object({
  subdomainName: z.string().min(2).max(100).optional(),
  leadConsultant: z.string().nullable().optional()
});

// PUT /api/admin/subdomains/[id] - Update subdomain
export async function PUT(
  request: NextRequest,
{ params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid subdomain ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateSubdomainSchema.parse(body);

    // Check if subdomain exists
    const existingSubdomain = await prisma.subdomain.findUnique({
      where: { id },
      include: { domain: true }
    });

    if (!existingSubdomain) {
      return NextResponse.json(
        { error: 'Subdomain not found' },
        { status: 404 }
      );
    }

    // Check for name conflicts if updating name
    if (validatedData.subdomainName && validatedData.subdomainName !== existingSubdomain.subdomainName) {
      const conflictingSubdomain = await prisma.subdomain.findFirst({
        where: {
          domainId: existingSubdomain.domainId,
          subdomainName: validatedData.subdomainName,
          id: { not: id }
        }
      });

      if (conflictingSubdomain) {
        return NextResponse.json(
          { error: 'Subdomain name already exists for this domain' },
          { status: 400 }
        );
      }
    }

    // Verify consultant exists if provided
    if (validatedData.leadConsultant) {
      const consultant = await prisma.user.findUnique({
        where: { username: validatedData.leadConsultant }
      });

      if (!consultant) {
        return NextResponse.json(
          { error: 'Lead consultant not found' },
          { status: 404 }
        );
      }
    }

    const updatedSubdomain = await prisma.subdomain.update({
      where: { id },
      data: validatedData,
      include: {
        domain: {
          select: {
            domainName: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Subdomain updated successfully',
      subdomain: updatedSubdomain
    });
  } catch (error) {
    console.error('Error updating subdomain:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update subdomain' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/subdomains/[id] - Delete subdomain
export async function DELETE(
  request: NextRequest,
{ params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid subdomain ID' },
        { status: 400 }
      );
    }

    // Check if subdomain exists
    const existingSubdomain = await prisma.subdomain.findUnique({
      where: { id }
    });

    if (!existingSubdomain) {
      return NextResponse.json(
        { error: 'Subdomain not found' },
        { status: 404 }
      );
    }

    // Check if subdomain has historical data
    const histDataCount = await prisma.histData.count({
      where: {
        subdomain: existingSubdomain.subdomainName
      }
    });

    if (histDataCount > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete subdomain. It has ${histDataCount} historical entries. Consider deactivating instead.`,
          hasData: true,
          entryCount: histDataCount
        },
        { status: 400 }
      );
    }

    // Check if subdomain has scopes
    const scopesCount = await prisma.scope.count({
      where: {
        subdomainId: id
      }
    });

    if (scopesCount > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete subdomain. It has ${scopesCount} associated scopes. Delete scopes first.`,
          hasScopes: true,
          scopesCount
        },
        { status: 400 }
      );
    }

    await prisma.subdomain.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Subdomain deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting subdomain:', error);
    return NextResponse.json(
      { error: 'Failed to delete subdomain' },
      { status: 500 }
    );
  }
}