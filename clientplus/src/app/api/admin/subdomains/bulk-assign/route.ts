// src/app/api/admin/subdomains/bulk-assign/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { z } from 'zod';

const bulkAssignSchema = z.object({
  subdomainIds: z.array(z.number().positive()),
  leadConsultant: z.string().nullable()
});

// POST /api/admin/subdomains/bulk-assign - Bulk assign consultant to multiple subdomains
export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    const body = await request.json();
    const validatedData = bulkAssignSchema.parse(body);

    if (validatedData.subdomainIds.length === 0) {
      return NextResponse.json(
        { error: 'No subdomains selected' },
        { status: 400 }
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

    // Verify all subdomains exist
    const existingSubdomains = await prisma.subdomain.findMany({
      where: {
        id: {
          in: validatedData.subdomainIds
        }
      },
      select: {
        id: true,
        subdomainName: true,
        domain: {
          select: {
            domainName: true
          }
        }
      }
    });

    if (existingSubdomains.length !== validatedData.subdomainIds.length) {
      const foundIds = existingSubdomains.map((s: any) => s.id);
      const missingIds = validatedData.subdomainIds.filter(id => !foundIds.includes(id));
      
      return NextResponse.json(
        { 
          error: `Subdomains not found: ${missingIds.join(', ')}` 
        },
        { status: 404 }
      );
    }

    // Perform bulk update
    const updateResult = await prisma.subdomain.updateMany({
      where: {
        id: {
          in: validatedData.subdomainIds
        }
      },
      data: {
        leadConsultant: validatedData.leadConsultant,
        updatedAt: new Date()
      }
    });

    const assignmentMessage = validatedData.leadConsultant 
      ? `Assigned @${validatedData.leadConsultant} as lead consultant`
      : 'Removed lead consultant assignment';

    return NextResponse.json({
      message: `${assignmentMessage} for ${updateResult.count} subdomain${updateResult.count !== 1 ? 's' : ''}`,
      updatedCount: updateResult.count,
      subdomains: existingSubdomains.map( (s:any) => ({
        id: s.id,
        name: `${s.domain.domainName} → ${s.subdomainName}`
      }))
    });
  } catch (error) {
    console.error('Error in bulk assignment:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to perform bulk assignment' },
      { status: 500 }
    );
  }
}