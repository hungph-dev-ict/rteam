/**
 * hirec_runner.js — Headless Hirec feedback form filler.
 * Reads JSON config from stdin or --config=<file>.
 *
 * Input JSON:
 * {
 *   "url": "https://app.hirec.vn/feedback/...",
 *   "form_type": "BA" | "PM" | "SE",   // optional, used to select Feedback Form dropdown
 *   "payload": { ... structured form data from LLM ... },
 *   "cookies": { "antiforgery": "...", "idsrv": "...", "idsrv_session": "..." }
 * }
 */

const { chromium } = require('playwright');
const fs = require('fs');

// Safe CSS escaping for attribute selectors
function esc(id) {
  return id.replace(/["\\\n\r]/g, '\\$&');
}

/**
 * Load form structure JSON for the given form_type (BA/PM/SE).
 * Returns Sets of element IDs grouped by their tag type:
 *   - textInputIds:          IDs of <input> elements (tag === 'INPUT')
 *   - standaloneTextareaIds: IDs of standalone <textarea> elements (tag === 'TEXTAREA')
 *   - radioGroupIds:         IDs of radio group containers (tag === 'DIV')
 *
 * Falls back to empty Sets if the schema file is not found or form_type is missing,
 * so the runner can still attempt to fill using the legacy heuristic path.
 */
function loadFormSchema(form_type) {
  const empty = { textInputIds: new Set(), standaloneTextareaIds: new Set(), radioGroupIds: new Set() };
  if (!form_type) return empty;

  const ft = String(form_type).toLowerCase();
  // Schema files live two levels up from files/ → project root/data/automation/
  const schemaPath = require('path').join(__dirname, '..', 'data', 'automation', `form_structure_${ft}.json`);

  if (!fs.existsSync(schemaPath)) {
    process.stderr.write(`[hirec_runner] ⚠️ Schema not found: ${schemaPath}, falling back to heuristic mode.\n`);
    return empty;
  }

  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
  const textInputIds = new Set();
  const standaloneTextareaIds = new Set();
  const radioGroupIds = new Set();

  for (const el of (schema.elements || [])) {
    const tag = (el.tag || '').toUpperCase();
    const id = el.id || '';
    if (tag === 'INPUT') textInputIds.add(id);
    else if (tag === 'TEXTAREA') standaloneTextareaIds.add(id);
    else if (tag === 'DIV') radioGroupIds.add(id);
  }

  process.stderr.write(
    `[hirec_runner] Loaded schema "${ft}": ${textInputIds.size} inputs, ` +
    `${standaloneTextareaIds.size} textareas, ${radioGroupIds.size} radio groups.\n`
  );
  return { textInputIds, standaloneTextareaIds, radioGroupIds };
}

// Mapping form_type → Feedback Form option title on Hirec
const FEEDBACK_FORM_MAP = {
  'BA': 'FJP_InterviewChecklist_v1.1_BA',
  'PM': 'FJP_InterviewChecklist_v1.1_Front_PM',
  'SE': 'FJP_InterviewChecklist_v1.1_Front_SE',
};

async function run(config) {
  const { url, payload = {}, cookies: cookieValues = {}, form_type } = config;

  // Build field-type lookup from form_structure JSON (dynamic, not hardcoded)
  const { textInputIds, standaloneTextareaIds, radioGroupIds } = loadFormSchema(form_type);

  if (!url) throw new Error('Missing required field: url');

  const cookies = [
    {
      name: '.AspNetCore.Antiforgery.TbVMJcqMN8o',
      value: cookieValues.antiforgery || '',
      domain: 'auth.hirec.vn', path: '/', httpOnly: true, secure: true,
    },
    {
      name: 'idsrv',
      value: cookieValues.idsrv || '',
      domain: 'auth.hirec.vn', path: '/', httpOnly: true, secure: true,
    },
    {
      name: 'idsrv.session',
      value: cookieValues.idsrv_session || '',
      domain: 'auth.hirec.vn', path: '/', httpOnly: false, secure: true,
    },
  ];

  process.stderr.write('[hirec_runner] Launching Chromium (headless)...\n');
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
      '--no-zygote',
    ],
  });

  try {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });

    if (cookies.some(c => c.value)) {
      await context.addCookies(cookies);
    }

    const page = await context.newPage();

    // Block non-essential heavy resources to speed up page loading by 5x
    await page.route('**/*.{png,jpg,jpeg,gif,svg,woff,woff2,ttf,otf,mp4,webm}', route => route.abort());

    process.stderr.write('[hirec_runner] Navigating to form...\n');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });

    try {
      await page.waitForLoadState('networkidle', { timeout: 3000 });
    } catch {
      process.stderr.write('[hirec_runner] networkidle timeout, continuing...\n');
    }
    await page.waitForTimeout(500);

    const currentUrl = page.url();
    process.stderr.write(`[hirec_runner] URL: ${currentUrl}\n`);

    // ── Select Feedback Form dropdown based on form_type ──────────────────────
    const formLabel = form_type ? FEEDBACK_FORM_MAP[String(form_type).toUpperCase()] : null;
    if (formLabel) {
      process.stderr.write(`[hirec_runner] Selecting Feedback Form: "${formLabel}"...\n`);
      try {
        // Check current selected form via DOM
        const currentSelected = await page.evaluate(() => {
          const item = document.querySelector('.ant-select-selection-item');
          return item ? item.getAttribute('title') : null;
        });
        process.stderr.write(`[hirec_runner] Current selected form: "${currentSelected}"\n`);

        if (currentSelected === formLabel) {
          process.stderr.write(`[hirec_runner] ✅ Form already selected, skipping.\n`);
        } else {
          // Click to open the Ant Design searchable Select dropdown
          const selectTrigger = page.locator('.ant-select-selector').first();
          await selectTrigger.waitFor({ state: 'visible', timeout: 10000 });
          await selectTrigger.click();
          await page.waitForTimeout(500);

          // Dropdown uses virtual scroll — must type to filter so target option is rendered.
          // Use keyboard.type() (not fill) to fire proper React synthetic events.
          await page.keyboard.type('FJP', { delay: 80 });
          await page.waitForTimeout(700);

          // Click the target option once it's visible in the filtered list
          const option = page.locator(`.ant-select-item-option[title="${formLabel}"]`);
          await option.waitFor({ state: 'visible', timeout: 8000 });
          await option.click();

          process.stderr.write(`[hirec_runner] ✅ Selected "${formLabel}", waiting for form re-render...\n`);
          await page.waitForTimeout(1500);
        }
      } catch (selErr) {
        process.stderr.write(`[hirec_runner] ⚠️ Could not select Feedback Form "${formLabel}": ${selErr.message.split('\n')[0]}\n`);
      }
    } else {
      process.stderr.write('[hirec_runner] No form_type provided or unrecognized type, skipping Feedback Form selection.\n');
    }
    // ─────────────────────────────────────────────────────────────────────────


    let filled = 0;
    const errors = [];

    for (const [key, value] of Object.entries(payload)) {
      try {
        // Plain text inputs — derived from schema (tag === 'INPUT')
        if (textInputIds.has(key)) {
          const el = page.locator(`input[id="${esc(key)}"]`);
          await el.scrollIntoViewIfNeeded();
          await el.fill(String(value));
          process.stderr.write(`  ✅ [text] "${key}"\n`);
          filled++;
          continue;
        }

        // Standalone textareas — derived from schema (tag === 'TEXTAREA')
        // Schema stores IDs with trailing underscore for Conclusion_ and Note_.
        // The payload key may or may not include the underscore, so we check both.
        const textareaIdExact = key;          // e.g. "Conclusion_"
        const textareaIdTrailing = `${key}_`;    // e.g. "Conclusion" → "Conclusion_"
        if (standaloneTextareaIds.has(textareaIdExact) || standaloneTextareaIds.has(textareaIdTrailing)) {
          const resolvedId = standaloneTextareaIds.has(textareaIdExact) ? textareaIdExact : textareaIdTrailing;
          const el = page.locator(`textarea[id="${esc(resolvedId)}"]`);
          await el.scrollIntoViewIfNeeded();
          await el.fill(String(value));
          process.stderr.write(`  ✅ [textarea] "${key}" → id="${resolvedId}"\n`);
          filled++;
          continue;
        }

        // Fallback for string input/textarea if schema is empty or doesn't list the field ID
        if (typeof value === 'string') {
          const candidateIds = [key, `${key}_`, `${key}__`].map(esc);
          let handled = false;
          for (const candId of candidateIds) {
            const loc = page.locator(`textarea[id="${candId}"], input[id="${candId}"]`).first();
            if (await loc.count() > 0) {
              await loc.scrollIntoViewIfNeeded();
              await loc.fill(String(value));
              process.stderr.write(`  ✅ [string fallback] "${key}" → id="${candId}"\n`);
              filled++;
              handled = true;
              break;
            }
          }
          if (handled) continue;
        }

        // Radio + Reason pair (DIV tag in schema, or object value as fallback)
        if (typeof value === 'object' && value !== null) {
          const { value: radioValue, reason } = value;

          // Derive group container ID and reason textarea ID from the schema.
          // Schema stores IDs like "Japanese_Listening_choose" (DIV) and
          // "Japanese_Listening_Reason" (TEXTAREA). The payload key passed from
          // the LLM is the "base" key, e.g. "Japanese_Listening".
          // We first try to find a matching DIV id in the schema by looking up
          // "<key>_choose" or "<key>__choose"; if the schema is empty we fall
          // back to the same heuristic as before.
          const cleanKeyName = key.replace(/_$/, '');
          const groupIdUnder = `${cleanKeyName}_choose`;
          const groupIdDouble = `${cleanKeyName}__choose`;
          const groupId = radioGroupIds.has(groupIdUnder) ? groupIdUnder
            : radioGroupIds.has(groupIdDouble) ? groupIdDouble
              : cleanKeyName.includes('_') ? groupIdUnder   // heuristic fallback
                : groupIdDouble;

          const reasonIdUnder = `${cleanKeyName}_Reason`;
          const reasonIdDouble = `${cleanKeyName}__Reason`;
          const reasonId = standaloneTextareaIds.has(reasonIdUnder) ? reasonIdUnder
            : standaloneTextareaIds.has(reasonIdDouble) ? reasonIdDouble
              : cleanKeyName.includes('_') ? reasonIdUnder  // heuristic fallback
                : reasonIdDouble;

          if (radioValue != null) {
            const radio = page.locator(`[id="${esc(groupId)}"] input[value="${esc(String(radioValue))}"]`);
            await radio.scrollIntoViewIfNeeded();
            await radio.click();
            process.stderr.write(`  ✅ [radio] "${key}" → "${radioValue}"\n`);
            filled++;
          }

          if (reason) {
            const textarea = page.locator(`textarea[id="${esc(reasonId)}"]`);
            await textarea.scrollIntoViewIfNeeded();
            await textarea.fill(String(reason));
            process.stderr.write(`  ✅ [reason] "${key}"\n`);
            filled++;
          }
        }
      } catch (err) {
        process.stderr.write(`  ❌ [error] "${key}": ${err.message.split('\n')[0]}\n`);
        errors.push({ field: key, error: err.message.split('\n')[0] });
      }
    }

    // Try Save Draft
    try {
      const saveDraft = page.locator('button:has-text("Save draft"), button:has-text("Lưu nháp")').first();
      if (await saveDraft.count() > 0) {
        await saveDraft.scrollIntoViewIfNeeded();
        await saveDraft.click();
        await page.waitForTimeout(2000);
        process.stderr.write('[hirec_runner] Clicked Save Draft\n');
      }
    } catch (e) {
      process.stderr.write(`[hirec_runner] Save draft: ${e.message.split('\n')[0]}\n`);
    }

    await browser.close();
    return {
      success: true,
      message: `Filled: ${filled} fields, Errors: ${errors.length}`,
      filled,
      errors,
      finalUrl: currentUrl,
    };
  } catch (err) {
    await browser.close();
    throw err;
  }
}

async function main() {
  let config;
  const configArgIdx = process.argv.findIndex(a => a.startsWith('--config='));
  if (configArgIdx !== -1) {
    const filePath = process.argv[configArgIdx].replace('--config=', '');
    config = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } else {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    config = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
  }

  const result = await run(config);
  process.stdout.write(JSON.stringify(result) + '\n');
}

main().catch(err => {
  process.stdout.write(JSON.stringify({ success: false, error: err.message }) + '\n');
  process.exit(1);
});
