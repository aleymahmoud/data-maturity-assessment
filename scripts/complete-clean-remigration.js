import { config } from 'dotenv';
config({ path: '.env.local' });

import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';

async function completeCleanReMigration() {
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

    // 1. COMPLETE CLEANUP - Remove all data from specified tables
    console.log('\n🧹 STEP 1: Complete cleanup of MySQL tables...');

    const tablesToClean = ['question_options', 'questions', 'domains', 'subdomains'];

    for (const table of tablesToClean) {
      await mysqlConnection.execute(`DELETE FROM ${table}`);
      console.log(`  ✅ Cleaned ${table} table`);
    }

    // 2. RE-MIGRATE DOMAINS
    console.log('\n📂 STEP 2: Re-migrating domains...');
    const domains = sqliteDb.prepare('SELECT * FROM domains').all();
    console.log(`Found ${domains.length} domains in SQLite`);

    for (const domain of domains) {
      await mysqlConnection.execute(
        'INSERT INTO domains (id, name_en, name_ar, description_en, description_ar, display_order) VALUES (?, ?, ?, ?, ?, ?)',
        [domain.id, domain.name_en, domain.name_ar, domain.description_en, domain.description_ar, domain.display_order]
      );
    }
    console.log('✅ Domains re-migrated');

    // 3. RE-MIGRATE SUBDOMAINS
    console.log('\n📁 STEP 3: Re-migrating subdomains...');
    const subdomains = sqliteDb.prepare('SELECT * FROM subdomains').all();
    console.log(`Found ${subdomains.length} subdomains in SQLite`);

    for (const subdomain of subdomains) {
      await mysqlConnection.execute(
        'INSERT INTO subdomains (id, domain_id, name_en, name_ar, description_en, description_ar, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [subdomain.id, subdomain.domain_id, subdomain.name_en, subdomain.name_ar, subdomain.description_en, subdomain.description_ar, subdomain.display_order]
      );
    }
    console.log('✅ Subdomains re-migrated');

    // 4. RE-MIGRATE QUESTIONS
    console.log('\n❓ STEP 4: Re-migrating questions...');
    const questions = sqliteDb.prepare('SELECT * FROM questions').all();
    console.log(`Found ${questions.length} questions in SQLite`);

    for (const question of questions) {
      await mysqlConnection.execute(
        'INSERT INTO questions (id, subdomain_id, title_en, title_ar, text_en, text_ar, scenario_en, scenario_ar, icon, display_order, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [question.id, question.subdomain_id, question.title_en, question.title_ar, question.text_en, question.text_ar, question.scenario_en, question.scenario_ar, question.icon, question.display_order, question.priority || 0]
      );
    }
    console.log('✅ Questions re-migrated');

    // 5. RE-MIGRATE QUESTION OPTIONS
    console.log('\n⚙️ STEP 5: Re-migrating question options...');
    const options = sqliteDb.prepare('SELECT * FROM question_options').all();
    console.log(`Found ${options.length} question options in SQLite`);

    for (const option of options) {
      await mysqlConnection.execute(
        'INSERT INTO question_options (id, question_id, option_key, option_text_en, option_text_ar, score_value, maturity_level, explanation_en, explanation_ar, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [option.id, option.question_id, option.option_key, option.option_text_en, option.option_text_ar, option.score_value, option.maturity_level, option.explanation_en, option.explanation_ar, option.display_order]
      );
    }
    console.log('✅ Question options re-migrated');

    // 6. FINAL VERIFICATION
    console.log('\n📊 STEP 6: Final verification...');
    const [domainCount] = await mysqlConnection.execute('SELECT COUNT(*) as count FROM domains');
    const [subdomainCount] = await mysqlConnection.execute('SELECT COUNT(*) as count FROM subdomains');
    const [questionCount] = await mysqlConnection.execute('SELECT COUNT(*) as count FROM questions');
    const [optionCount] = await mysqlConnection.execute('SELECT COUNT(*) as count FROM question_options');

    console.log(`  - Domains: ${domainCount[0].count}`);
    console.log(`  - Subdomains: ${subdomainCount[0].count}`);
    console.log(`  - Questions: ${questionCount[0].count}`);
    console.log(`  - Question Options: ${optionCount[0].count}`);

    // 7. CHECK FOR ANY DUPLICATE TABLES
    console.log('\n🔍 STEP 7: Final check for question_options tables...');
    const [allTables] = await mysqlConnection.execute('SHOW TABLES');
    const questionRelatedTables = allTables.filter(table => {
      const tableName = Object.values(table)[0].toLowerCase();
      return tableName.includes('question') && tableName.includes('option');
    });

    console.log('Question-option related tables found:');
    questionRelatedTables.forEach(table => {
      console.log(`  - ${Object.values(table)[0]}`);
    });

    console.log('\n🎉 Complete cleanup and re-migration completed successfully!');

  } catch (error) {
    console.error('❌ Re-migration failed:', error);
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

completeCleanReMigration().catch(console.error);