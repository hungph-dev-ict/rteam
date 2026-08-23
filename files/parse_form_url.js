/**
 * parse_form_url.js — Inspects a Hirec feedback form URL with auth cookies,
 * extracts the form element structure (choose groups + reason textareas),
 * and outputs a structured JSON for use as form_structure.
 *
 * Input (stdin or --config=<file>):
 * {
 *   "url": "https://app.hirec.vn/...",
 *   "cookies": { "antiforgery": "...", "idsrv": "...", "idsrv_session": "..." }
 * }
 *
 * Output (stdout): { "success": true, "elements": [...], "form_type_hint": "BA"|"PM"|"SE" }
 */

const { chromium } = require('playwright');
const fs = require('fs');

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

  const { url, cookies: cookieValues = {} } = config;
  if (!url) throw new Error('Missing required field: url');

  const cookies = [
    { name: '.AspNetCore.Antiforgery.TbVMJcqMN8o', value: cookieValues.antiforgery || '', domain: 'auth.hirec.vn', path: '/', httpOnly: true, secure: true },
    { name: 'idsrv', value: cookieValues.idsrv || '', domain: 'auth.hirec.vn', path: '/', httpOnly: true, secure: true },
    { name: 'idsrv.session', value: cookieValues.idsrv_session || '', domain: 'auth.hirec.vn', path: '/', httpOnly: false, secure: true },
  ].filter(c => c.value);

  process.stderr.write('[parse_form_url] Launching Chromium (headless)...\n');
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  try {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    if (cookies.length) await context.addCookies(cookies);

    const page = await context.newPage();
    process.stderr.write(`[parse_form_url] Navigating to: ${url}\n`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    try { await page.waitForLoadState('networkidle', { timeout: 15000 }); } catch {}
    await page.waitForTimeout(3000);

    // Extract form structure
    const elements = await page.evaluate(() => {
      const result = [];

      // Find all div elements with id ending in _choose or __choose
      const chooseEls = document.querySelectorAll('[id$="_choose"], [id$="__choose"]');
      chooseEls.forEach(el => {
        const radios = el.querySelectorAll('input[type="radio"]');
        const childInputs = Array.from(radios).map(r => r.value).filter(Boolean);
        result.push({ tag: 'DIV', id: el.id, childInputs });

        // Look for the associated reason textarea (same parent, next sibling group)
        const reasonId = el.id.replace(/_choose$/, '_Reason').replace(/__choose$/, '__Reason');
        const reasonEl = document.getElementById(reasonId);
        if (reasonEl) {
          result.push({ tag: 'TEXTAREA', id: reasonEl.id, childInputs: [] });
        }
      });

      // Also find standalone textareas that weren't covered
      const textareas = document.querySelectorAll('textarea[id]');
      textareas.forEach(el => {
        if (!result.find(r => r.id === el.id)) {
          result.push({ tag: 'TEXTAREA', id: el.id, childInputs: [] });
        }
      });

      // Find text inputs with meaningful IDs
      const inputs = document.querySelectorAll('input[id]:not([type="radio"]):not([type="search"])');
      inputs.forEach(el => {
        if (el.id && !result.find(r => r.id === el.id)) {
          result.push({ tag: 'INPUT', id: el.id, type: el.type || 'text', childInputs: [] });
        }
      });

      return result;
    });

    // Guess form type from page content
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
    let form_type_hint = 'BA';
    if (/PM|Project Manager/i.test(bodyText)) form_type_hint = 'PM';
    else if (/SE|Software Engineer|Developer/i.test(bodyText)) form_type_hint = 'SE';

    await browser.close();
    process.stderr.write(`[parse_form_url] Found ${elements.length} elements, hint: ${form_type_hint}\n`);
    process.stdout.write(JSON.stringify({ success: true, elements, form_type_hint, page_url: url }) + '\n');

  } catch (err) {
    await browser.close();
    process.stdout.write(JSON.stringify({ success: false, error: err.message }) + '\n');
  }
}

main().catch(err => {
  process.stdout.write(JSON.stringify({ success: false, error: err.message }) + '\n');
  process.exit(1);
});
