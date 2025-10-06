import mysql from 'mysql2/promise';

async function checkQuestions() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'inwarallisfair',
    database: 'data_maturity'
  });

  try {
    // Get table structure
    const [columns] = await connection.execute('DESCRIBE questions');
    console.log('\n=== QUESTIONS TABLE STRUCTURE ===');
    console.table(columns);

    // Get total count
    const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM questions');
    console.log('\n=== TOTAL QUESTIONS ===');
    console.log('Total:', countResult[0].total);

    // Get sample questions
    const [questions] = await connection.execute('SELECT * FROM questions LIMIT 3');
    console.log('\n=== SAMPLE QUESTIONS ===');
    console.log(JSON.stringify(questions, null, 2));

    // Get subdomains distribution
    const [subdomains] = await connection.execute(`
      SELECT subdomain_id, COUNT(*) as count
      FROM questions
      GROUP BY subdomain_id
      ORDER BY subdomain_id
    `);
    console.log('\n=== QUESTIONS BY SUBDOMAIN ===');
    console.table(subdomains);

  } finally {
    await connection.end();
  }
}

checkQuestions().catch(console.error);
