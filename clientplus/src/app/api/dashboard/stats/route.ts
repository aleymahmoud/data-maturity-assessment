// src/app/api/dashboard/stats/route.ts
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

    // Get current date components
    const today = new Date()
    const year = today.getFullYear()
    const monthNo = today.getMonth() + 1

    console.log('Fetching stats for user:', session.user.username)

    // Calculate today's hours
    const todayEntries = await prisma.histData.findMany({
      where: {
        consultant: session.user.username,
        year: year,
        monthNo: monthNo,
        day: today.getDate(),
      },
      select: {
        workingHours: true,
      },
    })

    const todayHours = todayEntries.reduce((sum: number, entry: any) => {
      return sum + Number(entry.workingHours)
    }, 0)

    // Calculate monthly hours
    const monthlyEntries = await prisma.histData.findMany({
      where: {
        consultant: session.user.username,
        year: year,
        monthNo: monthNo,
      },
      select: {
        workingHours: true,
      },
    })

    const monthHours = monthlyEntries.reduce((sum: number, entry: any) => {
      return sum + Number(entry.workingHours)
    }, 0)

    // Get active clients count
    const activeClients = await prisma.histData.findMany({
      where: {
        consultant: session.user.username,
        year: year,
        monthNo: monthNo,
      },
      select: {
        client: true,
      },
      distinct: ['client'],
    })

    // Get consultant deal for utilization calculation
    const consultantDeal = await prisma.consultantDeal.findFirst({
      where: {
        consultant: session.user.username,
        year: year,
        month: monthNo,
      },
      select: {
        dealDays: true,
      },
    })

    const dealDays = consultantDeal?.dealDays || 22 // Default to 22 working days
    const workingDaysInMonth = dealDays
    const expectedHoursPerDay = 6
    const expectedMonthlyHours = workingDaysInMonth * expectedHoursPerDay
    const utilization = expectedMonthlyHours > 0 ? (monthHours / expectedMonthlyHours) * 100 : 0

    // **NEW: Calculate Team Members for LEAD_CONSULTANT and SUPER_USER**
    let teamMembers = 0
    let teamMembersBreakdown = null

    if (session.user.role === 'LEAD_CONSULTANT' || session.user.role === 'SUPER_USER') {
      console.log('Calculating team members for:', session.user.role, session.user.username)

      // Step 1: Get all subdomains the current user worked on this month
      const userSubdomains = await prisma.histData.findMany({
        where: {
          consultant: session.user.username,
          year: year,
          monthNo: monthNo,
          subdomain: {
            not: null, // Only entries with subdomain
          },
        },
        select: {
          domain: true,
          subdomain: true,
        },
        distinct: ['domain', 'subdomain'],
      })

      console.log('User worked on subdomains:', userSubdomains)

      if (userSubdomains.length > 0) {
        // Step 2: Find all consultants who worked on the same domain+subdomain combinations this month
        const subdomainConditions = userSubdomains.map((entry: any) => ({
          domain: entry.domain,
          subdomain: entry.subdomain,
          year: year,
          monthNo: monthNo,
        }))

        const teammateEntries = await prisma.histData.findMany({
          where: {
            OR: subdomainConditions,
            consultant: {
              not: session.user.username, // Exclude current user
            },
          },
          select: {
            consultant: true,
            domain: true,
            subdomain: true,
          },
          distinct: ['consultant'],
        })

        console.log('Found teammate entries:', teammateEntries)

        // Step 3: Get unique teammates (excluding current user)
        const uniqueTeammates = [...new Set(teammateEntries.map((entry: any) => entry.consultant))]
        teamMembers = uniqueTeammates.length

        // Step 4: Create breakdown for tooltip
        const breakdownMap = new Map()
        
        for (const subdomain of userSubdomains) {
          const key = `${subdomain.domain} → ${subdomain.subdomain}`
          
          // Find all consultants for this specific subdomain
          const subdomainTeammates = await prisma.histData.findMany({
            where: {
              domain: subdomain.domain,
              subdomain: subdomain.subdomain,
              year: year,
              monthNo: monthNo,
            },
            select: {
              consultant: true,
            },
            distinct: ['consultant'],
          })

          const consultantNames = subdomainTeammates
            .map((entry: any) => entry.consultant)
            .filter((consultant: any) => consultant !== session.user.username) // Exclude current user from breakdown
            .sort()

          if (consultantNames.length > 0) {
            breakdownMap.set(key, consultantNames)
          }
        }

        // Convert to array format for easy frontend consumption
        teamMembersBreakdown = Array.from(breakdownMap.entries()).map(([subdomain, consultants]) => ({
          subdomain,
          consultants,
          count: consultants.length,
        }))

        console.log('Team members breakdown:', teamMembersBreakdown)
      }
    }

    const stats = {
      todayHours: Number(todayHours.toFixed(1)),
      monthHours: Number(monthHours.toFixed(1)),
      utilization: Number(utilization.toFixed(1)),
      activeClients: activeClients.length,
      teamMembers,
      teamMembersBreakdown, // For tooltip display
    }

    console.log('Calculated stats:', stats)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch dashboard stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}