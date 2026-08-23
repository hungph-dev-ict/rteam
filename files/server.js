const express = require('express');
const { fillFeedbackForm } = require('./automation');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'hirec-automation' });
});

/**
 * POST /fill-form
 * Body: { url: string, cookies: [...], payload: { ... } }
 *
 * payload example:
 * {
 *   "Japanese_Listening": { "value": "N2", "reason": "Candidate scored N2..." },
 *   "Japanese_Speaking": { "value": "N2+", "reason": "..." },
 *   "English": { "value": "2-Intermediate (Toeic>450)", "reason": "..." },
 *   "Academic background": { "value": "Tier 3: ...", "reason": "..." },
 *   "Educational level": { "value": "Master", "reason": "..." },
 *   "IT Experience": { "value": "3 to <6 years", "reason": "..." },
 *   "Working experience in JP": { "value": "<1 year", "reason": "..." },
 *   "BA_Business a Skills": { "value": "3_Intermeadiate  (使いこなせる)", "reason": "..." },
 *   "BA_Domain Knowledge": { "value": "2_Limited Experience (出来る)", "reason": "..." },
 *   "BA_General Technology Understanding": { "value": "3_Intermeadiate  (使いこなせる)", "reason": "..." },
 *   "BA_Technology Solution for Domain": { "value": "2_Limited Experience (出来る)", "reason": "..." },
 *   "BA_Tools (Office, Communication, Requirement Tools)": { "value": "2_Limited Experience (出来る)", "reason": "..." },
 *   "BA_Facilitation and Negotiation Skills": { "value": "2_Limited Experience (出来る)", "reason": "..." },
 *   "BA_Research and Analytical Skills": { "value": "3_Intermeadiate  (使いこなせる)", "reason": "..." },
 *   "BA_Organizational Skills": { "value": "2_Limited Experience (出来る)", "reason": "..." },
 *   "BA_Stress Management Skills": { "value": "2_Limited Experience (出来る)", "reason": "..." },
 *   "BA_Active mindset": { "value": "3_Intermeadiate  (使いこなせる)", "reason": "..." },
 *   "Management skill_General Management (Stakeholder/Contract/Issue/Risk/Resource…)": { "value": "2_Limited Experience (出来る)", "reason": "..." },
 *   "Management skill_Scope Management": { "value": "1_Fundamental (知っている)", "reason": "..." },
 *   "Management skill_Task Management": { "value": "2_Limited Experience (出来る)", "reason": "..." },
 *   "Management skill_Quality Management": { "value": "1_Fundamental (知っている)", "reason": "..." },
 *   "Soft Skill_Presentation/Communication Skills": { "value": "3_Intermeadiate  (使いこなせる)", "reason": "..." },
 *   "Soft Skill_Time Management/Problem solving": { "value": "3_Intermeadiate  (使いこなせる)", "reason": "..." },
 *   "Soft Skill_Teamwork": { "value": "3_Intermeadiate  (使いこなせる)", "reason": "..." },
 *   "Soft Skill_Business manner": { "value": "2_Limited Experience (出来る)", "reason": "..." },
 *   "Soft Skill_Learning Ability/Adaptable Ability": { "value": "3_Intermeadiate  (使いこなせる)", "reason": "..." },
 *   "Soft Skill_Ability to handle pressure at work": { "value": "2_Limited Experience (出来る)", "reason": "..." },
 *   "Plus point_Working location": "HN",
 *   "Plus point_Experience of working in FSOFT (year)": "3",
 *   "Plus point_Valuable skill": "Japanese N2, BA experience",
 *   "Job rank Assessed_BA": "SE",
 *   "Conclusion": "Candidate is suitable...",
 *   "Note": "Some additional notes..."
 * }
 */
app.post('/fill-form', async (req, res) => {
  const { url, cookies, payload, submit = false } = req.body;

  if (!url || !payload) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: url, payload',
    });
  }

  console.log(`[${new Date().toISOString()}] Starting fill-form for: ${url}`);

  try {
    const result = await fillFeedbackForm({ url, cookies, payload, submit });
    console.log(`[${new Date().toISOString()}] Completed: ${result.filled} fields filled`);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error:`, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Hirec Automation Service running on port ${PORT}`);
});
