// src/app/api/admin/scope-templates/route.ts - Enhanced for Universal Scopes
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { z } from 'zod';

// Validation schemas
const createScopeTemplateSchema = z.object({
  templateName: z.string().min(1, 'Scope name is required').max(100, 'Scope name too long'),
  description: z.string().optional(),
  domainIds: z.array(z.number()).min(1, 'At least one domain is required'),
});

// GET /api/admin/scope-templates - Get all universal scopes
export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('domainId');
    const search = searchParams.get('search');

    const where: any = {};
    if (domainId) {
      where.domainId = parseInt(domainId);
    }

    if (search) {
      where.templateName = {
        contains: search,
        mode: 'insensitive'
      };
    }

    const templates = await prisma.scopeTemplate.findMany({
      where,
      include: {
        domain: {
          select: {
            id: true,
            domainName: true
          }
        }
      },
      orderBy: [
        { domain: { domainName: 'asc' } },
        { templateName: 'asc' }
      ]
    });

    // Get assignment counts for each template
    const templatesWithStats = await Promise.all(
      templates.map(async (template) => {
        // Count how many subdomains use this scope (from scopes table)
        const assignmentCount = await prisma.scope.count({
          where: {
            scopeName: template.templateName,
            subdomain: {
              domainId: template.domainId
            }
          }
        });

        return {
          id: template.id,
          templateName: template.templateName,
          description: template.description,
          domain: template.domain,
          createdAt: template.createdAt.toISOString(),
          updatedAt: template.updatedAt.toISOString(),
          assignmentCount
        };
      })
    );

    // Group templates by domain for easier UI handling
    const templatesByDomain = templatesWithStats.reduce((acc, template) => {
      const domainName = template.domain.domainName;
      if (!acc[domainName]) {
        acc[domainName] = {
          domain: template.domain,
          templates: []
        };
      }
      acc[domainName].templates.push(template);
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      templates: templatesWithStats,
      templatesByDomain
    });

  } catch (error) {
    console.error('Error fetching scope templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scope templates' },
      { status: 500 }
    );
  }
}

// POST /api/admin/scope-templates - Create universal scope(s)
export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    const body = await request.json();
    const validatedData = createScopeTemplateSchema.parse(body);

    // Check if domains exist
    const existingDomains = await prisma.domain.findMany({
      where: {
        id: {
          in: validatedData.domainIds
        }
      }
    });

    if (existingDomains.length !== validatedData.domainIds.length) {
      return NextResponse.json(
        { error: 'Some domains not found' },
        { status: 400 }
      );
    }

    const createdTemplates = [];
    const skippedDomains = [];

    // Create template for each domain
    for (const domainId of validatedData.domainIds) {
      // Check if template already exists for this domain
      const existingTemplate = await prisma.scopeTemplate.findFirst({
        where: {
          domainId: domainId,
          templateName: validatedData.templateName
        }
      });

      if (existingTemplate) {
        const domain = existingDomains.find(d => d.id === domainId);
        skippedDomains.push(domain?.domainName || `Domain ${domainId}`);
        continue;
      }

      const newTemplate = await prisma.scopeTemplate.create({
        data: {
          domainId: domainId,
          templateName: validatedData.templateName,
          description: validatedData.description || null
        },
        include: {
          domain: true
        }
      });

      createdTemplates.push(newTemplate);
    }

    let message = `Created universal scope "${validatedData.templateName}" for ${createdTemplates.length} domain(s)`;
    if (skippedDomains.length > 0) {
      message += `. Skipped ${skippedDomains.length} domain(s) where scope already exists: ${skippedDomains.join(', ')}`;
    }

    return NextResponse.json({
      message,
      createdTemplates,
      skippedDomains
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating scope template:', error);
    return NextResponse.json(
      { error: 'Failed to create universal scope' },
      { status: 500 }
    );
  }
}