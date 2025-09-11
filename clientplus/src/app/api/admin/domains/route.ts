// src/app/api/admin/domains/route.ts - Fixed Version
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { z } from 'zod';

const createDomainSchema = z.object({
  domainName: z.string()
    .min(2, 'Domain name must be at least 2 characters')
    .max(100, 'Domain name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-\_]+$/, 'Domain name can only contain letters, numbers, spaces, hyphens, and underscores'),
});

// GET /api/admin/domains - Get all domains with statistics
export async function GET() {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    const domains = await prisma.domain.findMany({
      select: {
        id: true,
        domainName: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            userDomains: true,
            subdomains: true,
            scopeTemplates: true
          }
        }
      },
      orderBy: {
        domainName: 'asc'
      }
    });

// Get OVERALL active users from userDomain table (only users who are active)
const allActiveUsers = await prisma.userDomain.findMany({
  select: {
    userId: true,
    user: {
      select: {
        isActive: true
      }
    }
  },
  where: {
    user: {
      isActive: true  // Only count active users
    }
  },
  distinct: ['userId']
});

    // Get usage statistics for each domain
    const domainsWithStats = await Promise.all(
      domains.map(async (domain:any) => {
        // Get entry count for this domain
        const entryCount = await prisma.histData.count({
          where: {
            domain: domain.domainName
          }
        });
// Get active users count for this specific domain
const domainActiveUsers = await prisma.userDomain.count({
  where: {
    domainId: domain.id,
    user: {
      isActive: true
    }
  }
});

return {
  ...domain,
  stats: {
    userCount: domainActiveUsers, // Now shows only active users per domain
    subdomainCount: domain._count.subdomains,
    templateCount: domain._count.scopeTemplates,
    entryCount,
    activeConsultants: 0
  },
  _count: undefined
};
      })
    );

    // Return domains array with global stats as additional properties
const response = {
  domains: domainsWithStats,
  globalActiveUsers: allActiveUsers.length
};

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching domains:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domains' },
      { status: 500 }
    );
  }
}

// POST /api/admin/domains - Create new domain
export async function POST(request: Request) {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    const body = await request.json();
    const result = createDomainSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { domainName } = result.data;

    // Check if domain name already exists
    const existingDomain = await prisma.domain.findFirst({
      where: {
        domainName: {
          equals: domainName
          
        }
      }
    });

    if (existingDomain) {
      return NextResponse.json(
        { error: 'Domain name already exists' },
        { status: 400 }
      );
    }

    // Create new domain
    const newDomain = await prisma.domain.create({
      data: {
        domainName: domainName.trim()
      },
      select: {
        id: true,
        domainName: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      message: 'Domain created successfully',
      domain: newDomain
    });

  } catch (error) {
    console.error('Error creating domain:', error);
    return NextResponse.json(
      { error: 'Failed to create domain' },
      { status: 500 }
    );
  }
}