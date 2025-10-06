import { openDatabase } from '../src/lib/database.js';

async function checkColumns() {
  try {
    const database = await openDatabase();

    const [columns] = await database.query('DESCRIBE assessment_sessions');

    console.log('Columns in assessment_sessions table:');
    console.table(columns);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkColumns();
