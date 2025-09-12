// scripts/setup-assessment-codes-table.js
import Database from 'better-sqlite3'
import path from 'path'

const db = new Database(path.join(process.cwd(), 'data_maturity.db'))

// Create or update assessment_codes table
const setupAssessmentCodesTable = () => {
  try {
    // Check if table exists
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='assessment_codes'
    `).get()

    if (!tableExists) {
      console.log('📋 Creating assessment_codes table...')
      
      const createTableSQL = `
        CREATE TABLE assessment_codes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code TEXT UNIQUE NOT NULL,
          max_uses INTEGER,
          usage_count INTEGER DEFAULT 0,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          active INTEGER DEFAULT 1,
          description TEXT
        )
      `
      
      db.exec(createTableSQL)
      console.log('✅ Assessment codes table created successfully')
    } else {
      console.log('📋 Assessment codes table already exists, checking structure...')
      
      // Get current table structure
      const columns = db.prepare("PRAGMA table_info(assessment_codes)").all()
      const columnNames = columns.map(col => col.name)
      
      const requiredColumns = [
        { name: 'id', type: 'INTEGER', pk: true },
        { name: 'code', type: 'TEXT' },
        { name: 'max_uses', type: 'INTEGER' },
        { name: 'usage_count', type: 'INTEGER' },
        { name: 'expires_at', type: 'DATETIME' },
        { name: 'created_at', type: 'DATETIME' },
        { name: 'active', type: 'INTEGER' },
        { name: 'description', type: 'TEXT' }
      ]

      const missingColumns = requiredColumns.filter(req => !columnNames.includes(req.name))

      if (missingColumns.length > 0) {
        console.log('⚠️  Missing columns detected, updating table structure...')
        
        // Add missing columns
        for (const col of missingColumns) {
          if (col.name !== 'id') { // Can't add primary key column to existing table
            const defaultValue = col.name === 'active' ? 'DEFAULT 1' : 
                                col.name === 'usage_count' ? 'DEFAULT 0' :
                                col.name === 'created_at' ? 'DEFAULT CURRENT_TIMESTAMP' : ''
            
            try {
              db.exec(`ALTER TABLE assessment_codes ADD COLUMN ${col.name} ${col.type} ${defaultValue}`)
              console.log(`✅ Added column: ${col.name}`)
            } catch (error) {
              console.error(`❌ Error adding column ${col.name}:`, error.message)
            }
          }
        }
      } else {
        console.log('✅ Table structure is up to date')
      }
    }

    // Create some sample data if table is empty
    const count = db.prepare('SELECT COUNT(*) as count FROM assessment_codes').get().count
    
    if (count === 0) {
      console.log('📝 Adding sample assessment codes...')
      
      const sampleCodes = [
        {
          code: 'ABC123',
          max_uses: 50,
          usage_count: 12,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          description: 'Q4 Assessment Batch'
        },
        {
          code: 'XYZ789',
          max_uses: 25,
          usage_count: 25,
          expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
          description: 'Department Survey'
        },
        {
          code: 'DEF456',
          max_uses: 100,
          usage_count: 5,
          expires_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago (expired)
          description: 'Expired Test Code'
        }
      ]

      const insertStmt = db.prepare(`
        INSERT INTO assessment_codes (code, max_uses, usage_count, expires_at, created_at, active, description)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 1, ?)
      `)

      for (const code of sampleCodes) {
        try {
          insertStmt.run(code.code, code.max_uses, code.usage_count, code.expires_at, code.description)
          console.log(`✅ Added sample code: ${code.code}`)
        } catch (error) {
          console.error(`❌ Error adding sample code ${code.code}:`, error.message)
        }
      }
    }

    // Show final table info
    const finalCount = db.prepare('SELECT COUNT(*) as count FROM assessment_codes').get().count
    console.log(`📊 Assessment codes table now has ${finalCount} records`)

    // Show some sample data
    const sampleData = db.prepare(`
      SELECT code, max_uses, usage_count, expires_at, active,
        CASE 
          WHEN active = 0 THEN 'inactive'
          WHEN expires_at <= datetime('now') THEN 'expired'
          WHEN usage_count >= max_uses AND max_uses IS NOT NULL THEN 'used_up'
          ELSE 'active'
        END as status
      FROM assessment_codes 
      ORDER BY created_at DESC 
      LIMIT 3
    `).all()

    if (sampleData.length > 0) {
      console.log('\n📋 Sample codes:')
      console.table(sampleData)
    }

  } catch (error) {
    console.error('❌ Error setting up assessment codes table:', error)
    throw error
  }
}

// Run setup
const run = async () => {
  try {
    console.log('🚀 Setting up assessment codes table...\n')
    setupAssessmentCodesTable()
    console.log('\n✅ Assessment codes table setup completed!')
  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  } finally {
    db.close()
  }
}

run()