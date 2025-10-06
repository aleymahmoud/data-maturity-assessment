// scripts/simulate-full-assessments.js
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'data_maturity.db'));

// Assessment codes to simulate
const codes = [
  '75F2B7E3', 'A5E2C49E', 'DB7CE4BE', '3F940611', 'EDF5D818',
  '68C1E64A', 'B3A506C8', '57488CA6', 'A38087CF', '9E5E4C5A'
];

// Sample users for Forefront organization
const sampleUsers = [
  {
    name: 'Ahmed Al-Rashid',
    email: 'ahmed.rashid@forefront.sa',
    organization: 'Forefront',
    role_title: 'Data Manager',
    role_id: 'it-technology',
    department: 'Information Technology'
  },
  {
    name: 'Fatima Hassan',
    email: 'fatima.hassan@forefront.sa',
    organization: 'Forefront',
    role_title: 'Business Analyst',
    role_id: 'analytics',
    department: 'Business Intelligence'
  },
  {
    name: 'Omar Abdullah',
    email: 'omar.abdullah@forefront.sa',
    organization: 'Forefront',
    role_title: 'IT Director',
    role_id: 'it-technology',
    department: 'Information Technology'
  },
  {
    name: 'Layla Mahmoud',
    email: 'layla.mahmoud@forefront.sa',
    organization: 'Forefront',
    role_title: 'Executive Manager',
    role_id: 'executive',
    department: 'Executive Office'
  },
  {
    name: 'Khalid Al-Zahra',
    email: 'khalid.zahra@forefront.sa',
    organization: 'Forefront',
    role_title: 'BI Specialist',
    role_id: 'analytics',
    department: 'Business Intelligence'
  },
  {
    name: 'Nour Al-Mansouri',
    email: 'nour.mansouri@forefront.sa',
    organization: 'Forefront',
    role_title: 'Data Governance Lead',
    role_id: 'compliance',
    department: 'Data Governance'
  },
  {
    name: 'Saeed Al-Maliki',
    email: 'saeed.maliki@forefront.sa',
    organization: 'Forefront',
    role_title: 'Operations Manager',
    role_id: 'operations',
    department: 'Operations'
  },
  {
    name: 'Amina Al-Zaidi',
    email: 'amina.zaidi@forefront.sa',
    organization: 'Forefront',
    role_title: 'Chief Technology Officer',
    role_id: 'executive',
    department: 'Executive Office'
  },
  {
    name: 'Hassan Al-Qasimi',
    email: 'hassan.qasimi@forefront.sa',
    organization: 'Forefront',
    role_title: 'Data Analyst',
    role_id: 'analytics',
    department: 'Business Intelligence'
  },
  {
    name: 'Maryam Al-Harbi',
    email: 'maryam.harbi@forefront.sa',
    organization: 'Forefront',
    role_title: 'IT Manager',
    role_id: 'it-technology',
    department: 'Information Technology'
  }
];

// Function to generate realistic assessment responses
function generateResponse() {
  const responses = ['1', '2', '3', '4', '5']; // 1=Initial, 2=Developing, 3=Defined, 4=Advanced, 5=Optimized
  const weights = [0.1, 0.25, 0.4, 0.2, 0.05]; // More likely to answer 2-4, less likely for extremes

  const random = Math.random();
  let cumulative = 0;

  for (let i = 0; i < responses.length; i++) {
    cumulative += weights[i];
    if (random <= cumulative) {
      return responses[i];
    }
  }
  return '3'; // Default fallback
}

async function simulateFullAssessmentCycle() {
  console.log('🚀 Starting full assessment simulation for Forefront organization...\n');

  try {
    // Disable foreign key constraints temporarily
    db.exec('PRAGMA foreign_keys = OFF');

    // Clear existing data for these codes first
    console.log('🧹 Clearing existing data for Forefront codes...');
    const deleteUsers = db.prepare('DELETE FROM users WHERE assessment_code IN (' + codes.map(() => '?').join(',') + ')');
    deleteUsers.run(...codes);

    const deleteCodes = db.prepare('DELETE FROM assessment_codes WHERE code IN (' + codes.map(() => '?').join(',') + ')');
    deleteCodes.run(...codes);

    // Step 1: Add assessment codes to database
    console.log('📝 Step 1: Adding assessment codes...');

    const insertCode = db.prepare(`
      INSERT OR REPLACE INTO assessment_codes (
        code, organization_name, assessment_type, created_at, expires_at,
        max_uses, usage_count, active, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    codes.forEach(code => {
      const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const expiresAt = new Date(createdAt.getTime() + 90 * 24 * 60 * 60 * 1000);

      insertCode.run(
        code,
        'Forefront',
        'quick',
        createdAt.toISOString(),
        expiresAt.toISOString(),
        10,
        0,
        1,
        'admin' // created_by
      );
    });

    console.log(`✅ Added ${codes.length} assessment codes for Forefront\n`);

    // First check the questions table schema
    const questionTableInfo = db.prepare("PRAGMA table_info(questions)").all();
    const questionColumns = questionTableInfo.map(col => col.name);
    console.log('Questions table columns:', questionColumns);

    // Get all questions (assuming they're all for quick assessment)
    const questions = db.prepare(`
      SELECT q.*, sd.name_en as subdomain_name
      FROM questions q
      JOIN subdomains sd ON q.subdomain_id = sd.id
      ORDER BY q.id
    `).all();

    console.log(`📋 Found ${questions.length} quick assessment questions\n`);

    if (questions.length !== 11) {
      console.warn(`⚠️  Warning: Expected 11 quick questions, but found ${questions.length}`);
    }

    // Step 2-5: For each code, simulate the complete user journey
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];
      const user = sampleUsers[i];

      console.log(`👤 Processing assessment for ${user.name} (${code})...`);

      // Step 2: Validate code (simulate /api/validate-code)
      console.log(`   🔍 Step 2: Validating code ${code}...`);

      const codeValidation = db.prepare(`
        SELECT * FROM assessment_codes
        WHERE code = ? AND active = 1 AND datetime('now') < expires_at
      `).get(code);

      if (!codeValidation) {
        console.error(`   ❌ Code validation failed for ${code}`);
        continue;
      }

      // Step 3: Add user info (simulate user registration)
      console.log(`   📝 Step 3: Adding user information...`);

      const insertUser = db.prepare(`
        INSERT INTO users (
          name, email, organization, role_title, selected_role_id,
          assessment_code, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const userResult = insertUser.run(
        user.name,
        user.email,
        user.organization,
        user.role_title,
        user.role_id,
        code,
        new Date().toISOString()
      );

      const userId = userResult.lastInsertRowid;

      // Update code usage
      db.prepare(`
        UPDATE assessment_codes
        SET usage_count = usage_count + 1
        WHERE code = ?
      `).run(code);

      // Step 4: Create assessment session (simulate /api/session)
      console.log(`   🎯 Step 4: Creating assessment session...`);

      const sessionStart = new Date();
      const insertSession = db.prepare(`
        INSERT INTO assessment_sessions (
          user_id, session_start, completion_percentage, status, language_preference
        ) VALUES (?, ?, ?, ?, ?)
      `);

      const sessionResult = insertSession.run(
        userId,
        sessionStart.toISOString(),
        0,
        'in_progress',
        'en'
      );

      const sessionId = sessionResult.lastInsertRowid;

      // Step 5: Answer all questions (simulate /api/save-responses)
      console.log(`   📝 Step 5: Answering all ${questions.length} questions...`);

      const insertResponse = db.prepare(`
        INSERT INTO user_responses (
          user_id, session_id, question_id, response_value,
          subdomain_id, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      let responses = {};
      questions.forEach(question => {
        const response = generateResponse();

        insertResponse.run(
          userId,
          sessionId,
          question.id,
          response,
          question.subdomain_id,
          new Date().toISOString()
        );

        responses[question.id] = response;
      });

      // Step 6: Calculate scores (simulate /api/calculate-scores)
      console.log(`   🧮 Step 6: Calculating scores...`);

      // Calculate subdomain scores
      const subdomains = db.prepare('SELECT * FROM subdomains').all();
      const insertScore = db.prepare(`
        INSERT INTO session_scores (
          session_id, subdomain_id, score_type, raw_score,
          percentage_score, maturity_level, questions_answered, total_questions
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      let totalScore = 0;
      let totalQuestions = 0;
      let validSubdomains = 0;

      subdomains.forEach(subdomain => {
        const subdomainQuestions = questions.filter(q => q.subdomain_id === subdomain.id);

        if (subdomainQuestions.length > 0) {
          let subdomainTotal = 0;
          subdomainQuestions.forEach(q => {
            subdomainTotal += parseInt(responses[q.id]);
          });

          const avgScore = subdomainTotal / subdomainQuestions.length;
          const percentage = (avgScore / 5.0) * 100;
          const maturityLevel = getMaturityLevel(avgScore);

          insertScore.run(
            sessionId,
            subdomain.id,
            'subdomain',
            avgScore,
            percentage,
            maturityLevel,
            subdomainQuestions.length,
            subdomainQuestions.length
          );

          totalScore += avgScore;
          totalQuestions += subdomainQuestions.length;
          validSubdomains++;
        }
      });

      // Calculate overall score
      const overallScore = validSubdomains > 0 ? totalScore / validSubdomains : 0;
      const overallPercentage = (overallScore / 5.0) * 100;
      const overallMaturity = getMaturityLevel(overallScore);

      insertScore.run(
        sessionId,
        null,
        'overall',
        overallScore,
        overallPercentage,
        overallMaturity,
        totalQuestions,
        totalQuestions
      );

      // Step 7: Complete assessment (simulate /api/complete-assessment)
      console.log(`   ✅ Step 7: Completing assessment...`);

      const sessionEnd = new Date(sessionStart.getTime() + Math.random() * 30 * 60 * 1000); // 0-30 minutes

      db.prepare(`
        UPDATE assessment_sessions
        SET session_end = ?, completion_percentage = ?, status = ?
        WHERE id = ?
      `).run(sessionEnd.toISOString(), 100, 'completed', sessionId);

      console.log(`   🎉 Assessment completed! Score: ${overallScore.toFixed(1)} (${overallMaturity})\n`);
    }

    console.log('🎊 Successfully simulated complete assessment cycle for all 10 users!');
    console.log('\n📊 Summary:');
    console.log(`- Organization: Forefront`);
    console.log(`- Assessment Type: Quick (11 questions)`);
    console.log(`- Total Completed Assessments: ${codes.length}`);
    console.log(`- Users: ${sampleUsers.map(u => u.name).join(', ')}`);

    console.log('\n🔍 Assessment Codes:');
    codes.forEach(code => console.log(`- ${code}`));

    console.log('\n🎯 Next Steps:');
    console.log('1. Go to Admin → Results & Analytics');
    console.log('2. Switch to "Assessment Reports" tab');
    console.log('3. Select "Collective Assessment" report type');
    console.log('4. Select the Forefront codes from the dropdown');
    console.log('5. Click "Generate Report" to see the consolidated results');
    console.log('6. Test the PDF export functionality');

  } catch (error) {
    console.error('❌ Error during simulation:', error);
    throw error;
  } finally {
    // Re-enable foreign key constraints
    db.exec('PRAGMA foreign_keys = ON');
  }
}

function getMaturityLevel(score) {
  if (score >= 4.3) return 'Optimized';
  if (score >= 3.5) return 'Advanced';
  if (score >= 2.7) return 'Defined';
  if (score >= 1.9) return 'Developing';
  return 'Initial';
}

// Run the simulation
simulateFullAssessmentCycle()
  .then(() => {
    console.log('\n✨ Simulation completed successfully!');
  })
  .catch((error) => {
    console.error('💥 Simulation failed:', error);
  })
  .finally(() => {
    db.close();
  });