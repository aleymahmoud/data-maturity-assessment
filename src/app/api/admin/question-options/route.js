import { NextResponse } from 'next/server'
import { openDatabase } from '../../../../lib/database.js'

export async function GET(request) {
  try {
    const database = await openDatabase()
    const { searchParams } = new URL(request.url)
    const questionId = searchParams.get('question_id')

    if (!questionId) {
      return NextResponse.json({
        success: false,
        error: 'Question ID is required'
      }, { status: 400 })
    }

    const [options] = await database.query(`
      SELECT * FROM question_options
      WHERE question_id = ?
      ORDER BY display_order, score_value
    `, [questionId])

    return NextResponse.json({
      success: true,
      options
    })

  } catch (error) {
    console.error('Error fetching question options:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch question options'
    }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const database = await openDatabase()
    const body = await request.json()

    const {
      id,
      option_text_en,
      option_text_ar,
      score_value,
      maturity_level,
      explanation_en,
      explanation_ar,
      display_order
    } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Option ID is required'
      }, { status: 400 })
    }

    await database.query(`
      UPDATE question_options
      SET option_text_en = ?,
          option_text_ar = ?,
          score_value = ?,
          maturity_level = ?,
          explanation_en = ?,
          explanation_ar = ?,
          display_order = ?
      WHERE id = ?
    `, [
      option_text_en, option_text_ar, score_value,
      maturity_level, explanation_en, explanation_ar,
      display_order, id
    ])

    return NextResponse.json({
      success: true,
      message: 'Option updated successfully'
    })

  } catch (error) {
    console.error('Error updating option:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update option'
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const database = await openDatabase()
    const body = await request.json()

    const {
      question_id,
      option_key,
      option_text_en,
      option_text_ar,
      score_value,
      maturity_level,
      explanation_en,
      explanation_ar,
      display_order
    } = body

    if (!question_id || !option_key || !option_text_en) {
      return NextResponse.json({
        success: false,
        error: 'Question ID, option key, and English text are required'
      }, { status: 400 })
    }

    // Generate option ID
    const id = `${question_id}_${option_key}`

    await database.query(`
      INSERT INTO question_options (
        id, question_id, option_key, option_text_en, option_text_ar,
        score_value, maturity_level, explanation_en, explanation_ar, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, question_id, option_key, option_text_en, option_text_ar || '',
      score_value, maturity_level, explanation_en || '', explanation_ar || '',
      display_order || 0
    ])

    return NextResponse.json({
      success: true,
      message: 'Option created successfully',
      id
    })

  } catch (error) {
    console.error('Error creating option:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create option'
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
        error: 'Option ID is required'
      }, { status: 400 })
    }

    await database.query('DELETE FROM question_options WHERE id = ?', [id])

    return NextResponse.json({
      success: true,
      message: 'Option deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting option:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete option'
    }, { status: 500 })
  }
}
