import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import Database from 'better-sqlite3'
import path from 'path'
import { authOptions } from '../../../auth/[...nextauth]/route'

const db = new Database(path.join(process.cwd(), 'data_maturity.db'))

// PUT - Update assessment code (toggle active status or extend expiration)
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const code = params.id // This will be the code parameter
    const { action, maxUses, expiresIn, active } = await request.json()

    // Get existing code
    const existingCode = db.prepare('SELECT * FROM assessment_codes WHERE code = ?').get(code)
    
    if (!existingCode) {
      return NextResponse.json({ error: 'Assessment code not found' }, { status: 404 })
    }

    let updateQuery = 'UPDATE assessment_codes SET '
    let updateParams = []
    let logMessage = ''

    switch (action) {
      case 'toggle_status':
        updateQuery += 'active = ?'
        updateParams.push(active ? 1 : 0)
        logMessage = `${active ? 'Activated' : 'Deactivated'} assessment code ${existingCode.code}`
        break

      case 'extend_expiration':
        if (!expiresIn || expiresIn < 1) {
          return NextResponse.json({ error: 'Extension days must be at least 1' }, { status: 400 })
        }
        const newExpirationDate = new Date()
        newExpirationDate.setDate(newExpirationDate.getDate() + parseInt(expiresIn))
        
        updateQuery += 'expires_at = ?'
        updateParams.push(newExpirationDate.toISOString())
        logMessage = `Extended assessment code ${existingCode.code} expiration by ${expiresIn} days`
        break

      case 'update_limits':
        if (!maxUses || maxUses < 1) {
          return NextResponse.json({ error: 'Max uses must be at least 1' }, { status: 400 })
        }
        updateQuery += 'max_uses = ?'
        updateParams.push(maxUses)
        logMessage = `Updated assessment code ${existingCode.code} max uses to ${maxUses}`
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    updateQuery += ' WHERE code = ?'
    updateParams.push(code)

    // Execute update
    const result = db.prepare(updateQuery).run(...updateParams)

    if (result.changes === 0) {
      return NextResponse.json({ error: 'No changes made' }, { status: 400 })
    }

    // Get updated code
    const updatedCode = db.prepare(`
      SELECT 
        code,
        max_uses,
        usage_count,
        expires_at,
        created_at,
        active,
        description,
        CASE 
          WHEN active = 0 THEN 'inactive'
          WHEN expires_at <= datetime('now') THEN 'expired'
          WHEN usage_count >= max_uses AND max_uses IS NOT NULL THEN 'used_up'
          ELSE 'active'
        END as status
      FROM assessment_codes 
      WHERE code = ?
    `).get(code)

    // Log the activity
    try {
      db.prepare(`
        INSERT INTO audit_logs (action, details, timestamp, user_type)
        VALUES (?, ?, CURRENT_TIMESTAMP, 'admin')
      `).run('code_updated', logMessage)
    } catch (logError) {
      console.error('Audit log error:', logError)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Assessment code updated successfully',
      code: updatedCode
    })

  } catch (error) {
    console.error('Update assessment code error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}