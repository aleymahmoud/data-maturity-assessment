// src/app/api/admin/activity/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET() {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    // Get recent user activities (last 10)
    const recentUserCreations = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    // Get recent entries (last 5)
    const recentEntries = await prisma.histData.findMany({
      select: {
        id: true,
        consultant: true,
        client: true,
        domain: true,
        workingHours: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    // Convert to activity format
    const userActivities = recentUserCreations.map((user: any) => ({
      id: `user-${user.id}`,
      type: 'user_created',
      user: 'admin', // Since we don't track who created users, default to admin
      description: `Created new user: ${user.username}`,
      timestamp: user.createdAt.toISOString(),
    }));

    const entryActivities = recentEntries.map((entry: any) => ({
      id: `entry-${entry.id}`,
      type: 'entry_added',
      user: entry.consultant,
      description: `Added ${entry.workingHours}h entry for ${entry.client} - ${entry.domain}`,
      timestamp: entry.createdAt.toISOString(),
    }));

    // Combine and sort by timestamp (newest first)
    const allActivities = [...userActivities, ...entryActivities].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Take only the 10 most recent activities
    const activities = allActivities.slice(0, 10);

    console.log('Generated admin activities:', activities.length);

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching admin activity:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch admin activity',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}