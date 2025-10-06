const mysql = require('mysql2/promise');

async function checkAndFixSchema() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'inwarallisfair',
    database: 'data_maturity'
  });

  console.log('Checking intended_recipient column:');
  const [columns] = await connection.execute('DESCRIBE assessment_codes');
  const recipientCol = columns.find(col => col.Field === 'intended_recipient');
  console.log('intended_recipient column:', recipientCol);

  if (recipientCol && recipientCol.Null === 'NO') {
    console.log('\nFixing intended_recipient to allow NULL values...');
    await connection.execute('ALTER TABLE assessment_codes MODIFY COLUMN intended_recipient VARCHAR(255) NULL');
    console.log('✅ Fixed: intended_recipient now allows NULL values');
  }

  // Check if is_active column exists, if not add it
  const activeCol = columns.find(col => col.Field === 'is_active');
  if (!activeCol) {
    console.log('\nAdding is_active column for manual activation control...');
    await connection.execute('ALTER TABLE assessment_codes ADD COLUMN is_active TINYINT(1) DEFAULT 1 AFTER assessment_type');
    console.log('✅ Added: is_active column for manual deactivation');
  }

  console.log('\nUpdated table structure:');
  const [newColumns] = await connection.execute('DESCRIBE assessment_codes');
  newColumns.forEach(col => {
    if (col.Field === 'intended_recipient' || col.Field === 'is_active') {
      console.log(`  ${col.Field} - ${col.Type} - ${col.Null} - ${col.Default}`);
    }
  });

  await connection.end();
}

checkAndFixSchema().catch(console.error);