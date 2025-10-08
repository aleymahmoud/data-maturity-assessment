import { NextResponse } from 'next/server';
import { openDatabase } from '../../../../lib/database.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';

// Increase API route timeout to 5 minutes for AI generation
export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

// Fetch all framework metadata dynamically from database
async function fetchFrameworkMetadata(db) {
  // 1. Fetch domains
  const [domains] = await db.execute(`
    SELECT id, name_en, name_ar, description_en, description_ar, display_order
    FROM domains
    ORDER BY display_order, id
  `);

  // 2. Fetch subdomains
  const [subdomains] = await db.execute(`
    SELECT id, domain_id, name_en, name_ar, description_en, description_ar, display_order
    FROM subdomains
    ORDER BY display_order, id
  `);

  // 3. Fetch maturity levels
  const [maturityLevels] = await db.execute(`
    SELECT level_number, level_name as name_en, level_description_en as description_en,
           level_description_ar as description_ar, score_range_min as min_score, score_range_max as max_score
    FROM maturity_levels
    ORDER BY level_number
  `);

  // 4. Fetch all questions
  const [questions] = await db.execute(`
    SELECT id, subdomain_id, title_en, title_ar, text_en, text_ar, scenario_en, scenario_ar, display_order
    FROM questions
    ORDER BY display_order, id
  `);

  // 5. Fetch all question options
  const [options] = await db.execute(`
    SELECT question_id, option_key, option_text_en, option_text_ar, score_value as score
    FROM question_options
    WHERE option_key NOT IN ('na', 'ns')
    ORDER BY question_id, score_value
  `);

  return {
    domains,
    subdomains,
    maturityLevels,
    questions,
    options
  };
}

// Build dynamic framework context for Gemini prompt
function buildDynamicFrameworkContext(framework) {
  const { domains, subdomains, maturityLevels, questions, options } = framework;

  let context = `# DATA MATURITY ASSESSMENT FRAMEWORK\n\n`;

  // Domain Groups & Subdomains
  context += `## Domain Groups & Subdomains\n\n`;

  domains.forEach((domain, idx) => {
    context += `### Domain ${idx + 1}: ${domain.name_en}\n`;
    context += `${domain.description_en}\n\n`;

    // Find subdomains for this domain
    const domainSubdomains = subdomains.filter(s => s.domain_id === domain.id);
    domainSubdomains.forEach(subdomain => {
      context += `**${subdomain.name_en}**\n`;
      context += `- ${subdomain.description_en}\n\n`;
    });
  });

  // Maturity Levels (dynamic scoring)
  context += `## Maturity Levels\n\n`;
  maturityLevels.forEach(level => {
    context += `${level.level_number}. **${level.name_en}** (${level.min_score}-${level.max_score}): ${level.description_en}\n`;
  });
  context += `\n---\n\n`;

  // Questions with Options (grouped by subdomain)
  context += `## COMPLETE ASSESSMENT QUESTIONS (${questions.length} Questions)\n\n`;

  subdomains.forEach(subdomain => {
    const subdomainQuestions = questions.filter(q => q.subdomain_id === subdomain.id);

    if (subdomainQuestions.length > 0) {
      context += `### ${subdomain.name_en}\n\n`;

      subdomainQuestions.forEach(question => {
        context += `**${question.id}. ${question.title_en}**\n`;
        context += `Question: "${question.text_en}"\n`;
        if (question.scenario_en) {
          context += `Scenario: ${question.scenario_en}\n`;
        }
        context += `Options:\n`;

        // Get options for this question
        const questionOptions = options.filter(o => o.question_id === question.id);
        questionOptions.forEach(opt => {
          context += `  ${opt.score}/5: ${opt.option_text_en}\n`;
        });
        context += `\n`;
      });
    }
  });

  return context;
}

// Get maturity level based on dynamic scoring
function getMaturityLevel(score, maturityLevels) {
  const level = maturityLevels.find(l =>
    score >= parseFloat(l.min_score) && score <= parseFloat(l.max_score)
  );

  return level ? level.name_en : 'Unknown';
}

// Fetch all assessment data for selected codes
async function fetchAssessmentDataForCodes(db, codes, framework) {
  const assessments = [];
  let organizationName = null;
  const rolesSet = new Set();

  for (const code of codes) {
    // Get session data
    const [sessions] = await db.execute(`
      SELECT s.id, s.user_id, s.code, s.status, s.session_start, s.session_end,
             u.organization, u.role_title
      FROM assessment_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.code = ? AND s.status = 'completed'
      ORDER BY s.session_start DESC
      LIMIT 1
    `, [code]);

    if (sessions.length === 0) continue;

    const session = sessions[0];
    if (!organizationName) organizationName = session.organization;
    if (session.role_title) rolesSet.add(session.role_title);

    // Get responses
    const [responses] = await db.execute(`
      SELECT ur.question_id, ur.selected_option, q.subdomain_id, q.text_en
      FROM user_responses ur
      JOIN questions q ON ur.question_id = q.id
      WHERE ur.session_id = ?
      ORDER BY ur.question_id
    `, [session.id]);

    // Get subdomain scores
    const [scores] = await db.execute(`
      SELECT ss.subdomain_id, ss.percentage_score, ss.maturity_level,
             sd.name_en as subdomain_name
      FROM session_scores ss
      JOIN subdomains sd ON ss.subdomain_id = sd.id
      WHERE ss.session_id = ? AND ss.score_type = 'subdomain'
    `, [session.id]);

    // Get overall score from recommendation_metadata
    const [overall] = await db.execute(`
      SELECT overall_score, maturity_level as overall_maturity_level
      FROM recommendation_metadata
      WHERE session_id = ?
      LIMIT 1
    `, [session.id]);

    assessments.push({
      sessionId: session.id,
      code: session.code,
      role: session.role_title,
      organization: session.organization,
      completedAt: session.session_end,
      overallScore: overall[0]?.overall_score || 0,
      maturityLevel: overall[0]?.overall_maturity_level || 'Unknown',
      subdomainScores: scores.map(s => ({
        subdomain: s.subdomain_name,
        subdomainId: s.subdomain_id,
        score: parseFloat(s.percentage_score) / 20, // Convert to 5-point scale
        maturityLevel: s.maturity_level
      })),
      responses: responses.map(r => ({
        questionId: r.question_id,
        subdomainId: r.subdomain_id,
        questionText: r.text_en,
        selectedOption: r.selected_option
      }))
    });
  }

  // Calculate organizational averages
  const subdomainMap = new Map();

  assessments.forEach(assessment => {
    assessment.subdomainScores.forEach(score => {
      if (!subdomainMap.has(score.subdomain)) {
        subdomainMap.set(score.subdomain, []);
      }
      subdomainMap.get(score.subdomain).push(score.score);
    });
  });

  const subdomainScores = Array.from(subdomainMap.entries()).map(([name, scores]) => {
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    return {
      name,
      score: avgScore,
      maturityLevel: getMaturityLevel(avgScore, framework.maturityLevels)
    };
  });

  const overallScore = assessments.reduce((sum, a) => sum + parseFloat(a.overallScore), 0) / assessments.length;

  return {
    organizationName,
    totalAssessments: assessments.length,
    rolesAssessed: Array.from(rolesSet),
    overallScore: parseFloat(overallScore.toFixed(2)),
    overallMaturityLevel: getMaturityLevel(overallScore, framework.maturityLevels),
    subdomainScores,
    individualAssessments: assessments
  };
}

// Build assessment context for Gemini prompt
function buildAssessmentContext(data, framework) {
  let context = `# ORGANIZATIONAL ASSESSMENT DATA\n\n`;
  context += `## Organization: ${data.organizationName}\n`;
  context += `- Total Assessments: ${data.totalAssessments}\n`;
  context += `- Assessment Codes: ${data.individualAssessments.map(a => a.code).join(', ')}\n`;
  context += `- Overall Organizational Score: ${data.overallScore}/5.0\n`;
  context += `- Overall Maturity Level: ${data.overallMaturityLevel}\n\n`;

  context += `## Organizational Subdomain Scores (Averaged across all assessments)\n`;
  data.subdomainScores.forEach(s => {
    context += `- **${s.name}**: ${s.score.toFixed(2)}/5.0 (${s.maturityLevel})\n`;
  });
  context += `\n---\n\n`;

  context += `## INDIVIDUAL ASSESSMENT DETAILS\n\n`;

  data.individualAssessments.forEach((assessment, idx) => {
    context += `### Assessment ${idx + 1}: ${assessment.organization} - ${assessment.role}\n`;
    context += `**Overall Score:** ${assessment.overallScore}/5.0 (${assessment.maturityLevel})\n`;
    context += `**Assessment Code:** ${assessment.code}\n`;
    context += `**Completion Date:** ${new Date(assessment.completedAt).toLocaleDateString()}\n\n`;

    context += `**Subdomain Scores:**\n`;
    assessment.subdomainScores.forEach(s => {
      context += `- ${s.subdomain}: ${s.score.toFixed(2)}/5.0 (${s.maturityLevel})\n`;
    });
    context += `\n`;

    context += `**Complete Response Analysis:**\n\n`;

    // Group responses by subdomain
    const responsesBySubdomain = new Map();
    assessment.responses.forEach(r => {
      const subdomain = framework.subdomains.find(s => s.id === r.subdomainId);
      const subdomainName = subdomain?.name_en || 'Unknown';

      if (!responsesBySubdomain.has(subdomainName)) {
        responsesBySubdomain.set(subdomainName, []);
      }
      responsesBySubdomain.get(subdomainName).push(r);
    });

    responsesBySubdomain.forEach((responses, subdomainName) => {
      context += `**${subdomainName}:**\n`;
      responses.forEach(r => {
        context += `  ${r.questionId}: Selected ${r.selectedOption}/5\n`;
        context += `    → "${r.questionText}"\n`;
      });
      context += `\n`;
    });

    context += `---\n\n`;
  });

  return context;
}

// Build analysis instructions
function buildInstructionsContext(totalAssessments) {
  return `# ANALYSIS TASK

You are analyzing collective organizational data maturity across ${totalAssessments} assessments.

## Required Analysis:

### 1. Organizational Maturity Analysis (2-3 paragraphs)
Synthesize overall organizational data maturity:
- Cross-functional capability assessment
- Organizational data culture characterization
- Technical vs cultural maturity gaps
- How different roles/departments compare
- Systemic patterns vs isolated issues

### 2. Collective Strengths (5-7 items)
Identify organization-wide strong capabilities:
- Areas where MULTIPLE roles show high scores
- Foundational organizational strengths
- Competitive advantages in data maturity
- Capabilities that can be leveraged for improvement

### 3. Collective Weaknesses (5-7 items)
Identify systemic organizational gaps:
- Areas where MULTIPLE roles score low (systemic issues)
- Infrastructure or cultural barriers
- Root causes affecting the organization
- Critical gaps limiting maturity progression

### 4. Strategic Recommendations (10-15 items)
IMPORTANT: Recommendations must be ORGANIZATIONAL-LEVEL, not individual actions.

For each recommendation provide:
- title: Action-oriented organizational initiative
- description: Why this matters, what organizational problems it solves, expected impact
- priority: "high" | "medium" | "low"
  * high = Critical for maturity progression, affects multiple dimensions
  * medium = Important but can be sequenced
  * low = Nice to have, incremental improvement
- affectedRoles: Array of roles that will be involved/impacted
- timeframe: Realistic implementation period
- prerequisites: What organizational changes must happen first (if any)

### 5. Implementation Roadmap (4-6 phases)
Create realistic phased approach:

Each phase must include:
- phase: Descriptive name with timeframe (e.g., "Phase 1: Foundation Building (0-3 months)")
- timeframe: Duration
- keyActions: 3-5 specific organizational initiatives
- expectedOutcomes: Measurable maturity improvements
- requiredResources: Key roles, budget needs, infrastructure

Ensure phases build logically (prerequisites → execution → optimization)

---

## OUTPUT FORMAT

CRITICAL: Return ONLY valid, parseable JSON.

Rules:
- NO markdown code blocks (no \`\`\`json)
- NO explanatory text before or after the JSON
- ALL strings must use escaped quotes for any quotes inside: use \\" not "
- ALL newlines within strings must be escaped as \\n
- Ensure all JSON is properly closed with matching braces

Return this exact structure:

{
  "organizationalAnalysis": "2-3 paragraph comprehensive analysis...",
  "collectiveStrengths": [
    "Strength description 1",
    "Strength description 2"
  ],
  "collectiveWeaknesses": [
    "Weakness description 1",
    "Weakness description 2"
  ],
  "strategicRecommendations": [
    {
      "title": "Recommendation title",
      "description": "Detailed description of the organizational initiative",
      "priority": "high",
      "affectedRoles": ["Role 1", "Role 2"],
      "timeframe": "3-6 months",
      "prerequisites": ["Prerequisite 1", "Prerequisite 2"]
    }
  ],
  "implementationRoadmap": [
    {
      "phase": "Phase 1: Foundation Building (0-3 months)",
      "timeframe": "0-3 months",
      "keyActions": [
        "Action 1",
        "Action 2"
      ],
      "expectedOutcomes": [
        "Outcome 1",
        "Outcome 2"
      ],
      "requiredResources": [
        "Resource 1",
        "Resource 2"
      ]
    }
  ]
}
`;
}

export async function POST(request) {
  try {
    const { codes } = await request.json();

    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No assessment codes provided'
      }, { status: 400 });
    }

    const db = await openDatabase();

    // 1. Generate hash for caching
    const sortedCodes = [...codes].sort();
    const codesHash = crypto.createHash('md5')
      .update(sortedCodes.join(','))
      .digest('hex');

    console.log(`Checking cache for hash: ${codesHash}`);

    // 2. Check cache
    const [cached] = await db.execute(
      'SELECT * FROM collective_recommendations WHERE codes_hash = ?',
      [codesHash]
    );

    if (cached.length > 0) {
      console.log('✅ Cache hit! Returning cached recommendations');

      // Update last_accessed
      await db.execute(
        'UPDATE collective_recommendations SET last_accessed = NOW() WHERE id = ?',
        [cached[0].id]
      );

      // Helper to safely parse JSON (handles both string and object)
      const safeJsonParse = (value) => {
        if (typeof value === 'string') {
          try {
            return JSON.parse(value);
          } catch (e) {
            console.error('Failed to parse JSON string:', e.message);
            return value;
          }
        }
        return value; // Already an object
      };

      return NextResponse.json({
        success: true,
        cached: true,
        data: {
          organizationName: cached[0].organization_name,
          totalAssessments: cached[0].total_assessments,
          rolesAssessed: safeJsonParse(cached[0].roles_assessed),
          overallScore: parseFloat(cached[0].overall_score),
          overallMaturityLevel: cached[0].overall_maturity_level,
          subdomainScores: safeJsonParse(cached[0].subdomain_scores),
          organizationalAnalysis: cached[0].organizational_analysis,
          collectiveStrengths: safeJsonParse(cached[0].collective_strengths),
          collectiveWeaknesses: safeJsonParse(cached[0].collective_weaknesses),
          strategicRecommendations: safeJsonParse(cached[0].strategic_recommendations),
          implementationRoadmap: safeJsonParse(cached[0].implementation_roadmap)
        }
      });
    }

    console.log('Cache miss. Generating new recommendations...');

    // 3. Fetch DYNAMIC framework metadata from database
    console.log('Fetching framework metadata from database...');
    const framework = await fetchFrameworkMetadata(db);
    console.log(`✓ Loaded ${framework.domains.length} domains, ${framework.subdomains.length} subdomains, ${framework.questions.length} questions`);

    // 4. Fetch all assessment data for selected codes
    console.log('Fetching assessment data for codes...');
    const assessmentData = await fetchAssessmentDataForCodes(db, codes, framework);
    console.log(`✓ Loaded ${assessmentData.totalAssessments} assessments for ${assessmentData.organizationName}`);

    if (assessmentData.totalAssessments === 0) {
      return NextResponse.json({
        success: false,
        error: 'No completed assessments found for the provided codes'
      }, { status: 404 });
    }

    // 5. Build DYNAMIC prompt
    console.log('Building Gemini prompt...');
    const frameworkContext = buildDynamicFrameworkContext(framework);
    const assessmentContext = buildAssessmentContext(assessmentData, framework);
    const instructionsContext = buildInstructionsContext(assessmentData.totalAssessments);

    const fullPrompt = frameworkContext + '\n' + assessmentContext + '\n' + instructionsContext;
    console.log(`✓ Prompt built: ${fullPrompt.length} characters (~${Math.ceil(fullPrompt.length / 4)} tokens)`);

    // 6. Call Gemini Pro 2.5
    console.log('Calling Gemini Pro 2.5...');
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-thinking-exp',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 16000,
        responseMimeType: 'application/json'
      }
    });

    const result = await model.generateContent(fullPrompt);
    const response = result.response.text();
    const usage = result.response.usageMetadata;

    console.log(`✓ Gemini response: ${usage.promptTokenCount} input tokens, ${usage.candidatesTokenCount} output tokens`);

    // 7. Parse JSON response with error handling
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    let analysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('❌ JSON parsing failed. Raw response length:', cleaned.length);
      console.error('Error position:', parseError.message);

      // Try to extract JSON from the response using regex
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log('Attempting to parse extracted JSON...');
        try {
          analysis = JSON.parse(jsonMatch[0]);
          console.log('✅ Successfully parsed extracted JSON');
        } catch (secondError) {
          // Save the problematic response for debugging - write to a log file instead
          console.error('❌ Second parse attempt failed.');
          console.error('Raw response (first 1000 chars):', cleaned.substring(0, 1000));
          console.error('Raw response (last 1000 chars):', cleaned.substring(Math.max(0, cleaned.length - 1000)));

          // Try to save to file for debugging
          try {
            const fs = require('fs');
            const errorLogPath = `./gemini-error-${codesHash}-${Date.now()}.txt`;
            fs.writeFileSync(errorLogPath, cleaned);
            console.error(`✓ Raw response saved to: ${errorLogPath}`);
          } catch (fsError) {
            console.error('Could not save error log to file:', fsError.message);
          }

          throw new Error(`Failed to parse Gemini JSON response: ${parseError.message}. Response length: ${cleaned.length}. Check server logs for details.`);
        }
      } else {
        throw new Error(`No valid JSON found in Gemini response: ${parseError.message}`);
      }
    }

    // 8. Save to database (NO EXPIRATION)
    console.log('Saving to database...');
    await db.execute(`
      INSERT INTO collective_recommendations (
        codes_hash, assessment_codes, organization_name,
        total_assessments, roles_assessed, overall_score, overall_maturity_level,
        organizational_analysis, collective_strengths, collective_weaknesses,
        strategic_recommendations, implementation_roadmap, subdomain_scores
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      codesHash,
      JSON.stringify(sortedCodes),
      assessmentData.organizationName,
      assessmentData.totalAssessments,
      JSON.stringify(assessmentData.rolesAssessed),
      assessmentData.overallScore,
      assessmentData.overallMaturityLevel,
      analysis.organizationalAnalysis,
      JSON.stringify(analysis.collectiveStrengths),
      JSON.stringify(analysis.collectiveWeaknesses),
      JSON.stringify(analysis.strategicRecommendations),
      JSON.stringify(analysis.implementationRoadmap),
      JSON.stringify(assessmentData.subdomainScores)
    ]);

    console.log('✅ Collective recommendations generated and cached successfully');

    const responsePayload = {
      success: true,
      cached: false,
      tokenUsage: {
        input: usage.promptTokenCount,
        output: usage.candidatesTokenCount,
        total: usage.totalTokenCount
      },
      data: {
        organizationName: assessmentData.organizationName,
        totalAssessments: assessmentData.totalAssessments,
        rolesAssessed: assessmentData.rolesAssessed,
        overallScore: assessmentData.overallScore,
        overallMaturityLevel: assessmentData.overallMaturityLevel,
        subdomainScores: assessmentData.subdomainScores,
        organizationalAnalysis: analysis.organizationalAnalysis,
        collectiveStrengths: analysis.collectiveStrengths,
        collectiveWeaknesses: analysis.collectiveWeaknesses,
        strategicRecommendations: analysis.strategicRecommendations,
        implementationRoadmap: analysis.implementationRoadmap
      }
    };

    console.log('📤 Sending response with data fields:', Object.keys(responsePayload.data));
    console.log('📊 Response size estimate:', JSON.stringify(responsePayload).length, 'bytes');
    console.log('✅ Returning response to client...');

    return NextResponse.json(responsePayload);

  } catch (error) {
    console.error('Error generating collective recommendations:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
