// scripts/add-sample-assessments.js
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(process.cwd(), 'data_maturity.db'));

// Sample assessment codes for Forefront
const codes = [
  '75F2B7E3', 'A5E2C49E', 'DB7CE4BE', '3F940611', 'EDF5D818',
  '68C1E64A', 'B3A506C8', '57488CA6', 'A38087CF', '9E5E4C5A'
];

// Sample user data - using correct role IDs from database
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
  // Generate scores that tend to be in the 2.5-4.2 range for more realistic data maturity
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

console.log('Adding sample assessment codes...');

try {
  // Disable foreign key constraints temporarily
  db.exec('PRAGMA foreign_keys = OFF');
  // First, check the actual schema
  const tableInfo = db.prepare("PRAGMA table_info(assessment_codes)").all();
  const columns = tableInfo.map(col => col.name);
  console.log('Available columns:', columns);

  // Add the assessment codes if they don't exist (using only existing columns)
  const insertCode = db.prepare(`
    INSERT OR IGNORE INTO assessment_codes (
      code, organization_name, assessment_type, created_at, expires_at,
      max_uses, usage_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  codes.forEach(code => {
    const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date in last 30 days
    const expiresAt = new Date(createdAt.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days from creation

    insertCode.run(
      code,
      'Forefront',
      'quick',
      createdAt.toISOString(),
      expiresAt.toISOString(),
      10,
      1
    );
  });

  console.log('Assessment codes added successfully!');

  // Now add users and their assessments
  console.log('Adding users and completed assessments...');

  // Check user table schema
  const userTableInfo = db.prepare("PRAGMA table_info(users)").all();
  const userColumns = userTableInfo.map(col => col.name);
  console.log('User table columns:', userColumns);

  // Check available roles
  const roles = db.prepare("SELECT * FROM roles").all();
  console.log('Available roles:', roles.map(r => `${r.id}: ${r.name_en}`));

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

  // Get all subdomains
  const subdomains = db.prepare('SELECT * FROM subdomains ORDER BY id').all();

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
    const sessionEnd = new Date(sessionStart.getTime() + Math.random() * 60 * 60 * 1000); // 0-1 hour later

    const sessionResult = insertSession.run(
      userId,
      sessionStart.toISOString(),
      sessionEnd.toISOString(),
      100, // Full completion
      'completed',
      'en'
    );

    const sessionId = sessionResult.lastInsertRowid;

    // Generate subdomain scores based on role
    const roleBasedScores = {};
    let totalQuestions = 0;
    let totalAnswered = 0;
    let totalScore = 0;
    let scoredSubdomains = 0;

    subdomains.forEach(subdomain => {
      // Different roles focus on different subdomains
      let shouldScore = false;
      let questionsForRole = 0;

      switch (user.role_id) {
        case 'executive': // Executive - all subdomains but fewer questions
          shouldScore = true;
          questionsForRole = Math.floor(Math.random() * 3) + 2; // 2-4 questions
          break;
        case 'it-technology': // IT/Technology - technical subdomains
          shouldScore = [1, 2, 3, 6, 7].includes(subdomain.id);
          questionsForRole = shouldScore ? Math.floor(Math.random() * 4) + 3 : 0; // 3-6 questions
          break;
        case 'analytics': // BI/Analytics - data and analytics focused
          shouldScore = [2, 4, 5, 8, 9].includes(subdomain.id);
          questionsForRole = shouldScore ? Math.floor(Math.random() * 4) + 3 : 0; // 3-6 questions
          break;
        case 'operations': // Operations - business focused
          shouldScore = [4, 5, 9, 10, 11].includes(subdomain.id);
          questionsForRole = shouldScore ? Math.floor(Math.random() * 3) + 2 : 0; // 2-4 questions
          break;
        case 'compliance': // Compliance & Risk - governance focused
          shouldScore = [2, 6, 7, 10, 11].includes(subdomain.id);
          questionsForRole = shouldScore ? Math.floor(Math.random() * 4) + 4 : 0; // 4-7 questions
          break;
      }

      if (shouldScore && questionsForRole > 0) {
        const score = generateRealisticScore();
        const percentage = (score / 5.0) * 100;

        insertSessionScore.run(
          sessionId,
          subdomain.id,
          'subdomain',
          score,
          percentage,
          getMaturityLevel(score),
          questionsForRole,
          questionsForRole
        );

        totalQuestions += questionsForRole;
        totalAnswered += questionsForRole;
        totalScore += score;
        scoredSubdomains++;
      }
    });

    // Calculate overall score
    const overallScore = scoredSubdomains > 0 ? totalScore / scoredSubdomains : 0;
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

    console.log(`Added assessment for ${user.name} (${code}) - Score: ${overallScore.toFixed(1)}`);
  });

  console.log('\n✅ Successfully added 10 sample assessments for Forefront organization!');
  console.log('\nYou can now generate a collective report using these codes:');
  codes.forEach(code => console.log(`- ${code}`));

  console.log('\nTo test the consolidated report:');
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