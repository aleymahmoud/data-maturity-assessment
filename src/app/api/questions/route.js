import { NextResponse } from 'next/server';
import { openDatabase } from '../../../lib/database.js';

export async function GET() {
  try {
    const db = await openDatabase();
    
    // Get all questions with correct table/column names
    const questions = await db.all(`
      SELECT 
        q.id,
        q.subdomain_id as subdomain,
        q.title_en as title,
        q.text_en as question,
        q.scenario_en as scenario,
        q.icon
      FROM questions q
      ORDER BY CAST(REPLACE(q.id, 'Q', '') AS INTEGER)
    `);

    // Get options for each question
    const questionsWithOptions = await Promise.all(
      questions.map(async (question) => {
        const options = await db.all(`
          SELECT 
            option_key,
            option_text_en as text,
            score_value as value,
            display_order
          FROM question_options 
          WHERE question_id = ?
          ORDER BY display_order
        `, [question.id]);

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
          title: question.title,
          question: question.question,
          scenario: question.scenario,
          icon: question.icon || '📋', // Use icon from database
          options: shuffledOptions.map(opt => ({
            value: opt.option_key === 'NA' ? 'na' : 
                   opt.option_key === 'NS' ? 'ns' : 
                   opt.value,
            text: opt.text
          }))
        };
      })
    );

    return NextResponse.json({
      success: true,
      questions: questionsWithOptions
    });

  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch questions'
    }, { status: 500 });
  }
}