import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma.js'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const organization = searchParams.get('organization') || ''
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const search = searchParams.get('search') || ''

    const offset = (page - 1) * limit

    // Build Prisma where clause
    const where = {}

    if (organization && organization !== 'all') {
      where.organizationName = organization
    }

    if (type && type !== 'all') {
      where.assessmentType = type
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { organizationName: { contains: search, mode: 'insensitive' } },
        { intendedRecipient: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get all codes matching criteria
    const allCodes = await prisma.assessmentCode.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    // Calculate status for each code
    const codesWithStatus = allCodes.map(code => {
      const now = new Date()
      const expiresAt = code.expiresAt ? new Date(code.expiresAt) : null
      const isExpired = expiresAt && expiresAt < now
      const isUsed = code.isUsed

      let codeStatus = 'active'
      if (isExpired) {
        codeStatus = 'expired'
      } else if (isUsed) {
        codeStatus = 'used_up'
      }

      return {
        code: code.code,
        organization_name: code.organizationName,
        intended_recipient: code.intendedRecipient,
        expires_at: code.expiresAt,
        is_used: code.isUsed,
        usage_count: code.usageCount,
        max_uses: 1, // Single use codes - schema doesn't have max_uses field
        assessment_type: code.assessmentType,
        question_list: code.questionList,
        created_at: code.createdAt,
        status: codeStatus,
        active: !isExpired && !isUsed
      }
    })

    // Apply status filter
    let filteredCodes = codesWithStatus
    if (status && status !== 'all') {
      filteredCodes = codesWithStatus.filter(code => code.status === status)
    }

    // Apply pagination
    const totalCount = filteredCodes.length
    const paginatedCodes = filteredCodes.slice(offset, offset + limit)

    return NextResponse.json({
      codes: paginatedCodes,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching assessment codes:', error)
    return NextResponse.json({ error: 'Failed to fetch assessment codes' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()

    const {
      organizationName,
      description,
      expiresIn,
      assessmentType = 'full',
      maxUses = 1,
      generateBulk = false,
      bulkCount = 1
    } = body

    if (!organizationName) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 })
    }

    // Calculate expiration date
    let expiresAt = null
    if (expiresIn && expiresIn > 0) {
      const expDate = new Date()
      expDate.setDate(expDate.getDate() + expiresIn)
      expiresAt = expDate
    }

    const codesToCreate = generateBulk ? bulkCount : 1
    const createdCodes = []

    for (let i = 0; i < codesToCreate; i++) {
      // Generate unique code
      let code
      let attempts = 0
      do {
        code = Math.random().toString(36).substring(2, 10).toUpperCase()
        attempts++

        const existing = await prisma.assessmentCode.findUnique({
          where: { code }
        })
        if (!existing) break

        if (attempts > 10) {
          throw new Error('Unable to generate unique code after multiple attempts')
        }
      } while (true)

      // For now, use a default question list (can be enhanced later)
      const questionList = JSON.stringify([
        'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10',
        'Q11', 'Q12', 'Q13', 'Q14', 'Q15', 'Q16', 'Q17', 'Q18', 'Q19', 'Q20',
        'Q21', 'Q22', 'Q23', 'Q24', 'Q25', 'Q26', 'Q27', 'Q28', 'Q29', 'Q30',
        'Q31', 'Q32', 'Q33', 'Q34', 'Q35'
      ])

      await prisma.assessmentCode.create({
        data: {
          code,
          organizationName,
          intendedRecipient: description || '',
          expiresAt,
          assessmentType,
          isUsed: false,
          usageCount: 0,
          questionList
        }
      })

      createdCodes.push({
        code,
        organizationName,
        description,
        expiresAt,
        assessmentType,
        maxUses,
        questionCount: 35
      })
    }

    return NextResponse.json({
      message: `${codesToCreate} assessment code(s) created successfully`,
      codes: createdCodes
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating assessment code:', error)
    return NextResponse.json({ error: 'Failed to create assessment code' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Code parameter is required' }, { status: 400 })
    }

    const existing = await prisma.assessmentCode.findUnique({
      where: { code }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Assessment code not found' }, { status: 404 })
    }

    if (existing.isUsed) {
      return NextResponse.json({ error: 'Cannot delete used assessment code' }, { status: 400 })
    }

    await prisma.assessmentCode.delete({
      where: { code }
    })

    return NextResponse.json({ message: 'Assessment code deleted successfully' })

  } catch (error) {
    console.error('Error deleting assessment code:', error)
    return NextResponse.json({ error: 'Failed to delete assessment code' }, { status: 500 })
  }
}
