// src/app/api/dashboard/activity/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Fetching activity for user:', session.user.username)

    // Get recent entries (last 10) for the current user
    const recentEntries = await prisma.histData.findMany({
      where: {
        consultant: session.user.username,
      },
      select: {
        id: true,
        client: true,
        domain: true,
        workingHours: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })

    // Convert entries to activity format
    const activities = recentEntries.map((entry: any) => ({
      id: entry.id,
      type: 'entry_added' as const,
      description: `Added ${entry.workingHours}h entry for ${entry.client} - ${entry.domain}`,
      timestamp: entry.createdAt.toISOString(),
      user: session.user.username,
    }))

    console.log('Generated activities:', activities.length)

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Error fetching dashboard activity:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch dashboard activity',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}