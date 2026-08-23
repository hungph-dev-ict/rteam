# Hirec Automation Microservice

Express + Playwright service nhận JSON → tự động điền form đánh giá Hirec.

## Cài đặt & chạy

```bash
npm install
npx playwright install chromium
npm start
# Service chạy tại http://localhost:3000
```

Hoặc dùng Docker:
```bash
docker build -t hirec-automation .
docker run -p 3000:3000 hirec-automation
```

---

## API

### `GET /health`
Kiểm tra service còn sống không.

---

### `POST /fill-form`

**Request body:**

```json
{
  "url": "https://hirec.vn/feedback/...",
  "cookies": [
    { "name": "session", "value": "abc123", "domain": "hirec.vn" }
  ],
  "submit": false,
  "payload": { ... }
}
```

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `url` | string | ✅ | URL trang form Hirec (đã login sẵn hoặc dùng cookies) |
| `cookies` | array | ❌ | Cookie auth từ browser sau khi login |
| `submit` | boolean | ❌ | `false` = Save draft (default), `true` = Submit |
| `payload` | object | ✅ | Dữ liệu điền form (xem bên dưới) |

---

## Cấu trúc Payload

### Radio fields (có chọn giá trị + lý do)

```json
{
  "Japanese_Listening": {
    "value": "N2",
    "reason": "Candidate can follow business conversation in Japanese..."
  }
}
```

**Tất cả radio keys:**

| Key | Các giá trị hợp lệ |
|---|---|
| `Japanese_Listening` | N1, N1-, N2+, N2, N2-, N3+, N3, N3-, N4, N5, No |
| `Japanese_Speaking` | N1, N1-, N2+, N2, N2-, N3+, N3, N3-, N4, N5, No |
| `Japanese_Writing` | N1, N1-, N2+, N2, N2-, N3+, N3, N3-, N4, N5, No |
| `Japanese_Reading` | N1, N1-, N2+, N2, N2-, N3+, N3, N3-, N4, N5, No |
| `English` | 0-No English, 1-Elementary (Toeic>300), 2-Intermediate (Toeic>450), 3-Advanced (Toeic>730), 4-Professional (Toeic>875), 5_Native |
| `Academic background` | Tier 1: Todai..., Tier 2: Tohoku..., Tier 3: Waseda..., Tier 4: Tự nhiên..., Tier 0: Other |
| `Educational level` | PhD, Master, Bachelor (JP), Bachelor (VN), Senmon & Other |
| `IT Experience` | <1 year, 1 to <3 years, 3 to <6 years, 6 to <9 years, 9 to <12 years, 12 to 15 years, >15 years |
| `Working experience in JP` | <1 year, 1 to <3 years, 3 to <6 years, 6 to <9 years, 9 to <12 years, 12 to 15 years, >15 years |
| `BA_Business a Skills` | 0_No knowledge, 1_Fundamental (知っている), 2_Limited Experience (出来る), 3_Intermeadiate  (使いこなせる), 4_Advanced  (教えられる), 5_Expert , 6_Master  |
| `BA_Domain Knowledge` | (same as above) |
| `BA_General Technology Understanding` | (same as above) |
| `BA_Technology Solution for Domain` | (same as above) |
| `BA_Tools (Office, Communication, Requirement Tools)` | (same as above) |
| `BA_Facilitation and Negotiation Skills` | (same as above) |
| `BA_Research and Analytical Skills` | (same as above) |
| `BA_Organizational Skills` | (same as above) |
| `BA_Stress Management Skills` | (same as above) |
| `BA_Active mindset` | (same as above) |
| `Management skill_General Management (Stakeholder/Contract/Issue/Risk/Resource…)` | (same as above) |
| `Management skill_Scope Management` | (same as above) |
| `Management skill_Task Management` | (same as above) |
| `Management skill_Quality Management` | (same as above) |
| `Soft Skill_Presentation/Communication Skills` | (same as above) |
| `Soft Skill_Time Management/Problem solving` | (same as above) |
| `Soft Skill_Teamwork` | (same as above) |
| `Soft Skill_Business manner` | (same as above) |
| `Soft Skill_Learning Ability/Adaptable Ability` | (same as above) |
| `Soft Skill_Ability to handle pressure at work` | (same as above) |

### Text input fields (string trực tiếp)

```json
{
  "Plus point_Working location": "Hanoi",
  "Plus point_Experience of working in FSOFT (year)": "3",
  "Plus point_Valuable skill": "Japanese N2, BA 3 years",
  "Job rank Assessed_BA": "SE2"
}
```

### Textarea fields (string trực tiếp)

```json
{
  "Conclusion": "Candidate is suitable for BA position at SE level.",
  "Note": "Strong Japanese skills, proactive attitude."
}
```

---

## Ví dụ request đầy đủ

```json
{
  "url": "https://hirec.vn/feedback/abc123",
  "cookies": [
    {
      "name": ".AspNetCore.Cookies",
      "value": "your-cookie-value-here",
      "domain": "hirec.vn",
      "path": "/",
      "httpOnly": true,
      "secure": true
    }
  ],
  "submit": false,
  "payload": {
    "Japanese_Listening": { "value": "N2", "reason": "Candidate can understand business Japanese clearly." },
    "Japanese_Speaking": { "value": "N2", "reason": "Speaks fluently with minor errors." },
    "Japanese_Writing": { "value": "N2-", "reason": "Can write emails but some grammar issues." },
    "Japanese_Reading": { "value": "N2", "reason": "Reads technical docs well." },
    "English": { "value": "2-Intermediate (Toeic>450)", "reason": "Can communicate in basic English." },
    "Academic background": { "value": "Tier 3: Waseda, Kyushu, Keio, Tsukuba, Chiba, Bách Khoa", "reason": "Graduated from Bach Khoa University." },
    "Educational level": { "value": "Master", "reason": "Master degree in Computer Science." },
    "IT Experience": { "value": "3 to <6 years", "reason": "4 years of IT experience." },
    "Working experience in JP": { "value": "1 to <3 years", "reason": "2 years working in Tokyo." },
    "BA_Business a Skills": { "value": "3_Intermeadiate  (使いこなせる)", "reason": "Has solid BA experience." },
    "BA_Domain Knowledge": { "value": "2_Limited Experience (出来る)", "reason": "Basic domain knowledge." },
    "BA_General Technology Understanding": { "value": "3_Intermeadiate  (使いこなせる)", "reason": "Good understanding of IT systems." },
    "BA_Technology Solution for Domain": { "value": "2_Limited Experience (出来る)", "reason": "Has applied some tech solutions." },
    "BA_Tools (Office, Communication, Requirement Tools)": { "value": "3_Intermeadiate  (使いこなせる)", "reason": "Proficient with Confluence, JIRA, Excel." },
    "BA_Facilitation and Negotiation Skills": { "value": "2_Limited Experience (出来る)", "reason": "Can facilitate small meetings." },
    "BA_Research and Analytical Skills": { "value": "3_Intermeadiate  (使いこなせる)", "reason": "Strong analytical mindset." },
    "BA_Organizational Skills": { "value": "3_Intermeadiate  (使いこなせる)", "reason": "Well organized." },
    "BA_Stress Management Skills": { "value": "3_Intermeadiate  (使いこなせる)", "reason": "Handles pressure well." },
    "BA_Active mindset": { "value": "3_Intermeadiate  (使いこなせる)", "reason": "Proactive and self-driven." },
    "Management skill_General Management (Stakeholder/Contract/Issue/Risk/Resource…)": { "value": "2_Limited Experience (出来る)", "reason": "Some project management exposure." },
    "Management skill_Scope Management": { "value": "1_Fundamental (知っている)", "reason": "Knows scope management basics." },
    "Management skill_Task Management": { "value": "2_Limited Experience (出来る)", "reason": "Manages own tasks well." },
    "Management skill_Quality Management": { "value": "1_Fundamental (知っている)", "reason": "Familiar with QA concepts." },
    "Soft Skill_Presentation/Communication Skills": { "value": "3_Intermeadiate  (使いこなせる)", "reason": "Presents clearly to stakeholders." },
    "Soft Skill_Time Management/Problem solving": { "value": "3_Intermeadiate  (使いこなせる)", "reason": "Handles multiple tasks effectively." },
    "Soft Skill_Teamwork": { "value": "3_Intermeadiate  (使いこなせる)", "reason": "Works well in a team." },
    "Soft Skill_Business manner": { "value": "3_Intermeadiate  (使いこなせる)", "reason": "Professional manner in JP business context." },
    "Soft Skill_Learning Ability/Adaptable Ability": { "value": "4_Advanced  (教えられる)", "reason": "Learns quickly and adapts." },
    "Soft Skill_Ability to handle pressure at work": { "value": "3_Intermeadiate  (使いこなせる)", "reason": "Calm under deadline pressure." },
    "Plus point_Working location": "Hanoi",
    "Plus point_Experience of working in FSOFT (year)": "0",
    "Plus point_Valuable skill": "Japanese N2, 4 years BA in Japan",
    "Job rank Assessed_BA": "SE2",
    "Conclusion": "Candidate is suitable for BA position. Recommend hiring at SE2 level.",
    "Note": "Strong Japanese and BA skills. Proactive attitude."
  }
}
```

## Lấy cookies từ browser

1. Login vào Hirec trên Chrome
2. Mở DevTools (F12) → Application → Cookies
3. Copy tất cả cookies của domain `hirec.vn` sang JSON format

Hoặc dùng extension **EditThisCookie** để export JSON.

---

## Response

```json
{
  "success": true,
  "filled": 62,
  "skipped": 0,
  "errors": [],
  "action": "saved_draft"
}
```
