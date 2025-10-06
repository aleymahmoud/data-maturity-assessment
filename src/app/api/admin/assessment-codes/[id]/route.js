import { NextResponse } from 'next/server'
import { openDatabase } from '../../../../../lib/database.js'

export async function GET(request, { params }) {
  try {
    const database = await openDatabase()
    const { id } = await params

    const [codes] = await database.execute('SELECT * FROM assessment_codes WHERE code = ?', [id])

    if (codes.length === 0) {
      return NextResponse.json({ error: 'Assessment code not found' }, { status: 404 })
    }

    return NextResponse.json({ code: codes[0] })

  } catch (error) {
    console.error('Error fetching assessment code:', error)
    return NextResponse.json({ error: 'Failed to fetch assessment code' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const database = await openDatabase()
    const { id } = await params
    const body = await request.json()

    // Check if code exists first
    const [existing] = await database.execute('SELECT code FROM assessment_codes WHERE code = ?', [id])

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Assessment code not found' }, { status: 404 })
    }

    // Handle different actions
    const { action } = body

    if (action === 'toggle_status') {
      // Handle activate/deactivate toggle
      const { active } = body

      // Update the is_active column
      await database.execute(`
        UPDATE assessment_codes
        SET is_active = ?
        WHERE code = ?
      `, [active ? 1 : 0, id])

      return NextResponse.json({
        message: `Assessment code ${active ? 'activated' : 'deactivated'} successfully`
      })
    } else {
      // Handle regular update
      const {
        organization_name,
        intended_recipient,
        expires_in_days,
        assessment_type = 'full',
        max_uses = 1
      } = body

      // Validate required fields for regular update
      if (!organization_name) {
        return NextResponse.json({ error: 'Organization name is required' }, { status: 400 })
      }

      // Calculate expiration date if expires_in_days is provided
      let expiresAt = null
      if (expires_in_days && expires_in_days > 0) {
        const expDate = new Date()
        expDate.setDate(expDate.getDate() + parseInt(expires_in_days))
        expiresAt = expDate.toISOString().split('T')[0] // Format as YYYY-MM-DD
      }

      // Get the current assessment type to check if it's changing
      const [currentCode] = await database.execute('SELECT assessment_type FROM assessment_codes WHERE code = ?', [id])
      const currentType = currentCode[0]?.assessment_type

      // Generate new question list if assessment type is changing
      let questionList = null
      if (currentType !== assessment_type) {
        if (assessment_type === 'quick') {
          // Get priority questions only (priority = 1)
          const [questions] = await database.query(`
            SELECT id FROM questions
            WHERE priority = 1
            ORDER BY display_order
          `)
          questionList = JSON.stringify(questions.map(q => q.id))
        } else {
          // Get all questions for full assessment
          const [questions] = await database.query(`
            SELECT id FROM questions
            ORDER BY display_order
          `)
          questionList = JSON.stringify(questions.map(q => q.id))
        }
      }

      // Update the code
      if (questionList !== null) {
        // Update with new question list
        await database.execute(`
          UPDATE assessment_codes
          SET organization_name = ?, intended_recipient = ?, expires_at = ?, assessment_type = ?, max_uses = ?, question_list = ?
          WHERE code = ?
        `, [organization_name, intended_recipient || null, expiresAt || null, assessment_type, max_uses, questionList, id])
      } else {
        // Update without changing question list
        await database.execute(`
          UPDATE assessment_codes
          SET organization_name = ?, intended_recipient = ?, expires_at = ?, assessment_type = ?, max_uses = ?
          WHERE code = ?
        `, [organization_name, intended_recipient || null, expiresAt || null, assessment_type, max_uses, id])
      }

      return NextResponse.json({
        message: 'Assessment code updated successfully',
        questionListUpdated: questionList !== null
      })
    }

  } catch (error) {
    console.error('Error updating assessment code:', error)
    return NextResponse.json({ error: 'Failed to update assessment code' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const database = await openDatabase()
    const { id } = await params

    // Check if code exists and is not used
    const [existing] = await database.execute('SELECT is_used FROM assessment_codes WHERE code = ?', [id])

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Assessment code not found' }, { status: 404 })
    }

    if (existing[0].is_used) {
      return NextResponse.json({ error: 'Cannot delete used assessment code' }, { status: 400 })
    }

    // Delete the code
    await database.execute('DELETE FROM assessment_codes WHERE code = ?', [id])

    return NextResponse.json({ message: 'Assessment code deleted successfully' })

  } catch (error) {
    console.error('Error deleting assessment code:', error)
    return NextResponse.json({ error: 'Failed to delete assessment code' }, { status: 500 })
  }
}