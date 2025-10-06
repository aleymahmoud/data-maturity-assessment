import { NextResponse } from 'next/server'
import { openDatabase } from '../../../../lib/database.js'

export async function GET(request) {
  try {
    const database = await openDatabase()

    const [domains] = await database.execute(`
      SELECT * FROM domains
      ORDER BY display_order
    `)

    return NextResponse.json({
      success: true,
      domains: domains
    })

  } catch (error) {
    console.error('Error fetching domains:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch domains'
    }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const database = await openDatabase()
    const body = await request.json()

    const { id, name_en, name_ar, description_en, description_ar, display_order } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Domain ID is required'
      }, { status: 400 })
    }

    await database.execute(`
      UPDATE domains
      SET name_en = ?,
          name_ar = ?,
          description_en = ?,
          description_ar = ?,
          display_order = ?
      WHERE id = ?
    `, [name_en, name_ar, description_en, description_ar, display_order, id])

    return NextResponse.json({
      success: true,
      message: 'Domain updated successfully'
    })

  } catch (error) {
    console.error('Error updating domain:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update domain'
    }, { status: 500 })
  }
}
