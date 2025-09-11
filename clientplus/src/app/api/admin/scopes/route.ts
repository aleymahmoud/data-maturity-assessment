// src/app/api/admin/scopes/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { z } from 'zod';

// Validation schemas
const createScopeSchema = z.object({
  subdomainId: z.number().min(1, 'Subdomain is required'),
  scopeName: z.string().min(1, 'Scope name is required').max(100, 'Scope name too long'),
  templateId: z.number().optional(),
});

const bulkCreateScopeSchema = z.object({
  subdomainId: z.number().min(1, 'Subdomain is required'),
  templateIds: z.array(z.number()).min(1, 'At least one template is required'),
});

// GET /api/admin/scopes - Get all scopes with filters
export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('domainId');
    const subdomainId = searchParams.get('subdomainId');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};
    
    if (subdomainId) {
      where.subdomainId = parseInt(subdomainId);
    } else if (domainId) {
      where.subdomain = {
        domainId: parseInt(domainId)
      };
    }

    if (search) {
      where.scopeName = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // FIXED: Made creator optional to handle null createdBy values
    const scopes = await prisma.scope.findMany({
      where,
      include: {
        subdomain: {
          include: {
            domain: {
              select: {
                id: true,
                domainName: true
              }
            }
          }
        }
        // REMOVED creator include to avoid the null error
      },
      orderBy: [
        { subdomain: { domain: { domainName: 'asc' } } },
        { subdomain: { subdomainName: 'asc' } },
        { scopeName: 'asc' }
      ]
    });

    // Get usage statistics for each scope and handle creator separately
    const scopesWithStats = await Promise.all(
      scopes.map(async (scope: any) => {
        let usageCount = 0;
        let lastUsed = null;
        let activeConsultants = 0;
        let creator = null;

        try {
          // Get usage count for this scope
          usageCount = await prisma.histData.count({
            where: {
              scope: scope.scopeName
            }
          });

          // Get last used date
          const lastEntry = await prisma.histData.findFirst({
            where: {
              scope: scope.scopeName
            },
            orderBy: {
              id: 'desc'
            },
            select: {
              year: true,
              monthNo: true,
              day: true
            }
          });

          if (lastEntry) {
            lastUsed = new Date(lastEntry.year, lastEntry.monthNo - 1, lastEntry.day);
          }

          // Get active consultants count
          const consultants = await prisma.histData.findMany({
            where: {
              scope: scope.scopeName
            },
            select: {
              consultant: true
            },
            distinct: ['consultant']
          });

          activeConsultants = consultants.length;

          // FIXED: Safely get creator info, handle null case
          if (scope.createdBy) {
            try {
              creator = await prisma.user.findUnique({
                where: { username: scope.createdBy },
                select: {
                  username: true,
                  firstName: true,
                  lastName: true
                }
              });
            } catch (error) {
              console.log(`Creator not found for scope ${scope.id}: ${scope.createdBy}`);
            }
          }

          // Default creator if not found
          if (!creator) {
            creator = {
              username: scope.createdBy || 'unknown',
              firstName: null,
              lastName: null
            };
          }

        } catch (error) {
          console.error('Error getting scope stats:', error);
        }

        return {
          id: scope.id,
          scopeName: scope.scopeName,
          createdBy: scope.createdBy || 'unknown',
          createdAt: scope.createdAt.toISOString(),
          updatedAt: scope.updatedAt.toISOString(),
          subdomain: {
            id: scope.subdomain.id,
            subdomainName: scope.subdomain.subdomainName,
            leadConsultant: scope.subdomain.leadConsultant || '',
            domain: scope.subdomain.domain
          },
          creator: creator,
          stats: {
            usageCount,
            lastUsed: lastUsed?.toISOString() || null,
            activeConsultants
          }
        };
      })
    );

    // Get summary statistics
    const totalScopes = scopesWithStats.length;
    const totalUsage = scopesWithStats.reduce((sum, scope) => sum + scope.stats.usageCount, 0);
    const activeScopes = scopesWithStats.filter(scope => scope.stats.usageCount > 0).length;

    // Get domains and subdomains for filters
    const domains = await prisma.domain.findMany({
      select: {
        id: true,
        domainName: true
      },
      orderBy: {
        domainName: 'asc'
      }
    });

    const subdomains = await prisma.subdomain.findMany({
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
        { subdomainName: 'asc' }
      ]
    });

    return NextResponse.json({
      scopes: scopesWithStats,
      domains,
      subdomains,
      summary: {
        totalScopes,
        totalUsage,
        activeScopes,
        inactiveScopes: totalScopes - activeScopes
      }
    });

  } catch (error) {
    console.error('Error fetching scopes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scopes', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/scopes - Create new scope or bulk create from templates
export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    const body = await request.json();
    
    // Get current user session
    const { getServerSession } = await import('next-auth/next');
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);
    const user = session?.user;
    
    // Check if this is bulk creation from templates
    if (body.templateIds && Array.isArray(body.templateIds)) {
      const validatedData = bulkCreateScopeSchema.parse(body);
      
      // Get templates
      const templates = await prisma.scopeTemplate.findMany({
        where: {
          id: {
            in: validatedData.templateIds
          }
        }
      });

      if (templates.length !== validatedData.templateIds.length) {
        return NextResponse.json(
          { error: 'Some templates not found' },
          { status: 400 }
        );
      }

      // Check if subdomain exists
      const subdomain = await prisma.subdomain.findUnique({
        where: { id: validatedData.subdomainId }
      });

      if (!subdomain) {
        return NextResponse.json(
          { error: 'Subdomain not found' },
          { status: 400 }
        );
      }

      // Create scopes from templates
      const createdScopes = [];
      for (const template of templates) {
        // Check if scope already exists
        const existingScope = await prisma.scope.findFirst({
          where: {
            subdomainId: validatedData.subdomainId,
            scopeName: template.templateName
          }
        });

        if (!existingScope) {
          const newScope = await prisma.scope.create({
            data: {
              subdomainId: validatedData.subdomainId,
              scopeName: template.templateName,
              createdBy: user?.username || 'system'
            },
            include: {
              subdomain: {
                include: {
                  domain: true
                }
              }
            }
          });
          createdScopes.push(newScope);
        }
      }

      return NextResponse.json({
        message: `Created ${createdScopes.length} scopes from ${templates.length} templates`,
        createdScopes: createdScopes.length,
        skipped: templates.length - createdScopes.length
      });

    } else {
      // Single scope creation
      const validatedData = createScopeSchema.parse(body);

      // Check if subdomain exists
      const subdomain = await prisma.subdomain.findUnique({
        where: { id: validatedData.subdomainId }
      });

      if (!subdomain) {
        return NextResponse.json(
          { error: 'Subdomain not found' },
          { status: 400 }
        );
      }

      // Check if scope already exists
      const existingScope = await prisma.scope.findFirst({
        where: {
          subdomainId: validatedData.subdomainId,
          scopeName: validatedData.scopeName
        }
      });

      if (existingScope) {
        return NextResponse.json(
          { error: 'Scope already exists for this subdomain' },
          { status: 400 }
        );
      }

      const newScope = await prisma.scope.create({
        data: {
          subdomainId: validatedData.subdomainId,
          scopeName: validatedData.scopeName,
          createdBy: user?.username || 'system'
        },
        include: {
          subdomain: {
            include: {
              domain: true
            }
          }
        }
      });

      // Get creator info safely
      let creator = null;
      if (newScope.createdBy) {
        try {
          creator = await prisma.user.findUnique({
            where: { username: newScope.createdBy },
            select: {
              username: true,
              firstName: true,
              lastName: true
            }
          });
        } catch (error) {
          console.log('Creator not found');
        }
      }

      return NextResponse.json({
        ...newScope,
        creator: creator || {
          username: newScope.createdBy || 'system',
          firstName: null,
          lastName: null
        }
      }, { status: 201 });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating scope:', error);
    return NextResponse.json(
      { error: 'Failed to create scope', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}