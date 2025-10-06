import mysql from 'mysql2/promise';

async function testQuery() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'inwarallisfair',
    database: 'data_maturity'
  });

  try {
    const page = 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    console.log('Testing questions query...');
    console.log('limit:', limit, 'offset:', offset);

    // Test with direct values
    const [questions1] = await connection.execute(`
      SELECT
        q.*,
        s.name_en as subdomain_name_en,
        s.name_ar as subdomain_name_ar
      FROM questions q
      LEFT JOIN subdomains s ON q.subdomain_id = s.id
      ORDER BY q.display_order
      LIMIT 10 OFFSET 0
    `);

    console.log('\n✓ Direct query works! Found', questions1.length, 'questions');

    // Test with parameters - ensure integers
    console.log('\nTesting with params:', [limit, offset], 'types:', typeof limit, typeof offset);

    const [questions2] = await connection.query(`
      SELECT
        q.*,
        s.name_en as subdomain_name_en,
        s.name_ar as subdomain_name_ar
      FROM questions q
      LEFT JOIN subdomains s ON q.subdomain_id = s.id
      ORDER BY q.display_order
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    console.log('✓ Parameterized query works! Found', questions2.length, 'questions');
    console.log('\nFirst question:', questions2[0]?.id, questions2[0]?.title_en);

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Error code:', error.code);
  } finally {
    await connection.end();
  }
}

testQuery();
