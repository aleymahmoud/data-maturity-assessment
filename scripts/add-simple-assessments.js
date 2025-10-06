// scripts/add-simple-assessments.js
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'data_maturity.db'));

// Sample assessment codes for Forefront
const codes = [
  '75F2B7E3', 'A5E2C49E', 'DB7CE4BE', '3F940611', 'EDF5D818',
  '68C1E64A', 'B3A506C8', '57488CA6', 'A38087CF', '9E5E4C5A'
];

// Sample user data
const sampleUsers = [
  { name: 'Ahmed Al-Rashid', email: 'ahmed.rashid@forefront.sa', role_title: 'Data Manager', role_id: 'it-technology' },
  { name: 'Fatima Hassan', email: 'fatima.hassan@forefront.sa', role_title: 'Business Analyst', role_id: 'analytics' },
  { name: 'Omar Abdullah', email: 'omar.abdullah@forefront.sa', role_title: 'IT Director', role_id: 'it-technology' },
  { name: 'Layla Mahmoud', email: 'layla.mahmoud@forefront.sa', role_title: 'Executive Manager', role_id: 'executive' },
  { name: 'Khalid Al-Zahra', email: 'khalid.zahra@forefront.sa', role_title: 'BI Specialist', role_id: 'analytics' },
  { name: 'Nour Al-Mansouri', email: 'nour.mansouri@forefront.sa', role_title: 'Data Governance Lead', role_id: 'compliance' },
  { name: 'Saeed Al-Maliki', email: 'saeed.maliki@forefront.sa', role_title: 'Operations Manager', role_id: 'operations' },
  { name: 'Amina Al-Zaidi', email: 'amina.zaidi@forefront.sa', role_title: 'Chief Technology Officer', role_id: 'executive' },
  { name: 'Hassan Al-Qasimi', email: 'hassan.qasimi@forefront.sa', role_title: 'Data Analyst', role_id: 'analytics' },
  { name: 'Maryam Al-Harbi', email: 'maryam.harbi@forefront.sa', role_title: 'IT Manager', role_id: 'it-technology' }
];

// Function to generate random but realistic scores
function generateRealisticScore() {
  const base = Math.random() * 1.7 + 2.5; // Range: 2.5 - 4.2
  return parseFloat(base.toFixed(1));
}

function getMaturityLevel(score) {
  if (score >= 4.3) return 'Optimized';
  if (score >= 3.5) return 'Advanced';
  if (score >= 2.7) return 'Defined';
  if (score >= 1.9) return 'Developing';
  return 'Initial';
}

console.log('Adding sample assessments for Forefront organization...');

try {
  // Disable foreign key constraints temporarily
  db.exec('PRAGMA foreign_keys = OFF');

  // Clear existing data for these codes first
  console.log('Clearing existing data...');
  const deleteExisting = db.prepare('DELETE FROM users WHERE assessment_code IN (' + codes.map(() => '?').join(',') + ')');
  deleteExisting.run(...codes);

  // Get all subdomains
  const subdomains = db.prepare('SELECT * FROM subdomains ORDER BY id').all();
  console.log(`Found ${subdomains.length} subdomains`);

  const insertUser = db.prepare(`
    INSERT INTO users (
      name, email, organization, role_title, selected_role_id,
      assessment_code, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSession = db.prepare(`
    INSERT INTO assessment_sessions (
      user_id, session_start, session_end, completion_percentage,
      status, language_preference
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertSessionScore = db.prepare(`
    INSERT INTO session_scores (
      session_id, subdomain_id, score_type, raw_score,
      percentage_score, maturity_level, questions_answered, total_questions
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  codes.forEach((code, index) => {
    const user = sampleUsers[index];
    const createdAt = new Date(Date.now() - Math.random() * 25 * 24 * 60 * 60 * 1000);

    // Insert user
    const userResult = insertUser.run(
      user.name,
      user.email,
      'Forefront',
      user.role_title,
      user.role_id,
      code,
      createdAt.toISOString()
    );

    const userId = userResult.lastInsertRowid;

    // Insert assessment session
    const sessionStart = new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000);
    const sessionEnd = new Date(sessionStart.getTime() + Math.random() * 60 * 60 * 1000);

    const sessionResult = insertSession.run(
      userId,
      sessionStart.toISOString(),
      sessionEnd.toISOString(),
      100, // Full completion
      'completed',
      'en'
    );

    const sessionId = sessionResult.lastInsertRowid;

    // Generate scores for each subdomain (give everyone some scores)
    let totalScore = 0;
    let totalQuestions = 0;
    let totalAnswered = 0;

    subdomains.forEach(subdomain => {
      // Give each user some questions in each subdomain
      const questionsForSubdomain = Math.floor(Math.random() * 4) + 2; // 2-5 questions
      const score = generateRealisticScore();
      const percentage = (score / 5.0) * 100;

      insertSessionScore.run(
        sessionId,
        subdomain.id,
        'subdomain',
        score,
        percentage,
        getMaturityLevel(score),
        questionsForSubdomain,
        questionsForSubdomain
      );

      totalScore += score;
      totalQuestions += questionsForSubdomain;
      totalAnswered += questionsForSubdomain;
    });

    // Calculate overall score
    const overallScore = totalScore / subdomains.length;
    const overallPercentage = (overallScore / 5.0) * 100;

    // Insert overall score
    insertSessionScore.run(
      sessionId,
      null,
      'overall',
      overallScore,
      overallPercentage,
      getMaturityLevel(overallScore),
      totalAnswered,
      totalQuestions
    );

    console.log(`✅ Added assessment for ${user.name} (${code}) - Score: ${overallScore.toFixed(1)} (${getMaturityLevel(overallScore)})`);
  });

  console.log('\n🎉 Successfully added 10 sample assessments for Forefront organization!');
  console.log('\nAssessment codes:');
  codes.forEach(code => console.log(`- ${code}`));

  console.log('\n📊 To test the consolidated report:');
  console.log('1. Go to Admin → Results & Analytics');
  console.log('2. Switch to "Assessment Reports" tab');
  console.log('3. Select "Collective Assessment" report type');
  console.log('4. Select all or some of the Forefront codes');
  console.log('5. Click "Generate Report" to see the consolidated results');

} catch (error) {
  console.error('Error adding sample data:', error);
} finally {
  // Re-enable foreign key constraints
  db.exec('PRAGMA foreign_keys = ON');
  db.close();
}