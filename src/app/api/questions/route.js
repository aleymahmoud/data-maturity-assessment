import { NextResponse } from 'next/server';
import { openDatabase } from '../../../lib/database.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || 'en';
    const assessmentCode = searchParams.get('code');
    
    const db = await openDatabase();
    
    // Get assessment type for this code
    let assessmentType = 'full'; // default
    if (assessmentCode) {
      const codeData = await db.get(`
        SELECT assessment_type FROM assessment_codes WHERE code = ?
      `, [assessmentCode]);
      assessmentType = codeData?.assessment_type || 'full';
    }
    
    // Build query based on assessment type
    let questionQuery = `
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
    `;
    
    // Filter questions for quick assessment
    if (assessmentType === 'quick') {
      questionQuery += ` WHERE q.priority = 1`;
    }
    
    questionQuery += ` ORDER BY CAST(REPLACE(q.id, 'Q', '') AS INTEGER)`;
    
    const questions = await db.all(questionQuery);

    // Get options for each question
    const questionsWithOptions = await Promise.all(
      questions.map(async (question) => {
        const options = await db.all(`
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