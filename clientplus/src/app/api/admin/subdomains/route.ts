// src/app/api/admin/subdomains/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { z } from 'zod';

const createSubdomainSchema = z.object({
  domainId: z.number().positive('Domain ID is required'),
  subdomainName: z.string()
    .min(2, 'Subdomain name must be at least 2 characters')
    .max(100, 'Subdomain name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-\_]+$/, 'Subdomain name can only contain letters, numbers, spaces, hyphens, and underscores'),
  leadConsultant: z.string().optional()
});

const updateSubdomainSchema = z.object({
  subdomainName: z.string().min(2).max(100).optional(),
  leadConsultant: z.string().nullable().optional()
});

// GET /api/admin/subdomains - Get all subdomains with domain info and statistics
export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  const { searchParams } = new URL(request.url);
  const simple = searchParams.get('simple') === 'true';

  try {
    if (simple) {
      const subdomains = await prisma.subdomain.findMany({
        select: {
          id: true,
          subdomainName: true,
          domain: {
            select: {
              domainName: true,
            },
          },
        },
        orderBy: [
          { domain: { id: 'asc' } },
          { subdomainName: 'asc' }
        ]
      });
      return NextResponse.json({ subdomains });
    }
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
        { domain: { id: 'asc' } },
        { subdomainName: 'asc' }
      ]
    });

// Get usage statistics for each subdomain
const subdomainsWithStats = await Promise.all(
  subdomains.map(async (subdomain : any) => {
    let entryCount = 0;
    let activeConsultants = [];
    let scopesCount = 0;

    try {
      // Get entry count for this subdomain
      entryCount = await prisma.histData.count({
        where: {
          subdomain: subdomain.subdomainName
        }
      });
    } catch (error) {
      console.error('Error counting entries for subdomain:', subdomain.subdomainName, error);
    }

    try {
      // Get active consultants count for this subdomain
      activeConsultants = await prisma.histData.findMany({
        where: {
          subdomain: subdomain.subdomainName
        },
        select: {
          consultant: true
        },
        distinct: ['consultant']
      });
    } catch (error) {
      console.error('Error finding consultants for subdomain:', subdomain.subdomainName, error);
    }

    try {
      // Get scopes count for this subdomain
      scopesCount = await prisma.scope.count({
        where: {
          subdomainId: subdomain.id
        }
      });
    } catch (error) {
      console.error('Error counting scopes for subdomain:', subdomain.subdomainName, error);
    }

    return {
      id: subdomain.id,
      subdomainName: subdomain.subdomainName,
      leadConsultant: subdomain.leadConsultant,
      createdAt: subdomain.createdAt.toISOString(),
      updatedAt: subdomain.updatedAt.toISOString(),
      domain: subdomain.domain,
      stats: {
        entryCount,
        activeConsultants: activeConsultants.length,
        scopesCount
      }
    };
  })
);

    // Get total unique entries across ALL subdomains (not summed per subdomain)
    const totalUniqueEntries = await prisma.histData.count();

    // Get all active consultants for dropdown
    const consultants = await prisma.user.findMany({
      where: {
        isActive: true

      },
      select: {
        username: true,
        firstName: true,
        lastName: true,
        role: true
      },
      orderBy: {
        username: 'asc'
      }
    });

return NextResponse.json({
  subdomains: subdomainsWithStats,
  consultants,
  totalEntries: totalUniqueEntries
});
  } catch (error) {
    console.error('Error fetching subdomains:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subdomains' },
      { status: 500 }
    );
  }
}

// POST /api/admin/subdomains - Create new subdomain
export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    const body = await request.json();
    const validatedData = createSubdomainSchema.parse(body);

    // Check if subdomain already exists for this domain
    const existingSubdomain = await prisma.subdomain.findFirst({
      where: {
        domainId: validatedData.domainId,
        subdomainName: validatedData.subdomainName
      }
    });

    if (existingSubdomain) {
      return NextResponse.json(
        { error: 'Subdomain already exists for this domain' },
        { status: 400 }
      );
    }

    // Verify domain exists
    const domain = await prisma.domain.findUnique({
      where: { id: validatedData.domainId }
    });

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
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

    const newSubdomain = await prisma.subdomain.create({
      data: {
        domainId: validatedData.domainId,
        subdomainName: validatedData.subdomainName,
        leadConsultant: validatedData.leadConsultant || null
      },
      include: {
        domain: {
          select: {
            domainName: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Subdomain created successfully',
      subdomain: newSubdomain
    });
  } catch (error) {
    console.error('Error creating subdomain:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create subdomain' },
      { status: 500 }
    );
  }
}