// src/app/api/domains/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  console.log('prisma object:', prisma) // Add this line
  try {
    const domains = await prisma.domain.findMany({
      select: {
        id: true,
        domainName: true,
      },
      orderBy: {
        id: 'asc'
      }
    })

    return NextResponse.json(domains)
  } catch (error) {
    console.error('Error fetching domains:', error)
    return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 })
  }
}