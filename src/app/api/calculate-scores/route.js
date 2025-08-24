// src/app/api/calculate-scores/route.js
import { NextResponse } from 'next/server';
import { openDatabase } from '../../../lib/database.js';

export async function POST(request) {
  try {
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 });
    }

    const database = await openDatabase();
    
    // Get all responses for this session (excluding NA/NS)
    const responses = await database.all(`
      SELECT 
        ur.question_id,
        ur.score_value,
        q.subdomain_id
      FROM user_responses ur
      JOIN questions q ON ur.question_id = q.id
      WHERE ur.session_id = ? AND ur.score_value > 0
    `, [sessionId]);

    if (responses.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid responses found'
      }, { status: 404 });
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
    const scoresCalculated = [];
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

      scoresCalculated.push({
        subdomain: subdomainId,
        score: parseFloat(rawScore.toFixed(2)),
        questionsAnswered: scores.length
      });
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

    return NextResponse.json({
      success: true,
      message: 'Scores calculated successfully',
      overallScore: parseFloat(overallRawScore.toFixed(2)),
      maturityLevel: overallMaturityLevel,
      subdomainsProcessed: scoresCalculated.length,
      totalResponses: allSubdomainScores.length
    });

  } catch (error) {
    console.error('Error calculating scores:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to calculate scores'
    }, { status: 500 });
  }
}