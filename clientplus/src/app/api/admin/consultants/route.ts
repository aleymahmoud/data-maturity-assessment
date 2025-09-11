// src/app/api/admin/consultants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/consultants - Get consultant list for dropdown
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active users (consultants)
    const consultants = await prisma.user.findMany({
      where: {
        isActive: true,

      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        email: true
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
        { username: 'asc' }
      ]
    });

    // Transform to include consultant ID mapping
    const consultantsWithIds = await Promise.all(
      consultants.map(async (consultant : any) => {
        // Try to get consultant ID from existing deals
        const existingDeal = await prisma.consultantDeal.findFirst({
          where: { consultant: consultant.username },
          select: { consultantId: true }
        });

        return {
          id: existingDeal?.consultantId || parseInt(consultant.id) || 0,
          username: consultant.username,
          firstName: consultant.firstName,
          lastName: consultant.lastName,
          role: consultant.role,
          email: consultant.email,
          displayName: consultant.firstName && consultant.lastName 
            ? `${consultant.firstName} ${consultant.lastName}`
            : consultant.username
        };
      })
    );

    return NextResponse.json(consultantsWithIds);
  } catch (error) {
    console.error('Error fetching consultants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consultants' },
      { status: 500 }
    );
  }
}

// GET /api/admin/consultants/[username] - Get specific consultant details
export async function GET_CONSULTANT(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const consultant = await prisma.user.findUnique({
      where: { username: params.username },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        email: true,
        isActive: true
      }
    });

    if (!consultant) {
      return NextResponse.json(
        { error: 'Consultant not found' },
        { status: 404 }
      );
    }

    // Get consultant's deal history
    const dealHistory = await prisma.consultantDeal.findMany({
      where: { consultant: consultant.username },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    });

    return NextResponse.json({
      ...consultant,
      dealHistory
    });
  } catch (error) {
    console.error('Error fetching consultant details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consultant details' },
      { status: 500 }
    );
  }
}