import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import Database from 'better-sqlite3'
import path from 'path'
import crypto from 'crypto'
import { authOptions } from '../../auth/[...nextauth]/route'

const db = new Database(path.join(process.cwd(), 'data_maturity.db'))

// GET - Fetch all assessment codes
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'

    let query = `
      SELECT 
        code,
        max_uses,
        usage_count,
        expires_at,
        created_at,
        active,
        description,
        organization_name,
        intended_recipient,
        assessment_type,
        CASE 
          WHEN active = 0 THEN 'inactive'
          WHEN expires_at <= datetime('now') THEN 'expired'
          WHEN usage_count >= max_uses AND max_uses IS NOT NULL THEN 'used_up'
          ELSE 'active'
        END as status
      FROM assessment_codes
      WHERE 1=1
    `

    const params = []

    if (search) {
      query += ` AND code LIKE ?`
      params.push(`%${search}%`)
    }

    if (status !== 'all') {
      switch (status) {
        case 'active':
          query += ` AND active = 1 AND expires_at > datetime('now') AND (usage_count < max_uses OR max_uses IS NULL)`
          break
        case 'expired':
          query += ` AND expires_at <= datetime('now')`
          break
        case 'used_up':
          query += ` AND usage_count >= max_uses AND max_uses IS NOT NULL`
          break
        case 'inactive':
          query += ` AND active = 0`
          break
      }
    }

    query += ` ORDER BY created_at DESC`

    const codes = db.prepare(query).all(...params)

    return NextResponse.json({ success: true, codes })

  } catch (error) {
    console.error('Get assessment codes error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Generate new assessment code
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { maxUses, expiresIn, description, assessmentType = 'full', generateBulk = false, bulkCount = 1 } = await request.json()

    // Validation
    if (!maxUses || maxUses < 1) {
      return NextResponse.json({ error: 'Max uses must be at least 1' }, { status: 400 })
    }

    if (!expiresIn || expiresIn < 1) {
      return NextResponse.json({ error: 'Expiration days must be at least 1' }, { status: 400 })
    }

    if (!['full', 'quick'].includes(assessmentType)) {
      return NextResponse.json({ error: 'Invalid assessment type' }, { status: 400 })
    }

    if (generateBulk && (!bulkCount || bulkCount < 1 || bulkCount > 100)) {
      return NextResponse.json({ error: 'Bulk count must be between 1 and 100' }, { status: 400 })
    }

    // Generate unique code
    const generateCode = () => {
      return crypto.randomBytes(4).toString('hex').toUpperCase()
    }

    // Calculate expiration date
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + parseInt(expiresIn))

    const numberOfCodes = generateBulk ? bulkCount : 1
    const generatedCodes = []

    // Insert new code(s)
    const insertStmt = db.prepare(`
      INSERT INTO assessment_codes (
        code, max_uses, usage_count, expires_at, created_at, active, description, 
        created_by, assessment_type
      )
      VALUES (?, ?, 0, ?, CURRENT_TIMESTAMP, 1, ?, 'admin', ?)
    `)

    for (let i = 0; i < numberOfCodes; i++) {
      let code = generateCode()
      
      // Ensure code is unique
      while (db.prepare('SELECT code FROM assessment_codes WHERE code = ?').get(code)) {
        code = generateCode()
      }

      // Insert the code
      insertStmt.run(code, maxUses, expiresAt.toISOString(), description || null, assessmentType)
      
      // Get the created code
      const newCode = db.prepare(`
        SELECT code, max_uses, usage_count, expires_at, created_at, active, description, assessment_type
        FROM assessment_codes 
        WHERE code = ?
      `).get(code)
      
      generatedCodes.push(newCode)
    }

    // Log the activity
    try {
      const logMessage = generateBulk 
        ? `Generated ${numberOfCodes} ${assessmentType} assessment codes with ${maxUses} uses each, expires ${expiresAt.toDateString()}`
        : `Generated ${assessmentType} assessment code ${generatedCodes[0].code} with ${maxUses} uses, expires ${expiresAt.toDateString()}`
      
      db.prepare(`
        INSERT INTO audit_logs (action, details, timestamp, user_type)
        VALUES (?, ?, CURRENT_TIMESTAMP, 'admin')
      `).run('code_generated', logMessage)
    } catch (logError) {
      console.error('Audit log error:', logError)
    }

    return NextResponse.json({ 
      success: true, 
      message: generateBulk 
        ? `${numberOfCodes} assessment codes generated successfully`
        : 'Assessment code generated successfully',
      codes: generatedCodes,
      code: generatedCodes[0] // For backward compatibility
    })

  } catch (error) {
    console.error('Generate assessment code error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete assessment code
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    // Get code info before deletion
    const codeInfo = db.prepare('SELECT code FROM assessment_codes WHERE code = ?').get(code)
    
    if (!codeInfo) {
      return NextResponse.json({ error: 'Assessment code not found' }, { status: 404 })
    }

    // Delete the code
    const deleteStmt = db.prepare('DELETE FROM assessment_codes WHERE code = ?')
    const result = deleteStmt.run(code)

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Assessment code not found' }, { status: 404 })
    }

    // Log the activity
    try {
      db.prepare(`
        INSERT INTO audit_logs (action, details, timestamp, user_type)
        VALUES (?, ?, CURRENT_TIMESTAMP, 'admin')
      `).run('code_deleted', `Deleted assessment code ${codeInfo.code}`)
    } catch (logError) {
      console.error('Audit log error:', logError)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Assessment code deleted successfully' 
    })

  } catch (error) {
    console.error('Delete assessment code error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}