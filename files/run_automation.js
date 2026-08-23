const { chromium } = require('playwright');

const FORM_URL = 'https://app.hirec.vn/feedback/interview-scheduled/4e556708-b2c2-4a4e-98bb-f5fd1681ab12-OblZ0l';

const COOKIES = [
  {
    name: '.AspNetCore.Antiforgery.TbVMJcqMN8o',
    value: 'CfDJ8G2pqpQssjtHqzxIdqlsrG5XQCw1OB9r7_mWgg8AAmdIusJpjJ5XMgaZfCfKcwAHwIfSF6J67MgjNO7bhaf1ODfva9feOCdEgdKVdhRD-gn7_rzmh0ZY3VS7klhoMaNdagdg_p7h0DfiBC0akNzonNI',
    domain: 'auth.hirec.vn', path: '/', httpOnly: true, secure: true,
  },
  {
    name: 'idsrv',
    value: 'CfDJ8G2pqpQssjtHqzxIdqlsrG7yXI8Y9ViYStmluMMgTCAHUxkb1n7DhWkRKO5z71FS9T5DhG8jyQx0HuwKvw39Dqf4EpgruLxwnZyKyeu4d9X16qpGJ2ZD_dJqnXZa-n1lDuC5laJhf0WkszjQE3SyyG6eIETS9HfYXyM8QsPJbLzqIfTferTkU7d1eGG2An04Y2RCvwC-FwzDlPw87ieKA3kEbMMFXbLrJ2YfaY96BNwV4_K22tnh7jIrD1f2mD6UokdHl6WHXvKyYb7HMjI_NyX5p6gr8nc1rny55XuHLTze3tsoxGQr6Hpvm_DZhA4Tfz_WulIS2cSOBKJVGWAPpFkl7x6MnSd2ZBaezVRmN4ACTNGQS2ZAXDpTqP06NsFBwGLO-cXLlxV2EWlCv6DGXCdNHo-vBrYw3FfeQ2PWjswh5eXZwwq5gW3b02dqln6P2hdQ4GRJh5VAXoHkjoKriF8ug5ZQfmDGV13tMGVCcaE6Lrfo4DY5imDjA2OsXmB0tXjDXtB52Z9B5h1BwYIuuFgd6c2wuMyPH47kSFkX6bsxVmtCimgwT_9NTj1hihBrCiPXnmcQVJE_H4QireL3hVxhLc5nDnCoRwxsdbwzCfHgcimWAlhaV54DAa_rbqX-HRHjOkM34t8tB_kAlV1jB96vi-rqB5vOodeKklYgPL5Y',
    domain: 'auth.hirec.vn', path: '/', httpOnly: true, secure: true,
  },
  {
    name: 'idsrv.session',
    value: '0FCEDB560119DD862D0485DEB5BCC316',
    domain: 'auth.hirec.vn', path: '/', httpOnly: false, secure: true,
  },
];

// ─── Sample payload for Hoang Ngoc Diep ───
const PAYLOAD = {
  // Japanese skills
  'Japanese_Listening': { value: 'N2', reason: 'Ứng viên có thể nghe hiểu tốt các cuộc hội thoại kinh doanh bằng tiếng Nhật. Thể hiện khả năng nghe hiểu tốt trong các buổi họp.' },
  'Japanese_Speaking': { value: 'N2', reason: 'Nói lưu loát với một số lỗi ngữ pháp nhỏ. Thoải mái trong môi trường kinh doanh Nhật Bản.' },
  'Japanese_Writing': { value: 'N2-', reason: 'Có thể viết email kinh doanh với một số lỗi ngữ pháp nhỏ. Đang tiến bộ đều đặn.' },
  'Japanese_Reading': { value: 'N2', reason: 'Đọc hiểu tốt tài liệu kỹ thuật và báo cáo kinh doanh bằng tiếng Nhật.' },

  // English
  'English': { value: '2-Intermediate (Toeic>450)', reason: 'Có thể giao tiếp tiếng Anh cơ bản trong các tình huống kinh doanh hàng ngày.' },

  // Background
  'Academic background': { value: 'Tier 4: Tự nhiên, FU, Bưu Chính', reason: 'Tốt nghiệp từ một trường đại học uy tín tại Việt Nam với nền tảng khoa học máy tính vững chắc.' },
  'Educational level': { value: 'Bachelor (VN)', reason: 'Bằng Cử nhân ngành Công nghệ Thông tin tại Việt Nam.' },

  // Experience
  'IT Experience': { value: '3 to <6 years', reason: '4 năm kinh nghiệm IT trong phát triển phần mềm và vai trò BA.' },
  'Working experience in JP': { value: '1 to <3 years', reason: '2 năm làm việc onsite tại Nhật Bản trong các dự án doanh nghiệp lớn.' },

  // BA Skills
  'BA_Business a Skills': { value: '3_Intermeadiate  (使いこなせる)', reason: 'Kinh nghiệm BA vững chắc. Có thể tự xử lý việc thu thập và phân tích yêu cầu một cách độc lập.' },
  'BA_Domain Knowledge': { value: '2_Limited Experience (出来る)', reason: 'Có kiến thức domain cơ bản trong lĩnh vực tài chính và nhân sự.' },
  'BA_General Technology Understanding': { value: '3_Intermeadiate  (使いこなせる)', reason: 'Hiểu tốt về kiến trúc hệ thống IT và các ứng dụng doanh nghiệp.' },
  'BA_Technology Solution for Domain': { value: '2_Limited Experience (出来る)', reason: 'Đã áp dụng các giải pháp công nghệ trong ngữ cảnh domain với sự hỗ trợ.' },
  'BA_Tools (Office, Communication, Requirement Tools)': { value: '3_Intermeadiate  (使いこなせる)', reason: 'Thành thạo Confluence, JIRA, Excel và các công cụ quản lý yêu cầu.' },
  'BA_Facilitation and Negotiation Skills': { value: '2_Limited Experience (出来る)', reason: 'Có thể điều phối các cuộc họp nhỏ. Đang phát triển kỹ năng đàm phán.' },
  'BA_Research and Analytical Skills': { value: '3_Intermeadiate  (使いこなせる)', reason: 'Tư duy phân tích mạnh. Có khả năng phân tách các vấn đề phức tạp hiệu quả.' },
  'BA_Organizational Skills': { value: '3_Intermeadiate  (使いこなせる)', reason: 'Có tổ chức tốt. Duy trì tài liệu rõ ràng và theo dõi công việc chặt chẽ.' },
  'BA_Stress Management Skills': { value: '3_Intermeadiate  (使いこなせる)', reason: 'Chịu được áp lực deadline tốt. Bình tĩnh trong các tình huống khó khăn.' },
  'BA_Active mindset': { value: '3_Intermeadiate  (使いこなせる)', reason: 'Chủ động và tự giác. Tự đề xuất và triển khai mà không cần chờ chỉ thị.' },

  // Management skills
  'Management skill_General Management (Stakeholder/Contract/Issue/Risk/Resource…)': { value: '2_Limited Experience (出来る)', reason: 'Có kinh nghiệm tiếp xúc với quản lý dự án trong các dự án trước đây.' },
  'Management skill_Scope Management': { value: '1_Fundamental (知っている)', reason: 'Nắm được các khái niệm quản lý phạm vi dự án. Đang học hỏi trong thực tiễn.' },
  'Management skill_Task Management': { value: '2_Limited Experience (出来る)', reason: 'Quản lý công việc cá nhân hiệu quả. Sử dụng công cụ để theo dõi tiến độ.' },
  'Management skill_Quality Management': { value: '1_Fundamental (知っている)', reason: 'Quen thuộc với các khái niệm QA/QC. Áp dụng kiểm tra chất lượng cơ bản.' },

  // Soft skills
  'Soft Skill_Presentation/Communication Skills': { value: '3_Intermeadiate  (使いこなせる)', reason: 'Trình bày rõ ràng với các bên liên quan bằng cả tiếng Việt và tiếng Nhật.' },
  'Soft Skill_Time Management/Problem solving': { value: '3_Intermeadiate  (使いこなせる)', reason: 'Quản lý nhiều công việc cùng lúc hiệu quả. Có phương pháp giải quyết vấn đề tốt.' },
  'Soft Skill_Teamwork': { value: '3_Intermeadiate  (使いこなせる)', reason: 'Làm việc nhóm tốt. Đóng góp tích cực cho sự phát triển của nhóm.' },
  'Soft Skill_Business manner': { value: '3_Intermeadiate  (使いこなせる)', reason: 'Phong cách làm việc chuyên nghiệp, phù hợp với văn hóa doanh nghiệp Nhật Bản.' },
  'Soft Skill_Learning Ability/Adaptable Ability': { value: '4_Advanced  (教えられる)', reason: 'Học nhanh và thích nghi tốt với môi trường mới. Có thể hướng dẫn thành viên cấp dưới.' },
  'Soft Skill_Ability to handle pressure at work': { value: '3_Intermeadiate  (使いこなせる)', reason: 'Bình tĩnh dưới áp lực deadline. Duy trì chất lượng công việc ngay cả trong thời điểm căng thẳng.' },

  // Plus points (text inputs)
  'Plus point_Working location': 'Hà Nội',
  'Plus point_Experience of working in FSOFT (year)': '0',
  'Plus point_Valuable skill': 'Tiếng Nhật N2, 4 năm kinh nghiệm BA, 2 năm làm việc onsite tại Nhật',

  // Job rank
  'Job rank Assessed_BA': 'SE2',

  // Free text
  'Conclusion': 'Ứng viên Hoàng Ngọc Diệp phù hợp với vị trí BA. Tiếng Nhật N2 vững và kỹ năng BA tốt. Đề xuất tuyển dụng ở cấp độ SE2, cần chú trọng phát triển thêm kiến thức domain sau khi onboarding.',
  'Note': 'Thái độ chủ động và phù hợp với văn hóa làm việc với khách hàng Nhật. Kinh nghiệm onsite là điểm cộng lớn. Cần theo dõi sự phát triển domain knowledge sau khi onboarding.',
};

// ─── Helper: escape CSS ID for attribute selector ───
function esc(id) {
  return id.replace(/["\\]/g, '\\$&');
}

async function runAutomation() {
  console.log('🚀 Launching Chromium...');
  const browser = await chromium.launch({
    headless: false,
    slowMo: 80,
    args: ['--start-maximized'],
  });

  const context = await browser.newContext({ viewport: null, ignoreHTTPSErrors: true });
  await context.addCookies(COOKIES);
  const page = await context.newPage();

  console.log('🌐 Opening form...');
  await page.goto(FORM_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  console.log('⏳ Waiting for SPA to render...');
  try {
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  } catch { /* ok */ }
  await page.waitForTimeout(2000);

  console.log('📝 Starting to fill form...\n');

  const TEXT_INPUT_KEYS = [
    'Plus point_Working location',
    'Plus point_Experience of working in FSOFT (year)',
    'Plus point_Valuable skill',
    'Job rank Assessed_BA',
  ];
  const TEXTAREA_ONLY_KEYS = ['Conclusion', 'Note'];

  let filled = 0, skipped = 0;
  const errors = [];

  for (const [key, value] of Object.entries(PAYLOAD)) {
    try {
      // ── Plain text inputs ──
      if (TEXT_INPUT_KEYS.includes(key)) {
        const el = page.locator(`input[id="${esc(key)}"]`);
        await el.scrollIntoViewIfNeeded();
        await el.fill(String(value));
        console.log(`  ✅ [text]     "${key}" = "${value}"`);
        filled++;
        continue;
      }

      // ── Standalone textareas (Conclusion, Note) ──
      if (TEXTAREA_ONLY_KEYS.includes(key)) {
        const el = page.locator(`textarea[id="${esc(key)}_"]`);
        await el.scrollIntoViewIfNeeded();
        await el.fill(String(value));
        console.log(`  ✅ [textarea] "${key}"`);
        filled++;
        continue;
      }

      // ── Radio + Reason ──
      if (typeof value === 'object' && value !== null) {
        const { value: radioValue, reason } = value;

        // Build radio group container ID
        const groupId = key.includes('_') ? `${key}_choose` : `${key}__choose`;
        // Build reason textarea ID
        const reasonId = key.includes('_') ? `${key}_Reason` : `${key}__Reason`;

        // Click the radio inside the group container
        if (radioValue != null) {
          const radio = page.locator(`[id="${esc(groupId)}"] input[value="${esc(radioValue)}"]`);
          await radio.scrollIntoViewIfNeeded();
          await radio.click();
          console.log(`  ✅ [radio]    "${key}" → "${radioValue}"`);
          filled++;
        }

        // Fill reason textarea
        if (reason) {
          const textarea = page.locator(`textarea[id="${esc(reasonId)}"]`);
          await textarea.scrollIntoViewIfNeeded();
          await textarea.fill(String(reason));
          console.log(`  ✅ [reason]   "${key}" reason filled`);
          filled++;
        }
      }

    } catch (err) {
      console.log(`  ❌ [error]    "${key}": ${err.message.split('\n')[0]}`);
      errors.push({ field: key, error: err.message });
      skipped++;
    }
  }

  console.log(`\n📊 Summary: ${filled} filled, ${skipped} skipped, ${errors.length} errors`);

  // ── Click Save Draft (TẠM COMMENT ĐỂ REVIEW TRƯỚC KHI LƯU) ──
  // console.log('\n💾 Clicking "Save draft"...');
  // await page.waitForTimeout(500);
  // const saveDraftBtn = page.locator('button:has-text("Save draft")');
  // await saveDraftBtn.scrollIntoViewIfNeeded();
  // await saveDraftBtn.click();
  // console.log('⏳ Waiting for save confirmation...');
  // await page.waitForTimeout(3000);

  console.log('\n👀 Form đã điền xong — giữ browser mở 60s để review...');
  await page.waitForTimeout(60000);

  await browser.close();
  console.log('🔒 Browser closed.');
}

runAutomation().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
