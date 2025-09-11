// src/app/api/admin/lead-consultants/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET() {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    const leadConsultants = await prisma.user.findMany({
      where: {
        role: 'LEAD_CONSULTANT',
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        isActive: true,
      },
      orderBy: {
        username: 'asc',
      },
    });

    const leadConsultantsWithData = await Promise.all(
      leadConsultants.map(async (consultant : any) => {
        const subdomains = await prisma.subdomain.findMany({
          where: {
            leadConsultant: consultant.username,
          },
          select: {
            id: true,
            subdomainName: true,
            domain: {
              select: {
                domainName: true,
              },
            },
          },
        });

        const workload = subdomains.length;

        return {
          ...consultant,
          assignedSubdomains: subdomains,
          workload,
        };
      })
    );

    return NextResponse.json(leadConsultantsWithData);
  } catch (error) {
    console.error('Error fetching lead consultants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead consultants' },
      { status: 500 }
    );
  }
}
