# Recommendations System - Complete Flow Documentation

## Overview

The recommendations system uses Google Gemini 2.5 Pro AI to generate personalized, actionable recommendations based on the user's assessment results. Recommendations are generated once, stored in the database, and retrieved from cache on subsequent requests.

---

## Database Schema

### 1. `recommendations` Table
Stores individual recommendation items (5 general + 5 role-specific per session).

```sql
CREATE TABLE recommendations (
  id VARCHAR(255) PRIMARY KEY,              -- Format: {sessionId}_general_1
  session_id VARCHAR(255) NOT NULL,         -- Links to assessment_sessions
  recommendation_type ENUM('general', 'role') NOT NULL,
  priority ENUM('high', 'medium', 'low') NOT NULL,
  title VARCHAR(255) NOT NULL,              -- Max 60 characters
  description TEXT NOT NULL,                -- 2-3 simple sentences
  display_order INT NOT NULL,               -- 1-5 for ordering
  language VARCHAR(10) DEFAULT 'en',        -- 'en' or 'ar'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES assessment_sessions(id) ON DELETE CASCADE
)
```

### 2. `recommendation_metadata` Table
Tracks when and how recommendations were generated.

```sql
CREATE TABLE recommendation_metadata (
  session_id VARCHAR(255) PRIMARY KEY,
  generated_at TIMESTAMP NOT NULL,
  model_version VARCHAR(50) DEFAULT 'gemini-2.5-pro',
  language VARCHAR(10) DEFAULT 'en',
  overall_score DECIMAL(3,1),
  maturity_level VARCHAR(50),
  FOREIGN KEY (session_id) REFERENCES assessment_sessions(id) ON DELETE CASCADE
)
```

---

## API Flow Logic

### Endpoint: `/api/generate-recommendations`

**Method:** POST

**Request Body:**
```json
{
  "sessionId": "session_1759221723287_5u36l4b3r",
  "language": "en",                    // Optional: 'en' or 'ar'
  "forceRegenerate": false,            // Optional: force new generation
  "showPrompt": false                  // Optional: return prompt instead
}
```

---

## Complete Request Flow

### Step 1: Check for Cached Recommendations

```javascript
// Query database for existing recommendations
SELECT * FROM recommendations
WHERE session_id = ? AND language = ?
```

**If recommendations exist** → Return cached data immediately
- Response includes `cached: true`
- No AI API call made
- **Fast response (~50ms)**

**If no recommendations exist** → Continue to Step 2

---

### Step 2: Fetch Assessment Data

The system fetches three types of data from the database:

1. **Session Data** - User profile and role
2. **Subdomain Scores** - Performance across all 11 subdomains
3. **User Responses** - ALL questions answered with selected options

```javascript
// Example data fetched:
{
  roleName: "Executive/C-Suite",
  organization: "Test Company",
  overallScore: 3.1,
  maturityLevel: "Defined",
  scores: [
    { subdomain: "Leadership", score: 1.0, level: "Initial" },
    { subdomain: "Talent", score: 1.0, level: "Initial" },
    ...
  ],
  responses: [
    {
      question: "How does your organization identify data needs?",
      selectedAnswer: "We gather data senior staff think might be useful",
      score: 2
    },
    ...
  ]
}
```

---

### Step 3: Build AI Prompt

The prompt includes:

1. **Framework Context** - Complete overview of 11 subdomains and maturity levels
2. **Framework Mapping** - What each of 35 questions measures
3. **User's Results** - Scores, weak/strong areas, all responses
4. **Writing Guidelines** - Simple language, short sentences, actionable advice
5. **Output Format** - JSON structure specification

**Key Writing Guidelines:**
- Simple, clear language (10th-grade reading level)
- Short sentences (15-20 words max)
- No jargon or buzzwords
- Active voice ("Create a team" not "A team should be created")
- Specific and actionable

**Prompt Size:** ~9,500 characters (~2,400 tokens)

---

### Step 4: Call Google Gemini API

```javascript
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
const result = await model.generateContent(prompt);
```

**API Response Time:** ~20-30 seconds (depending on Gemini load)

---

### Step 5: Parse and Validate Response

```javascript
// Expected JSON structure:
{
  "generalRecommendations": [
    {
      "priority": "high",
      "title": "Establish a Data Governance Team",
      "description": "Create a team responsible for..."
    },
    // ... 4 more
  ],
  "roleRecommendations": [
    {
      "priority": "high",
      "title": "Publicly Sponsor a Data Governance Council",
      "description": "Use your executive authority to..."
    },
    // ... 4 more
  ]
}
```

**Validation Checks:**
- Response is valid JSON
- Contains `generalRecommendations` and `roleRecommendations`
- Each has 5 items
- Each item has `priority`, `title`, `description`

---

### Step 6: Store in Database

The system uses a **transaction** to ensure data consistency:

```javascript
START TRANSACTION;

// 1. Insert metadata
INSERT INTO recommendation_metadata (...);

// 2. Insert 5 general recommendations
FOR EACH general recommendation:
  INSERT INTO recommendations (
    id: '{sessionId}_general_{1-5}',
    type: 'general',
    ...
  );

// 3. Insert 5 role recommendations
FOR EACH role recommendation:
  INSERT INTO recommendations (
    id: '{sessionId}_role_{1-5}',
    type: 'role',
    ...
  );

COMMIT;
```

**If database save fails:** System continues and still returns recommendations to user (graceful degradation).

---

### Step 7: Return Response

```json
{
  "success": true,
  "cached": false,                    // false on first generation
  "recommendations": {
    "general": [ /* 5 items */ ],
    "role": [ /* 5 items */ ]
  },
  "metadata": {
    "sessionId": "...",
    "overallScore": "3.1",
    "maturityLevel": "Defined",
    "language": "en",
    "generatedAt": "2025-09-30T18:04:41.111Z"
  }
}
```

---

## Subsequent Requests (Cache Flow)

### When user views results again:

```
Request → Check DB → Found cached? → Return immediately
           ↓
           No → Generate new (Steps 2-7)
```

**Cache Benefits:**
- **Speed:** ~50ms vs ~30 seconds
- **Cost:** $0.00 vs ~$0.02 per generation
- **Consistency:** Same recommendations every time

---

## Force Regeneration

If you want to regenerate recommendations:

```json
{
  "sessionId": "...",
  "forceRegenerate": true
}
```

**What happens:**
1. Deletes existing recommendations from database
2. Deletes metadata
3. Generates fresh recommendations
4. Stores new ones

**Use cases:**
- AI model improved
- Prompt template updated
- User requests new recommendations

---

## Integration with Results Page

### When to Call the API:

**Option 1: On Assessment Completion**
```javascript
// After completing assessment
async function completeAssessment(sessionId) {
  // 1. Calculate scores
  await calculateScores(sessionId);

  // 2. Generate recommendations in background
  fetch('/api/generate-recommendations', {
    method: 'POST',
    body: JSON.stringify({ sessionId })
  });

  // 3. Redirect to results page immediately
  router.push(`/results?session=${sessionId}`);
}
```

**Option 2: On Results Page Load**
```javascript
// In results page
useEffect(() => {
  async function loadRecommendations() {
    setLoading(true);

    const response = await fetch('/api/generate-recommendations', {
      method: 'POST',
      body: JSON.stringify({ sessionId })
    });

    const data = await response.json();
    setRecommendations(data.recommendations);
    setLoading(false);

    // If cached, loads instantly
    // If new, takes ~30 seconds
  }

  loadRecommendations();
}, [sessionId]);
```

**Recommended Approach:** Option 2 (on results page load)
- Simpler error handling
- User sees loading state
- Works even if background generation fails

---

## Error Handling

### Possible Errors:

1. **Session not found**
   - Status: 404
   - Response: `{ success: false, error: 'Session not found' }`

2. **Gemini API failure**
   - Status: 500
   - Response: `{ success: false, error: 'Failed to generate recommendations' }`

3. **Invalid JSON from AI**
   - Status: 500
   - Includes `rawResponse` for debugging

4. **Database error**
   - Recommendations still returned
   - Error logged to console
   - Next request will regenerate

---

## Language Support

### English (default):
```json
{ "sessionId": "...", "language": "en" }
```

### Arabic:
```json
{ "sessionId": "...", "language": "ar" }
```

**What changes:**
- Prompt instructs AI to respond in Arabic
- Recommendations stored with `language = 'ar'`
- Uses Arabic field names from database (role_name_ar, etc.)

---

## Performance Metrics

### First Generation:
- **Database queries:** ~5 queries
- **AI generation:** 20-30 seconds
- **Database storage:** ~15 INSERT queries
- **Total time:** ~25-35 seconds

### Cached Retrieval:
- **Database query:** 1 query
- **Total time:** ~50ms

### Cost per Generation:
- **Gemini 2.5 Pro:** ~$0.015-0.02 per request
- **Database storage:** Negligible

---

## Monitoring

### Key Metrics to Track:

1. **Cache hit rate** - What % of requests use cache?
2. **Generation time** - How long does AI take?
3. **Failure rate** - How often does generation fail?
4. **User satisfaction** - Are recommendations helpful?

### Logs to Monitor:

```javascript
// Success
console.log(`✓ Recommendations saved to database for session ${sessionId}`);

// Failure
console.error('Error generating recommendations:', error);
console.error('Failed to parse LLM response:', parseError);
console.error('Error saving recommendations to database:', dbError);
```

---

## Testing Commands

### Generate new recommendations:
```bash
node test-recommendations.js
```

### View the prompt:
```bash
node show-prompt.js
```

### Check database:
```bash
node -e "
const db = require('./src/lib/database.js');
db.openDatabase().then(async (conn) => {
  const [recs] = await conn.execute('SELECT * FROM recommendations LIMIT 5');
  console.table(recs);
  process.exit(0);
});
"
```

---

## Summary

The recommendations system provides:

✅ **AI-powered personalized recommendations**
✅ **Cached for speed and cost efficiency**
✅ **Simple, clear language anyone can understand**
✅ **Stored permanently in database**
✅ **Bilingual support (English/Arabic)**
✅ **Graceful error handling**
✅ **Easy integration with results page**

The key insight: **Generate once, cache forever** - until the user explicitly requests new recommendations or the system is updated.
