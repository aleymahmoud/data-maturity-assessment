import { NextResponse } from 'next/server'
import { openDatabase } from '../../../../lib/database.js'

export async function GET(request) {
  try {
    const database = await openDatabase()
    const { searchParams } = new URL(request.url)

    // Get query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const organization = searchParams.get('organization') || ''
    const status = searchParams.get('status') || ''
    const search = searchParams.get('search') || ''

    const offset = (page - 1) * limit

    // Ensure limit and offset are valid integers
    if (isNaN(limit) || isNaN(offset) || limit <= 0 || offset < 0) {
      return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 })
    }

    // Build WHERE clause
    let whereConditions = []
    let params = []

    if (organization && organization !== 'all') {
      whereConditions.push('organization_name = ?')
      params.push(organization)
    }

    if (status && status !== 'all') {
      if (status === 'used') {
        whereConditions.push('is_used = 1')
      } else if (status === 'unused') {
        whereConditions.push('is_used = 0')
      }
    }

    if (search) {
      whereConditions.push('(code LIKE ? OR organization_name LIKE ? OR intended_recipient LIKE ?)')
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Get total count
    const [countResult] = await database.execute(`
      SELECT COUNT(*) as total FROM assessment_codes ${whereClause}
    `, params)

    const totalCount = countResult[0].total

    // Get codes with pagination - use template literal for LIMIT/OFFSET since MySQL has issues with parameterized LIMIT
    const query = `
      SELECT * FROM assessment_codes
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    const [codes] = await database.execute(query, params)

    // Calculate status for each code
    const codesWithStatus = codes.map(code => {
      const now = new Date()
      const expiresAt = new Date(code.expires_at)
      const isExpired = expiresAt < now
      const isUsedUp = code.usage_count >= code.max_uses
      const isUsed = code.is_used
      const isManuallyInactive = code.is_active === 0

      let status = 'active'
      if (isExpired) {
        status = 'expired'
      } else if (isUsedUp) {
        status = 'used_up'
      } else if (isUsed) {
        status = 'used_up'
      } else if (isManuallyInactive) {
        status = 'inactive'
      }

      return {
        ...code,
        status,
        active: code.is_active === 1
      }
    })

    return NextResponse.json({
      codes: codesWithStatus,
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
    const database = await openDatabase()
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

    // Validate required fields
    if (!organizationName) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 })
    }

    // Calculate expiration date
    let expiresAt = null
    if (expiresIn && expiresIn > 0) {
      const expDate = new Date()
      expDate.setDate(expDate.getDate() + expiresIn)
      expiresAt = expDate.toISOString().split('T')[0] // Format as YYYY-MM-DD
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

        const [existing] = await database.execute('SELECT code FROM assessment_codes WHERE code = ?', [code])
        if (existing.length === 0) break

        if (attempts > 10) {
          throw new Error('Unable to generate unique code after multiple attempts')
        }
      } while (true)

      // Snapshot questions based on assessment type
      let questionList = []
      if (assessmentType === 'quick') {
        // Get priority 1 questions for quick assessments
        const [questions] = await database.execute(`
          SELECT id FROM questions
          WHERE priority = 1
          ORDER BY display_order
        `)
        questionList = questions.map(q => q.id)
      } else {
        // Get all questions for full assessments
        const [questions] = await database.execute(`
          SELECT id FROM questions
          ORDER BY display_order
        `)
        questionList = questions.map(q => q.id)
      }

      // Insert new code with snapshotted questions
      await database.execute(`
        INSERT INTO assessment_codes (
          code, organization_name, intended_recipient,
          expires_at, assessment_type, is_used,
          created_at, usage_count, created_by, max_uses, question_list
        ) VALUES (?, ?, ?, ?, ?, 0, NOW(), 0, ?, ?, ?)
      `, [
        code,
        organizationName,
        description || '',
        expiresAt,
        assessmentType,
        'api-admin',
        maxUses,
        JSON.stringify(questionList)
      ])

      createdCodes.push({
        code,
        organizationName,
        description,
        expiresAt,
        assessmentType,
        maxUses,
        questionCount: questionList.length
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
    const database = await openDatabase()
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Code parameter is required' }, { status: 400 })
    }

    // Check if code exists and is not used
    const [existing] = await database.execute('SELECT is_used FROM assessment_codes WHERE code = ?', [code])

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Assessment code not found' }, { status: 404 })
    }

    if (existing[0].is_used) {
      return NextResponse.json({ error: 'Cannot delete used assessment code' }, { status: 400 })
    }

    // Delete the code
    await database.execute('DELETE FROM assessment_codes WHERE code = ?', [code])

    return NextResponse.json({ message: 'Assessment code deleted successfully' })

  } catch (error) {
    console.error('Error deleting assessment code:', error)
    return NextResponse.json({ error: 'Failed to delete assessment code' }, { status: 500 })
  }
}