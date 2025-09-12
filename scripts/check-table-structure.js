// scripts/check-table-structure.js
import Database from 'better-sqlite3'
import path from 'path'

const db = new Database(path.join(process.cwd(), 'data_maturity.db'))

try {
  console.log('🔍 Checking assessment_codes table structure...\n')
  
  // Get table info
  const tableInfo = db.prepare("PRAGMA table_info(assessment_codes)").all()
  
  console.log('📋 Current table structure:')
  console.table(tableInfo)
  
  // Check if we can query basic columns
  console.log('\n🧪 Testing basic queries...')
  
  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM assessment_codes').get()
    console.log(`✅ Total records: ${count.count}`)
  } catch (error) {
    console.log(`❌ Error counting records: ${error.message}`)
  }
  
  try {
    const sample = db.prepare('SELECT * FROM assessment_codes LIMIT 1').get()
    console.log('\n📊 Sample record:')
    console.log(sample)
  } catch (error) {
    console.log(`❌ Error getting sample record: ${error.message}`)
  }
  
  // Test the corrected query
  try {
    console.log('\n🧪 Testing corrected query...')
    const query = `
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
      ORDER BY created_at DESC
    `
    
    const codes = db.prepare(query).all()
    console.log(`✅ Query successful! Found ${codes.length} records`)
    
    if (codes.length > 0) {
      console.log('\n📊 Sample results:')
      console.table(codes.slice(0, 3))
    }
    
  } catch (error) {
    console.log(`❌ Error with query: ${error.message}`)
  }
  
} catch (error) {
  console.error('❌ Error:', error)
} finally {
  db.close()
  console.log('\n✅ Database connection closed')
}