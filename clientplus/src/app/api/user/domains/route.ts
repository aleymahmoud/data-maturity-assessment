// src/app/api/user/domains/route.ts
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

    console.log('Fetching domains for user:', session.user.username)

    // Check if user is a super user or admin - they should see all domains
    const isSuperUser = session.user.role === 'SUPER_USER'
    const isAdmin = session.user.role === 'LEAD_CONSULTANT'

    let domains

    if (isSuperUser || isAdmin) {
      // Super users and admins can see all domains
      domains = await prisma.domain.findMany({
        select: {
          id: true,
          domainName: true,
        },
        orderBy: {
          domainName: 'asc'
        }
      })
      
      console.log(`Admin/Super user - returning all ${domains.length} domains`)
    } else {
      // Regular users only see their assigned domains
      const userDomains = await prisma.userDomain.findMany({
        where: {
          userId: session.user.id,
        },
        include: {
          domain: {
            select: {
              id: true,
              domainName: true,
            }
          }
        },
        orderBy: {
          domain: {
            domainName: 'asc'
          }
        }
      })

      // Extract the domain objects from the user domain relationships
      domains = userDomains.map(userDomain => userDomain.domain)
      
      console.log(`Regular user - returning ${domains.length} assigned domains`)
    }

    return NextResponse.json(domains)
  } catch (error) {
    console.error('Error fetching user domains:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch user domains',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}