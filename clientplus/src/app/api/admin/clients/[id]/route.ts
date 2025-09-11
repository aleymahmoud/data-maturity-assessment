// src/app/api/admin/clients/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteParams = {
  params: Promise<{ id: string }>
}

// GET /api/admin/clients/[id] - Get client details with project history
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || !['SUPER_USER', 'LEAD_CONSULTANT'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await context.params
    const clientId = parseInt(id)
    
    // Get client details
    const client = await prisma.clientData.findUnique({
      where: { id: clientId }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Get project history
    const projectHistory = await prisma.histData.findMany({
      where: { client: client.clientName },
      orderBy: { createdAt: 'desc' },
      take: 50, // Latest 50 entries
      select: {
        id: true,
        year: true,
        monthNo: true,
        day: true,
        consultant: true,
        activityType: true,
        workingHours: true,
        notes: true,
        domain: true,
        subdomain: true,
        scope: true,
        createdAt: true
      }
    })

    // Get subdomain info
    const subdomain = await prisma.subdomain.findFirst({
      where: { subdomainName: client.clientName.toLowerCase().replace(/\s+/g, '-') },
      select: { 
        id: true, 
        subdomainName: true, 
        leadConsultant: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      client,
      subdomain,
      projectHistory,
      stats: {
        totalProjects: projectHistory.length,
totalHours: projectHistory.reduce((sum: number, entry :any) => sum + parseFloat(entry.workingHours.toString()), 0),
        uniqueConsultants: [...new Set(projectHistory.map((p:any) => p.consultant))].length
      }
    })

  } catch (error) {
    console.error('Error fetching client details:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch client details' 
    }, { status: 500 })
  }
}

// PUT /api/admin/clients/[id] - Update client details
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || !['SUPER_USER', 'LEAD_CONSULTANT'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await context.params
    const clientId = parseInt(id)
    const body = await request.json()
    const { clientName, type, status, activity } = body

    // Validation
    if (!clientName || !type) {
      return NextResponse.json({ 
        error: 'Client name and type are required' 
      }, { status: 400 })
    }

    // Check if client exists
    const existingClient = await prisma.clientData.findUnique({
      where: { id: clientId }
    })

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Check if new name conflicts with another client
    if (clientName !== existingClient.clientName) {
      const nameConflict = await prisma.clientData.findFirst({
        where: { 
          clientName,
          id: { not: clientId }
        }
      })

      if (nameConflict) {
        return NextResponse.json({ 
          error: 'Client with this name already exists' 
        }, { status: 400 })
      }
    }

    // Update client
    const updatedClient = await prisma.clientData.update({
      where: { id: clientId },
      data: {
        clientName,
        type,
        status,
        activity
      }
    })

    return NextResponse.json({ 
      message: 'Client updated successfully',
      client: updatedClient 
    })

  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json({ 
      error: 'Failed to update client' 
    }, { status: 500 })
  }
}

// DELETE /api/admin/clients/[id] - Deactivate client (soft delete)
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || !['SUPER_USER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized - Super User required' }, { status: 403 })
    }

    const { id } = await context.params
    const clientId = parseInt(id)
    
    // Check if client exists
    const existingClient = await prisma.clientData.findUnique({
      where: { id: clientId }
    })

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Deactivate client (soft delete)
    const deactivatedClient = await prisma.clientData.update({
      where: { id: clientId },
      data: { status: 'E' } // Set to "Ended"
    })

    return NextResponse.json({ 
      message: 'Client deactivated successfully',
      client: deactivatedClient 
    })

  } catch (error) {
    console.error('Error deactivating client:', error)
    return NextResponse.json({ 
      error: 'Failed to deactivate client' 
    }, { status: 500 })
  }
}