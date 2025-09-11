// src/app/api/admin/deals/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT /api/admin/deals/[id] - Update existing deal
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dealId = parseInt(params.id);
    if (isNaN(dealId)) {
      return NextResponse.json(
        { error: 'Invalid deal ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { dealDays, role } = body;

    // Validate required fields
    if (dealDays === undefined) {
      return NextResponse.json(
        { error: 'Deal days is required' },
        { status: 400 }
      );
    }

    // Check if deal exists
    const existingDeal = await prisma.consultantDeal.findUnique({
      where: { id: dealId }
    });

    if (!existingDeal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    const updatedDeal = await prisma.consultantDeal.update({
      where: { id: dealId },
      data: {
        dealDays: parseInt(dealDays),
        ...(role && { role })
      }
    });

    return NextResponse.json(updatedDeal);
  } catch (error) {
    console.error('Error updating deal:', error);
    return NextResponse.json(
      { error: 'Failed to update deal' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/deals/[id] - Delete deal
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dealId = parseInt(params.id);
    if (isNaN(dealId)) {
      return NextResponse.json(
        { error: 'Invalid deal ID' },
        { status: 400 }
      );
    }

    // Check if deal exists
    const existingDeal = await prisma.consultantDeal.findUnique({
      where: { id: dealId }
    });

    if (!existingDeal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    await prisma.consultantDeal.delete({
      where: { id: dealId }
    });

    return NextResponse.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    console.error('Error deleting deal:', error);
    return NextResponse.json(
      { error: 'Failed to delete deal' },
      { status: 500 }
    );
  }
}