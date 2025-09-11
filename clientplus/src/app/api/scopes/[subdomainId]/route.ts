// src/app/api/scopes/[subdomainId]/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateSubdomainAccess } from '@/lib/domainValidation'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ subdomainId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subdomainId: subdomainIdString } = await params
    const subdomainId = parseInt(subdomainIdString)
    
    if (isNaN(subdomainId)) {
      return NextResponse.json({ error: 'Invalid subdomain ID' }, { status: 400 })
    }

    // SECURITY: Verify the subdomain exists and user has access to its parent domain
    const subdomain = await prisma.subdomain.findUnique({
      where: { id: subdomainId },
      include: {
        domain: {
          select: { id: true, domainName: true }
        }
      }
    })

    if (!subdomain) {
      return NextResponse.json({ error: 'Subdomain not found' }, { status: 404 })
    }

    // For non-admin users, verify they have access to the parent domain
    if (session.user.role !== 'SUPER_USER' && session.user.role !== 'LEAD_CONSULTANT') {
      const userDomain = await prisma.userDomain.findFirst({
        where: {
          userId: session.user.id,
          domainId: subdomain.domain.id
        }
      })

      if (!userDomain) {
        console.warn(`User ${session.user.username} attempted to access scopes for unauthorized subdomain: ${subdomain.subdomainName} in domain: ${subdomain.domain.domainName}`)
        return NextResponse.json({
          error: `You don't have access to domain '${subdomain.domain.domainName}' required for this subdomain`,
          domainName: subdomain.domain.domainName,
          subdomainName: subdomain.subdomainName
        }, { status: 403 })
      }
    }

    // Fetch scopes for the subdomain
    const scopes = await prisma.scope.findMany({
      where: {
        subdomainId: subdomainId
      },
      select: {
        id: true,
        scopeName: true,
        createdBy: true,
      },
      orderBy: {
        scopeName: 'asc'
      }
    })

    console.log(`Retrieved ${scopes.length} scopes for subdomain '${subdomain.subdomainName}' in domain '${subdomain.domain.domainName}' for user: ${session.user.username}`)

    return NextResponse.json(scopes)
  } catch (error) {
    console.error('Error fetching scopes:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch scopes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}