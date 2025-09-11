// src/app/api/admin/deals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/deals - Fetch deals with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const consultant = searchParams.get('consultant');
    const userType = searchParams.get('userType');

    // Build where clause for filtering
    const where: any = {};
    
    if (year) {
      where.year = parseInt(year);
    }
    
    if (month) {
      where.month = parseInt(month);
    }
    
    if (consultant) {
      where.consultant = consultant;
    }
    
    if (userType) {
      where.role = userType;
    }

    const deals = await prisma.consultantDeal.findMany({
      where,
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { consultant: 'asc' }
      ]
    });

    return NextResponse.json(deals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deals' },
      { status: 500 }
    );
  }
}

// POST /api/admin/deals - Create new deal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      year, 
      month, 
      consultantId, 
      consultant, 
      dealDays, 
      role 
    } = body;

    // Validate required fields
    if (!year || !month || !consultantId || !consultant || dealDays === undefined || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if deal already exists for this consultant/month/year
    const existingDeal = await prisma.consultantDeal.findUnique({
      where: {
        year_month_consultantId: {
          year: parseInt(year),
          month: parseInt(month),
          consultantId: parseInt(consultantId)
        }
      }
    });

    if (existingDeal) {
      return NextResponse.json(
        { error: 'Deal already exists for this consultant in this month/year' },
        { status: 409 }
      );
    }

    const newDeal = await prisma.consultantDeal.create({
      data: {
        year: parseInt(year),
        month: parseInt(month),
        consultantId: parseInt(consultantId),
        consultant,
        dealDays: parseInt(dealDays),
        role
      }
    });

    return NextResponse.json(newDeal, { status: 201 });
  } catch (error) {
    console.error('Error creating deal:', error);
    return NextResponse.json(
      { error: 'Failed to create deal' },
      { status: 500 }
    );
  }
}