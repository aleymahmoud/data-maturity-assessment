import { NextResponse } from 'next/server'
import prisma from '../../../../../lib/prisma.js'

export async function GET(request) {
  try {
    // Get unique organizations using Prisma
    const codes = await prisma.assessmentCode.findMany({
      where: {
        organizationName: {
          not: null
        }
      },
      select: {
        organizationName: true
      },
      distinct: ['organizationName'],
      orderBy: {
        organizationName: 'asc'
      }
    })

    const orgList = codes
      .map(code => code.organizationName)
      .filter(name => name && name.trim() !== '')

    return NextResponse.json({ organizations: orgList })

  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
  }
}
