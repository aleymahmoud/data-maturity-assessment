import mysql from 'mysql2/promise';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function addDisplayOrderToRoles() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'data_maturity',
      charset: 'utf8mb4'
    });

    console.log('Connected to database\n');

    // Add display_order column
    console.log('Adding display_order column to roles table...');
    await connection.execute(`
      ALTER TABLE roles
      ADD COLUMN display_order INT DEFAULT 0
    `);
    console.log('✓ display_order column added\n');

    // Set display order for existing roles
    console.log('Setting display order for existing roles...');

    const roleOrders = [
      { id: 'executive', order: 1 },
      { id: 'it_technology', order: 2 },
      { id: 'bi_analytics', order: 3 },
      { id: 'business_managers', order: 4 },
      { id: 'data_governance', order: 5 }
    ];

    for (const role of roleOrders) {
      await connection.execute(`
        UPDATE roles SET display_order = ? WHERE id = ?
      `, [role.order, role.id]);
      console.log(`✓ Set display_order=${role.order} for ${role.id}`);
    }

    console.log('\n✓ All roles updated successfully');

    // Show final order
    console.log('\nFinal roles order:');
    const [rows] = await connection.execute(`
      SELECT id, title, display_order
      FROM roles
      ORDER BY display_order
    `);

    console.log('\nOrder\tID\t\t\tTitle');
    console.log('='.repeat(80));
    rows.forEach(role => {
      console.log(`${role.display_order}\t${role.id.padEnd(20)}\t${role.title}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    if (error.message.includes('Duplicate column name')) {
      console.log('\nNote: display_order column already exists. Updating orders only...');

      // Just update the orders
      const roleOrders = [
        { id: 'executive', order: 1 },
        { id: 'it_technology', order: 2 },
        { id: 'bi_analytics', order: 3 },
        { id: 'business_managers', order: 4 },
        { id: 'data_governance', order: 5 }
      ];

      for (const role of roleOrders) {
        await connection.execute(`
          UPDATE roles SET display_order = ? WHERE id = ?
        `, [role.order, role.id]);
        console.log(`✓ Set display_order=${role.order} for ${role.id}`);
      }
    }
  } finally {
    if (connection) await connection.end();
  }
}

addDisplayOrderToRoles();
