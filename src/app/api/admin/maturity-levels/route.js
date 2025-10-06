import { NextResponse } from 'next/server'
import { openDatabase } from '../../../../lib/database.js'

export async function GET(request) {
  try {
    const database = await openDatabase()

    const [levels] = await database.execute(`
      SELECT * FROM maturity_levels
      ORDER BY level_number
    `)

    // Map database columns to expected property names
    const mappedLevels = levels.map(level => ({
      id: level.level_number,
      name: level.level_name,
      description: level.level_description_en,
      description_ar: level.level_description_ar,
      min_score: parseFloat(level.score_range_min),
      max_score: parseFloat(level.score_range_max),
      color: level.color_code,
      display_order: level.level_number
    }))

    return NextResponse.json({
      success: true,
      levels: mappedLevels
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
    const database = await openDatabase()
    const body = await request.json()

    const {
      level_number,
      level_name,
      level_description_en,
      level_description_ar,
      score_range_min,
      score_range_max,
      color_code
    } = body

    if (!level_number || !level_name) {
      return NextResponse.json({
        success: false,
        error: 'Level number and name are required'
      }, { status: 400 })
    }

    await database.execute(`
      INSERT INTO maturity_levels (
        level_number, level_name, level_description_en, level_description_ar,
        score_range_min, score_range_max, color_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      level_number, level_name, level_description_en, level_description_ar,
      score_range_min, score_range_max, color_code
    ])

    return NextResponse.json({
      success: true,
      message: 'Maturity level created successfully'
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
    const database = await openDatabase()
    const body = await request.json()

    // Map from frontend property names to database column names
    const level_number = body.id || body.level_number
    const level_name = body.name || body.level_name
    const level_description_en = body.description || body.level_description_en
    const level_description_ar = body.description_ar || body.level_description_ar
    const score_range_min = body.min_score || body.score_range_min
    const score_range_max = body.max_score || body.score_range_max
    const color_code = body.color || body.color_code

    if (!level_number) {
      return NextResponse.json({
        success: false,
        error: 'Level number is required'
      }, { status: 400 })
    }

    await database.execute(`
      UPDATE maturity_levels
      SET level_name = ?,
          level_description_en = ?,
          level_description_ar = ?,
          score_range_min = ?,
          score_range_max = ?,
          color_code = ?
      WHERE level_number = ?
    `, [
      level_name, level_description_en, level_description_ar || '',
      score_range_min, score_range_max, color_code, level_number
    ])

    return NextResponse.json({
      success: true,
      message: 'Maturity level updated successfully'
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
    const database = await openDatabase()
    const { searchParams } = new URL(request.url)
    const level_number = searchParams.get('level_number')

    if (!level_number) {
      return NextResponse.json({
        success: false,
        error: 'Level number is required'
      }, { status: 400 })
    }

    await database.execute(`
      DELETE FROM maturity_levels
      WHERE level_number = ?
    `, [level_number])

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
