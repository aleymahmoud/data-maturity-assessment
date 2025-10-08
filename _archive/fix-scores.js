// Manually calculate scores for the session
import { openDatabase } from './src/lib/database.js';

async function calculateScoresDirectly() {
  try {
    const sessionId = 'session_1757496004892_7h9dtehvm';
    const database = await openDatabase();
    
    console.log('=== MANUAL SCORE CALCULATION ===');
    console.log('Calculating scores for session:', sessionId);
    
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

    console.log('Found responses for calculation:', responses.length);

    if (responses.length === 0) {
      console.log('No valid responses found for score calculation');
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

    console.log('Processing subdomains:', Object.keys(subdomainData));

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

      console.log(`${subdomainId}: ${rawScore.toFixed(2)} (${scores.length} questions) - ${maturityLevel}`);

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

    console.log(`\nOVERALL: ${overallRawScore.toFixed(2)} - ${overallMaturityLevel}`);

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

    console.log('\n✅ Scores calculated and saved successfully!');
    console.log('Now test the results page again.');
    
  } catch (error) {
    console.error('Error calculating scores:', error);
  }
}

calculateScoresDirectly();