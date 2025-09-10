// src/app/api/complete-assessment/route.js
import { NextResponse } from 'next/server';
import { markCodeAsUsed, saveAssessmentResponses, openDatabase } from '../../../lib/database.js';

// Function to calculate scores (same logic as /api/calculate-scores)
async function calculateScores(sessionId) {
  try {
    const database = await openDatabase();
    
    // Get all responses for this session (excluding NA/NS)
    console.log('Fetching responses for session:', sessionId);
    const responses = await database.all(`
      SELECT 
        ur.question_id,
        ur.score_value,
        q.subdomain_id
      FROM user_responses ur
      JOIN questions q ON ur.question_id = q.id
      WHERE ur.session_id = ? AND ur.score_value > 0
    `, [sessionId]);

    console.log('Found responses:', responses.length);
    if (responses.length > 0) {
      console.log('Sample response:', responses[0]);
    }

    if (responses.length === 0) {
      console.log('No valid responses found for score calculation');
      // Let's also check if there are any responses at all for this session
      const allResponses = await database.all(`
        SELECT question_id, score_value FROM user_responses WHERE session_id = ?
      `, [sessionId]);
      console.log('All responses for session (including NA/NS):', allResponses.length);
      return;
    }

    // Group responses by subdomain
    const subdomainData = {};
    responses.forEach(response => {
      if (!subdomainData[response.subdomain_id]) {
        subdomainData[response.subdomain_id] = [];
      }
      subdomainData[response.subdomain_id].push(response.score_value);
    });

    // Calculate scores for each subdomain
    for (const [subdomainId, scores] of Object.entries(subdomainData)) {
      const rawScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const percentageScore = (rawScore / 5) * 100;
      
      // Determine maturity level
      let maturityLevel = 'Initial';
      if (rawScore >= 4.3) maturityLevel = 'Optimized';
      else if (rawScore >= 3.5) maturityLevel = 'Advanced';
      else if (rawScore >= 2.7) maturityLevel = 'Defined';
      else if (rawScore >= 1.9) maturityLevel = 'Developing';

      // Insert subdomain score
      await database.run(`
        INSERT OR REPLACE INTO session_scores (
          id, session_id, subdomain_id, score_type, 
          raw_score, percentage_score, maturity_level,
          questions_answered, total_questions, calculated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        `${sessionId}_${subdomainId}_subdomain`,
        sessionId,
        subdomainId,
        'subdomain',
        parseFloat(rawScore.toFixed(2)),
        parseFloat(percentageScore.toFixed(1)),
        maturityLevel,
        scores.length,
        scores.length
      ]);
    }

    // Calculate overall score
    const allSubdomainScores = Object.values(subdomainData).flat();
    const overallRawScore = allSubdomainScores.reduce((sum, score) => sum + score, 0) / allSubdomainScores.length;
    const overallPercentage = (overallRawScore / 5) * 100;
    
    let overallMaturityLevel = 'Initial';
    if (overallRawScore >= 4.3) overallMaturityLevel = 'Optimized';
    else if (overallRawScore >= 3.5) overallMaturityLevel = 'Advanced';
    else if (overallRawScore >= 2.7) overallMaturityLevel = 'Defined';
    else if (overallRawScore >= 1.9) overallMaturityLevel = 'Developing';

    // Insert overall score
    await database.run(`
      INSERT OR REPLACE INTO session_scores (
        id, session_id, score_type, 
        raw_score, percentage_score, maturity_level,
        questions_answered, total_questions, calculated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      `${sessionId}_overall`,
      sessionId,
      'overall',
      parseFloat(overallRawScore.toFixed(2)),
      parseFloat(overallPercentage.toFixed(1)),
      overallMaturityLevel,
      allSubdomainScores.length,
      35
    ]);

    console.log('Scores calculated successfully for session:', sessionId);
  } catch (error) {
    console.error('Error calculating scores:', error);
  }
}

export async function POST(request) {
  try {
    const { code, sessionId, responses } = await request.json();
    
    if (!code || !sessionId || !responses) {
      return NextResponse.json({
        success: false,
        error: 'Code, session ID, and responses are required'
      }, { status: 400 });
    }

    // First save all responses with assessment code
    const saveResult = await saveAssessmentResponses(sessionId, responses, code);
    
    if (!saveResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to save responses: ' + saveResult.error
      }, { status: 500 });
    }

    // Calculate scores after saving responses
    console.log('Starting score calculation for session:', sessionId);
    await calculateScores(sessionId);

    // Then mark code as used and session as completed
    const completeResult = await markCodeAsUsed(code, sessionId);
    
    if (!completeResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to complete assessment: ' + completeResult.error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Assessment completed successfully',
      savedResponses: saveResult.savedCount
    });

  } catch (error) {
    console.error('Complete assessment error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error occurred'
    }, { status: 500 });
  }
}