import { NextResponse } from 'next/server'
import { openDatabase } from '../../../../../../lib/database.js'

export async function GET(request, { params }) {
  try {
    const database = await openDatabase()
    const { id } = await params

    // First, get the assessment code with its question_list
    const [codes] = await database.query(`
      SELECT question_list
      FROM assessment_codes
      WHERE code = ?
    `, [id])

    if (codes.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Assessment code not found'
      }, { status: 404 })
    }

    const questionList = codes[0].question_list

    // If no question list or empty, return empty array
    if (!questionList || questionList.length === 0) {
      return NextResponse.json({
        success: true,
        questions: [],
        stats: { total_questions: 0 }
      })
    }

    // Get question details for all questions in the list
    const placeholders = questionList.map(() => '?').join(',')
    const [questions] = await database.query(`
      SELECT
        q.id,
        q.title_en,
        q.title_ar,
        q.text_en,
        q.text_ar,
        q.icon,
        q.display_order,
        s.name_en as subdomain_name_en,
        s.name_ar as subdomain_name_ar,
        d.name_en as domain_name_en,
        d.name_ar as domain_name_ar,
        d.display_order as domain_order,
        s.display_order as subdomain_order
      FROM questions q
      LEFT JOIN subdomains s ON q.subdomain_id = s.id
      LEFT JOIN domains d ON s.domain_id = d.id
      WHERE q.id IN (${placeholders})
      ORDER BY d.display_order, s.display_order, q.display_order
    `, questionList)

    return NextResponse.json({
      success: true,
      questions,
      stats: { total_questions: questions.length }
    })

  } catch (error) {
    console.error('Error fetching questions for assessment code:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch questions'
    }, { status: 500 })
  }
}
