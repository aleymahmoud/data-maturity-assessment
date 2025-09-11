// src/app/api/admin/stats/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET() {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    // Get current date components
    const today = new Date();
    const year = today.getFullYear();
    const monthNo = today.getMonth() + 1;

    // Calculate previous month for comparisons
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const prevYear = lastMonth.getFullYear();
    const prevMonthNo = lastMonth.getMonth() + 1;

    // Get total users count
    const totalUsers = await prisma.user.count();

    // Get users created this month
    const thisMonthUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(year, monthNo - 1, 1), // Start of current month
          lt: new Date(year, monthNo, 1), // Start of next month
        }
      }
    });

    // Get active users count
    const activeUsers = await prisma.user.count({
      where: {
        isActive: true
      }
    });

    // Get super users count
    const superUsers = await prisma.user.count({
      where: {
        role: 'SUPER_USER'
      }
    });

    // Get total domains count
    const totalDomains = await prisma.domain.count();

    // Get domains created this month
    const thisMonthDomains = await prisma.domain.count({
      where: {
        createdAt: {
          gte: new Date(year, monthNo - 1, 1),
          lt: new Date(year, monthNo, 1),
        }
      }
    });

    // Get recent entries count (entries created in the last 7 days)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const recentEntries = await prisma.histData.count({
      where: {
        createdAt: {
          gte: lastWeek
        }
      }
    });

    // Get this month's entries count
    const thisMonthEntries = await prisma.histData.count({
      where: {
        year: year,
        monthNo: monthNo
      }
    });

    // Calculate active percentage
    const activePercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

    const stats = {
      totalUsers,
      activeUsers,
      superUsers,
      totalDomains,
      recentEntries,
      thisMonthEntries,
      // Additional calculated fields for dynamic display
      thisMonthUsers,
      thisMonthDomains,
      activePercentage,
    };

    console.log('Admin dashboard stats:', stats);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch admin dashboard stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}