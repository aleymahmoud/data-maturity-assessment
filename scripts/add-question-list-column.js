// Migration script to add question_list column to assessment_codes table
import { openDatabase } from '../src/lib/database.js';

async function addQuestionListColumn() {
  try {
    const database = await openDatabase();

    console.log('Adding question_list column to assessment_codes table...');

    // Add the question_list JSON column
    await database.execute(`
      ALTER TABLE assessment_codes
      ADD COLUMN question_list JSON DEFAULT NULL
    `);

    console.log('✅ Successfully added question_list column');

    // Update existing codes to have proper question lists
    console.log('Updating existing assessment codes...');

    // Get all existing codes
    const [codes] = await database.execute(`
      SELECT code, assessment_type FROM assessment_codes
    `);

    for (const codeRecord of codes) {
      let questionList = [];

      if (codeRecord.assessment_type === 'quick') {
        // Get priority 1 questions for quick assessments
        const [questions] = await database.execute(`
          SELECT id FROM questions
          WHERE priority = 1
          ORDER BY display_order
        `);
        questionList = questions.map(q => q.id);
      } else {
        // Get all questions for full assessments
        const [questions] = await database.execute(`
          SELECT id FROM questions
          ORDER BY display_order
        `);
        questionList = questions.map(q => q.id);
      }

      // Update the code with the question list
      await database.execute(`
        UPDATE assessment_codes
        SET question_list = ?
        WHERE code = ?
      `, [JSON.stringify(questionList), codeRecord.code]);

      console.log(`Updated code ${codeRecord.code} (${codeRecord.assessment_type}) with ${questionList.length} questions`);
    }

    console.log('✅ Migration completed successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
addQuestionListColumn()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });