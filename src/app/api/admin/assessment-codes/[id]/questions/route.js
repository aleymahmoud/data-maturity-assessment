import { NextResponse } from 'next/server'
import prisma from '../../../../../../lib/prisma.js'

export async function GET(request, { params }) {
  try {
    const { id } = await params

    // Get the assessment code with its question_list
    const code = await prisma.assessmentCode.findUnique({
      where: { code: id },
      select: {
        questionList: true
      }
    })

    if (!code) {
      return NextResponse.json({
        success: false,
        error: 'Assessment code not found'
      }, { status: 404 })
    }

    // Parse question list
    let questionList = []
    if (code.questionList) {
      if (typeof code.questionList === 'string') {
        try {
          questionList = JSON.parse(code.questionList)
        } catch {
          questionList = code.questionList.split(',').map(q => q.trim()).filter(q => q)
        }
      } else if (Array.isArray(code.questionList)) {
        questionList = code.questionList
      }
    }

    // If no question list or empty, return empty array
    if (!questionList || questionList.length === 0) {
      return NextResponse.json({
        success: true,
        questions: [],
        stats: { total_questions: 0 }
      })
    }

    // Since questions are stored statically, we'll return basic info
    // Format question data for display
    const questions = questionList.map((questionId, index) => ({
      id: questionId,
      title_en: `Question ${questionId.replace('Q', '')}`,
      text_en: `Assessment question ${questionId}`,
      icon: '📋',
      display_order: index + 1,
      domain_name_en: 'Assessment',
      subdomain_name_en: 'General'
    }))

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
