// src/app/api/admin/clients/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/clients - Fetch all clients with project history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || !['SUPER_USER', 'LEAD_CONSULTANT'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const type = searchParams.get('type') || 'all'

    // Build where clause
    const whereClause: any = {}
    
    if (search) {
      whereClause.clientName = {
        contains: search,
        //mode: 'insensitive'
      }
    }
    
    if (status !== 'all') {
      whereClause.status = status === 'active' ? 'A' : 'E'
    }
    
    if (type !== 'all') {
      whereClause.type = type
    }

    // Fetch clients with project statistics
    const clients = await prisma.clientData.findMany({
      where: whereClause,
      orderBy: { clientName: 'asc' },
      select: {
        id: true,
        clientName: true,
        type: true,
        status: true,
        activity: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Get project history stats for each client
    const clientsWithStats = await Promise.all(
      clients.map(async (client: any) => {
        const [projectCount, totalHours, lastActivity] = await Promise.all([
          // Count unique projects
          prisma.histData.count({
            where: { client: client.clientName }
          }),
          // Sum total hours
          prisma.histData.aggregate({
            where: { client: client.clientName },
            _sum: { workingHours: true }
          }),
          // Last activity date
          prisma.histData.findFirst({
            where: { client: client.clientName },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true, year: true, monthNo: true }
          })
        ])

        // Check if client has subdomain
        const subdomain = await prisma.subdomain.findFirst({
          where: { subdomainName: client.clientName.toLowerCase().replace(/\s+/g, '-') },
          select: { id: true, leadConsultant: true }
        })

        return {
          ...client,
          stats: {
            projectCount,
            totalHours: totalHours._sum.workingHours || 0,
            lastActivityDate: lastActivity?.createdAt || null,
            hasSubdomain: !!subdomain,
            leadConsultant: subdomain?.leadConsultant || null
          }
        }
      })
    )

    return NextResponse.json({ 
      clients: clientsWithStats,
      total: clients.length 
    })

  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch clients' 
    }, { status: 500 })
  }
}

// POST /api/admin/clients - Create new client with auto subdomain
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || !['SUPER_USER', 'LEAD_CONSULTANT'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { clientName, type, activity } = body

    // Validation
    if (!clientName || !type) {
      return NextResponse.json({ 
        error: 'Client name and type are required' 
      }, { status: 400 })
    }

    // Check if client already exists
    const existingClient = await prisma.clientData.findUnique({
      where: { clientName }
    })

    if (existingClient) {
      return NextResponse.json({ 
        error: 'Client with this name already exists' 
      }, { status: 400 })
    }

    // Start transaction for client + subdomain creation
    const result = await prisma.$transaction(async (tx:any) => {
      // 1. Create the client
      const newClient = await tx.clientData.create({
        data: {
          clientName,
          type,
          status: 'A', // Active by default
          activity: activity || 'Client'
        }
      })

      // 2. Ensure "Consulting" domain exists
      let consultingDomain = await tx.domain.findFirst({
        where: { domainName: 'Consulting' }
      })

      if (!consultingDomain) {
        consultingDomain = await tx.domain.create({
          data: { domainName: 'Consulting' }
        })
      }

      // 3. Create subdomain for the client
      const subdomainName = clientName.toLowerCase().replace(/\s+/g, '-')
      
      const newSubdomain = await tx.subdomain.create({
        data: {
          domainId: consultingDomain.id,
          subdomainName,
          leadConsultant: 'islam' // Auto-assign islam as lead consultant
        }
      })

      return { client: newClient, subdomain: newSubdomain }
    })

    return NextResponse.json({ 
      message: 'Client created successfully',
      client: result.client,
      subdomain: result.subdomain
    })

  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json({ 
      error: 'Failed to create client' 
    }, { status: 500 })
  }
}

