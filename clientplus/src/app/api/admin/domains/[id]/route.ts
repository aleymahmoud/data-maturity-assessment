// src/app/api/admin/domains/[id]/route.ts - Domain Detail Operations
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { z } from 'zod';

const updateDomainSchema = z.object({
  domainName: z.string()
    .min(2, 'Domain name must be at least 2 characters')
    .max(100, 'Domain name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-\_]+$/, 'Domain name can only contain letters, numbers, spaces, hyphens, and underscores'),
});

// GET /api/admin/domains/[id] - Get domain details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    const { id } = await params;
    const domainId = parseInt(id);

    if (isNaN(domainId)) {
      return NextResponse.json(
        { error: 'Invalid domain ID' },
        { status: 400 }
      );
    }

    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
      select: {
        id: true,
        domainName: true,
        createdAt: true,
        updatedAt: true,
        subdomains: {
          select: {
            id: true,
            subdomainName: true,
            leadConsultant: true,
            createdAt: true
          },
          orderBy: {
            subdomainName: 'asc'
          }
        },
        userDomains: {
          select: {
            user: {
              select: {
                username: true,
                role: true
              }
            }
          }
        },
        scopeTemplates: {
          select: {
            id: true,
            templateName: true,
            description: true
          }
        }
      }
    });

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
    }

    // Get usage statistics
    const entryCount = await prisma.histData.count({
      where: { domain: domain.domainName }
    });

    const recentEntries = await prisma.histData.findMany({
      where: { domain: domain.domainName },
      select: {
        consultant: true,
        client: true,
        workingHours: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Transform data
    const transformedDomain = {
      ...domain,
      stats: {
        subdomainCount: domain.subdomains.length,
        userCount: domain.userDomains.length,
        templateCount: domain.scopeTemplates.length,
        entryCount
      },
      users: domain.userDomains.map((ud: any) => ud.user),
      recentEntries,
      userDomains: undefined // Remove from response
    };

    return NextResponse.json(transformedDomain);
  } catch (error) {
    console.error('Error fetching domain:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domain' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/domains/[id] - Update domain
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    const { id } = await params;
    const domainId = parseInt(id);

    if (isNaN(domainId)) {
      return NextResponse.json(
        { error: 'Invalid domain ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const result = updateDomainSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { domainName } = result.data;

    // Check if domain exists
    const existingDomain = await prisma.domain.findUnique({
      where: { id: domainId }
    });

    if (!existingDomain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
    }

    // Check if new name conflicts with other domains
    const nameConflict = await prisma.domain.findFirst({
      where: {
        domainName: {
          equals: domainName
          
        },
        id: { not: domainId }
      }
    });

    if (nameConflict) {
      return NextResponse.json(
        { error: 'Domain name already exists' },
        { status: 400 }
      );
    }

    // Update domain
    const updatedDomain = await prisma.domain.update({
      where: { id: domainId },
      data: {
        domainName: domainName.trim(),
        updatedAt: new Date()
      },
      select: {
        id: true,
        domainName: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      message: 'Domain updated successfully',
      domain: updatedDomain
    });

  } catch (error) {
    console.error('Error updating domain:', error);
    return NextResponse.json(
      { error: 'Failed to update domain' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/domains/[id] - Delete domain with safety checks
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    const { id } = await params;
    const domainId = parseInt(id);

    if (isNaN(domainId)) {
      return NextResponse.json(
        { error: 'Invalid domain ID' },
        { status: 400 }
      );
    }

    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
      select: {
        domainName: true,
        _count: {
          select: {
            subdomains: true,
            userDomains: true,
            scopeTemplates: true
          }
        }
      }
    });

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
    }

    // Check for existing data that would prevent deletion
    const entryCount = await prisma.histData.count({
      where: { domain: domain.domainName }
    });

    const hasRelatedData = 
      domain._count.subdomains > 0 ||
      domain._count.userDomains > 0 ||
      domain._count.scopeTemplates > 0 ||
      entryCount > 0;

    if (hasRelatedData) {
      return NextResponse.json({
        error: 'Cannot delete domain with existing data',
        details: {
          subdomains: domain._count.subdomains,
          users: domain._count.userDomains,
          templates: domain._count.scopeTemplates,
          entries: entryCount
        }
      }, { status: 400 });
    }

    // Safe to delete
    await prisma.domain.delete({
      where: { id: domainId }
    });

    return NextResponse.json({
      message: 'Domain deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting domain:', error);
    return NextResponse.json(
      { error: 'Failed to delete domain' },
      { status: 500 }
    );
  }
}