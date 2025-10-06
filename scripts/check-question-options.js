import mysql from 'mysql2/promise';

async function checkQuestionOptions() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'inwarallisfair',
    database: 'data_maturity'
  });

  try {
    // Get table structure
    const [columns] = await connection.execute('DESCRIBE question_options');
    console.log('\n=== QUESTION_OPTIONS TABLE STRUCTURE ===');
    console.table(columns);

    // Get total count
    const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM question_options');
    console.log('\n=== TOTAL OPTIONS ===');
    console.log('Total:', countResult[0].total);

    // Get sample options for one question
    const [options] = await connection.execute(`
      SELECT * FROM question_options
      WHERE question_id = 'Q1'
      ORDER BY score_value
    `);
    console.log('\n=== SAMPLE OPTIONS FOR Q1 ===');
    console.log(JSON.stringify(options, null, 2));

    // Get distinct score values
    const [scores] = await connection.execute(`
      SELECT DISTINCT score_value, COUNT(*) as count
      FROM question_options
      GROUP BY score_value
      ORDER BY score_value
    `);
    console.log('\n=== SCORE DISTRIBUTION ===');
    console.table(scores);

  } finally {
    await connection.end();
  }
}

checkQuestionOptions().catch(console.error);
