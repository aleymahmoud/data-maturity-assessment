// src/app/api/generate-recommendations/route.js
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { openDatabase } from '../../../lib/database.js';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

// Set API version to v1 instead of v1beta
const apiSettings = {
  apiVersion: 'v1'
};

export async function POST(request) {
  try {
    const { sessionId, language = 'en', showPrompt = false, forceRegenerate = false } = await request.json();

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 });
    }

    const database = await openDatabase();

    // Check if recommendations already exist for the requested language (unless forceRegenerate is true)
    if (!forceRegenerate && !showPrompt) {
      console.log(`Checking for cached recommendations: sessionId=${sessionId}`);

      // Fetch BOTH English and Arabic recommendations
      const [existingRecsEN] = await database.execute(`
        SELECT
          r.id,
          r.recommendation_type,
          r.priority,
          r.title,
          r.description,
          r.display_order,
          rm.generated_at,
          rm.overall_score,
          rm.maturity_level,
          rm.maturity_summary_description,
          rm.maturity_summary_indicators
        FROM recommendations r
        JOIN recommendation_metadata rm ON r.session_id = rm.session_id AND rm.language = 'en'
        WHERE r.session_id = ? AND r.language = 'en'
        ORDER BY r.recommendation_type, r.display_order
      `, [sessionId]);

      const [existingRecsAR] = await database.execute(`
        SELECT
          r.id,
          r.recommendation_type,
          r.priority,
          r.title,
          r.description,
          r.display_order,
          rm.maturity_summary_description,
          rm.maturity_summary_indicators
        FROM recommendations r
        JOIN recommendation_metadata rm ON r.session_id = rm.session_id AND rm.language = 'ar'
        WHERE r.session_id = ? AND r.language = 'ar'
        ORDER BY r.recommendation_type, r.display_order
      `, [sessionId]);

      console.log(`Found ${existingRecsEN.length} EN and ${existingRecsAR.length} AR cached recommendations`);

      if (existingRecsEN.length > 0 && existingRecsAR.length > 0) {
        console.log(`✓ Returning cached recommendations for language: ${language}`);

        // Return only the requested language
        const existingRecs = language === 'ar' ? existingRecsAR : existingRecsEN;

        const general = existingRecs
          .filter(r => r.recommendation_type === 'general')
          .map(r => ({
            priority: r.priority,
            title: r.title,
            description: r.description
          }));

        const role = existingRecs
          .filter(r => r.recommendation_type === 'role')
          .map(r => ({
            priority: r.priority,
            title: r.title,
            description: r.description
          }));

        // Get maturity summary for the requested language
        const selectedRecs = language === 'ar' ? existingRecsAR : existingRecsEN;
        const maturitySummary = {
          description: selectedRecs[0].maturity_summary_description,
          keyIndicators: selectedRecs[0].maturity_summary_indicators || []
        };

        return NextResponse.json({
          success: true,
          cached: true,
          recommendations: {
            maturitySummary,
            general,
            role
          },
          metadata: {
            sessionId,
            overallScore: existingRecsEN[0].overall_score,
            maturityLevel: existingRecsEN[0].maturity_level,
            language,
            generatedAt: existingRecsEN[0].generated_at
          }
        });
      }
    }

    console.log('⚠ No cached recommendations found - generating new ones in BOTH languages...');

    // Fetch session data
    const [sessionRows] = await database.execute(`
      SELECT
        s.*,
        u.name,
        u.email,
        u.organization,
        u.role_title,
        r.name_en as role_name_en,
        r.name_ar as role_name_ar
      FROM assessment_sessions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN roles r ON u.selected_role_id = r.id
      WHERE s.id = ?
    `, [sessionId]);

    if (sessionRows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Session not found'
      }, { status: 404 });
    }

    const sessionData = sessionRows[0];
    const roleName = language === 'ar' ? sessionData.role_name_ar : sessionData.role_name_en;

    // Fetch scores
    const [scores] = await database.execute(`
      SELECT
        sd.id as subdomain_id,
        sd.name_en as subdomain_name,
        sd.domain_id,
        d.name_en as domain_name,
        ss.raw_score,
        ss.percentage_score,
        ss.maturity_level,
        ss.questions_answered
      FROM session_scores ss
      JOIN subdomains sd ON ss.subdomain_id = sd.id
      JOIN domains d ON sd.domain_id = d.id
      WHERE ss.session_id = ? AND ss.score_type = 'subdomain'
      ORDER BY sd.display_order
    `, [sessionId]);

    // Fetch user responses with full question details and selected option text
    const [responses] = await database.execute(`
      SELECT
        ur.question_id,
        ur.selected_option,
        ur.score_value,
        q.text_en as question_text,
        q.subdomain_id,
        sd.name_en as subdomain_name,
        qo.option_text_en as selected_option_text
      FROM user_responses ur
      JOIN questions q ON ur.question_id = q.id
      JOIN subdomains sd ON q.subdomain_id = sd.id
      LEFT JOIN question_options qo ON ur.selected_option = qo.option_key AND qo.question_id = q.id
      WHERE ur.session_id = ?
      ORDER BY CAST(SUBSTRING(q.id, 2) AS UNSIGNED)
    `, [sessionId]);

    // Calculate overall score
    const overallScore = scores.length > 0
      ? (scores.reduce((sum, s) => sum + parseFloat(s.raw_score || 0), 0) / scores.length).toFixed(1)
      : '0.0';

    // Determine maturity level
    let maturityLevel = 'Initial';
    const scoreNum = parseFloat(overallScore);
    if (scoreNum >= 4.3) maturityLevel = 'Optimized';
    else if (scoreNum >= 3.5) maturityLevel = 'Advanced';
    else if (scoreNum >= 2.7) maturityLevel = 'Defined';
    else if (scoreNum >= 1.9) maturityLevel = 'Developing';

    // Identify weak and strong areas
    const weakAreas = scores
      .filter(s => parseFloat(s.raw_score) < 2.7)
      .sort((a, b) => parseFloat(a.raw_score) - parseFloat(b.raw_score))
      .slice(0, 3);

    const strongAreas = scores
      .filter(s => parseFloat(s.raw_score) >= 3.5)
      .sort((a, b) => parseFloat(b.raw_score) - parseFloat(a.raw_score))
      .slice(0, 3);

    // Build the prompt with comprehensive framework documentation
    const prompt = `You are an expert data maturity consultant analyzing an organization's data maturity assessment results.

# ASSESSMENT FRAMEWORK CONTEXT

This assessment is based on a comprehensive Data Maturity Framework with 11 subdomains across 3 domain groups:

**Domain Groups:**
1. DATA LIFECYCLE (6 subdomains): Data Collection, Infrastructure, Quality, Analysis, Application, Strategy
2. GOVERNANCE & PROTECTION (2 subdomains): Security, Responsible Use
3. ORGANIZATIONAL ENABLERS (3 subdomains): Leadership, Talent, Culture

**Maturity Levels:**
- Initial (1.0-1.8): Ad-hoc, reactive approaches with minimal formalization
- Developing (1.9-2.6): Basic capabilities with inconsistent implementation
- Defined (2.7-3.4): Standardized approaches with documented processes
- Advanced (3.5-4.2): Enterprise-wide integration with proactive management
- Optimized (4.3-5.0): Innovative approaches with continuous improvement

# FRAMEWORK DETAILED MAPPING

**DATA LIFECYCLE DOMAIN:**

1. Data Collection Subdomain - Assesses systematic approach to identifying, gathering, and capturing data
   - Q1: Data Needs Identification - Strategic approach to determining what data to collect
   - Q2: Collection Process Design - Methodology for implementing new data collection initiatives
   - Q3: Collection Standardization - Consistency across organizational units

2. Infrastructure Subdomain - Technical foundation for storing, processing, and integrating data
   - Q4: Data Integration Capability - Technical ability to combine data from multiple sources
   - Q5: System Reliability and Performance - Dependability and operational stability
   - Q6: Scalability and Capacity Management - Ability to handle growing data volumes

3. Quality Subdomain - Systematic management of data accuracy, consistency, and reliability
   - Q7: Error Detection and Correction - Processes for identifying and fixing quality issues
   - Q8: Data Consistency Management - Coordination across multiple systems
   - Q9: Data Standards and Documentation - Knowledge management for proper data use

4. Analysis Subdomain - Sophistication in examining data and generating insights
   - Q10: Causal Analysis Capability - Understanding why events occur
   - Q11: Predictive Analysis and Planning - Anticipating future challenges
   - Q12: Program Evaluation Rigor - Measuring effectiveness and impact
   - Q13: Comparative Analysis and Benchmarking - Competitive intelligence capability

5. Application Subdomain - Converting insights into actions and improvements
   - Q14: Insight Implementation Process - Speed of translating discoveries into action
   - Q15: Performance Problem Response - Addressing poor performance revealed by data
   - Q16: Change Management - Adaptability when data challenges practices

6. Strategy Subdomain - Integration of data into high-level decision-making
   - Q17: Data-Driven Resource Allocation - Evidence-based budget decisions
   - Q18: Strategic Expansion Analysis - Rigor in major strategic decisions
   - Q19: Impact Communication - Demonstrating value through data

**GOVERNANCE & PROTECTION DOMAIN:**

7. Security Subdomain - Protection through access controls, monitoring, and recovery
   - Q20: Access Control Management - Rigor of data access approval processes
   - Q21: Security Lifecycle Management - Access management throughout employee lifecycle
   - Q22: Disaster Recovery - Preparedness for system failures

8. Responsible Subdomain - Ethical practices, compliance, and stakeholder trust
   - Q23: Privacy and Consent Management - Transparency in data collection
   - Q24: Regulatory Compliance Management - Staying current with regulations
   - Q25: Ethical Data Use Evaluation - Systematic evaluation of ethical implications

**ORGANIZATIONAL ENABLERS DOMAIN:**

9. Leadership Subdomain - Executive commitment and modeling of data-driven approaches
   - Q26: Leadership Data Advocacy - Active promotion by senior leaders
   - Q27: Leadership Adaptability - Response to uncomfortable truths
   - Q28: Strategic Investment - Resource allocation priority
   - Q29: Change Management - Managing organizational resistance

10. Talent Subdomain - Attract, develop, and retain data skills
    - Q30: Technical Talent Adequacy - Sufficiency of technical skills
    - Q31: Data Literacy Development - Systematic skill development across organization
    - Q32: Talent Acquisition and Retention - Building analytical workforce

11. Culture Subdomain - Attitudes, behaviors, and norms that encourage data use
    - Q33: Data-Driven Innovation - Openness to challenging assumptions
    - Q34: Cross-Functional Collaboration - Collaboration between teams
    - Q35: Experimentation Culture - Encouragement of data-driven learning

# USER'S ASSESSMENT RESULTS

**User Role:** ${roleName}

**Overall Assessment:**
- Overall Maturity Score: ${overallScore}/5.0
- Maturity Level: ${maturityLevel}
- Questions Answered: ${responses.length}/${sessionData.total_questions}

**Subdomain Performance:**
${scores.map(s => `- ${s.subdomain_name} (${s.domain_name}): ${parseFloat(s.raw_score).toFixed(1)}/5.0 - ${s.maturity_level}`).join('\n')}

**Weakest Areas (Priority for Improvement):**
${weakAreas.length > 0 ? weakAreas.map(s => `- ${s.subdomain_name}: ${parseFloat(s.raw_score).toFixed(1)}/5.0`).join('\n') : 'No significant weak areas identified'}

**Strongest Areas:**
${strongAreas.length > 0 ? strongAreas.map(s => `- ${s.subdomain_name}: ${parseFloat(s.raw_score).toFixed(1)}/5.0`).join('\n') : 'No significant strong areas identified'}

# COMPLETE USER RESPONSES

Below are ALL questions answered with the user's selected responses and scores:

${responses
  .map(r => `**${r.question_id}** - ${r.question_text}
Subdomain: ${r.subdomain_name}
Selected Response: "${r.selected_option_text}"
Score: ${r.score_value}/5`)
  .join('\n\n')}

# YOUR TASK

Generate the following:

1. **Maturity Level Summary:** A brief analysis (2-3 sentences) explaining what their current maturity level means based on their actual responses and scores. Include 3 key indicators that characterize their current state.

2. **General Recommendations (5 items):** Recommendations applicable to improving overall data maturity across the organization, focusing on the weakest areas and foundational improvements.

3. **Role-Specific Recommendations (5 items):** Recommendations specifically tailored for someone in the "${roleName}" role, considering what actions they can directly influence or champion.

# OUTPUT FORMAT

Return ONLY valid JSON in this exact structure (no markdown, no extra text):

{
  "maturitySummary": {
    "levelName": "${maturityLevel}",
    "description": "2-3 sentences explaining what this level means for this organization based on their responses",
    "keyIndicators": [
      "First key indicator observed from their responses",
      "Second key indicator observed from their responses",
      "Third key indicator observed from their responses"
    ]
  },
  "generalRecommendations": [
    {
      "priority": "high",
      "title": "Clear, actionable title (max 60 characters)",
      "description": "Specific, actionable description explaining what to do and why (2-3 sentences)"
    }
  ],
  "roleRecommendations": [
    {
      "priority": "medium",
      "title": "Role-specific title (max 60 characters)",
      "description": "Specific action this role can take (2-3 sentences)"
    }
  ]
}

# GUIDELINES

**Priority Levels:**
- "high" (critical, immediate action needed)
- "medium" (important, near-term)
- "low" (beneficial, longer-term)

**Writing Style Requirements:**
- Use SIMPLE, CLEAR language that anyone can understand
- Write at a 10th-grade reading level - avoid jargon and technical terms
- Use SHORT sentences (15-20 words maximum)
- Be SPECIFIC and ACTIONABLE - avoid vague or generic advice
- Each recommendation should answer: "What exactly should they DO?"
- Use active voice and direct language (e.g., "Create a team" not "A team should be created")
- Avoid buzzwords like "leverage", "synergy", "paradigm", "ecosystem"
- If you must use a technical term, explain it simply

**Content Requirements:**
- Base priority on the severity of gaps and impact on overall maturity
- Consider the user's current maturity level when suggesting next steps
- Focus on practical, concrete steps they can take NOW
- For role-specific recommendations, focus on actions this role can directly influence
- Each title should be clear and descriptive (max 60 characters)
- Each description should be 2-3 short, clear sentences

**Language:** ${language === 'ar' ? 'Respond in Arabic using simple, clear language' : 'Respond in English using simple, clear language'}

Generate the recommendations now:`;

    // If showPrompt flag is set, return the prompt instead of calling API
    if (showPrompt) {
      return NextResponse.json({
        success: true,
        prompt: prompt,
        promptLength: prompt.length,
        estimatedTokens: Math.ceil(prompt.length / 4)
      });
    }

    // Generate recommendations in English first
    console.log('🌐 Step 1: Generating recommendations in English...');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    let recommendationsEN;
    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      console.log('Raw LLM Response (EN):', responseText.substring(0, 200) + '...');

      // Parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      recommendationsEN = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);

      // Validate structure
      if (!recommendationsEN.maturitySummary || !recommendationsEN.generalRecommendations || !recommendationsEN.roleRecommendations) {
        throw new Error('Invalid recommendations structure - missing required fields');
      }

      console.log('✓ Generated English recommendations with maturity summary');
    } catch (error) {
      console.error('Error generating English recommendations:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to generate recommendations',
        details: error.message
      }, { status: 500 });
    }

    // Translate to Arabic using a simple prompt
    console.log('🌐 Step 2: Translating recommendations to Arabic...');

    let recommendationsAR;
    try {
      const translationPrompt = `Translate the following recommendations to Arabic. Keep the same structure and format. Use simple, clear Arabic that anyone can understand. Maintain the priority levels (high, medium, low) as English words. Translate the levelName field value as well.

English Recommendations:
${JSON.stringify(recommendationsEN, null, 2)}

Return ONLY the translated JSON in this exact format:
{
  "maturitySummary": {
    "levelName": "Arabic translation of level name",
    "description": "Arabic translation here",
    "keyIndicators": [
      "Arabic translation here",
      "Arabic translation here",
      "Arabic translation here"
    ]
  },
  "generalRecommendations": [
    {
      "priority": "high",
      "title": "Arabic translation here",
      "description": "Arabic translation here"
    }
  ],
  "roleRecommendations": [
    {
      "priority": "high",
      "title": "Arabic translation here",
      "description": "Arabic translation here"
    }
  ]
}`;

      const translationResult = await model.generateContent(translationPrompt);
      const translationText = translationResult.response.text();

      console.log('Raw Translation Response:', translationText.substring(0, 200) + '...');

      // Parse translation
      const jsonMatch = translationText.match(/\{[\s\S]*\}/);
      recommendationsAR = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(translationText);

      // Validate structure
      if (!recommendationsAR.maturitySummary || !recommendationsAR.generalRecommendations || !recommendationsAR.roleRecommendations) {
        throw new Error('Invalid Arabic recommendations structure');
      }

      console.log('✓ Translated recommendations to Arabic');
    } catch (error) {
      console.error('Error translating to Arabic:', error);
      // If translation fails, fall back to English recommendations
      console.warn('⚠️ Translation failed, using English recommendations for both languages');
      recommendationsAR = recommendationsEN;
    }

    // Use the requested language for the response
    const recommendations = language === 'ar' ? recommendationsAR : recommendationsEN;

    // Store recommendations in database - BOTH languages
    try {
      // Start transaction (use query for transaction commands, not execute)
      await database.query('START TRANSACTION');

      // Delete existing recommendations if forceRegenerate
      if (forceRegenerate) {
        await database.execute('DELETE FROM recommendations WHERE session_id = ?', [sessionId]);
        await database.execute('DELETE FROM recommendation_metadata WHERE session_id = ?', [sessionId]);
      }

      // Insert metadata for both languages
      const metadataEN = {
        description: recommendationsEN.maturitySummary.description,
        indicators: recommendationsEN.maturitySummary.keyIndicators
      };

      const metadataAR = {
        description: recommendationsAR.maturitySummary.description,
        indicators: recommendationsAR.maturitySummary.keyIndicators
      };

      await database.execute(`
        INSERT INTO recommendation_metadata
        (session_id, generated_at, model_version, language, overall_score, maturity_level, maturity_summary_description, maturity_summary_indicators)
        VALUES (?, NOW(), 'gemini-2.5-pro', 'en', ?, ?, ?, ?)
      `, [sessionId, overallScore, maturityLevel, metadataEN.description, JSON.stringify(metadataEN.indicators)]);

      await database.execute(`
        INSERT INTO recommendation_metadata
        (session_id, generated_at, model_version, language, overall_score, maturity_level, maturity_summary_description, maturity_summary_indicators)
        VALUES (?, NOW(), 'gemini-2.5-pro', 'ar', ?, ?, ?, ?)
      `, [sessionId, overallScore, maturityLevel, metadataAR.description, JSON.stringify(metadataAR.indicators)]);

      // Helper function to insert recommendations for a language
      const insertRecommendationsForLanguage = async (recs, lang) => {
        // Insert general recommendations
        for (let i = 0; i < recs.generalRecommendations.length; i++) {
          const rec = recs.generalRecommendations[i];
          const recId = `${sessionId}_${lang}_general_${i + 1}`;

          await database.execute(`
            INSERT INTO recommendations
            (id, session_id, recommendation_type, priority, title, description, display_order, language)
            VALUES (?, ?, 'general', ?, ?, ?, ?, ?)
          `, [recId, sessionId, rec.priority, rec.title, rec.description, i + 1, lang]);
        }

        // Insert role-specific recommendations
        for (let i = 0; i < recs.roleRecommendations.length; i++) {
          const rec = recs.roleRecommendations[i];
          const recId = `${sessionId}_${lang}_role_${i + 1}`;

          await database.execute(`
            INSERT INTO recommendations
            (id, session_id, recommendation_type, priority, title, description, display_order, language)
            VALUES (?, ?, 'role', ?, ?, ?, ?, ?)
          `, [recId, sessionId, rec.priority, rec.title, rec.description, i + 1, lang]);
        }
      };

      // Store both English and Arabic recommendations
      await insertRecommendationsForLanguage(recommendationsEN, 'en');
      await insertRecommendationsForLanguage(recommendationsAR, 'ar');

      // Commit transaction (use query for transaction commands, not execute)
      await database.query('COMMIT');

      console.log(`✓ Recommendations saved to database for session ${sessionId} in BOTH languages`);

    } catch (dbError) {
      // Rollback on error (use query for transaction commands, not execute)
      try {
        await database.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
      console.error('Error saving recommendations to database:', dbError);
      // Continue even if database save fails - still return recommendations
    }

    // Return only the requested language (both are saved in DB)
    const recommendationsToReturn = language === 'ar' ? recommendationsAR : recommendationsEN;

    return NextResponse.json({
      success: true,
      cached: false,
      recommendations: {
        maturitySummary: {
          description: recommendationsToReturn.maturitySummary.description,
          keyIndicators: recommendationsToReturn.maturitySummary.keyIndicators
        },
        general: recommendationsToReturn.generalRecommendations,
        role: recommendationsToReturn.roleRecommendations
      },
      metadata: {
        sessionId,
        overallScore,
        maturityLevel,
        language,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate recommendations',
      details: error.message
    }, { status: 500 });
  }
}
