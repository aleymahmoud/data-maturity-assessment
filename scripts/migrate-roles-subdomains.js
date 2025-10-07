import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import { roles } from '../src/data/roles.js';
import { subdomainConfig } from '../src/data/questions.js';

// Load environment variables
config({ path: '.env.local' });

async function migrateRolesAndSubdomains() {
  let connection;

  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'data_maturity',
      charset: 'utf8mb4'
    });

    console.log('✅ Connected to database');

    // Create roles table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        examples JSON,
        estimated_time VARCHAR(50),
        dimension_count INT,
        icon VARCHAR(10),
        subdomains JSON,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Created roles table');

    console.log('✅ Subdomains table already exists');

    // Migrate roles data
    console.log('📦 Migrating roles data...');

    // Define display order for roles
    const roleDisplayOrder = {
      'executive': 1,
      'it_technology': 2,
      'bi_analytics': 3,
      'business_managers': 4,
      'data_governance': 5
    };

    for (const [roleId, roleData] of Object.entries(roles)) {
      const displayOrder = roleDisplayOrder[roleData.id] || 999;

      await connection.execute(`
        INSERT INTO roles (id, title, description, examples, estimated_time, dimension_count, icon, subdomains, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          title = VALUES(title),
          description = VALUES(description),
          examples = VALUES(examples),
          estimated_time = VALUES(estimated_time),
          dimension_count = VALUES(dimension_count),
          icon = VALUES(icon),
          subdomains = VALUES(subdomains),
          display_order = VALUES(display_order),
          updated_at = CURRENT_TIMESTAMP
      `, [
        roleData.id,
        roleData.title,
        roleData.description,
        JSON.stringify(roleData.examples),
        roleData.estimatedTime,
        roleData.dimensionCount,
        roleData.icon,
        JSON.stringify(roleData.subdomains),
        displayOrder
      ]);

      console.log(`  ✓ Migrated role: ${roleData.title} (display_order: ${displayOrder})`);
    }

    console.log('✅ Migrated all roles');

    // Migrate subdomains data (using existing table structure with name_en, name_ar, etc.)
    console.log('📦 Migrating subdomains data...');

    // First, get list of existing domain IDs from domains table
    const [domains] = await connection.execute('SELECT id FROM domains LIMIT 1');
    const defaultDomainId = domains[0]?.id || 'domain_1';

    let displayOrder = 1;
    for (const subdomain of subdomainConfig) {
      await connection.execute(`
        INSERT INTO subdomains (id, domain_id, name_en, name_ar, description_en, description_ar, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name_en = VALUES(name_en),
          description_en = VALUES(description_en),
          display_order = VALUES(display_order)
      `, [
        subdomain.id,
        defaultDomainId,
        subdomain.name,
        subdomain.name, // Using English name for Arabic as well for now
        subdomain.description,
        subdomain.description, // Using English description for Arabic as well for now
        displayOrder++
      ]);

      console.log(`  ✓ Migrated subdomain: ${subdomain.name}`);
    }

    console.log('✅ Migrated all subdomains');

    // Verify migration
    const [rolesCount] = await connection.execute('SELECT COUNT(*) as count FROM roles');
    const [subdomainsCount] = await connection.execute('SELECT COUNT(*) as count FROM subdomains');

    console.log('\n📊 Migration Summary:');
    console.log(`   Roles in database: ${rolesCount[0].count}`);
    console.log(`   Subdomains in database: ${subdomainsCount[0].count}`);
    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run migration
migrateRolesAndSubdomains()
  .then(() => {
    console.log('✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
