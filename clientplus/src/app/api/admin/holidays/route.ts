// src/app/api/admin/holidays/route.ts - ENHANCED WITH DEBUG
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/holidays - Fetch public holidays
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    // Build where clause for filtering
    const where: any = {};
    
    if (year) {
      where.year = parseInt(year);
    }
    
    if (month) {
      where.month = parseInt(month);
    }

    const holidays = await prisma.publicHoliday.findMany({
      where,
      orderBy: [
        { year: 'asc' },
        { month: 'asc' },
        { day: 'asc' }
      ]
    });

    // Debug logging
    console.log('🔍 Holidays API Debug:');
    console.log(`Found ${holidays.length} holidays`);
    console.log('First holiday:', holidays[0]);
    console.log('All holidays:', holidays);

    // Ensure dates are properly formatted for frontend
    const formattedHolidays = holidays.map(holiday => ({
      ...holiday,
      date: holiday.date.toISOString().split('T')[0] // Format as YYYY-MM-DD
    }));

    return NextResponse.json(formattedHolidays);
  } catch (error) {
    console.error('❌ Error fetching holidays:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holidays' },
      { status: 500 }
    );
  }
}

// POST /api/admin/holidays - Create new holiday
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, date, isRecurring, country } = body;

    // Validate required fields
    if (!name || !date) {
      return NextResponse.json(
        { error: 'Name and date are required' },
        { status: 400 }
      );
    }

    const holidayDate = new Date(date);
    
    // Check if holiday already exists on this date
    const existingHoliday = await prisma.publicHoliday.findUnique({
      where: { date: holidayDate }
    });

    if (existingHoliday) {
      return NextResponse.json(
        { error: 'Holiday already exists on this date' },
        { status: 409 }
      );
    }

    const newHoliday = await prisma.publicHoliday.create({
      data: {
        name,
        date: holidayDate,
        year: holidayDate.getFullYear(),
        month: holidayDate.getMonth() + 1,
        day: holidayDate.getDate(),
        isRecurring: isRecurring || false,
        country: country || 'EG'
      }
    });

    console.log('✅ Created holiday:', newHoliday);

    return NextResponse.json({
      ...newHoliday,
      date: newHoliday.date.toISOString().split('T')[0]
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating holiday:', error);
    return NextResponse.json(
      { error: 'Failed to create holiday' },
      { status: 500 }
    );
  }
}