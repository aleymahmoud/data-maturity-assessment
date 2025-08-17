import { NextResponse } from 'next/server';
import { openDatabase } from '../../../lib/database.js';

export async function GET() {
  try {
    const db = await openDatabase();
    
    // Get all questions with their options
    const questions = await db.all(`
      SELECT 
        q.id,
        q.dimension_id as subdomain,
        q.title_en as title,
        q.text_en as question,
        d.scenario_en as scenario
      FROM questions q
      LEFT JOIN dimensions d ON q.dimension_id = d.id
      ORDER BY q.id
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

        // Add icons based on question ID or subdomain
        const iconMap = {
          'FOCUS_APP_Q1': '⚡',
          'FOCUS_APP_Q2': '🔧', 
          'FOCUS_APP_Q3': '🔄',
          'FOCUS_ANA_Q4': '🔬',
          'FOCUS_ANA_Q5': '🔮',
          'FOCUS_ANA_Q6': '📊',
          'FOCUS_ANA_Q7': '📈',
          'FOCUS_STR_Q8': '💰',
          'FOCUS_STR_Q9': '🚀',
          'FOCUS_STR_Q10': '📢'
        };

        return {
          id: question.id,
          subdomain: question.subdomain,
          title: question.title,
          question: question.question,
          scenario: question.scenario,
          icon: iconMap[question.id] || '📋', // Default icon
          options: options.map(opt => ({
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