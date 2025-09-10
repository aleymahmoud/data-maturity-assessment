// Test the scoring calculation directly
import { openDatabase } from './src/lib/database.js';

async function testScoring() {
  try {
    console.log('=== TESTING SCORE CALCULATION ===');
    const sessionId = 'session_1757496004892_7h9dtehvm';
    const db = await openDatabase();
    
    // Test our exact query from results API
    console.log('\n1. Testing session_scores query...');
    const allSubdomains = await db.all(`
      SELECT 
        sd.id,
        sd.name_en as name,
        sd.description_en as description,
        sd.display_order,
        COALESCE(s.raw_score, 0) as score,
        COALESCE(s.percentage_score, 0) as percentage,
        COALESCE(s.questions_answered, 0) as questions_answered,
        COALESCE(s.total_questions, 0) as total_questions
      FROM subdomains sd
      LEFT JOIN session_scores s ON sd.id = s.subdomain_id 
        AND s.session_id = ? 
        AND s.score_type = 'subdomain'
      ORDER BY sd.display_order
    `, [sessionId]);
    
    console.log('Subdomain results count:', allSubdomains.length);
    console.log('Questions answered total:', allSubdomains.reduce((sum, domain) => sum + domain.questions_answered, 0));
    
    // Test the fallback query
    console.log('\n2. Testing fallback query...');
    const responsesCount = await db.get(`
      SELECT COUNT(*) as count 
      FROM user_responses ur
      WHERE ur.session_id = ? AND ur.score_value > 0
    `, [sessionId]);
    
    console.log('Fallback query result:', responsesCount);
    
    // Test the score calculation function
    console.log('\n3. Testing score calculation logic...');
    const responses = await db.all(`
      SELECT 
        ur.question_id,
        ur.score_value,
        q.subdomain_id
      FROM user_responses ur
      JOIN questions q ON ur.question_id = q.id
      WHERE ur.session_id = ? AND ur.score_value > 0
    `, [sessionId]);
    
    console.log('Calculation input responses:', responses.length);
    
    if (responses.length > 0) {
      // Group by subdomain
      const subdomainData = {};
      responses.forEach(response => {
        if (!subdomainData[response.subdomain_id]) {
          subdomainData[response.subdomain_id] = [];
        }
        subdomainData[response.subdomain_id].push(response.score_value);
      });
      
      console.log('Grouped subdomains:', Object.keys(subdomainData));
      console.log('Sample subdomain data:', Object.entries(subdomainData)[0]);
      
      // Calculate one sample score
      const [sampleSubdomain, sampleScores] = Object.entries(subdomainData)[0];
      const sampleAvg = sampleScores.reduce((sum, score) => sum + score, 0) / sampleScores.length;
      console.log(`Sample calculation: ${sampleSubdomain} = ${sampleAvg} (from ${sampleScores.length} responses)`);
    }
    
  } catch (error) {
    console.error('Scoring test error:', error);
  }
}

testScoring();