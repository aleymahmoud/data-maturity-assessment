import { NextResponse } from 'next/server';
import { openDatabase } from '../../../lib/database.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || 'en';
    const assessmentCode = searchParams.get('code');

    const db = await openDatabase();

    // Get snapshotted question list from assessment code
    let questionList = [];
    if (assessmentCode) {
      const [rows] = await db.execute(`
        SELECT question_list, assessment_type FROM assessment_codes WHERE code = ?
      `, [assessmentCode]);

      const codeData = rows[0];
      if (codeData && codeData.question_list) {
        // MySQL JSON column is already parsed, no need for JSON.parse()
        questionList = Array.isArray(codeData.question_list) ? codeData.question_list : JSON.parse(codeData.question_list);
      }
    }

    // If no question list found, fall back to all questions (for backward compatibility)
    if (questionList.length === 0) {
      const [allQuestions] = await db.execute(`
        SELECT id FROM questions ORDER BY display_order
      `);
      questionList = allQuestions.map(q => q.id);
    }

    // Build query to get only the snapshotted questions
    let questionRows = [];
    if (questionList.length > 0) {
      const placeholders = questionList.map(() => '?').join(',');
      const questionQuery = `
        SELECT
          q.id,
          q.subdomain_id as subdomain,
          q.title_en,
          q.title_ar,
          q.text_en,
          q.text_ar,
          q.scenario_en,
          q.scenario_ar,
          q.icon,
          q.priority
        FROM questions q
        WHERE q.id IN (${placeholders})
        ORDER BY CAST(REPLACE(q.id, 'Q', '') AS UNSIGNED)
      `;

      const [results] = await db.execute(questionQuery, questionList);
      questionRows = results;
    }

    const questions = questionRows;

    // Get options for each question
    const questionsWithOptions = await Promise.all(
      questions.map(async (question) => {
        const [optionRows] = await db.execute(`
          SELECT
            option_key,
            option_text_en,
            option_text_ar,
            score_value as value,
            display_order
          FROM question_options
          WHERE question_id = ?
          ORDER BY display_order
        `, [question.id]);

        const options = optionRows;

        // Separate scoring options (A,B,C,D,E) from NA/NS
        const scoringOptions = options.filter(opt => !['NA', 'NS'].includes(opt.option_key));
        const fixedOptions = options.filter(opt => ['NA', 'NS'].includes(opt.option_key));

        // Shuffle scoring options randomly
        const shuffledScoring = scoringOptions.sort(() => Math.random() - 0.5);

        // Combine: shuffled scoring options + fixed NA/NS at end
        const shuffledOptions = [...shuffledScoring, ...fixedOptions];

        return {
          id: question.id,
          subdomain: question.subdomain,
          title: language === 'ar' ? question.title_ar : question.title_en,
          question: language === 'ar' ? question.text_ar : question.text_en,
          scenario: language === 'ar' ? question.scenario_ar : question.scenario_en,
          icon: question.icon || '📋',
          options: shuffledOptions.map(opt => ({
            value: opt.option_key === 'NA' ? 'na' : 
                   opt.option_key === 'NS' ? 'ns' : 
                   opt.value,
            text: language === 'ar' ? opt.option_text_ar : opt.option_text_en
          }))
        };
      })
    );

    return NextResponse.json({
      success: true,
      questions: questionsWithOptions,
      language: language
    });

  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch questions'
    }, { status: 500 });
  }
}