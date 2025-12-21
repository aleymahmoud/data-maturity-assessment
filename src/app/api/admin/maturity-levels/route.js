import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma.js'

export async function GET(request) {
  try {
    const levels = await prisma.maturityLevel.findMany({
      orderBy: { levelNumber: 'asc' }
    })

    // Map to expected format for frontend
    const mappedLevels = levels.map(level => ({
      id: level.id,
      level_number: level.levelNumber,
      name: level.name,
      name_ar: level.nameAr,
      description: level.description,
      description_ar: level.descriptionAr,
      min_score: level.minScore,
      max_score: level.maxScore,
      color: level.color,
      icon: level.icon,
      display_order: level.levelNumber
    }))

    return NextResponse.json({
      success: true,
      levels: mappedLevels,
      maturityLevels: mappedLevels // Also include for compatibility
    })

  } catch (error) {
    console.error('Error fetching maturity levels:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch maturity levels'
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()

    const {
      level_number,
      name,
      name_ar,
      description,
      description_ar,
      min_score,
      max_score,
      color,
      icon
    } = body

    if (!level_number || !name) {
      return NextResponse.json({
        success: false,
        error: 'Level number and name are required'
      }, { status: 400 })
    }

    // Check if level number already exists
    const existing = await prisma.maturityLevel.findUnique({
      where: { levelNumber: parseInt(level_number) }
    })

    if (existing) {
      return NextResponse.json({
        success: false,
        error: 'A maturity level with this number already exists'
      }, { status: 400 })
    }

    const newLevel = await prisma.maturityLevel.create({
      data: {
        levelNumber: parseInt(level_number),
        name,
        nameAr: name_ar || null,
        description: description || null,
        descriptionAr: description_ar || null,
        minScore: parseFloat(min_score) || 0,
        maxScore: parseFloat(max_score) || 0,
        color: color || '#6b7280',
        icon: icon || null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Maturity level created successfully',
      level: newLevel
    })

  } catch (error) {
    console.error('Error creating maturity level:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create maturity level'
    }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()

    const id = body.id
    const levelNumber = body.level_number || body.levelNumber
    const name = body.name
    const nameAr = body.name_ar || body.nameAr
    const description = body.description
    const descriptionAr = body.description_ar || body.descriptionAr
    const minScore = body.min_score ?? body.minScore
    const maxScore = body.max_score ?? body.maxScore
    const color = body.color
    const icon = body.icon

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Maturity level ID is required'
      }, { status: 400 })
    }

    const updatedLevel = await prisma.maturityLevel.update({
      where: { id },
      data: {
        levelNumber: levelNumber ? parseInt(levelNumber) : undefined,
        name: name || undefined,
        nameAr: nameAr,
        description: description,
        descriptionAr: descriptionAr,
        minScore: minScore !== undefined ? parseFloat(minScore) : undefined,
        maxScore: maxScore !== undefined ? parseFloat(maxScore) : undefined,
        color: color,
        icon: icon
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Maturity level updated successfully',
      level: updatedLevel
    })

  } catch (error) {
    console.error('Error updating maturity level:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update maturity level'
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
        error: 'Maturity level ID is required'
      }, { status: 400 })
    }

    // Check if this level is used by any answer options
    const usedByOptions = await prisma.answerOption.count({
      where: { maturityLevelId: id }
    })

    if (usedByOptions > 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot delete: This maturity level is used by ${usedByOptions} answer option(s)`
      }, { status: 400 })
    }

    await prisma.maturityLevel.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Maturity level deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting maturity level:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete maturity level'
    }, { status: 500 })
  }
}
