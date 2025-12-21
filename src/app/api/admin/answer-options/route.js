import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma.js'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const questionId = searchParams.get('questionId')

    if (!questionId) {
      return NextResponse.json({
        success: false,
        error: 'Question ID is required'
      }, { status: 400 })
    }

    const answerOptions = await prisma.answerOption.findMany({
      where: { questionId },
      orderBy: { displayOrder: 'asc' },
      include: {
        maturityLevel: {
          select: {
            id: true,
            levelNumber: true,
            name: true,
            color: true
          }
        }
      }
    })

    // Map to expected format
    const mappedOptions = answerOptions.map(opt => ({
      id: opt.id,
      question_id: opt.questionId,
      maturity_level_id: opt.maturityLevelId,
      maturity_level_number: opt.maturityLevel.levelNumber,
      maturity_level_name: opt.maturityLevel.name,
      maturity_level_color: opt.maturityLevel.color,
      text: opt.text,
      text_ar: opt.textAr,
      score_value: opt.scoreValue,
      display_order: opt.displayOrder
    }))

    return NextResponse.json({
      success: true,
      options: mappedOptions
    })

  } catch (error) {
    console.error('Error fetching answer options:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch answer options'
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()

    const {
      question_id,
      maturity_level_id,
      text,
      text_ar,
      score_value,
      display_order
    } = body

    if (!question_id || !maturity_level_id || !text) {
      return NextResponse.json({
        success: false,
        error: 'Question ID, maturity level ID, and text are required'
      }, { status: 400 })
    }

    // Verify question exists
    const question = await prisma.question.findUnique({
      where: { id: question_id }
    })

    if (!question) {
      return NextResponse.json({
        success: false,
        error: 'Question not found'
      }, { status: 404 })
    }

    // Verify maturity level exists
    const maturityLevel = await prisma.maturityLevel.findUnique({
      where: { id: maturity_level_id }
    })

    if (!maturityLevel) {
      return NextResponse.json({
        success: false,
        error: 'Maturity level not found'
      }, { status: 404 })
    }

    // Get the next display order if not provided
    let order = display_order
    if (order === undefined || order === null) {
      const lastOption = await prisma.answerOption.findFirst({
        where: { questionId: question_id },
        orderBy: { displayOrder: 'desc' }
      })
      order = lastOption ? lastOption.displayOrder + 1 : 1
    }

    const newOption = await prisma.answerOption.create({
      data: {
        questionId: question_id,
        maturityLevelId: maturity_level_id,
        text,
        textAr: text_ar || null,
        scoreValue: parseInt(score_value) || maturityLevel.levelNumber,
        displayOrder: parseInt(order)
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Answer option created successfully',
      option: newOption
    })

  } catch (error) {
    console.error('Error creating answer option:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create answer option'
    }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()

    const {
      id,
      maturity_level_id,
      text,
      text_ar,
      score_value,
      display_order
    } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Answer option ID is required'
      }, { status: 400 })
    }

    const updatedOption = await prisma.answerOption.update({
      where: { id },
      data: {
        maturityLevelId: maturity_level_id || undefined,
        text: text || undefined,
        textAr: text_ar,
        scoreValue: score_value !== undefined ? parseInt(score_value) : undefined,
        displayOrder: display_order !== undefined ? parseInt(display_order) : undefined
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Answer option updated successfully',
      option: updatedOption
    })

  } catch (error) {
    console.error('Error updating answer option:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update answer option'
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
        error: 'Answer option ID is required'
      }, { status: 400 })
    }

    await prisma.answerOption.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Answer option deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting answer option:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete answer option'
    }, { status: 500 })
  }
}

// Bulk create answer options for a question
export async function PATCH(request) {
  try {
    const body = await request.json()

    const { question_id, options } = body

    if (!question_id || !options || !Array.isArray(options)) {
      return NextResponse.json({
        success: false,
        error: 'Question ID and options array are required'
      }, { status: 400 })
    }

    // Delete existing options for this question
    await prisma.answerOption.deleteMany({
      where: { questionId: question_id }
    })

    // Create new options
    const createdOptions = await prisma.answerOption.createMany({
      data: options.map((opt, index) => ({
        questionId: question_id,
        maturityLevelId: opt.maturity_level_id,
        text: opt.text,
        textAr: opt.text_ar || null,
        scoreValue: parseInt(opt.score_value) || index + 1,
        displayOrder: parseInt(opt.display_order) || index + 1
      }))
    })

    return NextResponse.json({
      success: true,
      message: `${createdOptions.count} answer options created successfully`
    })

  } catch (error) {
    console.error('Error bulk creating answer options:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create answer options'
    }, { status: 500 })
  }
}
