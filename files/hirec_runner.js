/**
 * hirec_runner.js — Headless Hirec feedback form filler.
 * Reads JSON config from stdin or --config=<file>.
 *
 * Input JSON:
 * {
 *   "url": "https://app.hirec.vn/feedback/...",
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

// Text input keys (no radio, no reason)
const TEXT_INPUT_KEYS = [
  'Plus point_Working location',
  'Plus point_Experience of working in FSOFT (year)',
  'Plus point_Valuable skill',
  'Job rank Assessed_BA',
];

// Standalone textarea keys
const TEXTAREA_ONLY_KEYS = ['Conclusion', 'Note'];

async function run(config) {
  const { url, payload = {}, cookies: cookieValues = {} } = config;

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
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });

    if (cookies.some(c => c.value)) {
      await context.addCookies(cookies);
    }

    const page = await context.newPage();

    process.stderr.write('[hirec_runner] Navigating to form...\n');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    try {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch {
      process.stderr.write('[hirec_runner] networkidle timeout, continuing...\n');
    }
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    process.stderr.write(`[hirec_runner] URL: ${currentUrl}\n`);

    let filled = 0;
    const errors = [];

    for (const [key, value] of Object.entries(payload)) {
      try {
        // Plain text inputs
        if (TEXT_INPUT_KEYS.includes(key)) {
          const el = page.locator(`input[id="${esc(key)}"]`);
          await el.scrollIntoViewIfNeeded();
          await el.fill(String(value));
          process.stderr.write(`  ✅ [text] "${key}"\n`);
          filled++;
          continue;
        }

        // Standalone textareas (Conclusion_, Note_)
        if (TEXTAREA_ONLY_KEYS.includes(key)) {
          const el = page.locator(`textarea[id="${esc(key)}_"]`);
          await el.scrollIntoViewIfNeeded();
          await el.fill(String(value));
          process.stderr.write(`  ✅ [textarea] "${key}"\n`);
          filled++;
          continue;
        }

        // Radio + Reason pair
        if (typeof value === 'object' && value !== null) {
          const { value: radioValue, reason } = value;

          // Build group container ID
          const cleanKeyName = key.replace(/_$/, '');
          const groupId = cleanKeyName.includes('_') ? `${cleanKeyName}_choose` : `${cleanKeyName}__choose`;
          const reasonId = cleanKeyName.includes('_') ? `${cleanKeyName}_Reason` : `${cleanKeyName}__Reason`;

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
