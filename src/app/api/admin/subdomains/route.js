import { NextResponse } from 'next/server'
import { openDatabase } from '../../../../lib/database.js'

export async function GET(request) {
  try {
    const database = await openDatabase()

    const [subdomains] = await database.query(`
      SELECT
        s.*,
        d.name_en as domain_name_en,
        d.name_ar as domain_name_ar
      FROM subdomains s
      LEFT JOIN domains d ON s.domain_id = d.id
      ORDER BY s.display_order
    `)

    return NextResponse.json({
      success: true,
      subdomains
    })

  } catch (error) {
    console.error('Error fetching subdomains:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch subdomains'
    }, { status: 500 })
  }
}
