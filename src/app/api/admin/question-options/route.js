import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma.js'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const questionId = searchParams.get('question_id')

    if (!questionId) {
      return NextResponse.json({
        success: false,
        error: 'Question ID is required'
      }, { status: 400 })
    }

    const options = await prisma.answerOption.findMany({
      where: { questionId },
      orderBy: [
        { displayOrder: 'asc' },
        { scoreValue: 'asc' }
      ],
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
    const mappedOptions = options.map(opt => ({
      id: opt.id,
      question_id: opt.questionId,
      maturity_level_id: opt.maturityLevelId,
      maturity_level_number: opt.maturityLevel?.levelNumber,
      maturity_level_name: opt.maturityLevel?.name,
      maturity_level_color: opt.maturityLevel?.color,
      text: opt.text,
      text_ar: opt.textAr,
      score_value: opt.scoreValue,
      display_order: opt.displayOrder,
      is_special: opt.isSpecial || false,
      special_type: opt.specialType || null
    }))

    return NextResponse.json({
      success: true,
      options: mappedOptions
    })

  } catch (error) {
    console.error('Error fetching question options:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch question options'
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
      display_order,
      is_special,
      special_type
    } = body

    // For special options (NA/NS), maturity_level_id is not required
    const isSpecialOption = is_special === true || special_type === 'NA' || special_type === 'NS'

    if (!question_id || !text) {
      return NextResponse.json({
        success: false,
        error: 'Question ID and text are required'
      }, { status: 400 })
    }

    if (!isSpecialOption && !maturity_level_id) {
      return NextResponse.json({
        success: false,
        error: 'Maturity level ID is required for scoring options'
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

    // If not a special option, verify maturity level exists
    let maturityLevel = null
    if (!isSpecialOption && maturity_level_id) {
      maturityLevel = await prisma.maturityLevel.findUnique({
        where: { id: maturity_level_id }
      })

      if (!maturityLevel) {
        return NextResponse.json({
          success: false,
          error: 'Maturity level not found'
        }, { status: 404 })
      }
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
        maturityLevelId: isSpecialOption ? null : maturity_level_id,
        text,
        textAr: text_ar || null,
        scoreValue: isSpecialOption ? 0 : (parseInt(score_value) || maturityLevel?.levelNumber || 1),
        displayOrder: parseInt(order),
        isSpecial: isSpecialOption,
        specialType: isSpecialOption ? special_type : null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Option created successfully',
      option: newOption
    })

  } catch (error) {
    console.error('Error creating option:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create option',
      details: error.message
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
      display_order,
      is_special,
      special_type
    } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Option ID is required'
      }, { status: 400 })
    }

    const isSpecialOption = is_special === true || special_type === 'NA' || special_type === 'NS'

    const updateData = {
      text: text || undefined,
      textAr: text_ar,
      displayOrder: display_order !== undefined ? parseInt(display_order) : undefined,
      isSpecial: isSpecialOption,
      specialType: isSpecialOption ? special_type : null
    }

    if (isSpecialOption) {
      updateData.maturityLevelId = null
      updateData.scoreValue = 0
    } else {
      if (maturity_level_id) {
        updateData.maturityLevelId = maturity_level_id
      }
      if (score_value !== undefined) {
        updateData.scoreValue = parseInt(score_value)
      }
    }

    const updatedOption = await prisma.answerOption.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      message: 'Option updated successfully',
      option: updatedOption
    })

  } catch (error) {
    console.error('Error updating option:', error)

    if (error.code === 'P2025') {
      return NextResponse.json({
        success: false,
        error: 'Option not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update option'
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
        error: 'Option ID is required'
      }, { status: 400 })
    }

    await prisma.answerOption.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Option deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting option:', error)

    if (error.code === 'P2025') {
      return NextResponse.json({
        success: false,
        error: 'Option not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to delete option'
    }, { status: 500 })
  }
}

// Bulk create/replace options for a question
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
      data: options.map((opt, index) => {
        const isSpecialOption = opt.is_special === true || opt.special_type === 'NA' || opt.special_type === 'NS'
        return {
          questionId: question_id,
          maturityLevelId: isSpecialOption ? null : opt.maturity_level_id,
          text: opt.text,
          textAr: opt.text_ar || null,
          scoreValue: isSpecialOption ? 0 : (parseInt(opt.score_value) || index + 1),
          displayOrder: parseInt(opt.display_order) || index + 1,
          isSpecial: isSpecialOption,
          specialType: isSpecialOption ? opt.special_type : null
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: `${createdOptions.count} options created successfully`
    })

  } catch (error) {
    console.error('Error bulk creating options:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create options'
    }, { status: 500 })
  }
}
