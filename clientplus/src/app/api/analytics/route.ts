// src/app/api/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Parse filters
    const fromDate = searchParams.get('from') ? new Date(searchParams.get('from')!) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Default 90 days ago
    const toDate = searchParams.get('to') ? new Date(searchParams.get('to')!) : new Date()
    const userTypes = searchParams.get('userTypes')?.split(',') || []
    const users = searchParams.get('users')?.split(',') || []
    const domains = searchParams.get('domains')?.split(',') || []
    const subdomains = searchParams.get('subdomains')?.split(',') || []
    const scopes = searchParams.get('scopes')?.split(',') || []
    const activityTypes = searchParams.get('activityTypes')?.split(',') || ['Client', 'FFNT']
    const viewMode = searchParams.get('viewMode') || 'hours'

    console.log('Analytics filters:', {
      fromDate,
      toDate,
      userTypes,
      users,
      domains,
      subdomains,
      scopes,
      activityTypes,
      viewMode,
      userRole: session.user.role,
      username: session.user.username
    })

    // Build base query conditions
    const baseConditions: any = {
      year: {
        gte: fromDate.getFullYear(),
        lte: toDate.getFullYear(),
      },
      monthNo: {
        gte: fromDate.getFullYear() === toDate.getFullYear() ? fromDate.getMonth() + 1 : 1,
        lte: fromDate.getFullYear() === toDate.getFullYear() ? toDate.getMonth() + 1 : 12,
      },
    }

    // Role-based filtering
    if (session.user.role === 'SUPER_USER') {
      // Super users can see all data with optional user filtering
      if (users.length > 0) {
        baseConditions.consultant = { in: users }
      }
    } else if (session.user.role === 'LEAD_CONSULTANT') {
      // Lead consultants see their own data plus their team's data
      if (users.length > 0) {
        baseConditions.consultant = { in: users }
      } else {
        // Get team members (users working on same subdomains)
        const userSubdomains = await prisma.histData.findMany({
          where: {
            consultant: session.user.username,
            year: { gte: fromDate.getFullYear() },
            monthNo: { gte: fromDate.getMonth() + 1 },
            subdomain: { not: null },
          },
          select: { domain: true, subdomain: true },
          distinct: ['domain', 'subdomain'],
        })

        if (userSubdomains.length > 0) {
          const subdomainConditions = userSubdomains.map(entry => ({
            domain: entry.domain,
            subdomain: entry.subdomain,
          }))

          const teamMembers = await prisma.histData.findMany({
            where: {
              OR: subdomainConditions,
              year: { gte: fromDate.getFullYear() },
              monthNo: { gte: fromDate.getMonth() + 1 },
            },
            select: { consultant: true },
            distinct: ['consultant'],
          })

          const teamUsernames = teamMembers.map(member => member.consultant)
          baseConditions.consultant = { in: teamUsernames }
        } else {
          baseConditions.consultant = session.user.username
        }
      }
    } else {
      // Regular users only see their own data
      baseConditions.consultant = session.user.username
    }

    // Add domain/subdomain/scope filters
    if (domains.length > 0) {
      baseConditions.domain = { in: domains }
    }
    if (subdomains.length > 0) {
      // Extract subdomain names from the id-name format (e.g., "2-Forefront" -> "Forefront")
      const subdomainNames = subdomains.map(subdomain => {
        const parts = subdomain.split('-')
        return parts.slice(1).join('-') // Rejoin in case subdomain name contains dashes
      })
      baseConditions.subdomain = { in: subdomainNames }
    }
    if (scopes.length > 0) {
      // Extract scope names from the id-name format (e.g., "5-Social Media Management" -> "Social Media Management")
      const scopeNames = scopes.map(scope => {
        const parts = scope.split('-')
        return parts.slice(1).join('-') // Rejoin in case scope name contains dashes
      })
      baseConditions.scope = { in: scopeNames }
    }

    // Activity type filtering
    if (activityTypes.length > 0) {
      baseConditions.activityType = { in: activityTypes }
    }

    console.log('Final base conditions:', baseConditions)

    // 1. Performance Metrics
    const performanceMetrics = await calculatePerformanceMetrics(baseConditions, session.user)

    // 2. Utilization Chart Data
    const utilizationChart = await calculateUtilizationChart(baseConditions, session.user, fromDate, toDate)

    // 3. Activity Breakdown Chart
    const activityBreakdown = await calculateActivityBreakdown(baseConditions, fromDate, toDate)

    // 4. Client Distribution Charts
    const clientDistribution = await calculateClientDistribution(baseConditions, session.user)

    // 5. Performance Trends Analysis
    const performanceTrends = await calculatePerformanceTrends(baseConditions, session.user, fromDate, toDate)

    // 6. Top Clients Analysis
    const topClients = await calculateTopClients(baseConditions, 10)

    // 7. Team Performance Comparison
    const teamPerformance = await calculateTeamPerformance(baseConditions, session.user)

    const analyticsData = {
      performanceMetrics,
      utilizationChart,
      activityBreakdown,
      clientDistribution,
      performanceTrends,
      topClients,
      teamPerformance,
    }

    console.log('Analytics data calculated successfully')
    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch analytics data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function calculatePerformanceMetrics(baseConditions: any, user: any) {
  // Client Metrics - Primary source: HistData table
  const clientEntries = await prisma.histData.findMany({
    where: {
      ...baseConditions,
      activityType: 'Client',
    },
    select: {
      client: true,
      workingHours: true,
    },
  })

  // Get unique clients from HistData (normalize case for duplicates)
  const clientSet = new Set()
  const clientNameMap = new Map() // Maps lowercase -> original case
  
  clientEntries.forEach(entry => {
    const lowerClient = entry.client.toLowerCase()
    clientSet.add(lowerClient)
    // Keep the first occurrence's case
    if (!clientNameMap.has(lowerClient)) {
      clientNameMap.set(lowerClient, entry.client)
    }
  })
  
  const uniqueClients = Array.from(clientSet).map(lowerClient => 
    clientNameMap.get(lowerClient)
  )
  
  // Debug logging
  console.log('=== CLIENT METRICS DEBUG ===')
  console.log('Total client entries found:', clientEntries.length)
  console.log('Unique clients found:', uniqueClients.length)
  console.log('Client list:', uniqueClients.sort())
  console.log('Base conditions for client query:', baseConditions)
  
  // Join with ClientData to get types and status (fallback to active if not found)
  const clientTypes = await prisma.clientData.findMany({
    where: {
      clientName: { in: uniqueClients },
    },
    select: {
      clientName: true,
      type: true,
      status: true,
    },
  })

  // Create lookup map for client info (case insensitive)
  const clientInfoMap = new Map()
  clientTypes.forEach(client => {
    if (client.clientName) {
      clientInfoMap.set(client.clientName.toLowerCase(), client)
    }
  })
  
  // Debug logging for client types
  console.log('ClientData records found:', clientTypes.length)
  console.log('ClientData records:', clientTypes.map(c => ({ name: c.clientName, type: c.type, status: c.status })))
  
  // Debug the type calculations
  console.log('Total clients calculation:', uniqueClients.length)
  const projectClientsDebug = uniqueClients.filter(client => {
    const info = clientInfoMap.get(client.toLowerCase())
    console.log(`Client "${client}": type=${info?.type}, status=${info?.status}`)
    return info?.type === 'PRJ'
  })
  console.log('Project clients:', projectClientsDebug)
  const retainerClientsDebug = uniqueClients.filter(client => {
    const info = clientInfoMap.get(client.toLowerCase())
    return info?.type === 'RET'
  })
  console.log('Retainer clients:', retainerClientsDebug)

  // Calculate Total Clients (all clients with logged hours)
  const totalClients = uniqueClients.length
  const totalProjectClients = uniqueClients.filter(client => {
    const info = clientInfoMap.get(client.toLowerCase())
    return info?.type === 'PRJ'
  }).length
  const totalRetainerClients = uniqueClients.filter(client => {
    const info = clientInfoMap.get(client.toLowerCase())
    return info?.type === 'RET'
  }).length

  // Calculate Active Clients (clients with status 'A' or not found in ClientData)
  const activeClients = uniqueClients.filter(client => {
    const info = clientInfoMap.get(client.toLowerCase())
    return !info || info.status === 'A' // Treat unknown clients as active
  }).length
  const activeProjectClients = uniqueClients.filter(client => {
    const info = clientInfoMap.get(client.toLowerCase())
    return (!info || info.status === 'A') && info?.type === 'PRJ'
  }).length
  const activeRetainerClients = uniqueClients.filter(client => {
    const info = clientInfoMap.get(client.toLowerCase())
    return (!info || info.status === 'A') && info?.type === 'RET'
  }).length

  // Calculate Total Client Hours and Mandays
  const totalClientHours = clientEntries.reduce((sum, entry) => sum + Number(entry.workingHours), 0)
  const totalClientMandays = totalClientHours / 6

  // Team Metrics - Primary source: HistData + ConsultantDeal for deal days
  const allEntries = await prisma.histData.findMany({
    where: baseConditions,
    select: {
      consultant: true,
      consultantId: true,  // Add ConsultantID
      workingHours: true,
      activityType: true,
      subdomain: true,
      year: true,
      monthNo: true,
    },
  })

  // Get deal days from ConsultantDeal table using ConsultantID
  const dealData = await prisma.consultantDeal.findMany({
    where: {
      year: {
        gte: baseConditions.year?.gte || new Date().getFullYear(),
        lte: baseConditions.year?.lte || new Date().getFullYear(),
      },
      month: {
        gte: baseConditions.monthNo?.gte || 1,
        lte: baseConditions.monthNo?.lte || 12,
      },
    },
    select: {
      consultantId: true,  // Use ConsultantID instead of consultant name
      consultant: true,    // Keep for debugging
      dealDays: true,
      role: true,
      year: true,
      month: true,
    },
  })

  // Create maps for deal days and roles by ConsultantID (not consultant name)
  const consultantDealDays = new Map<number, number>()
  const consultantRoles = new Map<number, 'CONSULTANT' | 'SUPPORTING'>()
  const consultantIdToName = new Map<number, string>()
  
  dealData.forEach(deal => {
    const current = consultantDealDays.get(deal.consultantId) || 0
    consultantDealDays.set(deal.consultantId, current + deal.dealDays)
    consultantRoles.set(deal.consultantId, deal.role)
    consultantIdToName.set(deal.consultantId, deal.consultant)
  })

  // Following R logic: Group by ConsultantID, year, month first to avoid transaction duplication
  const monthlyTotals = new Map<number, Map<string, number>>() // consultantId -> monthKey -> hours
  const ffntMonthlyTotals = new Map<number, Map<string, number>>() // consultantId -> monthKey -> ffnt hours

  allEntries.forEach(entry => {
    const consultantId = entry.consultantId
    const monthKey = `${entry.year}-${entry.monthNo}`
    
    // Total hours by consultantId-month
    if (!monthlyTotals.has(consultantId)) {
      monthlyTotals.set(consultantId, new Map())
    }
    const consultantMonths = monthlyTotals.get(consultantId)!
    const currentHours = consultantMonths.get(monthKey) || 0
    consultantMonths.set(monthKey, currentHours + Number(entry.workingHours))

    // FFNT hours by consultantId-month (Forefront subdomain only)
    if (entry.subdomain === 'Forefront') {
      if (!ffntMonthlyTotals.has(consultantId)) {
        ffntMonthlyTotals.set(consultantId, new Map())
      }
      const consultantFFNTMonths = ffntMonthlyTotals.get(consultantId)!
      const currentFFNTHours = consultantFFNTMonths.get(monthKey) || 0
      consultantFFNTMonths.set(monthKey, currentFFNTHours + Number(entry.workingHours))
    }
  })

  // Sum monthly totals to get consultant totals (R logic: sum after grouping)
  const consultantHours = new Map<number, number>()
  monthlyTotals.forEach((months, consultantId) => {
    const totalHours = Array.from(months.values()).reduce((sum, hours) => sum + hours, 0)
    consultantHours.set(consultantId, totalHours)
  })

  // Get current user's ConsultantID from the entries (since we don't have it in session)
  const userConsultantId = allEntries.find(entry => 
    entry.consultant.toLowerCase() === user.username.toLowerCase()
  )?.consultantId

  console.log(`User ${user.username} has ConsultantID: ${userConsultantId}`)

  // FFNT hours and mandays (current user or all for super user)
  const myFFNTMonths = userConsultantId ? ffntMonthlyTotals.get(userConsultantId) || new Map() : new Map()
  const ffntHours = userConsultantId && (baseConditions.consultant === user.username || !baseConditions.consultant)
    ? Array.from(myFFNTMonths.values()).reduce((sum, hours) => sum + hours, 0)
    : Array.from(ffntMonthlyTotals.values()).reduce((sum, months) => 
        sum + Array.from(months.values()).reduce((s, h) => s + h, 0), 0)
  const ffntMandays = ffntHours / 6

  // Calculate utilizations using R formula: (Hours / 6) / DealDays * 100
  
  // 1. My Utilization
  const myHours = userConsultantId ? consultantHours.get(userConsultantId) || 0 : 0
  const myDealDays = userConsultantId ? consultantDealDays.get(userConsultantId) || 0 : 0
  const myUtilization = myDealDays > 0 ? ((myHours / 6) / myDealDays) * 100 : 0

  console.log(`My Utilization Debug: hours=${myHours}, dealDays=${myDealDays}, utilization=${myUtilization}%`)

  // 2. Team Utilization (ALL users) - R logic: sum(hours/6)/sum(dealDays)*100
  const totalTeamHours = Array.from(consultantHours.values()).reduce((sum, hours) => sum + hours, 0)
  const totalTeamDealDays = Array.from(consultantDealDays.values()).reduce((sum, days) => sum + days, 0)
  const teamUtilization = totalTeamDealDays > 0 ? ((totalTeamHours / 6) / totalTeamDealDays) * 100 : 0

  // 3. Consulting Team Utilization (Non-supporting users)
  let consultingHours = 0
  let consultingDealDays = 0
  consultantHours.forEach((hours, consultantId) => {
    const role = consultantRoles.get(consultantId)
    if (role !== 'SUPPORTING') {
      consultingHours += hours
      consultingDealDays += consultantDealDays.get(consultantId) || 0
    }
  })
  const consultingTeamUtilization = consultingDealDays > 0 ? ((consultingHours / 6) / consultingDealDays) * 100 : 0

  // 4. Supporting Team Utilization (Supporting users only)
  let supportingHours = 0
  let supportingDealDays = 0
  consultantHours.forEach((hours, consultantId) => {
    const role = consultantRoles.get(consultantId)
    if (role === 'SUPPORTING') {
      supportingHours += hours
      supportingDealDays += consultantDealDays.get(consultantId) || 0
    }
  })
  const supportingTeamUtilization = supportingDealDays > 0 ? ((supportingHours / 6) / supportingDealDays) * 100 : 0

  return {
    clientMetrics: {
      totalClients: totalClients,
      totalProjectClients: totalProjectClients,
      totalRetainerClients: totalRetainerClients,
      totalActiveClients: activeClients,
      activeProjectClients: activeProjectClients,
      activeRetainerClients: activeRetainerClients,
      totalClientHours: Number(totalClientHours.toFixed(1)),
      totalClientMandays: Number(totalClientMandays.toFixed(1)),
    },
    teamMetrics: {
      myUtilization: Number(myUtilization.toFixed(1)),
      teamUtilization: Number(teamUtilization.toFixed(1)),
      consultingTeamUtilization: Number(consultingTeamUtilization.toFixed(1)),
      supportingTeamUtilization: Number(supportingTeamUtilization.toFixed(1)),
      ffntHours: Number(ffntHours.toFixed(1)),
      ffntMandays: Number(ffntMandays.toFixed(1)),
    },
  }
}

async function calculateUtilizationChart(baseConditions: any, user: any, fromDate: Date, toDate: Date) {
  const months: string[] = []
  const myUtilization: number[] = []
  const teamUtilization: number[] = []

  // Generate month-year combinations
  const currentDate = new Date(fromDate)
  while (currentDate <= toDate) {
    const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    months.push(monthYear)
    
    // Calculate utilization for this month
    const monthConditions = {
      ...baseConditions,
      year: currentDate.getFullYear(),
      monthNo: currentDate.getMonth() + 1,
    }

    const monthEntries = await prisma.histData.findMany({
      where: monthConditions,
      select: {
        consultant: true,
        workingHours: true,
      },
    })

    // Get deal days for this specific month
    const monthDealData = await prisma.consultantDeal.findMany({
      where: {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
      },
      select: {
        consultant: true,
        dealDays: true,
      },
    })

    // Create map for deal days by consultant
    const monthDealDays = new Map<string, number>()
    monthDealData.forEach(deal => {
      monthDealDays.set(deal.consultant, deal.dealDays)
    })

    // Following R logic: Group by consultant first, then sum
    const consultantMonthlyHours = new Map<string, number>()
    monthEntries.forEach(entry => {
      const current = consultantMonthlyHours.get(entry.consultant) || 0
      consultantMonthlyHours.set(entry.consultant, current + Number(entry.workingHours))
    })

    // My utilization for this month using R formula: (hours/6)/dealDays*100
    const myMonthHours = consultantMonthlyHours.get(user.username) || 0
    const myDealDays = monthDealDays.get(user.username) || 0
    const myMonthUtil = myDealDays > 0 ? ((myMonthHours / 6) / myDealDays) * 100 : 0
    myUtilization.push(Number(myMonthUtil.toFixed(1)))

    // Team utilization for this month using R formula: sum(hours/6)/sum(dealDays)*100
    const totalMonthHours = Array.from(consultantMonthlyHours.values()).reduce((sum, hours) => sum + hours, 0)
    const totalMonthDealDays = Array.from(monthDealDays.values()).reduce((sum, days) => sum + days, 0)
    const teamMonthUtil = totalMonthDealDays > 0 ? ((totalMonthHours / 6) / totalMonthDealDays) * 100 : 0
    teamUtilization.push(Number(teamMonthUtil.toFixed(1)))

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1)
  }

  return { months, myUtilization, teamUtilization }
}

async function calculateActivityBreakdown(baseConditions: any, fromDate: Date, toDate: Date) {
  const months: string[] = []
  const clientHours: number[] = []
  const ffntHours: number[] = []
  const clientMandays: number[] = []
  const ffntMandays: number[] = []

  // Generate month-year combinations
  const currentDate = new Date(fromDate)
  while (currentDate <= toDate) {
    const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    months.push(monthYear)
    
    // Get entries for this month
    const monthConditions = {
      ...baseConditions,
      year: currentDate.getFullYear(),
      monthNo: currentDate.getMonth() + 1,
    }

    const monthEntries = await prisma.histData.findMany({
      where: monthConditions,
      select: {
        workingHours: true,
        activityType: true,
        subdomain: true,
      },
    })

    // Client entries
    const clientMonthEntries = monthEntries.filter(entry => entry.activityType === 'Client')
    const clientMonthHours = clientMonthEntries.reduce((sum, entry) => sum + Number(entry.workingHours), 0)
    clientHours.push(Number(clientMonthHours.toFixed(1)))
    clientMandays.push(Number((clientMonthHours / 6).toFixed(1)))

    // FFNT entries (Forefront subdomain or FFNT activity type)
    const ffntMonthEntries = monthEntries.filter(entry => 
      entry.subdomain === 'Forefront' || entry.activityType === 'FFNT'
    )
    const ffntMonthHours = ffntMonthEntries.reduce((sum, entry) => sum + Number(entry.workingHours), 0)
    ffntHours.push(Number(ffntMonthHours.toFixed(1)))
    ffntMandays.push(Number((ffntMonthHours / 6).toFixed(1)))

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1)
  }

  return { months, clientHours, ffntHours, clientMandays, ffntMandays }
}

async function calculateClientDistribution(baseConditions: any, user: any) {
  // Get all entries within the filter conditions
  const entries = await prisma.histData.findMany({
    where: baseConditions,
    select: {
      client: true,
      workingHours: true,
      activityType: true,
    },
  })

  // Get client types from the database
  const uniqueClients = [...new Set(entries.map(entry => entry.client))]
  const clientTypes = await prisma.clientData.findMany({
    where: {
      clientName: { in: uniqueClients },
      status: 'A', // Active clients only
    },
    select: {
      clientName: true,
      type: true,
    },
  })

  // Create a map for quick lookup
  const clientTypeMap = new Map(
    clientTypes.map(client => [client.clientName, client.type])
  )

  // Calculate distribution by client type
  const distributionMap = new Map([
    ['PRJ', { hours: 0, clients: new Set(), type: 'Project' }],
    ['RET', { hours: 0, clients: new Set(), type: 'Retainer' }],
    ['FFNT', { hours: 0, clients: new Set(), type: 'FFNT' }],
  ])

  entries.forEach(entry => {
    const clientType = clientTypeMap.get(entry.client) || 'FFNT'
    const distribution = distributionMap.get(clientType)
    
    if (distribution) {
      distribution.hours += Number(entry.workingHours)
      distribution.clients.add(entry.client)
    }
  })

  // Convert to chart data format
  const pieChartData: {
    labels: string[];
    data: number[];
    backgroundColor: string[];
    clientCounts: number[];
  } = {
    labels: [],
    data: [],
    backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'], // Blue, Green, Yellow
    clientCounts: [],
  }

  distributionMap.forEach((value, key) => {
    if (value.hours > 0) {
      pieChartData.labels.push(value.type)
      pieChartData.data.push(Number(value.hours.toFixed(1)))
      pieChartData.clientCounts.push(value.clients.size)
    }
  })

  return {
    pieChart: pieChartData,
    totalHours: entries.reduce((sum, entry) => sum + Number(entry.workingHours), 0),
    totalClients: uniqueClients.length,
  }
}

async function calculateTopClients(baseConditions: any, limit: number = 10) {
  // Get client hours aggregated
  const entries = await prisma.histData.findMany({
    where: {
      ...baseConditions,
      activityType: 'Client', // Only client work
    },
    select: {
      client: true,
      workingHours: true,
    },
  })

  // Aggregate hours by client
  const clientHours = new Map<string, number>()
  entries.forEach(entry => {
    const current = clientHours.get(entry.client) || 0
    clientHours.set(entry.client, current + Number(entry.workingHours))
  })

  // Get client types
  const uniqueClients = Array.from(clientHours.keys())
  const clientTypes = await prisma.clientData.findMany({
    where: {
      clientName: { in: uniqueClients },
      status: 'A',
    },
    select: {
      clientName: true,
      type: true,
    },
  })

  const clientTypeMap = new Map(
    clientTypes.map(client => [client.clientName, client.type])
  )

  // Sort and limit
  const sortedClients = Array.from(clientHours.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([client, hours]) => ({
      client,
      hours: Number(hours.toFixed(1)),
      mandays: Number((hours / 6).toFixed(1)),
      type: clientTypeMap.get(client) || 'FFNT',
    }))

  return {
    clients: sortedClients,
    chartData: {
      labels: sortedClients.map(c => c.client),
      data: sortedClients.map(c => c.hours),
      backgroundColor: sortedClients.map(c => {
        switch (c.type) {
          case 'PRJ': return '#3B82F6'  // Blue
          case 'RET': return '#10B981'  // Green
          default: return '#F59E0B'     // Yellow
        }
      }),
    }
  }
}

async function calculatePerformanceTrends(baseConditions: any, user: any, fromDate: Date, toDate: Date) {
  // Extended date range for trends (12 months back)
  const extendedFromDate = new Date(fromDate)
  extendedFromDate.setMonth(extendedFromDate.getMonth() - 6) // 6 more months back

  const trendConditions = {
    ...baseConditions,
    year: {
      gte: extendedFromDate.getFullYear(),
      lte: toDate.getFullYear(),
    },
    monthNo: {
      gte: extendedFromDate.getFullYear() === toDate.getFullYear() ? extendedFromDate.getMonth() + 1 : 1,
      lte: fromDate.getFullYear() === toDate.getFullYear() ? toDate.getMonth() + 1 : 12,
    },
  }

  const months: string[] = []
  const utilizationTrend: number[] = []
  const efficiencyTrend: number[] = []
  const clientDiversityTrend: number[] = []

  // Generate extended month range
  const currentDate = new Date(extendedFromDate)
  while (currentDate <= toDate) {
    const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    months.push(monthYear)
    
    const monthConditions = {
      ...trendConditions,
      year: currentDate.getFullYear(),
      monthNo: currentDate.getMonth() + 1,
    }

    const monthEntries = await prisma.histData.findMany({
      where: monthConditions,
      select: {
        consultant: true,
        workingHours: true,
        client: true,
      },
    })

    // Get deal days for this specific month in trends
    const trendMonthDealData = await prisma.consultantDeal.findMany({
      where: {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
      },
      select: {
        consultant: true,
        dealDays: true,
      },
    })

    const trendMonthDealDays = new Map<string, number>()
    trendMonthDealData.forEach(deal => {
      trendMonthDealDays.set(deal.consultant, deal.dealDays)
    })

    // Calculate metrics for this month - following R logic
    const myEntries = monthEntries.filter(entry => entry.consultant === user.username)
    const myHours = myEntries.reduce((sum, entry) => sum + Number(entry.workingHours), 0)
    const uniqueClients = new Set(myEntries.map(entry => entry.client)).size
    
    const myTrendDealDays = trendMonthDealDays.get(user.username) || 0
    const utilization = myTrendDealDays > 0 ? ((myHours / 6) / myTrendDealDays) * 100 : 0
    const efficiency = myHours > 0 ? (myHours / Math.max(myEntries.length, 1)) : 0 // Hours per entry
    
    utilizationTrend.push(Number(utilization.toFixed(1)))
    efficiencyTrend.push(Number(efficiency.toFixed(1)))
    clientDiversityTrend.push(uniqueClients)

    currentDate.setMonth(currentDate.getMonth() + 1)
  }

  return {
    months,
    trends: {
      utilization: utilizationTrend,
      efficiency: efficiencyTrend,
      clientDiversity: clientDiversityTrend,
    },
    // Calculate trend direction (positive/negative)
    trendAnalysis: {
      utilizationTrend: calculateTrendDirection(utilizationTrend),
      efficiencyTrend: calculateTrendDirection(efficiencyTrend),
      diversityTrend: calculateTrendDirection(clientDiversityTrend),
    }
  }
}

async function calculateTeamPerformance(baseConditions: any, user: any) {
  const entries = await prisma.histData.findMany({
    where: baseConditions,
    select: {
      consultant: true,
      workingHours: true,
      client: true,
      activityType: true,
      subdomain: true,
    },
  })

  // Get deal days for the same date range as baseConditions
  const performanceDealData = await prisma.consultantDeal.findMany({
    where: {
      year: {
        gte: baseConditions.year?.gte || new Date().getFullYear(),
        lte: baseConditions.year?.lte || new Date().getFullYear(),
      },
      month: {
        gte: baseConditions.monthNo?.gte || 1,
        lte: baseConditions.monthNo?.lte || 12,
      },
    },
    select: {
      consultant: true,
      dealDays: true,
    },
  })

  // Create map for deal days by consultant
  const performanceDealDays = new Map<string, number>()
  performanceDealData.forEach(deal => {
    const current = performanceDealDays.get(deal.consultant) || 0
    performanceDealDays.set(deal.consultant, current + deal.dealDays)
  })

  // Group by consultant
  const consultantMetrics = new Map<string, {
    totalHours: number;
    clientHours: number;
    ffntHours: number;
    uniqueClients: Set<string>;
    entries: number;
  }>()

  entries.forEach(entry => {
    const consultant = entry.consultant
    const current = consultantMetrics.get(consultant) || {
      totalHours: 0,
      clientHours: 0,
      ffntHours: 0,
      uniqueClients: new Set(),
      entries: 0,
    }

    const hours = Number(entry.workingHours)
    current.totalHours += hours
    current.entries += 1
    current.uniqueClients.add(entry.client)

    if (entry.activityType === 'Client') {
      current.clientHours += hours
    } else if (entry.activityType === 'FFNT' || entry.subdomain === 'Forefront') {
      current.ffntHours += hours
    }

    consultantMetrics.set(consultant, current)
  })

  // Calculate performance scores for each consultant using R formula
  const performanceData = Array.from(consultantMetrics.entries()).map(([consultant, metrics]) => {
    const dealDays = performanceDealDays.get(consultant) || 0
    const utilization = dealDays > 0 ? ((metrics.totalHours / 6) / dealDays) * 100 : 0
    const clientDiversity = metrics.uniqueClients.size
    const efficiency = metrics.totalHours / Math.max(metrics.entries, 1)
    const clientFocus = (metrics.clientHours / metrics.totalHours) * 100
    const ffntContribution = (metrics.ffntHours / metrics.totalHours) * 100

    return {
      consultant,
      metrics: {
        utilization: Math.min(utilization, 150), // Cap at 150% for radar chart
        clientDiversity: Math.min(clientDiversity * 10, 100), // Scale for radar
        efficiency: Math.min(efficiency * 2, 100), // Scale for radar
        clientFocus: clientFocus,
        ffntContribution: ffntContribution,
      },
      rawData: {
        totalHours: Number(metrics.totalHours.toFixed(1)),
        clientHours: Number(metrics.clientHours.toFixed(1)),
        ffntHours: Number(metrics.ffntHours.toFixed(1)),
        uniqueClients: clientDiversity,
      }
    }
  })

  return {
    consultants: performanceData.slice(0, 5), // Top 5 for radar chart
    radarLabels: ['Utilization', 'Client Diversity', 'Efficiency', 'Client Focus', 'FFNT Contribution'],
  }
}

function calculateTrendDirection(data: number[]): 'up' | 'down' | 'stable' {
  if (data.length < 2) return 'stable'
  
  const recent = data.slice(-3) // Last 3 data points
  const earlier = data.slice(0, 3) // First 3 data points
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
  const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length
  
  const change = ((recentAvg - earlierAvg) / earlierAvg) * 100
  
  if (change > 5) return 'up'
  if (change < -5) return 'down'
  return 'stable'
}