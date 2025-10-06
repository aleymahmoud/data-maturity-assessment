import { config } from 'dotenv';
config({ path: '.env.local' });

import mysql from 'mysql2/promise';

async function checkQuestionOptionsDuplicates() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('🔍 Checking for duplicate question options...');

    // Check for duplicate question_id + option_key combinations
    const [duplicates] = await connection.execute(`
      SELECT question_id, option_key, COUNT(*) as count
      FROM question_options
      GROUP BY question_id, option_key
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `);

    if (duplicates.length > 0) {
      console.log(`\n❌ Found ${duplicates.length} duplicate question_id/option_key combinations:`);
      duplicates.forEach(dup => {
        console.log(`  - Question ${dup.question_id}, Option ${dup.option_key}: ${dup.count} duplicates`);
      });
    } else {
      console.log('✅ No duplicate question_id/option_key combinations found');
    }

    // Check for duplicate IDs
    const [duplicateIds] = await connection.execute(`
      SELECT id, COUNT(*) as count
      FROM question_options
      GROUP BY id
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `);

    if (duplicateIds.length > 0) {
      console.log(`\n❌ Found ${duplicateIds.length} duplicate IDs:`);
      duplicateIds.forEach(dup => {
        console.log(`  - ID ${dup.id}: ${dup.count} duplicates`);
      });
    } else {
      console.log('✅ No duplicate IDs found');
    }

    // Show sample of question options
    console.log('\n📊 Sample of question options:');
    const [sample] = await connection.execute(`
      SELECT id, question_id, option_key, option_text_en
      FROM question_options
      ORDER BY question_id, option_key
      LIMIT 10
    `);

    sample.forEach(option => {
      console.log(`  - ID: ${option.id}, Q: ${option.question_id}, Option: ${option.option_key}, Text: ${option.option_text_en.substring(0, 50)}...`);
    });

    // Check total count
    const [totalCount] = await connection.execute('SELECT COUNT(*) as total FROM question_options');
    console.log(`\n📈 Total question options: ${totalCount[0].total}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkQuestionOptionsDuplicates();