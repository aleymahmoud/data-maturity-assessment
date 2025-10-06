import { openDatabase } from '../src/lib/database.js';

async function showAllTables() {
  try {
    const database = await openDatabase();

    // Show all tables
    const [tables] = await database.execute('SHOW TABLES');

    console.log('\n=== ALL TABLES IN DATABASE ===');
    tables.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`${index + 1}. ${tableName}`);
    });

    // Check for recommendation-related tables
    console.log('\n=== SEARCHING FOR RECOMMENDATION TABLES ===');
    const recommendationTables = tables.filter(table => {
      const tableName = Object.values(table)[0].toLowerCase();
      return tableName.includes('recommend') || tableName.includes('metadata');
    });

    if (recommendationTables.length > 0) {
      console.log('Found recommendation-related tables:');
      recommendationTables.forEach(table => {
        console.log(`- ${Object.values(table)[0]}`);
      });

      // Describe each recommendation table
      for (const table of recommendationTables) {
        const tableName = Object.values(table)[0];
        console.log(`\n=== STRUCTURE OF ${tableName} ===`);
        const [columns] = await database.execute(`DESCRIBE ${tableName}`);
        console.table(columns);

        // Show sample data
        console.log(`\n=== SAMPLE DATA FROM ${tableName} ===`);
        const [sampleData] = await database.execute(`SELECT * FROM ${tableName} LIMIT 3`);
        console.table(sampleData);
      }
    } else {
      console.log('No recommendation-related tables found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

showAllTables();
