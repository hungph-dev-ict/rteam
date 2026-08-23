const { chromium } = require('playwright');
const fs = require('fs');

const FORM_URL = 'https://app.hirec.vn/feedback/interview-scheduled/4e556708-b2c2-4a4e-98bb-f5fd1681ab12-OblZ0l';

const COOKIES = [
  {
    name: '.AspNetCore.Antiforgery.TbVMJcqMN8o',
    value: 'CfDJ8G2pqpQssjtHqzxIdqlsrG4EhCLUImFpKwWAU26AXBaCnRa0yR038dBs4SKNb3FoN7WM6g_dgKSRy8KVNzUHPcImLCuqidZwdvLdlTyxHNu6ceMydCXkisG6BFKViLMiHyBZosSWOmBwnpjkFYE0Etk',
    domain: 'auth.hirec.vn', path: '/', httpOnly: true, secure: true,
  },
  {
    name: 'idsrv',
    value: 'CfDJ8G2pqpQssjtHqzxIdqlsrG4c1FxvlH23G6WYEUd0kDCA5l9ij7ZcevCXfLlfmZRMEUoxmy1HaW-tJ8R7Nx-LZ39fk0YsmRDqGepyzVopaAU4dkeN2F4m5DpFjmOM-3iHNm099nyto_bsJrP3irEk7wmNO9gTLb1ON1SyzMAac0WvxaMUBKBD5PvPn33qt7YhmWVQ9P9BFILBX-FDaj25gNJez5e_L4PXhslJXqbfcN52fG1fdifYak1sJm_vIICNLy7VuLCe3EoHF0TlZ4Is86fS3KrSIxAhuVkhu73dsw-m2jvyiH5CQgaXNFlvjfdy_CHjhNpQ3Py5oTsm_b1-xYIEcc7n2nbg3WqWK4RWgG5ysAZHl2nBFYXxRCNBCLG0jcheouKh0RiHJnsHgbfyuHSTrhm7HleKJPqZ2QlOGOgxz1CrSF48HjqwazUO1Ibyc7NxKHN5miVLmFZin-RDIfaG3g4F6ceN16IFU2KH7qYgW7Wj3of8Qshh07K4Tr7SJd2ttaSHNbtPkf2jvmnfwZQpQIuhg4a7PqFNfA36ZolaFQbfIqpQOO5JG9cJ4smGPm46a__ufElzJ3GED-oz2_lSUOvmcYj_2qBAIhEkZwH2n7gHwdkV1kHHYvEN_lfle7hBjw5zwu-YZ4KeBxR_Z-ivM36ONtPkLKqEKxqLiyEU',
    domain: 'auth.hirec.vn', path: '/', httpOnly: true, secure: true,
  },
  {
    name: 'idsrv.session',
    value: '5FCB244BBBCBB4D1DDD24F85005CADA8',
    domain: 'auth.hirec.vn', path: '/', httpOnly: false, secure: true,
  },
];

async function inspectForm() {
  console.log('🚀 Launching Chromium (visible)...');
  const browser = await chromium.launch({
    headless: false,
    slowMo: 200,
    args: ['--start-maximized'],
  });

  const context = await browser.newContext({ viewport: null, ignoreHTTPSErrors: true });
  await context.addCookies(COOKIES);
  const page = await context.newPage();

  console.log('🌐 Navigating...');
  await page.goto(FORM_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for SPA to finish rendering - try multiple signals
  console.log('⏳ Waiting for SPA to render (up to 15s)...');
  try {
    // Wait for network to go idle (API calls done)
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  } catch {
    console.log('  networkidle timeout, continuing...');
  }

  // Extra wait for JS rendering
  await page.waitForTimeout(3000);

  const currentUrl = page.url();
  const title = await page.title();
  console.log('📍 URL:', currentUrl);
  console.log('📄 Title:', title);

  // Dump full DOM info
  const formInfo = await page.evaluate(() => {
    const allInputs = Array.from(document.querySelectorAll('input')).map(el => ({
      id: el.id, name: el.name, type: el.type, value: el.value,
      placeholder: el.placeholder, className: el.className.slice(0, 80),
    }));

    const textareas = Array.from(document.querySelectorAll('textarea')).map(el => ({
      id: el.id, name: el.name, placeholder: el.placeholder,
    }));

    // Collect radio groups by name attribute
    const radioByName = {};
    document.querySelectorAll('input[type="radio"]').forEach(r => {
      const key = r.name || 'unnamed';
      if (!radioByName[key]) radioByName[key] = [];
      radioByName[key].push({ id: r.id, value: r.value });
    });

    // Find elements with IDs containing 'choose' or 'Reason'
    const hirecElements = Array.from(document.querySelectorAll('[id*="choose"],[id*="Reason"],[id*="choose"],[id*="Note"],[id*="Conclusion"]')).map(el => ({
      tag: el.tagName, id: el.id,
      childInputs: Array.from(el.querySelectorAll('input[type="radio"]')).map(r => r.value),
    }));

    const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]')).map(b => ({
      text: b.innerText?.trim() || b.value, id: b.id, type: b.type, className: b.className.slice(0, 60),
    }));

    const bodyText = document.body.innerText.slice(0, 2000);

    return { allInputs, textareas, radioByName, hirecElements, buttons, bodyText };
  });

  console.log('\n=== INPUTS (non-radio) ===');
  formInfo.allInputs.filter(i => i.type !== 'radio' && i.type !== 'hidden').forEach(i =>
    console.log(`  [${i.type}] id="${i.id}" name="${i.name}" placeholder="${i.placeholder}"`)
  );

  console.log('\n=== TEXTAREAS ===');
  formInfo.textareas.forEach(t =>
    console.log(`  id="${t.id}" name="${t.name}" placeholder="${t.placeholder}"`)
  );

  console.log('\n=== RADIO GROUPS (by name) ===');
  Object.entries(formInfo.radioByName).forEach(([name, radios]) => {
    console.log(`  name="${name}": values=[${radios.map(r => r.value).join(', ')}]`);
  });

  console.log('\n=== HIREC-SPECIFIC ELEMENTS ===');
  formInfo.hirecElements.forEach(el =>
    console.log(`  <${el.tag}> id="${el.id}" radios=[${el.childInputs.join(', ')}]`)
  );

  console.log('\n=== BUTTONS ===');
  formInfo.buttons.forEach(b =>
    console.log(`  "${b.text}" id="${b.id}" type="${b.type}"`)
  );

  console.log('\n=== PAGE TEXT (first 2000 chars) ===');
  console.log(formInfo.bodyText);

  fs.writeFileSync('./form_structure.json', JSON.stringify(formInfo, null, 2));
  console.log('\n✅ Saved to form_structure.json');

  // Keep browser open 60s so we can inspect visually
  console.log('🔍 Browser open for 60s — inspect visually...');
  await page.waitForTimeout(60000);
  await browser.close();
}

inspectForm().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
