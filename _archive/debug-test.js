// Debug test to check database and API functionality
import { openDatabase } from './src/lib/database.js';

async function debugDatabase() {
  try {
    console.log('=== DATABASE DEBUG TEST ===');
    const db = await openDatabase();
    
    // Check if user_responses exist
    console.log('\n1. Checking user_responses...');
    const responses = await db.all(`
      SELECT session_id, COUNT(*) as count, MAX(answered_at) as latest 
      FROM user_responses 
      GROUP BY session_id 
      ORDER BY latest DESC 
      LIMIT 5
    `);
    console.log('Recent sessions with responses:', responses);
    
    if (responses.length > 0) {
      const latestSessionId = responses[0].session_id;
      console.log('\n2. Checking latest session details:', latestSessionId);
      
      // Get all responses for the latest session
      const sessionResponses = await db.all(`
        SELECT question_id, score_value, option_key 
        FROM user_responses 
        WHERE session_id = ? 
        ORDER BY question_id
      `, [latestSessionId]);
      
      console.log('Total responses for session:', sessionResponses.length);
      console.log('Valid scores (>0):', sessionResponses.filter(r => r.score_value > 0).length);
      console.log('Sample responses:', sessionResponses.slice(0, 5));
      
      // Check if questions table exists and can join
      console.log('\n3. Testing questions table join...');
      const joinTest = await db.all(`
        SELECT ur.question_id, ur.score_value, q.subdomain_id
        FROM user_responses ur
        LEFT JOIN questions q ON ur.question_id = q.id
        WHERE ur.session_id = ? AND ur.score_value > 0
        LIMIT 5
      `, [latestSessionId]);
      
      console.log('Join test results:', joinTest);
      
      // Check session_scores
      console.log('\n4. Checking session_scores...');
      const sessionScores = await db.all(`
        SELECT * FROM session_scores WHERE session_id = ?
      `, [latestSessionId]);
      
      console.log('Session scores found:', sessionScores.length);
      if (sessionScores.length > 0) {
        console.log('Sample score:', sessionScores[0]);
      }
      
      // Check subdomains table
      console.log('\n5. Checking subdomains table...');
      const subdomains = await db.all('SELECT id, name_en FROM subdomains LIMIT 5');
      console.log('Subdomains found:', subdomains);
      
      console.log('\n=== TEST COMPLETE ===');
      console.log('Latest session ID you can test with:', latestSessionId);
      console.log('Test URL: http://localhost:3001/api/results?session=' + latestSessionId);
    }
    
  } catch (error) {
    console.error('Database debug error:', error);
  }
}

debugDatabase();