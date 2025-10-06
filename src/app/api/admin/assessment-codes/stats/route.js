import { NextResponse } from 'next/server'
import { openDatabase } from '../../../../../lib/database.js'

export async function GET(request) {
  try {
    const database = await openDatabase()
    const { searchParams } = new URL(request.url)

    // Get query parameters for filtering
    const status = searchParams.get('status') || 'all'
    const type = searchParams.get('type') || 'all'
    const organization = searchParams.get('organization') || 'all'

    // Build WHERE clause for filtering
    let whereConditions = []
    let params = []

    if (organization && organization !== 'all') {
      whereConditions.push('organization_name = ?')
      params.push(organization)
    }

    if (type && type !== 'all') {
      whereConditions.push('assessment_type = ?')
      params.push(type)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Get all codes to calculate statuses
    const query = `SELECT * FROM assessment_codes ${whereClause}`
    const [codes] = await database.execute(query, params)

    // Calculate stats
    let total = 0
    let active = 0
    let inactive = 0
    let expired = 0
    let used_up = 0
    let expiring_soon = 0

    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    codes.forEach(code => {
      const expiresAt = new Date(code.expires_at)
      const isExpired = expiresAt < now
      const isUsedUp = code.usage_count >= code.max_uses
      const isManuallyInactive = code.is_active === 0

      let codeStatus = 'active'
      if (isExpired) {
        codeStatus = 'expired'
        expired++
      } else if (isUsedUp) {
        codeStatus = 'used_up'
        used_up++
      } else if (isManuallyInactive) {
        codeStatus = 'inactive'
        inactive++
      } else {
        active++

        // Check if expiring soon (within 30 days)
        if (expiresAt <= thirtyDaysFromNow) {
          expiring_soon++
        }
      }

      // Apply status filter
      if (status === 'all' || status === codeStatus) {
        total++
      }
    })

    // If a specific status filter is applied, recalculate counts
    if (status !== 'all') {
      total = codes.filter(code => {
        const expiresAt = new Date(code.expires_at)
        const isExpired = expiresAt < now
        const isUsedUp = code.usage_count >= code.max_uses
        const isManuallyInactive = code.is_active === 0

        let codeStatus = 'active'
        if (isExpired) codeStatus = 'expired'
        else if (isUsedUp) codeStatus = 'used_up'
        else if (isManuallyInactive) codeStatus = 'inactive'

        return codeStatus === status
      }).length

      // Reset other stats when filtering by status
      active = status === 'active' ? total : 0
      inactive = status === 'inactive' ? total : 0
      expired = status === 'expired' ? total : 0
      used_up = status === 'used_up' ? total : 0
      expiring_soon = 0
    } else {
      total = codes.length
    }

    return NextResponse.json({
      stats: {
        total,
        active,
        inactive,
        expired,
        used_up,
        expiring_soon
      }
    })

  } catch (error) {
    console.error('Error fetching assessment codes stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}