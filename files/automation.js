const { chromium } = require('playwright');

/**
 * Map payload keys to form element IDs.
 *
 * The Hirec form uses these ID patterns:
 *   Radio:   {Section}_{SubSection}_choose  (radio group container)
 *   Reason:  {Section}_{SubSection}_Reason  (textarea)
 *   Text:    {Section}_{SubSection}         (plain input for Plus point, Job rank, etc.)
 *   Special: Conclusion_, Note_             (textareas with trailing underscore)
 *
 * Payload key conventions (matches HTML IDs exactly minus suffix):
 *   "Japanese_Listening"    → radio: #Japanese_Listening_choose, textarea: #Japanese_Listening_Reason
 *   "English"               → radio: #English__choose,           textarea: #English__Reason
 *   "Academic background"   → radio: #Academic background__choose
 *   "BA_Business a Skills"  → radio: #BA_Business a Skills_choose
 *   "Plus point_Working location"  → text input: #Plus point_Working location
 *   "Conclusion"            → textarea: #Conclusion_
 *   "Note"                  → textarea: #Note_
 */

// Fields that are plain text inputs (no radio + no reason)
const TEXT_INPUT_KEYS = [
  'Plus point_Working location',
  'Plus point_Experience of working in FSOFT (year)',
  'Plus point_Valuable skill',
  'Job rank Assessed_BA',
];

// Fields that are standalone textareas (no radio)
const TEXTAREA_ONLY_KEYS = ['Conclusion', 'Note'];

function buildRadioId(rawKey) {
  const key = (rawKey || '').replace(/_$/, '');
  if (key.includes('_')) {
    return `${key}_choose`;
  } else {
    return `${key}__choose`;
  }
}

function buildReasonId(rawKey) {
  const key = (rawKey || '').replace(/_$/, '');
  if (key.includes('_')) {
    return `${key}_Reason`;
  } else {
    return `${key}__Reason`;
  }
}

async function fillFeedbackForm({ url, cookies, payload, submit = false }) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext();

  // Inject auth cookies if provided
  if (cookies && cookies.length > 0) {
    await context.addCookies(cookies);
  }

  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for form to render
    await page.waitForSelector('#feedback-form', { timeout: 15000 });

    const results = { filled: 0, skipped: 0, errors: [] };

    for (const [key, value] of Object.entries(payload)) {
      try {
        // --- Plain text inputs ---
        if (TEXT_INPUT_KEYS.includes(key)) {
          const inputId = `#${CSS.escape ? key : key.replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`)}`;
          // Use attribute selector for safety
          const input = page.locator(`input[id="${key}"]`);
          await input.fill(String(value));
          results.filled++;
          continue;
        }

        // --- Standalone textareas (Conclusion, Note) ---
        if (TEXTAREA_ONLY_KEYS.includes(key)) {
          const textarea = page.locator(`textarea[id="${key}_"]`);
          await textarea.fill(String(value));
          results.filled++;
          continue;
        }

        // --- Radio + optional reason ---
        if (typeof value === 'object' && value !== null) {
          const { value: radioValue, reason } = value;
          const radioGroupId = buildRadioId(key);
          const reasonId = buildReasonId(key);

          // Click the correct radio button within the group
          if (radioValue !== undefined && radioValue !== null) {
            const radio = page.locator(`#${CSS_escape(radioGroupId)} input[value="${radioValue}"]`);
            await radio.click();
            results.filled++;
          }

          // Fill reason textarea if provided
          if (reason) {
            const textarea = page.locator(`textarea[id="${reasonId}"]`);
            await textarea.fill(String(reason));
            results.filled++;
          }
        }
      } catch (err) {
        results.errors.push({ field: key, error: err.message });
        results.skipped++;
      }
    }

    // Save draft or submit
    if (submit) {
      await page.click('button:has-text("Submit")');
      await page.waitForTimeout(2000);
      results.action = 'submitted';
    } else {
      await page.click('button:has-text("Save draft")');
      await page.waitForTimeout(2000);
      results.action = 'saved_draft';
    }

    return results;
  } finally {
    await browser.close();
  }
}

// Safe CSS ID escaping for locator
function CSS_escape(id) {
  return id.replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~\s]/g, '\\$&');
}

module.exports = { fillFeedbackForm };
