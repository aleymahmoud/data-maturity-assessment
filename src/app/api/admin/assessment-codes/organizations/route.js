import { NextResponse } from 'next/server'
import { openDatabase } from '../../../../../lib/database.js'

export async function GET(request) {
  try {
    const database = await openDatabase()

    // Get unique organizations
    const [organizations] = await database.execute(`
      SELECT DISTINCT organization_name
      FROM assessment_codes
      WHERE organization_name IS NOT NULL
      ORDER BY organization_name
    `)

    const orgList = organizations.map(org => org.organization_name)

    return NextResponse.json({ organizations: orgList })

  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
  }
}