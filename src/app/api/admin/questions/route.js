import { NextResponse } from 'next/server'
import { openDatabase } from '../../../../lib/database.js'

export async function GET(request) {
  try {
    const database = await openDatabase()
    const { searchParams } = new URL(request.url)

    // Get pagination parameters
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    const offset = (page - 1) * limit

    // Get filter parameters
    const subdomain = searchParams.get('subdomain') || 'all'
    const priority = searchParams.get('priority') || 'all'
    const search = searchParams.get('search') || ''

    // Build WHERE clause
    let whereConditions = []
    let params = []

    if (subdomain && subdomain !== 'all') {
      whereConditions.push('q.subdomain_id = ?')
      params.push(subdomain)
    }

    if (priority && priority !== 'all') {
      whereConditions.push('q.priority = ?')
      params.push(priority)
    }

    if (search) {
      whereConditions.push('(q.title_en LIKE ? OR q.title_ar LIKE ? OR q.text_en LIKE ? OR q.text_ar LIKE ?)')
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern, searchPattern)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Get total count
    const [countResult] = await database.query(
      `SELECT COUNT(*) as total FROM questions q ${whereClause}`,
      params
    )
    const totalQuestions = countResult[0].total

    // Get questions with subdomain info
    const queryParams = [...params, limit, offset]
    const [questions] = await database.query(`
      SELECT
        q.*,
        s.name_en as subdomain_name_en,
        s.name_ar as subdomain_name_ar
      FROM questions q
      LEFT JOIN subdomains s ON q.subdomain_id = s.id
      ${whereClause}
      ORDER BY q.display_order
      LIMIT ? OFFSET ?
    `, queryParams)

    return NextResponse.json({
      success: true,
      questions,
      pagination: {
        page,
        limit,
        total: totalQuestions,
        totalPages: Math.ceil(totalQuestions / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch questions'
    }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const database = await openDatabase()
    const body = await request.json()

    const {
      id,
      title_en,
      title_ar,
      text_en,
      text_ar,
      scenario_en,
      scenario_ar,
      subdomain_id,
      display_order,
      priority,
      icon
    } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Question ID is required'
      }, { status: 400 })
    }

    await database.query(`
      UPDATE questions
      SET title_en = ?,
          title_ar = ?,
          text_en = ?,
          text_ar = ?,
          scenario_en = ?,
          scenario_ar = ?,
          subdomain_id = ?,
          display_order = ?,
          priority = ?,
          icon = ?
      WHERE id = ?
    `, [
      title_en, title_ar, text_en, text_ar,
      scenario_en, scenario_ar, subdomain_id,
      display_order, priority, icon, id
    ])

    return NextResponse.json({
      success: true,
      message: 'Question updated successfully'
    })

  } catch (error) {
    console.error('Error updating question:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update question'
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const database = await openDatabase()
    const body = await request.json()

    const {
      id,
      title_en,
      title_ar,
      text_en,
      text_ar,
      scenario_en,
      scenario_ar,
      subdomain_id,
      display_order,
      priority,
      icon
    } = body

    if (!id || !title_en || !text_en) {
      return NextResponse.json({
        success: false,
        error: 'ID, title, and text are required'
      }, { status: 400 })
    }

    await database.query(`
      INSERT INTO questions (
        id, title_en, title_ar, text_en, text_ar,
        scenario_en, scenario_ar, subdomain_id,
        display_order, priority, icon
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, title_en, title_ar || '', text_en, text_ar || '',
      scenario_en || '', scenario_ar || '', subdomain_id,
      display_order || 999, priority || 0, icon || '❓'
    ])

    return NextResponse.json({
      success: true,
      message: 'Question created successfully'
    })

  } catch (error) {
    console.error('Error creating question:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create question'
    }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const database = await openDatabase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Question ID is required'
      }, { status: 400 })
    }

    // Delete question options first (foreign key constraint)
    await database.query('DELETE FROM question_options WHERE question_id = ?', [id])

    // Delete question
    await database.query('DELETE FROM questions WHERE id = ?', [id])

    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting question:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete question'
    }, { status: 500 })
  }
}
