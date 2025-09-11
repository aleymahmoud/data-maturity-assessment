// src/app/api/subdomains/[domainId]/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateSubdomainAccess } from '@/lib/domainValidation'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ domainId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { domainId: domainIdString } = await params
    const domainId = parseInt(domainIdString)
    
    if (isNaN(domainId)) {
      return NextResponse.json({ error: 'Invalid domain ID' }, { status: 400 })
    }

    // SECURITY: First verify the domain exists and user has access to it
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
      select: { id: true, domainName: true }
    })

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 })
    }

    // For non-admin users, verify they have access to this domain
    if (session.user.role !== 'SUPER_USER' && session.user.role !== 'LEAD_CONSULTANT') {
      const userDomain = await prisma.userDomain.findFirst({
        where: {
          userId: session.user.id,
          domainId: domainId
        }
      })

      if (!userDomain) {
        console.warn(`User ${session.user.username} attempted to access subdomains for unauthorized domain: ${domain.domainName}`)
        return NextResponse.json({
          error: `You don't have access to domain '${domain.domainName}'`,
          domainName: domain.domainName
        }, { status: 403 })
      }
    }

    // Fetch subdomains for the domain
    const subdomains = await prisma.subdomain.findMany({
      where: {
        domainId: domainId
      },
      select: {
        id: true,
        subdomainName: true,
        leadConsultant: true,
      },
      orderBy: {
        subdomainName: 'asc'
      }
    })

    console.log(`Retrieved ${subdomains.length} subdomains for domain '${domain.domainName}' for user: ${session.user.username}`)

    return NextResponse.json(subdomains)
  } catch (error) {
    console.error('Error fetching subdomains:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch subdomains',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}