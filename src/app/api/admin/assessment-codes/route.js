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

      // Get questions based on assessment type
      const questions = await prisma.question.findMany({
        where: {
          isActive: true,
          assessmentTypes: {
            contains: assessmentType // "full" or "quick"
          }
        },
        select: {
          code: true
        },
        orderBy: {
          displayOrder: 'asc'
        }
      })

      const questionList = JSON.stringify(
        questions.map(q => q.code).filter(code => code !== null)
      )

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
    const force = searchParams.get('force') === 'true' // Allow force delete with cascade

    if (!code) {
      return NextResponse.json({ error: 'Code parameter is required' }, { status: 400 })
    }

    const existing = await prisma.assessmentCode.findUnique({
      where: { code },
      include: {
        sessions: true,
        responses: true,
        results: true
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Assessment code not found' }, { status: 404 })
    }

    // Check if there are any sessions, responses, or results
    const hasRelatedData = existing.sessions.length > 0 || existing.responses.length > 0 || existing.results.length > 0

    if (hasRelatedData && !force) {
      // Return detailed information about what's preventing deletion
      return NextResponse.json({
        error: 'Cannot delete assessment code with associated data',
        details: {
          sessions: existing.sessions.length,
          responses: existing.responses.length,
          results: existing.results.length,
          isUsed: existing.isUsed
        },
        message: 'This code has associated assessment data. Delete with force=true to cascade delete all related data.'
      }, { status: 400 })
    }

    // If force delete, cascade delete all related data
    if (force && hasRelatedData) {
      // Delete in order to respect foreign key constraints
      // First delete responses (they reference sessions)
      if (existing.responses.length > 0) {
        await prisma.userResponse.deleteMany({
          where: { assessmentCode: code }
        })
      }

      // Delete sessions
      if (existing.sessions.length > 0) {
        await prisma.assessmentSession.deleteMany({
          where: { code }
        })
      }

      // Delete results
      if (existing.results.length > 0) {
        await prisma.assessmentResult.deleteMany({
          where: { assessmentCode: code }
        })
      }
    }

    // Finally delete the assessment code
    await prisma.assessmentCode.delete({
      where: { code }
    })

    return NextResponse.json({
      message: 'Assessment code deleted successfully',
      cascadeDeleted: force && hasRelatedData
    })

  } catch (error) {
    console.error('Error deleting assessment code:', error)
    return NextResponse.json({
      error: 'Failed to delete assessment code',
      details: error.message
    }, { status: 500 })
  }
}
