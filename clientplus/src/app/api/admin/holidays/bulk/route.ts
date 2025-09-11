// src/app/api/admin/holidays/bulk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/admin/holidays/bulk - Import multiple holidays
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { holidays } = body;

    if (!Array.isArray(holidays)) {
      return NextResponse.json(
        { error: 'Holidays must be an array' },
        { status: 400 }
      );
    }

    const createdHolidays = [];
    const errors = [];

    for (const holiday of holidays) {
      try {
        // Validate required fields
        if (!holiday.name || !holiday.date) {
          errors.push(`Holiday missing name or date: ${JSON.stringify(holiday)}`);
          continue;
        }

        const holidayDate = new Date(holiday.date);
        
        // Validate date
        if (isNaN(holidayDate.getTime())) {
          errors.push(`Invalid date for holiday "${holiday.name}": ${holiday.date}`);
          continue;
        }

        // Check if holiday already exists on this date
        const existing = await prisma.publicHoliday.findUnique({
          where: { date: holidayDate }
        });

        if (existing) {
          errors.push(`Holiday already exists on ${holiday.date}: ${existing.name}`);
          continue;
        }

        const newHoliday = await prisma.publicHoliday.create({
          data: {
            name: holiday.name,
            date: holidayDate,
            year: holidayDate.getFullYear(),
            month: holidayDate.getMonth() + 1,
            day: holidayDate.getDate(),
            isRecurring: holiday.isRecurring || false,
            country: holiday.country || 'EG'
          }
        });

        createdHolidays.push(newHoliday);
      } catch (error) {
        errors.push(`Error creating holiday "${holiday.name}": ${error}`);
      }
    }

    return NextResponse.json({
      created: createdHolidays.length,
      errors,
      holidays: createdHolidays
    });
  } catch (error) {
    console.error('Error bulk creating holidays:', error);
    return NextResponse.json(
      { error: 'Failed to create holidays' },
      { status: 500 }
    );
  }
}