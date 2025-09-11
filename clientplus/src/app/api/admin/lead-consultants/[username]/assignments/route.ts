import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  const { username } = await params; // Add await here
  const { subdomainIds } = await request.json();

  if (!Array.isArray(subdomainIds)) {
    return NextResponse.json(
      { error: 'subdomainIds must be an array' },
      { status: 400 }
    );
  }

  try {
    await prisma.$transaction(async (tx:any) => {
      // Clear existing assignments for this consultant
      await tx.subdomain.updateMany({
        where: {
          leadConsultant: username,
        },
        data: {
          leadConsultant: null,
        },
      });

      // Set new assignments
      if (subdomainIds.length > 0) {
        await tx.subdomain.updateMany({
          where: {
            id: {
              in: subdomainIds,
            },
          },
          data: {
            leadConsultant: username,
          },
        });
      }
    });

    return NextResponse.json({ message: 'Assignments updated successfully' });
  } catch (error) {
    console.error('Error updating assignments:', error);
    return NextResponse.json(
      { error: 'Failed to update assignments' },
      { status: 500 }
    );
  }
}