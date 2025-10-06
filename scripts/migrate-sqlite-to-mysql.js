import { config } from 'dotenv';
config({ path: '.env.local' });

import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';
import fs from 'fs';

async function migrateData() {
  let mysqlConnection;
  let sqliteDb;

  try {
    // Connect to MySQL
    mysqlConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    // Connect to SQLite
    sqliteDb = new Database('data_maturity.db');

    console.log('✅ Connected to both databases');

    // 1. Migrate domains
    console.log('\\n📂 Migrating domains...');
    const domains = sqliteDb.prepare('SELECT * FROM domains').all();
    console.log(`Found ${domains.length} domains in SQLite`);

    for (const domain of domains) {
      await mysqlConnection.execute(`
        INSERT IGNORE INTO domains (id, name_en, name_ar, description_en, description_ar, display_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [domain.id, domain.name_en, domain.name_ar, domain.description_en, domain.description_ar, domain.display_order]);
    }
    console.log('✅ Domains migrated');

    // 2. Migrate subdomains
    console.log('\\n📁 Migrating subdomains...');
    const subdomains = sqliteDb.prepare('SELECT * FROM subdomains').all();
    console.log(`Found ${subdomains.length} subdomains in SQLite`);

    for (const subdomain of subdomains) {
      await mysqlConnection.execute(\`
        INSERT IGNORE INTO subdomains (id, domain_id, name_en, name_ar, description_en, description_ar, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      \`, [subdomain.id, subdomain.domain_id, subdomain.name_en, subdomain.name_ar,
           subdomain.description_en, subdomain.description_ar, subdomain.display_order]);
    }
    console.log('✅ Subdomains migrated');

    // 3. Migrate roles
    console.log('\\n👥 Migrating roles...');
    const roles = sqliteDb.prepare('SELECT * FROM roles').all();
    console.log(`Found ${roles.length} roles in SQLite`);

    for (const role of roles) {
      await mysqlConnection.execute(\`
        INSERT IGNORE INTO roles (id, name_en, name_ar, description_en, description_ar,
                                 focus_en, focus_ar, recommendations_en, recommendations_ar, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      \`, [role.id, role.name_en, role.name_ar, role.description_en, role.description_ar,
           role.focus_en, role.focus_ar, role.recommendations_en, role.recommendations_ar, role.display_order]);
    }
    console.log('✅ Roles migrated');

    // 4. Migrate questions
    console.log('\\n❓ Migrating questions...');
    const questions = sqliteDb.prepare('SELECT * FROM questions').all();
    console.log(`Found ${questions.length} questions in SQLite`);

    for (const question of questions) {
      await mysqlConnection.execute(\`
        INSERT IGNORE INTO questions (id, subdomain_id, title_en, title_ar, text_en, text_ar,
                                     scenario_en, scenario_ar, icon, display_order, priority)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      \`, [question.id, question.subdomain_id, question.title_en, question.title_ar,
           question.text_en, question.text_ar, question.scenario_en, question.scenario_ar,
           question.icon, question.display_order, question.priority || 0]);
    }
    console.log('✅ Questions migrated');

    // 5. Migrate question options
    console.log('\\n⚙️ Migrating question options...');
    const options = sqliteDb.prepare('SELECT * FROM question_options').all();
    console.log(`Found ${options.length} question options in SQLite`);

    for (const option of options) {
      await mysqlConnection.execute(\`
        INSERT IGNORE INTO question_options (id, question_id, option_key, option_text_en, option_text_ar,
                                           score_value, maturity_level, explanation_en, explanation_ar, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      \`, [option.id, option.question_id, option.option_key, option.option_text_en, option.option_text_ar,
           option.score_value, option.maturity_level, option.explanation_en, option.explanation_ar, option.display_order]);
    }
    console.log('✅ Question options migrated');

    // 6. Migrate maturity levels (if exists)
    console.log('\\n📊 Migrating maturity levels...');
    try {
      const maturityLevels = sqliteDb.prepare('SELECT * FROM maturity_levels').all();
      console.log(`Found ${maturityLevels.length} maturity levels in SQLite`);

      for (const level of maturityLevels) {
        await mysqlConnection.execute(\`
          INSERT IGNORE INTO maturity_levels (level_number, level_name, level_description_en, level_description_ar,
                                             score_range_min, score_range_max, color_code)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        \`, [level.level_number, level.level_name, level.level_description_en, level.level_description_ar,
             level.score_range_min, level.score_range_max, level.color_code]);
      }
      console.log('✅ Maturity levels migrated');
    } catch (error) {
      console.log('⚠️  No maturity_levels table found in SQLite, creating default ones...');

      // Create default maturity levels
      const defaultLevels = [
        [1, 'Initial', 'Basic or ad-hoc practices', 'ممارسات أساسية أو مخصصة', 1.0, 1.9, '#ef4444'],
        [2, 'Developing', 'Developing practices with some structure', 'ممارسات نامية مع بعض الهيكلة', 2.0, 2.6, '#f59e0b'],
        [3, 'Defined', 'Well-defined and documented practices', 'ممارسات محددة وموثقة جيداً', 2.7, 3.4, '#eab308'],
        [4, 'Advanced', 'Advanced practices with optimization', 'ممارسات متقدمة مع التحسين', 3.5, 4.2, '#10b981'],
        [5, 'Optimized', 'Fully optimized and continuously improving', 'محسن بالكامل ومتحسن باستمرار', 4.3, 5.0, '#3b82f6']
      ];

      for (const level of defaultLevels) {
        await mysqlConnection.execute(\`
          INSERT IGNORE INTO maturity_levels (level_number, level_name, level_description_en, level_description_ar,
                                             score_range_min, score_range_max, color_code)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        \`, level);
      }
      console.log('✅ Default maturity levels created');
    }

    // 7. Migrate admin users (if exists)
    console.log('\\n👨‍💼 Migrating admin users...');
    try {
      const adminUsers = sqliteDb.prepare('SELECT * FROM admin_users').all();
      console.log(`Found ${adminUsers.length} admin users in SQLite`);

      for (const admin of adminUsers) {
        await mysqlConnection.execute(\`
          INSERT IGNORE INTO admin_users (id, username, password_hash, full_name, email, role, created_at, last_login, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        \`, [admin.id, admin.username, admin.password_hash, admin.full_name, admin.email,
             admin.role, admin.created_at, admin.last_login, admin.is_active]);
      }
      console.log('✅ Admin users migrated');
    } catch (error) {
      console.log('⚠️  No admin_users table found in SQLite');
    }

    // 8. Migrate assessment codes (if exists)
    console.log('\\n🔑 Migrating assessment codes...');
    try {
      const assessmentCodes = sqliteDb.prepare('SELECT * FROM assessment_codes').all();
      console.log(`Found ${assessmentCodes.length} assessment codes in SQLite`);

      for (const code of assessmentCodes) {
        // Check if code already exists to avoid conflicts
        const [existing] = await mysqlConnection.execute('SELECT code FROM assessment_codes WHERE code = ?', [code.code]);

        if (existing.length === 0) {
          await mysqlConnection.execute(\`
            INSERT INTO assessment_codes (code, organization_name, intended_recipient, created_by,
                                        created_at, expires_at, assessment_type, is_used, usage_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          \`, [code.code, code.organization_name, code.intended_recipient, code.created_by,
               code.created_at, code.expires_at, code.assessment_type || 'full',
               code.is_used || 0, code.usage_count || 0]);
        }
      }
      console.log('✅ Assessment codes migrated');
    } catch (error) {
      console.log('⚠️  Error migrating assessment codes:', error.message);
    }

    // 9. Migration summary
    console.log('\\n📊 Migration Summary:');
    const [domainCount] = await mysqlConnection.execute('SELECT COUNT(*) as count FROM domains');
    const [subdomainCount] = await mysqlConnection.execute('SELECT COUNT(*) as count FROM subdomains');
    const [roleCount] = await mysqlConnection.execute('SELECT COUNT(*) as count FROM roles');
    const [questionCount] = await mysqlConnection.execute('SELECT COUNT(*) as count FROM questions');
    const [optionCount] = await mysqlConnection.execute('SELECT COUNT(*) as count FROM question_options');
    const [codeCount] = await mysqlConnection.execute('SELECT COUNT(*) as count FROM assessment_codes');

    console.log(\`  - Domains: \${domainCount[0].count}\`);
    console.log(\`  - Subdomains: \${subdomainCount[0].count}\`);
    console.log(\`  - Roles: \${roleCount[0].count}\`);
    console.log(\`  - Questions: \${questionCount[0].count}\`);
    console.log(\`  - Question Options: \${optionCount[0].count}\`);
    console.log(\`  - Assessment Codes: \${codeCount[0].count}\`);

    console.log('\\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    if (mysqlConnection) {
      await mysqlConnection.end();
    }
    if (sqliteDb) {
      sqliteDb.close();
    }
  }
}

// Install better-sqlite3 if not available
try {
  await import('better-sqlite3');
} catch (error) {
  console.log('Installing better-sqlite3...');
  const { exec } = await import('child_process');
  await new Promise((resolve, reject) => {
    exec('npm install better-sqlite3', (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

migrateData().catch(console.error);