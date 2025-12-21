import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma.js'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)

    // Get pagination parameters
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    const offset = (page - 1) * limit

    // Get filter parameters
    const subdomainId = searchParams.get('subdomain') || searchParams.get('subdomainId')
    const search = searchParams.get('search') || ''

    // Build where clause
    const where = {}

    if (subdomainId && subdomainId !== 'all') {
      where.subdomainId = subdomainId
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { titleAr: { contains: search, mode: 'insensitive' } },
        { text: { contains: search, mode: 'insensitive' } },
        { textAr: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get total count
    const totalQuestions = await prisma.question.count({ where })

    // Get questions with subdomain info
    const questions = await prisma.question.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
      skip: offset,
      take: limit,
      include: {
        subdomain: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            domain: {
              select: { id: true, name: true }
            }
          }
        },
        _count: {
          select: { answerOptions: true }
        }
      }
    })

    // Map to expected format
    const mappedQuestions = questions.map(q => ({
      id: q.id,
      code: q.code,
      title_en: q.title,
      title_ar: q.titleAr,
      text_en: q.text,
      text_ar: q.textAr,
      help_text: q.helpText,
      help_text_ar: q.helpTextAr,
      icon: q.icon,
      subdomain_id: q.subdomainId,
      subdomain_name_en: q.subdomain?.name,
      subdomain_name_ar: q.subdomain?.nameAr,
      domain_id: q.subdomain?.domain?.id,
      domain_name: q.subdomain?.domain?.name,
      display_order: q.displayOrder,
      is_required: q.isRequired,
      is_active: q.isActive,
      answer_count: q._count.answerOptions
    }))

    return NextResponse.json({
      success: true,
      questions: mappedQuestions,
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

export async function POST(request) {
  try {
    const body = await request.json()

    const {
      subdomain_id,
      code,
      title_en,
      title_ar,
      text_en,
      text_ar,
      help_text,
      help_text_ar,
      icon,
      display_order,
      is_required
    } = body

    if (!subdomain_id || !title_en || !text_en) {
      return NextResponse.json({
        success: false,
        error: 'Subdomain, title, and question text are required'
      }, { status: 400 })
    }

    // Verify subdomain exists
    const subdomain = await prisma.subdomain.findUnique({
      where: { id: subdomain_id }
    })

    if (!subdomain) {
      return NextResponse.json({
        success: false,
        error: 'Subdomain not found'
      }, { status: 404 })
    }

    // Get the next display order if not provided
    let order = display_order
    if (order === undefined || order === null) {
      const lastQuestion = await prisma.question.findFirst({
        orderBy: { displayOrder: 'desc' }
      })
      order = lastQuestion ? lastQuestion.displayOrder + 1 : 1
    }

    // Generate code if not provided
    let questionCode = code
    if (!questionCode) {
      const questionCount = await prisma.question.count()
      questionCode = `Q${questionCount + 1}`
    }

    const newQuestion = await prisma.question.create({
      data: {
        subdomainId: subdomain_id,
        code: questionCode,
        title: title_en,
        titleAr: title_ar || null,
        text: text_en,
        textAr: text_ar || null,
        helpText: help_text || null,
        helpTextAr: help_text_ar || null,
        icon: icon || '📋',
        displayOrder: parseInt(order),
        isRequired: is_required !== false,
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Question created successfully',
      question: {
        id: newQuestion.id,
        code: newQuestion.code,
        title_en: newQuestion.title,
        subdomain_id: newQuestion.subdomainId
      }
    })

  } catch (error) {
    console.error('Error creating question:', error)

    if (error.code === 'P2002' && error.meta?.target?.includes('code')) {
      return NextResponse.json({
        success: false,
        error: 'A question with this code already exists'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create question'
    }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()

    const {
      id,
      subdomain_id,
      code,
      title_en,
      title_ar,
      text_en,
      text_ar,
      help_text,
      help_text_ar,
      icon,
      display_order,
      is_required,
      is_active
    } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Question ID is required'
      }, { status: 400 })
    }

    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        subdomainId: subdomain_id || undefined,
        code: code || undefined,
        title: title_en || undefined,
        titleAr: title_ar,
        text: text_en || undefined,
        textAr: text_ar,
        helpText: help_text,
        helpTextAr: help_text_ar,
        icon: icon,
        displayOrder: display_order !== undefined ? parseInt(display_order) : undefined,
        isRequired: is_required !== undefined ? is_required : undefined,
        isActive: is_active !== undefined ? is_active : undefined
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Question updated successfully',
      question: updatedQuestion
    })

  } catch (error) {
    console.error('Error updating question:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update question'
    }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Question ID is required'
      }, { status: 400 })
    }

    // Delete question (cascade will delete answer options)
    await prisma.question.delete({
      where: { id }
    })

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
