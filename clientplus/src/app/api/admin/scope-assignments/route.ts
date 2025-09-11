// src/app/api/admin/scope-assignments/route.ts - Assign Scopes to Subdomains
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { z } from 'zod';

// Validation schema
const assignScopesSchema = z.object({
  subdomainId: z.number().min(1, 'Subdomain is required'),
  templateIds: z.array(z.number()).min(1, 'At least one scope template is required'),
});

// GET /api/admin/scope-assignments - Get available scopes for assignment
export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    const { searchParams } = new URL(request.url);
    const subdomainId = searchParams.get('subdomainId');

    if (!subdomainId) {
      return NextResponse.json(
        { error: 'Subdomain ID is required' },
        { status: 400 }
      );
    }

    // Get subdomain with domain info
    const subdomain = await prisma.subdomain.findUnique({
      where: { id: parseInt(subdomainId) },
      include: {
        domain: true
      }
    });

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain not found' },
        { status: 404 }
      );
    }

    // Get all scope templates for this domain
    const availableTemplates = await prisma.scopeTemplate.findMany({
      where: {
        domainId: subdomain.domainId
      },
      include: {
        domain: {
          select: {
            id: true,
            domainName: true
          }
        }
      },
      orderBy: {
        templateName: 'asc'
      }
    });

    // Get already assigned scopes for this subdomain
    const assignedScopes = await prisma.scope.findMany({
      where: {
        subdomainId: parseInt(subdomainId)
      },
      select: {
        scopeName: true
      }
    });

    const assignedScopeNames = assignedScopes.map(s => s.scopeName);

    // Mark templates as assigned or available
    const templatesWithStatus = availableTemplates.map((template: any) => ({
      id: template.id,
      templateName: template.templateName,
      description: template.description,
      domain: template.domain,
      isAssigned: assignedScopeNames.includes(template.templateName)
    }));

    return NextResponse.json({
      subdomain: {
        id: subdomain.id,
        subdomainName: subdomain.subdomainName,
        domain: subdomain.domain
      },
      availableTemplates: templatesWithStatus
    });

  } catch (error) {
    console.error('Error fetching scope assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scope assignments' },
      { status: 500 }
    );
  }
}

// POST /api/admin/scope-assignments - Assign scopes to subdomain
export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    const body = await request.json();
    const validatedData = assignScopesSchema.parse(body);

    // Get current user session
    const { getServerSession } = await import('next-auth/next');
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);
    const user = session?.user;

    // Check if subdomain exists
    const subdomain = await prisma.subdomain.findUnique({
      where: { id: validatedData.subdomainId },
      include: {
        domain: true
      }
    });

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain not found' },
        { status: 400 }
      );
    }

    // Get the scope templates
    const templates = await prisma.scopeTemplate.findMany({
      where: {
        id: {
          in: validatedData.templateIds
        },
        domainId: subdomain.domainId // Ensure templates belong to same domain
      }
    });

    if (templates.length !== validatedData.templateIds.length) {
      return NextResponse.json(
        { error: 'Some scope templates not found or not available for this domain' },
        { status: 400 }
      );
    }

    const assignedScopes = [];
    const skippedScopes = [];

    // Create scope assignments
    for (const template of templates) {
      // Check if scope already assigned to this subdomain
      const existingAssignment = await prisma.scope.findFirst({
        where: {
          subdomainId: validatedData.subdomainId,
          scopeName: template.templateName
        }
      });

      if (existingAssignment) {
        skippedScopes.push(template.templateName);
        continue;
      }

      const newAssignment = await prisma.scope.create({
        data: {
          subdomainId: validatedData.subdomainId,
          scopeName: template.templateName,
          createdBy: user?.username || 'system'
        }
      });

      assignedScopes.push({
        id: newAssignment.id,
        scopeName: newAssignment.scopeName
      });
    }

    let message = `Assigned ${assignedScopes.length} scope(s) to ${subdomain.subdomainName}`;
    if (skippedScopes.length > 0) {
      message += `. Skipped ${skippedScopes.length} scope(s) already assigned: ${skippedScopes.join(', ')}`;
    }

    return NextResponse.json({
      message,
      assignedScopes,
      skippedScopes,
      subdomain: {
        id: subdomain.id,
        subdomainName: subdomain.subdomainName,
        domain: subdomain.domain
      }
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error assigning scopes:', error);
    return NextResponse.json(
      { error: 'Failed to assign scopes' },
      { status: 500 }
    );
  }
}