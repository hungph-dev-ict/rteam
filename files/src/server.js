const express = require('express');
const { fillFeedbackForm } = require('./automation');

const app = express();
app.use(express.json({ limit: '5mb' }));

const PORT = process.env.PORT || 3000;

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'hirec-automation',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /fill-form
 * Body: { url: string, cookies: [...], payload: { ... }, submit: boolean }
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
