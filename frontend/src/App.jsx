import React, { useState, useEffect } from 'react';
import './App.css';
import * as XLSX from 'xlsx';

// SVG Icons
const Icons = {
  Compass: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  Users: () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m12-10a4 4 0 11-8 0 4 4 0 018 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zm-2 4h5a2 2 0 002-2v-3a2 2 0 00-2-2h-3" />
    </svg>
  ),
  ClipboardList: () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  Terminal: () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Upload: () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
  Play: () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    </svg>
  ),
  Refresh: () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m0 0l-3 3-3-3" />
    </svg>
  ),
  Settings: () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Zap: () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
};

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api";

// ─── i18n Translations ─────────────────
const TRANSLATIONS = {
  vi: {
    appTitle: "RTeam",
    navRun: "Nhập ứng viên",
    navCandidates: "Danh Sách Ứng Viên",
    navScorecards: "Bảng Đánh Giá",
    navSchemaConfig: "Cấu Hinh Schema",
    headerRun: "Nhập ứng viên",
    headerCandidates: "Danh Sách Ứng Viên",
    headerEvaluations: "Bảng Đánh Giá",    // Panel Titles
    headerSchema: "Cấu Hình Schema",
    workflowConfig: "Upload CV",
    talentPoolRecords: "Danh Sách Ứng Viên Hiện Tại",
    candidateEvaluationScorecards: "Bảng Đánh Giá Ứng Viên",

    // Form fields & placeholders
    resumeCvDoc: "Tài liệu CV / Sơ yếu lý lịch",
    uploadHint: "Chọn nhiều file PDF, Excel, Word (Ví dụ: CV + Chứng chỉ + Portfolio)",
    changeResume: "Thay đổi hoặc Thêm tài liệu",
    uploadCV: "Tải lên CV & Hồ sơ ứng viên (nhiều file)",
    positionInJapan: "Vị trí tại Nhật Bản",
    interviewerNote: "Ghi chú Phỏng vấn (tùy chọn)",
    interviewerNotePlaceholder: "Nhập ghi chú phỏng vấn, đánh giá kỹ thuật, hội thoại tiếng Nhật...",
    runRecruitmentFlow: "Chạy Quy Trình Tuyển Dụng",
    runningPlatform: "Hệ thống đang chạy...",
    resetHarness: "Khởi động lại",
    orchestratorChecklist: "Checklist Bước Chạy Hệ Thống",
    harnessReady: "Hệ Thống Đã Sẵn Sàng",
    harnessInstruction: "Tải lên CV (định dạng PDF/Excel) ở khung bên trái để bắt đầu chạy quy trình tuyển dụng AI.",

    // Status states
    processingPipeline: "Đội ngũ Agent đang xử lý...",
    processingSub: "Đang gọi quy tắc bóc tách, khởi tạo bộ câu hỏi phỏng vấn, và xác thực tính hợp lệ của schema.",
    liveAuditLogs: "Nhật ký Xử lý Thời gian thực",

    // Table Headers
    id: "Mã",
    fullName: "Họ và Tên",
    japanese: "Tiếng Nhật",
    experience: "Kinh nghiệm",
    techStack: "Tech Stack",
    createdAt: "Ngày tạo",
    actions: "Hành động",
    noCandidates: "Chưa có ứng viên nào được xử lý.",

    // Evaluations Table
    candidateName: "Tên Ứng Viên",
    techScore: "Điểm Kỹ thuật",
    japaneseScore: "Điểm Tiếng Nhật",
    outsourceFit: "Độ phù hợp Outsource",
    decision: "Quyết định",
    justification: "Giải trình",
    loggedDate: "Ngày đánh giá",
    noEvaluations: "Chưa có đánh giá nào được thực hiện.",
    backToScorecards: "← Quay lại danh sách Scorecard",
    detailedScorecard: "Chi tiết Scorecard:",
    date: "Ngày:",

    // Schema Config
    cvSchemaEditor: "Cấu Hình Schema CV Ứng Viên",
    cvSchemaDesc: "Định nghĩa các trường (như Tên, Tiếng Nhật, Stack) để Agent bóc tách từ CV.",
    evalSchemaEditor: "Cấu Hinh Schema Bảng Đánh Giá",
    evalSchemaDesc: "Định nghĩa các tiêu chí đánh giá (điểm số, cảnh báo, giải trình) cho Agent phân tích.",
    keyName: "Tên thuộc tính (Key)",
    dataType: "Kiểu dữ liệu",
    aiPromptInst: "Chỉ thị Prompt AI / Mô tả trích xuất",
    aiPromptPlaceholder: "Chỉ cho AI biết cần tìm thông tin gì hoặc đánh giá trường này thế nào...",
    isRequired: "Bắt buộc",
    addCustomField: "+ Thêm thuộc tính tùy chỉnh",
    saveSchemaSettings: "Lưu Cấu Hình Schema",
    importExcelSchema: "Nhập từ Excel (Tự động lấy Header)",
    resetSystemData: "Xóa sạch dữ liệu",
    delete: "Xóa",
    interviewBtn: "Phỏng vấn",
    version: "RTeam v1.0",

    // Dynamic Positions Manager i18n
    addPosition: "Thêm vị trí mới",
    positionCode: "Mã vị trí (VD: BrSE)",
    positionName: "Tên vị trí (VD: Bridge System Engineer)",
    selectPositionToEdit: "Chọn vị trí tuyển dụng để chỉnh sửa bảng đánh giá:",
    cvSchemaEditorTitle: "Cấu Hinh Schema CV Ứng Viên (Chung)",
    positionList: "Danh sách vị trí hiện tại",
    backToCandidates: "← Quay lại danh sách Ứng Viên",
    detailedCandidate: "Chi tiết Ứng Viên:",
    viewDetail: "Chi tiết",
    projects: "Kinh nghiệm dự án",
    exportExcel: "↓ Xuất Excel",
    exportCandidates: "Xuất danh sách Ứng Viên",
    exportEvaluations: "Xuất danh sách Đánh Giá",
    navEmployees: "Danh Sách Nhân Viên",
    headerEmployees: "Danh Sách Nhân Viên",
    employeeList: "Danh Sách Nhân Viên Hiện Tại",
    role: "Vai trò",
    hireBtn: "✅ Tuyển Dụng",
    hireConfirmTitle: "Xác nhận Tuyển Dụng",
    hireConfirmMsg: "Bạn muốn tuyển dụng ứng viên này?",
    hireSuccess: "Tuyển dụng thành công!",
    dismissBtn: "Sa Thải",
    dismissConfirmMsg: "Bạn chắc chắn muốn sa thải nhân viên này không?",
    dismissSuccess: "Nhân viên đã được sa thải.",
    noEmployees: "Chưa có nhân viên nào.",
    hiredAt: "Ngày tuyển dụng",
    exportEmployees: "Xuất danh sách Nhân Viên",
    employeeSchemaEditor: "Cấu Hinh Schema Nhân Viên",
    employeeSchemaDesc: "Các trường thông tin quản lý nội bộ nhân viên (được map tự động khi tuyển dụng).",
    missingRequiredFields: "Thiếu các trường bắt buộc:",
    backToEmployees: "← Quay lại Danh Sách Nhân Viên",
    detailedEmployee: "Hồ Sơ Nhân Viên:",
    department: "Phòng Ban",
    salaryGrade: "Hệ Số Lương",
    startDate: "Ngày Bắt Đầu",
    hiringNotes: "Ghi Chú Nội Bộ",
    clarificationTitle: "Yêu cầu Đính chính & Bổ sung Thông tin",
    clarificationSubtitle: "Hệ thống phát hiện thông tin mâu thuẫn hoặc thiếu sót. Vui lòng cập nhật bên dưới để tiếp tục.",
    correctionPrompt: "Vui lòng nhập giá trị chính xác hoặc giải trình tại đây:",
    submitClarification: "Gửi đính chính",
    fieldPlaceholder: "Nhập thông tin cho {fieldName}...",
    contradictionWarning: "Dữ liệu mâu thuẫn",
    sectionRecruitment: "Tuyển dụng",
    sectionEmployeeMgmt: "Quản lý nhân viên",
    sectionSettings: "Cài đặt",
    sectionAutomation: "Automation",
    navHirect: "Hirect Form Filler",
    headerHirect: "Automation — Hirect",
    hirecUrl: "URL Form Hirect",
    hirecUrlPlaceholder: "https://app.hirec.vn/feedback/interview-scheduled/...",
    hirecComment: "Nhận xét tổng quan",
    hirecCommentPlaceholder: "Nhập nội dung nhận xét, đánh giá ứng viên...",
    hirecCookies: "Cookie xác thực (Hirec)",
    hirecCookieAntiforgery: "Cookie: .AspNetCore.Antiforgery.TbVMJcqMN8o",
    hirecCookieIdsrv: "Cookie: idsrv",
    hirecCookieIdsrvSession: "Cookie: idsrv.session",
    hirecCookiePlaceholder: "Dán giá trị cookie vào đây...",
    hirecRun: "▶ Chạy Automation",
    hirecRunning: "Đang chạy...",
    hirecSuccess: "✅ Automation hoàn thành!",
    hirecError: "❌ Có lỗi xảy ra",
    hirecLogs: "Nhật ký thực thi",
    hirecResult: "Kết quả",
    hirecFieldsFilled: "Fields đã điền",
    hirecErrors: "Lỗi",
    hirecFinalUrl: "URL cuối"
  },
  en: {
    appTitle: "RTeam",
    navRun: "Import Candidate",
    navCandidates: "Candidates List",
    navScorecards: "Scorecards",
    navSchemaConfig: "Schema Config",
    headerRun: "Import Candidate",
    headerCandidates: "Candidates List",
    headerEvaluations: "Scorecards",
    headerSchema: "Schema Config",
    llmBrain: "LLM Brain:",

    // Panel Titles
    workflowConfig: "Workflow Config",
    talentPoolRecords: "Talent Pool Records",
    candidateEvaluationScorecards: "Candidate Evaluation Scorecards",

    // Form fields & placeholders
    resumeCvDoc: "Resume / CV Document",
    uploadHint: "Select multiple files PDF, Excel, Word (e.g. CV + Certificate + Portfolio)",
    changeResume: "Change or Add documents",
    uploadCV: "Upload Candidate Resume / Docs (multiple files)",
    positionInJapan: "Position in Japan",
    interviewerNote: "Interviewer Notes (optional)",
    interviewerNotePlaceholder: "Enter interview notes, tech skills comments, JLPT conversation scores...",
    runRecruitmentFlow: "Run Recruitment Flow",
    runningPlatform: "Running Platform...",
    resetHarness: "Reset Harness",
    orchestratorChecklist: "Orchestrator Step Checklist",
    harnessReady: "Recruitment Harness Ready",
    harnessInstruction: "Upload a PDF/Excel candidate resume in the left panel to trigger the AI recruitment pipeline.",

    // Status states
    processingPipeline: "Agent Team processing pipeline...",
    processingSub: "Invoking extraction rules, generating interview banks, and verifying scorecard compliance schemas.",
    liveAuditLogs: "Live Process Audit Logs",

    // Table Headers
    id: "ID",
    fullName: "Full Name",
    japanese: "Japanese",
    experience: "Experience",
    techStack: "Tech Stack",
    createdAt: "Created At",
    actions: "Actions",
    noCandidates: "No candidates processed yet.",

    // Evaluations Table
    candidateName: "Candidate Name",
    techScore: "Tech Score",
    japaneseScore: "Japanese Score",
    outsourceFit: "Outsource Fit",
    decision: "Decision",
    justification: "Justification",
    loggedDate: "Logged Date",
    noEvaluations: "No evaluations performed yet.",
    backToScorecards: "← Back to Scorecards List",
    detailedScorecard: "Detailed Scorecard:",
    date: "Date:",

    // Schema Config
    cvSchemaEditor: "Candidate CV Schema Editor",
    cvSchemaDesc: "Defines the fields (like Full Name, JLPT level, Stack) parsed by the agent from uploaded resumes.",
    evalSchemaEditor: "Evaluation Scorecard Editor",
    evalSchemaDesc: "Defines the evaluation metrics (scores 1-5, warnings, justification) analyzed by the evaluation agent.",
    keyName: "Key name",
    dataType: "Data type",
    aiPromptInst: "AI Prompts Instruction / Extraction Description",
    aiPromptPlaceholder: "Tell the AI what to look for or how to evaluate this field...",
    isRequired: "Is Required Field",
    addCustomField: "+ Add Custom Field Item",
    saveSchemaSettings: "Save Schema Settings",
    importExcelSchema: "Import from Excel (Auto Headers)",
    resetSystemData: "Reset System Data",
    delete: "Delete",
    interviewBtn: "Interview",
    version: "RTeam v1.0",

    // Dynamic Positions Manager i18n
    addPosition: "Add New Position",
    positionCode: "Position Code (e.g. BrSE)",
    positionName: "Position Name (e.g. Bridge System Engineer)",
    selectPositionToEdit: "Select target position to edit scorecard schema:",
    cvSchemaEditorTitle: "Candidate CV Schema Editor (Global)",
    positionList: "Current Job Positions",
    backToCandidates: "← Back to Candidates List",
    detailedCandidate: "Detailed Candidate Profile:",
    viewDetail: "Detail",
    projects: "Project Experience",
    exportExcel: "↓ Export Excel",
    exportCandidates: "Export Candidates List",
    exportEvaluations: "Export Evaluations List",
    navEmployees: "Employee List",
    headerEmployees: "Employee List",
    employeeList: "Current Employee List",
    hireBtn: "✅ Hire",
    hireConfirmTitle: "Confirm Hire",
    hireConfirmMsg: "Do you want to hire this candidate?",
    hireSuccess: "Hired successfully!",
    dismissBtn: "Dismiss",
    dismissConfirmMsg: "Are you sure you want to dismiss this employee?",
    dismissSuccess: "Employee has been dismissed.",
    noEmployees: "No employees yet.",
    hiredAt: "Hired At",
    exportEmployees: "Export Employees List",
    employeeSchemaEditor: "Employee Schema Editor",
    employeeSchemaDesc: "Defines internal HR fields that are auto-mapped from candidate and evaluation data when hiring.",
    missingRequiredFields: "Missing required fields:",
    backToEmployees: "← Back to Employee List",
    detailedEmployee: "Employee Profile:",
    department: "Department",
    salaryGrade: "Salary Grade",
    startDate: "Start Date",
    hiringNotes: "Internal Notes",
    clarificationTitle: "Clarification & Missing Info Required",
    clarificationSubtitle: "The system detected conflicting or missing information. Please resolve it below to continue.",
    correctionPrompt: "Please enter the correct value or explanation here:",
    submitClarification: "Submit Clarification",
    fieldPlaceholder: "Enter value for {fieldName}...",
    contradictionWarning: "Conflicting Data Detected",
    sectionRecruitment: "Recruitment",
    sectionEmployeeMgmt: "Employee Management",
    sectionSettings: "Settings",
    sectionAutomation: "Automation",
    navHirect: "Hirect Form Filler",
    headerHirect: "Automation — Hirect",
    hirecUrl: "Hirect Form URL",
    hirecUrlPlaceholder: "https://app.hirec.vn/feedback/interview-scheduled/...",
    hirecComment: "Overall Comment",
    hirecCommentPlaceholder: "Enter interview notes, overall candidate assessment...",
    hirecCookies: "Auth Cookies (Hirec)",
    hirecCookieAntiforgery: "Cookie: .AspNetCore.Antiforgery.TbVMJcqMN8o",
    hirecCookieIdsrv: "Cookie: idsrv",
    hirecCookieIdsrvSession: "Cookie: idsrv.session",
    hirecCookiePlaceholder: "Paste cookie value here...",
    hirecRun: "▶ Run Automation",
    hirecRunning: "Running...",
    hirecSuccess: "✅ Automation completed!",
    hirecError: "❌ Error occurred",
    hirecLogs: "Execution Logs",
    hirecResult: "Result",
    hirecFieldsFilled: "Fields Filled",
    hirecErrors: "Errors",
    hirecFinalUrl: "Final URL"
  },
  ja: {
    appTitle: "RTeam",
    navRun: "候補者登録",
    navCandidates: "候補者リスト",
    navScorecards: "評価スコアカード",
    navSchemaConfig: "スキーマ設定",
    headerRun: "候補者登録",
    headerCandidates: "候補者リスト",
    headerEvaluations: "評価スコアカード",
    headerSchema: "スキーマ設定",
    llmBrain: "LLMモデル:",

    // Panel Titles
    workflowConfig: "ワークフロー設定",
    talentPoolRecords: "候補者データ一覧",
    candidateEvaluationScorecards: "候補者評価スコアカード",

    // Form fields & placeholders
    resumeCvDoc: "履歴書 / 職務経歴書",
    uploadHint: "複数のPDF、Excel、Wordファイルを選択（例：履歴書＋証明書＋ポートフォリオ）",
    changeResume: "書類を追加・変更する",
    uploadCV: "候補者の書類をアップロード（複数可）",
    positionInJapan: "日本でのポジション",
    interviewerNote: "面接官メモ（任意）",
    interviewerNotePlaceholder: "面接メモ、技術スキル、日本語での会話スコアなどを入力...",
    runRecruitmentFlow: "採用フローを実行",
    runningPlatform: "処理実行中...",
    resetHarness: "ハーネスをリセット",
    orchestratorChecklist: "オーケストレーターチェックリスト",
    harnessReady: "採用ハーネスの準備完了",
    harnessInstruction: "左側のパネルでPDFまたはExcelの履歴書をアップロードして、AI採用プロセスを開始してください。",

    // Status states
    processingPipeline: "エージェントチーム処理中...",
    processingSub: "情報の抽出、質問の自動生成、評価スキーマの整合性チェックを行っています。",
    liveAuditLogs: "リアルタイム処理ログ",

    // Table Headers
    id: "ID",
    fullName: "氏名",
    japanese: "日本語能力",
    experience: "経験年数",
    techStack: "技術スタック",
    createdAt: "登録日時",
    actions: "操作",
    noCandidates: "処理された候補者はまだいません。",

    // Evaluations Table
    candidateName: "候補者氏名",
    techScore: "技術スコア",
    japaneseScore: "日本語スコア",
    outsourceFit: "適性スコア",
    decision: "判定",
    justification: "判定の根拠",
    loggedDate: "評価日時",
    noEvaluations: "評価データはまだありません。",
    backToScorecards: "← 評価リストに戻る",
    detailedScorecard: "評価スコアカード詳細:",
    date: "日時:",

    // Schema Config
    cvSchemaEditor: "候補者履歴書スキーマエディタ",
    cvSchemaDesc: "履歴書からエージェントが抽出する項目（氏名、日本語レベル、技術スタックなど）を定義します。",
    evalSchemaEditor: "評価用スコアカードエディタ",
    evalSchemaDesc: "評価エージェントがスコア付け、警告、理由判定の際に使用する評価指標を定義します。",
    keyName: "属性キー名",
    dataType: "データ型",
    aiPromptInst: "AIプロンプト指示 / 抽出説明",
    aiPromptPlaceholder: "AIに対して、どうやってこの項目を探索・評価するかを指示します...",
    isRequired: "必須項目にする",
    addCustomField: "+ カスタム属性を追加",
    saveSchemaSettings: "スキーマ設定を保存",
    importExcelSchema: "Excelからインポート (ヘッダー自動取得)",
    resetSystemData: "データを初期化",
    delete: "削除",
    interviewBtn: "面接",
    version: "IT採用ハーネス v1.0",

    // Dynamic Positions Manager i18n
    addPosition: "新規ポジション追加",
    positionCode: "ポジションコード (例: BrSE)",
    positionName: "ポジション名 (例: Bridge System Engineer)",
    selectPositionToEdit: "評価項目を編集するポジションを選択してください:",
    cvSchemaEditorTitle: "候補者履歴書スキーマエディタ (共通)",
    positionList: "現在のポジション一覧",
    backToCandidates: "← 候補者リストに戻る",
    detailedCandidate: "候補者プロファイル詳細:",
    viewDetail: "詳細",
    projects: "プロジェクト経験",
    exportExcel: "↓ Excel出力",
    exportCandidates: "候補者リストを出力",
    exportEvaluations: "評価リストを出力",
    navEmployees: "社員一覧",
    headerEmployees: "社員一覧",
    employeeList: "現在の社員一覧",
    hireBtn: "✅ 内定する",
    hireConfirmTitle: "内定確認",
    hireConfirmMsg: "この候補者を内定しますか？",
    hireSuccess: "内定完了！",
    dismissBtn: "解雇",
    dismissConfirmMsg: "この社員を解雇しますか？",
    dismissSuccess: "社員を解雇しました。",
    noEmployees: "社員はまだいません。",
    hiredAt: "内定日",
    exportEmployees: "社員リストを出力",
    employeeSchemaEditor: "社員スキーマエディタ",
    employeeSchemaDesc: "内定時に候補者・評価情報から自動マッピングされるHR管理項目を定義します。",
    missingRequiredFields: "必須項目が不足しています:",
    backToEmployees: "← 社員一覧に戻る",
    detailedEmployee: "社員プロファイル:",
    department: "部神",
    salaryGrade: "グレード",
    startDate: "入社日",
    hiringNotes: "内部メモ",
    clarificationTitle: "情報の確認と補足が必要",
    clarificationSubtitle: "情報の矛盾または不足が検出されました。続行するには以下に入力してください。",
    correctionPrompt: "正しい値または説明をここに入力してください：",
    submitClarification: "回答を送信",
    fieldPlaceholder: "{fieldName} の値を入力してください...",
    contradictionWarning: "データの矛盾を検出",
    sectionRecruitment: "採用管理",
    sectionEmployeeMgmt: "社員管理",
    sectionSettings: "各種設定",
    sectionAutomation: "オートメーション",
    navHirect: "Hirect フォーム入力",
    headerHirect: "オートメーション — Hirect",
    hirecUrl: "Hirect フォームURL",
    hirecUrlPlaceholder: "https://app.hirec.vn/feedback/interview-scheduled/...",
    hirecComment: "総合コメント",
    hirecCommentPlaceholder: "面接メモ、候補者評価を入力してください...",
    hirecCookies: "認証Cookie (Hirec)",
    hirecCookieAntiforgery: "Cookie: .AspNetCore.Antiforgery.TbVMJcqMN8o",
    hirecCookieIdsrv: "Cookie: idsrv",
    hirecCookieIdsrvSession: "Cookie: idsrv.session",
    hirecCookiePlaceholder: "Cookie値を貼り付けてください...",
    hirecRun: "▶ 実行",
    hirecRunning: "実行中...",
    hirecSuccess: "✅ 完了しました！",
    hirecError: "❌ エラーが発生しました",
    hirecLogs: "実行ログ",
    hirecResult: "結果",
    hirecFieldsFilled: "入力済みフィールド",
    hirecErrors: "エラー",
    hirecFinalUrl: "最終URL"
  }
};
// ─────────────────────────────────────────────────────────────────────────────

// File extraction logs inspector component
function FileExtractionDetails({ filename, layers }) {
  const [activeLayer, setActiveLayer] = useState(
    layers.layer_1_pdfplumber ? 'pdfplumber' : 'cells'
  );

  const isPdf = filename.toLowerCase().endsWith('.pdf');

  // Helper to determine status and badge style
  const getBadge = (text) => {
    if (!text || text.trim().length === 0) {
      return { label: "Empty / Rỗng", color: "#f87171", bg: "rgba(239,68,68,0.1)" };
    }
    if (text.toLowerCase().includes("error") || text.toLowerCase().includes("failed")) {
      return { label: "Error / Lỗi", color: "#f87171", bg: "rgba(239,68,68,0.1)" };
    }
    return { label: `${text.trim().length} ký tự`, color: "#34d399", bg: "rgba(52,211,153,0.1)" };
  };

  const getTabStyle = (key) => ({
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.78rem',
    cursor: 'pointer',
    background: activeLayer === key ? 'var(--primary)' : 'var(--surface-secondary)',
    color: activeLayer === key ? '#fff' : 'var(--text-muted)',
    border: 'none',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  });

  return (
    <div style={{ background: 'rgba(255,255,255,0.01)', borderRadius: '10px', padding: '16px', border: '1px solid var(--glass-border)', marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          📄 {filename}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {isPdf ? "PDF Document" : "Spreadsheet Document"}
        </span>
      </div>

      {/* Tabs Row */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {isPdf ? (
          <>
            <button type="button" style={getTabStyle('pdfplumber')} onClick={() => setActiveLayer('pdfplumber')}>
              Lớp 1: pdfplumber
            </button>
            <button type="button" style={getTabStyle('pypdf2')} onClick={() => setActiveLayer('pypdf2')}>
              Lớp 2: PyPDF2
            </button>
            {layers.ocr_triggered && (
              <button type="button" style={getTabStyle('ocr')} onClick={() => setActiveLayer('ocr')}>
                Lớp 3: AI Vision OCR 👁️
              </button>
            )}
          </>
        ) : (
          <>
            <button type="button" style={getTabStyle('cells')} onClick={() => setActiveLayer('cells')}>
              Lớp 1: Cell Values (Sheets)
            </button>
            {layers.ocr_triggered && (
              <button type="button" style={getTabStyle('images_ocr')} onClick={() => setActiveLayer('images_ocr')}>
                Lớp 2: Embedded Images OCR 👁️
              </button>
            )}
          </>
        )}
        <button type="button" style={getTabStyle('merged')} onClick={() => setActiveLayer('merged')}>
          Văn bản Gộp (Merged)
        </button>
      </div>

      {/* Layer text preview */}
      {(() => {
        let content = "";
        let badge = { label: "Unknown", color: "var(--text-muted)", bg: "transparent" };

        if (activeLayer === 'pdfplumber') {
          content = layers.layer_1_pdfplumber || "";
          badge = getBadge(content);
        } else if (activeLayer === 'pypdf2') {
          content = layers.layer_2_pypdf2 || "";
          badge = getBadge(content);
        } else if (activeLayer === 'ocr') {
          content = layers.layer_3_ocr || "";
          badge = getBadge(content);
        } else if (activeLayer === 'cells') {
          content = layers.layer_1_cells || "";
          badge = getBadge(content);
        } else if (activeLayer === 'images_ocr') {
          content = layers.layer_2_images_ocr || "";
          badge = getBadge(content);
        } else if (activeLayer === 'merged') {
          content = layers.final_merged || "";
          badge = getBadge(content);
        }

        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Nội dung bóc tách (Preview)
              </span>
              <span style={{
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: '12px',
                color: badge.color,
                background: badge.bg,
                fontWeight: '600'
              }}>
                {badge.label}
              </span>
            </div>
            <pre style={{
              margin: 0,
              padding: '12px',
              background: '#0d1117',
              borderRadius: '8px',
              border: '1px solid #21262d',
              fontSize: '0.78rem',
              fontFamily: 'monospace',
              color: '#c9d1d9',
              overflowY: 'auto',
              maxHeight: '220px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: '1.4'
            }}>
              {content ? content.trim() : "(Không có văn bản trong lớp này)"}
            </pre>
          </div>
        );
      })()}
    </div>
  );
}

const getProfileValue = (profile, possibleKeys, defaultValue = "") => {
  if (!profile) return defaultValue;
  for (const key of Object.keys(profile)) {
    const kLower = key.toLowerCase().replace(/_/g, " ").replace(/-/g, " ").trim();
    if (possibleKeys.includes(kLower)) {
      return profile[key];
    }
  }
  return defaultValue;
};

function App() {
  const [activeTab, setActiveTab] = useState("run");
  const [provider, setProvider] = useState("mock");
  const [language, setLanguage] = useState(() => localStorage.getItem("harness_lang") || "vi");
  const [settings, setSettings] = useState({});

  // Derived translation object
  const t = TRANSLATIONS[language] || TRANSLATIONS.vi;

  // Workflow inputs
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedPath, setUploadedPath] = useState("");
  const [position, setPosition] = useState("BrSE");
  const [interviewerNote, setInterviewerNote] = useState("");

  // Interactive / State variables
  const [runId, setRunId] = useState("");
  const [threadId, setThreadId] = useState("");
  const [status, setStatus] = useState("idle"); // idle, collecting_info, planning, executing, completed, error, waiting_for_profile_review, waiting_for_evaluation_review
  const [missingFields, setMissingFields] = useState([]);
  const [clarificationQuestion, setClarificationQuestion] = useState("");
  const [clarificationAnswer, setClarificationAnswer] = useState("");
  const [clarificationFormValues, setClarificationFormValues] = useState({});
  const [plan, setPlan] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [results, setResults] = useState({});
  const [errorMsg, setErrorMsg] = useState("");

  // Review Edit Fields - Dynamic (schema-driven, no hardcoded field names)
  const [reviewProfileFields, setReviewProfileFields] = useState({});

  const [reviewTechScore, setReviewTechScore] = useState(3);
  const [reviewJpScore, setReviewJpScore] = useState(3);
  const [reviewFitScore, setReviewFitScore] = useState(3);
  const [reviewRec, setReviewRec] = useState("hold");
  const [reviewJustification, setReviewJustification] = useState("");
  const [reviewRiskPoints, setReviewRiskPoints] = useState("");

  const [reviewProfileData, setReviewProfileData] = useState({});
  const [reviewEvaluationData, setReviewEvaluationData] = useState({});

  // Historical lists
  const [candidates, setCandidates] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedEvaluationCandidate, setSelectedEvaluationCandidate] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [recentRuns, setRecentRuns] = useState([]);

  // Poll execution simulation if running
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Positions state
  const [dbPositions, setDbPositions] = useState([]);
  const [selectedEditPosition, setSelectedEditPosition] = useState("");
  const [newPositionCode, setNewPositionCode] = useState("");
  const [newPositionName, setNewPositionName] = useState("");

  // Schema Configuration states
  const [candidateSchemaStr, setCandidateSchemaStr] = useState("");
  const [evaluationSchemaStr, setEvaluationSchemaStr] = useState("");
  const [candidateSchemaItems, setCandidateSchemaItems] = useState([]);
  const [evaluationSchemaItems, setEvaluationSchemaItems] = useState([]);
  const [employeeSchemaItems, setEmployeeSchemaItems] = useState([]);
  const [activeSchemaSubTab, setActiveSchemaSubTab] = useState("candidate");

  // Employee states
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isEditingEmployee, setIsEditingEmployee] = useState(false);
  const [editEmployeeFields, setEditEmployeeFields] = useState({});
  const [isUpdatingEmployee, setIsUpdatingEmployee] = useState(false);
  const [updateEmployeeError, setUpdateEmployeeError] = useState("");
  const [hireDialogOpen, setHireDialogOpen] = useState(false);
  const [hiringFromEvaluation, setHiringFromEvaluation] = useState(null);
  const [isHiring, setIsHiring] = useState(false);
  const [hireError, setHireError] = useState("");

  // Live Interview Session states
  const [interviewingCandidate, setInterviewingCandidate] = useState(null);
  const [interviewPosition, setInterviewPosition] = useState("BrSE");
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [isFetchingQuestions, setIsFetchingQuestions] = useState(false);
  const [interviewFeedback, setInterviewFeedback] = useState("");
  const [isSubmittingInterview, setIsSubmittingInterview] = useState(false);
  const [interviewEvaluationResult, setInterviewEvaluationResult] = useState(null);
  const [interviewCompleted, setInterviewCompleted] = useState(false);

  // ─── Hirect Automation state ────────────────────────────────────────────────
  const [hirecUrl, setHirecUrl] = useState('');
  const [hirecComment, setHirecComment] = useState('');
  const [hirecCookieAntiforgery, _setHirecCookieAntiforgery] = useState(() => localStorage.getItem('hirec_cookie_antiforgery') || '');
  const [hirecCookieIdsrv, _setHirecCookieIdsrv] = useState(() => localStorage.getItem('hirec_cookie_idsrv') || '');
  const [hirecCookieIdsrvSession, _setHirecCookieIdsrvSession] = useState(() => localStorage.getItem('hirec_cookie_idsrv_session') || '');

  const setHirecCookieAntiforgery = (val) => {
    _setHirecCookieAntiforgery(val);
    localStorage.setItem('hirec_cookie_antiforgery', val);
  };
  const setHirecCookieIdsrv = (val) => {
    _setHirecCookieIdsrv(val);
    localStorage.setItem('hirec_cookie_idsrv', val);
  };
  const setHirecCookieIdsrvSession = (val) => {
    _setHirecCookieIdsrvSession(val);
    localStorage.setItem('hirec_cookie_idsrv_session', val);
  };
  const [hirecRunning, setHirecRunning] = useState(false);
  const [hirecResult, setHirecResult] = useState(null);
  const [hirecStep, setHirecStep] = useState(1); // 1=input, 2=preview, 3=done
  const [hirecPayload, setHirecPayload] = useState(null); // generated payload from LLM
  const [hirecGenerating, setHirecGenerating] = useState(false);

  // New automation options: form_type, input_mode, direct json & history
  const [hirecFormType, setHirecFormType] = useState('BA'); // 'BA' | 'PM' | 'SE'
  const [hirecInputMode, setHirecInputMode] = useState('text'); // 'text' | 'json'
  const [hirecDirectJson, setHirecDirectJson] = useState('');
  const [hirecHistory, setHirecHistory] = useState([]);
  const [missingFieldsList, setMissingFieldsList] = useState([]);
  const [shortReasonFieldsList, setShortReasonFieldsList] = useState([]);
  const [jsonValidationErrors, setJsonValidationErrors] = useState([]);

  // Automation Form Settings state
  const [autoFormTab, setAutoFormTab] = useState('BA'); // 'BA' | 'PM' | 'SE'
  const [formStructures, setFormStructures] = useState({ BA: { elements: [] }, PM: { elements: [] }, SE: { elements: [] } });
  const [parseUrl, setParseUrl] = useState('');
  const [parseCookieAntiforgery, setParseCookieAntiforgery] = useState('');
  const [parseCookieIdsrv, setParseCookieIdsrv] = useState('');
  const [parseCookieIdsrvSession, setParseCookieIdsrvSession] = useState('');
  const [parsingForm, setParsingForm] = useState(false);
  const [parsedElements, setParsedElements] = useState(null);
  const [rawJsonStructure, setRawJsonStructure] = useState('');
  const [structureSaveSuccess, setStructureSaveSuccess] = useState('');

  // Helper functions for copying and downloading JSON
  const copyToClipboard = (data) => {
    const text = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data || '');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        alert('📋 Đã copy JSON vào Clipboard!');
      }).catch((err) => {
        console.error('Failed to copy text: ', err);
      });
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('📋 Đã copy JSON vào Clipboard!');
    }
  };

  const downloadJsonFile = (data, filename = 'data.json') => {
    const text = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data || '');
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Fetch history & structures helpers
  const fetchAutomationHistory = async () => {
    try {
      const r = await fetch(`${API_BASE}/automation/history`);
      const data = await r.json();
      if (Array.isArray(data)) setHirecHistory(data);
    } catch (e) {
      console.error("Failed to fetch automation history", e);
    }
  };

  const fetchFormStructures = async () => {
    try {
      const r = await fetch(`${API_BASE}/automation/form-structures`);
      const data = await r.json();
      if (data) {
        setFormStructures(data);
        if (data[autoFormTab]) {
          setRawJsonStructure(JSON.stringify(data[autoFormTab].elements || [], null, 2));
        }
      }
    } catch (e) {
      console.error("Failed to fetch form structures", e);
    }
  };

  useEffect(() => {
    fetchFormStructures();
    if (activeTab === 'hirect_automation') {
      fetchAutomationHistory();
    }
  }, [activeTab, autoFormTab]);
  // ──────────────────────────────────────────────────────────────────────────────

  const syncWorkflowState = (data) => {
    setRunId(data.run_id);
    setThreadId(data.thread_id);
    setStatus(data.status);
    setPlan(data.plan || []);
    setCurrentStepIndex(data.current_step_index);
    const fields = data.missing_fields || [];
    setMissingFields(fields);
    const initialFormValues = {};
    fields.forEach(field => {
      initialFormValues[field] = "";
    });
    setClarificationFormValues(initialFormValues);
    setClarificationQuestion(data.clarification_question || "");
    setResults(data.results || {});

    if (data.status === "error" && data.results?.error_message) {
      setErrorMsg(data.results.error_message);
    }

    // Sync dynamic review profile fields when workflow is paused for manual review
    if (data.status === "waiting_for_profile_review" && data.results?.candidate_profile) {
      const cp = data.results.candidate_profile;
      setReviewProfileData(cp);
      // Initialize all fields as editable strings, preserving their types
      const fields = {};
      Object.entries(cp).forEach(([k, v]) => {
        if (k.startsWith("_")) return; // skip internal keys like _contradictions
        if (Array.isArray(v)) {
          fields[k] = JSON.stringify(v, null, 2);
        } else if (v === null || v === undefined) {
          fields[k] = "";
        } else {
          fields[k] = String(v);
        }
      });
      setReviewProfileFields(fields);
    }
    if (data.status === "waiting_for_evaluation_review" && data.results?.evaluation_result) {
      const ev = data.results.evaluation_result;
      setReviewEvaluationData(ev);
      setReviewTechScore(ev.technical_score || 3);
      setReviewJpScore(ev.japanese_score || 3);
      setReviewFitScore(ev.outsourcing_fit_score || 3);
      setReviewRec(ev.recommendation || "hold");
      setReviewJustification(ev.justification || "");
      setReviewRiskPoints(Array.isArray(ev.risk_points) ? ev.risk_points.join("\n") : "");

      const targetPos = data.inputs?.position;
      const evalUrl = targetPos ? `${API_BASE}/schemas/evaluation?position=${targetPos}` : `${API_BASE}/schemas/evaluation`;
      fetch(evalUrl)
        .then(res => res.json())
        .then(schemaData => setEvaluationSchemaItems(parseSchemaToItems(schemaData)))
        .catch(err => console.error("Error fetching evaluation schema:", err));
    }

    // Refresh the recent runs list whenever state is synced with backend
    fetchRecentRuns();
  };

  const fetchRecentRuns = () => {
    fetch(`${API_BASE}/runs`)
      .then(res => res.json())
      .then(data => setRecentRuns(data))
      .catch(err => console.error("Error fetching recent runs:", err));
  };

  const handleSelectRecentRun = async (run) => {
    setErrorMsg("");
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/runs/${run.run_id}`);
      if (!res.ok) throw new Error("Could not load run details.");
      const data = await res.json();

      syncWorkflowState(data);
      fetchAuditLogs(data.thread_id);

      // Restore inputs in state
      if (data.inputs?.position) setPosition(data.inputs.position);
      if (data.inputs?.interviewer_note) setInterviewerNote(data.inputs.interviewer_note);
      if (data.inputs?.resume_file) {
        setUploadedPath(data.inputs.resume_file);
        // Put placeholder file in selectedFiles if file name is available
        const filename = data.inputs.resume_file.split("/").pop();
        setSelectedFiles([{ name: filename || "CV File" }]);
      }
    } catch (err) {
      setErrorMsg("Error loading recent run: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load configs & settings on mount
  useEffect(() => {
    fetchRecentRuns();

    fetch(`${API_BASE}/settings`)
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        if (data.default_provider) {
          setProvider(data.default_provider);
        }
      })
      .catch(err => console.error("Error fetching settings:", err));

    fetch(`${API_BASE}/schemas/candidate`)
      .then(res => res.json())
      .then(data => setCandidateSchemaItems(parseSchemaToItems(data)))
      .catch(err => console.error(err));

    fetch(`${API_BASE}/schemas/evaluation`)
      .then(res => res.json())
      .then(data => setEvaluationSchemaItems(parseSchemaToItems(data)))
      .catch(err => console.error(err));

    fetch(`${API_BASE}/schemas/employee`)
      .then(res => res.json())
      .then(data => setEmployeeSchemaItems(parseSchemaToItems(data)))
      .catch(err => console.error(err));

    fetch(`${API_BASE}/positions`)
      .then(res => res.json())
      .then(data => {
        setDbPositions(data);
        if (data && data.length > 0) {
          setPosition(data[0].code);
          setInterviewPosition(data[0].code);
        }
      })
      .catch(err => console.error("Error fetching positions:", err));
  }, []);

  const parseSchemaToItems = (schema) => {
    if (!schema || !schema.properties) return [];
    const requiredList = schema.required || [];
    return Object.keys(schema.properties).map(key => {
      const prop = schema.properties[key];
      let type = prop.type;
      let enumOptions = "";

      if (prop.type === "array" && prop.items?.type === "string") {
        type = "array of strings";
      } else if (prop.enum) {
        type = "select option (enum)";
        enumOptions = prop.enum.join(", ");
      }

      return {
        key,
        type,
        description: prop.description || "",
        enumOptions,
        required: requiredList.includes(key)
      };
    });
  };

  const buildSchemaFromItems = (items) => {
    const properties = {};
    const required = [];

    items.forEach(item => {
      const propVal = {};
      if (item.type === "array of strings") {
        propVal.type = "array";
        propVal.items = { type: "string" };
      } else if (item.type === "select option (enum)") {
        propVal.type = "string";
        propVal.enum = item.enumOptions.split(",").map(opt => opt.trim()).filter(Boolean);
      } else {
        propVal.type = item.type;
      }

      propVal.description = item.description;
      properties[item.key] = propVal;

      if (item.required) {
        required.push(item.key);
      }
    });

    return {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties,
      required
    };
  };

  // Sync historical lists when switching tabs
  useEffect(() => {
    setSelectedEvaluation(null);
    setSelectedCandidate(null);
    setSelectedEvaluationCandidate(null);
    setSelectedEmployee(null);
    setHireDialogOpen(false);
    if (activeTab === "candidates") {
      fetch(`${API_BASE}/candidates`)
        .then(res => res.json())
        .then(data => setCandidates(data))
        .catch(err => console.error(err));
    } else if (activeTab === "evaluations") {
      fetch(`${API_BASE}/evaluations`)
        .then(res => res.json())
        .then(data => setEvaluations(data))
        .catch(err => console.error(err));
    } else if (activeTab === "employees") {
      fetch(`${API_BASE}/employees`)
        .then(res => res.json())
        .then(data => setEmployees(data))
        .catch(err => console.error(err));
      fetch(`${API_BASE}/schemas/employee`)
        .then(res => res.json())
        .then(data => setEmployeeSchemaItems(parseSchemaToItems(data)))
        .catch(err => console.error(err));
    } else if (activeTab === "schema_config") {
      fetch(`${API_BASE}/schemas/candidate`)
        .then(res => res.json())
        .then(data => {
          setCandidateSchemaStr(JSON.stringify(data, null, 2));
          setCandidateSchemaItems(parseSchemaToItems(data));
        })
        .catch(err => console.error(err));

      fetch(`${API_BASE}/positions`)
        .then(res => res.json())
        .then(data => setDbPositions(data))
        .catch(err => console.error(err));

      const evalUrl = selectedEditPosition ? `${API_BASE}/schemas/evaluation?position=${selectedEditPosition}` : `${API_BASE}/schemas/evaluation`;
      fetch(evalUrl)
        .then(res => res.json())
        .then(data => {
          setEvaluationSchemaStr(JSON.stringify(data, null, 2));
          setEvaluationSchemaItems(parseSchemaToItems(data));
        })
        .catch(err => console.error(err));

      fetch(`${API_BASE}/schemas/employee`)
        .then(res => res.json())
        .then(data => setEmployeeSchemaItems(parseSchemaToItems(data)))
        .catch(err => console.error(err));
    }
  }, [activeTab]);

  const fetchAuditLogs = (tid) => {
    fetch(`${API_BASE}/audit-logs/${tid}`)
      .then(res => res.json())
      .then(data => setAuditLogs(data))
      .catch(err => console.error(err));
  };

  // Poll audit logs during execution
  useEffect(() => {
    let interval;
    if ((status === "executing" || isSubmitting) && threadId) {
      interval = setInterval(() => {
        fetchAuditLogs(threadId);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, isSubmitting, threadId]);

  // Handle PDF/Excel Upload (multiple files supported)
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setSelectedFiles(files);
    setIsUploading(true);
    setErrorMsg("");

    const formData = new FormData();
    files.forEach(file => {
      formData.append("files", file);
    });

    try {
      const res = await fetch(`${API_BASE}/upload-resume`, {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Upload failed.");
      const data = await res.json();
      setUploadedPath(data.file_path);
    } catch (err) {
      setErrorMsg("File upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Trigger main workflow start
  const handleStartWorkflow = async () => {
    setIsSubmitting(true);
    setErrorMsg("");

    // Compile inputs
    const inputs = {};
    if (uploadedPath) inputs["resume_file"] = uploadedPath;
    if (position) inputs["position"] = position;
    if (interviewerNote) inputs["interviewer_note"] = interviewerNote;
    inputs["user_message"] = `Chạy workflow tuyển dụng cho vị trí ${position}`;

    const payload = {
      provider,
      language,
      intent: "extract_profile",
      inputs
    };

    try {
      const res = await fetch(`${API_BASE}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Workflow run failed.");
      const data = await res.json();

      syncWorkflowState(data);

      // Fetch initial audit logs
      fetchAuditLogs(data.thread_id);
    } catch (err) {
      setErrorMsg("Error: " + err.message);
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle manually running the AI CV extraction step
  const handleRunAiExtraction = async () => {
    setIsSubmitting(true);
    setErrorMsg("");

    const payload = {
      run_id: runId,
      thread_id: threadId,
      provider,
      language,
      inputs: {}
    };

    try {
      const res = await fetch(`${API_BASE}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("AI extraction run failed.");
      const data = await res.json();

      syncWorkflowState(data);
      fetchAuditLogs(data.thread_id);
    } catch (err) {
      setErrorMsg("Error during AI Profile Extraction: " + err.message);
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle supplying clarification fields
  const handleClarificationSubmit = async () => {
    const filledKeys = Object.keys(clarificationFormValues).filter(k => {
      const val = clarificationFormValues[k];
      return val !== undefined && val !== null && String(val).trim() !== "";
    });

    if (filledKeys.length === 0) return;

    setIsSubmitting(true);
    setErrorMsg("");

    const inputs = {};
    if (uploadedPath) inputs["resume_file"] = uploadedPath;
    if (position) inputs["position"] = position;
    if (interviewerNote) inputs["interviewer_note"] = interviewerNote;

    // Merge form values into inputs
    Object.entries(clarificationFormValues).forEach(([key, val]) => {
      if (val && String(val).trim()) {
        inputs[key] = val;
        if (key === "position") {
          setPosition(val);
        } else if (key === "interviewer_note") {
          setInterviewerNote(val);
        }
      }
    });

    // Generate a clean user_message to help the LLM agent
    let userMsg = "";
    if (missingFields.includes("clarification_answer")) {
      userMsg = clarificationFormValues["clarification_answer"] || "";
      inputs["clarification_answer"] = userMsg;
    } else {
      userMsg = missingFields
        .map(field => {
          const schemaItem = candidateSchemaItems.find(s => s.key === field);
          const label = schemaItem?.key || field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          return `- ${label}: ${clarificationFormValues[field] || "(Chưa cung cấp)"}`;
        })
        .join("\n");
    }
    inputs["user_message"] = userMsg;

    const payload = {
      run_id: runId,
      thread_id: threadId,
      provider,
      language,
      inputs
    };

    try {
      const res = await fetch(`${API_BASE}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Clarification submission failed.");
      const data = await res.json();

      syncWorkflowState(data);
      setClarificationAnswer("");

      fetchAuditLogs(data.thread_id);
    } catch (err) {
      setErrorMsg("Error resuming workflow: " + err.message);
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit corrected candidate profile to resume workflow
  const handleConfirmProfile = async () => {
    setIsSubmitting(true);
    setErrorMsg("");

    // Build corrected profile from dynamic fields, restoring arrays/objects from JSON strings
    const correctedProfile = {};
    for (const [k, v] of Object.entries(reviewProfileFields)) {
      const trimmed = typeof v === "string" ? v.trim() : v;
      if (typeof trimmed === "string" && (trimmed.startsWith("[") || trimmed.startsWith("{"))) {
        try {
          correctedProfile[k] = JSON.parse(trimmed);
        } catch {
          setErrorMsg(`Field "${k}" contains invalid JSON: ${trimmed}`);
          setIsSubmitting(false);
          return;
        }
      } else {
        correctedProfile[k] = trimmed;
      }
    }

    const inputs = {};
    if (uploadedPath) inputs["resume_file"] = uploadedPath;
    if (position) inputs["position"] = position;
    if (interviewerNote) inputs["interviewer_note"] = interviewerNote;
    inputs["corrected_profile"] = correctedProfile;

    const payload = {
      run_id: runId,
      thread_id: threadId,
      provider,
      language,
      inputs
    };

    try {
      const res = await fetch(`${API_BASE}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Profile verification submission failed.");
      const data = await res.json();

      syncWorkflowState(data);
      fetchAuditLogs(data.thread_id);
    } catch (err) {
      setErrorMsg("Error resuming workflow after profile review: " + err.message);
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit corrected evaluation scorecard to complete workflow
  const handleConfirmEvaluation = async () => {
    setIsSubmitting(true);
    setErrorMsg("");

    const correctedEvaluation = { ...reviewEvaluationData };

    const payload = {
      run_id: runId,
      thread_id: threadId,
      provider,
      language,
      inputs: {
        corrected_evaluation: correctedEvaluation
      }
    };

    try {
      const res = await fetch(`${API_BASE}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Evaluation verification submission failed.");
      const data = await res.json();

      syncWorkflowState(data);
      fetchAuditLogs(data.thread_id);
    } catch (err) {
      setErrorMsg("Error resuming workflow after evaluation review: " + err.message);
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save candidate schema back to backend
  const handleSaveCandidateSchema = async (items) => {
    try {
      const parsed = buildSchemaFromItems(items);
      const res = await fetch(`${API_BASE}/schemas/candidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed)
      });
      if (!res.ok) throw new Error("Failed to save candidate schema.");
      alert("Candidate schema updated successfully!");
    } catch (e) {
      alert("Save Error: " + e.message);
    }
  };

  // Save evaluation schema back to backend
  const handleSaveEvaluationSchema = async (items) => {
    try {
      const parsed = buildSchemaFromItems(items);
      const url = selectedEditPosition ? `${API_BASE}/schemas/evaluation?position=${selectedEditPosition}` : `${API_BASE}/schemas/evaluation`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed)
      });
      if (!res.ok) throw new Error("Failed to save evaluation schema.");
      alert("Evaluation schema updated successfully!");
    } catch (e) {
      alert("Save Error: " + e.message);
    }
  };

  // Save employee schema back to backend
  const handleSaveEmployeeSchema = async (items) => {
    try {
      const parsed = buildSchemaFromItems(items);
      const res = await fetch(`${API_BASE}/schemas/employee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed)
      });
      if (!res.ok) throw new Error("Failed to save employee schema.");
      alert("Employee schema updated successfully!");
    } catch (e) {
      alert("Save Error: " + e.message);
    }
  };

  // Hire candidate from evaluation → create employee record
  const handleHireEmployee = async () => {
    if (!hiringFromEvaluation) return;
    setIsHiring(true);
    setHireError("");
    try {
      const res = await fetch(`${API_BASE}/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: hiringFromEvaluation.candidate_id,
          evaluation_id: hiringFromEvaluation.id,
          position: hiringFromEvaluation.position || ""
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to hire.");
      }
      setHireDialogOpen(false);
      setHiringFromEvaluation(null);
      setActiveTab("employees");
      // Refresh employee and evaluations lists after navigating
      fetch(`${API_BASE}/employees`).then(r => r.json()).then(data => setEmployees(data)).catch(() => { });
      fetch(`${API_BASE}/evaluations`).then(r => r.json()).then(data => setEvaluations(data)).catch(() => { });
    } catch (e) {
      setHireError(e.message);
    } finally {
      setIsHiring(false);
    }
  };

  // Dismiss (soft-delete) an employee
  const handleDismissEmployee = async (empId, empName) => {
    if (!confirm(`${t.dismissConfirmMsg}\n"${empName}"`)) return;
    try {
      const res = await fetch(`${API_BASE}/employees/${empId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Dismiss failed.");
      setEmployees(prev => prev.filter(e => e.id !== empId));
      setSelectedEmployee(null);
      alert(t.dismissSuccess);
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  // Edit employee details
  const handleStartEditEmployee = () => {
    if (!selectedEmployee) return;
    const fields = {
      full_name: selectedEmployee.full_name || "",
      email: selectedEmployee.email || "",
      phone: selectedEmployee.phone || "",
      position: selectedEmployee.position || "",
      japanese_level: selectedEmployee.japanese_level || "None",
      years_experience: selectedEmployee.years_experience ?? 0,
      tech_stack: Array.isArray(selectedEmployee.tech_stack) ? selectedEmployee.tech_stack.join(", ") : (selectedEmployee.tech_stack || "")
    };

    // Include custom employee schema fields
    const raw = selectedEmployee.raw_employee || {};
    employeeSchemaItems.forEach(item => {
      const val = raw[item.key] ?? selectedEmployee[item.key];
      if (item.type === "array of strings" && Array.isArray(val)) {
        fields[item.key] = val.join("\n");
      } else {
        fields[item.key] = val != null ? String(val) : "";
      }
    });

    setEditEmployeeFields(fields);
    setIsEditingEmployee(true);
    setUpdateEmployeeError("");
  };

  const handleSaveEmployee = async () => {
    setIsUpdatingEmployee(true);
    setUpdateEmployeeError("");
    try {
      const payload = {
        full_name: editEmployeeFields.full_name,
        email: editEmployeeFields.email,
        phone: editEmployeeFields.phone,
        position: editEmployeeFields.position,
        japanese_level: editEmployeeFields.japanese_level,
        years_experience: parseFloat(editEmployeeFields.years_experience) || 0.0,
      };

      const ts = editEmployeeFields.tech_stack;
      payload.tech_stack = typeof ts === "string"
        ? ts.split(",").map(t => t.trim()).filter(Boolean)
        : (Array.isArray(ts) ? ts : []);

      employeeSchemaItems.forEach(item => {
        const val = editEmployeeFields[item.key];
        if (item.type === "array of strings") {
          payload[item.key] = typeof val === "string" ? val.split("\n").map(v => v.trim()).filter(Boolean) : [];
        } else if (item.type === "integer") {
          payload[item.key] = parseInt(val, 10) || 0;
        } else {
          payload[item.key] = val;
        }
      });

      const res = await fetch(`${API_BASE}/employees/${selectedEmployee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to update employee.");
      }

      const updatedListRes = await fetch(`${API_BASE}/employees`);
      const updatedList = await updatedListRes.json();
      setEmployees(updatedList);

      const updatedEmp = updatedList.find(e => e.id === selectedEmployee.id);
      setSelectedEmployee(updatedEmp);
      setIsEditingEmployee(false);
    } catch (e) {
      setUpdateEmployeeError(e.message);
    } finally {
      setIsUpdatingEmployee(false);
    }
  };

  // Export employees to Excel
  const exportEmployeesToExcel = () => {
    if (!employees.length) return;
    const rows = employees.map(e => ({
      ID: e.id,
      'Full Name': e.full_name,
      Email: e.email || '',
      Phone: e.phone || '',
      Position: e.position || '',
      Department: e.raw_employee?.department || '',
      'Japanese Level': e.japanese_level || '',
      'Years Experience': e.years_experience ?? '',
      'Tech Stack': Array.isArray(e.tech_stack) ? e.tech_stack.join(', ') : (e.tech_stack || ''),
      'Salary Grade': e.raw_employee?.salary_grade || '',
      'Start Date': e.raw_employee?.start_date || '',
      Notes: e.raw_employee?.notes || '',
      'Hired At': e.hired_at ? new Date(e.hired_at).toLocaleString() : '',
      'Candidate ID': e.candidate_id || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const colWidths = Object.keys(rows[0] || {}).map(key => ({
      wch: Math.max(key.length, ...rows.map(r => String(r[key] || '').length).slice(0, 20)) + 2
    }));
    ws['!cols'] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    XLSX.writeFile(wb, `employees_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleResetDatabase = async () => {
    const confirmationText = language === "ja"
      ? "本当にすべてのデータベースとファイルをクリアしますか？"
      : language === "en"
        ? "Are you sure you want to clear all database tables and upload files?"
        : "Bạn có chắc chắn muốn xóa sạch toàn bộ cơ sở dữ liệu và tài liệu đã tải lên không?";

    if (!confirm(confirmationText)) return;

    try {
      const res = await fetch(`${API_BASE}/reset-data`, { method: "POST" });
      if (!res.ok) throw new Error("Reset failed.");
      alert(language === "ja" ? "初期化に成功しました！" : language === "en" ? "Data reset successful!" : "Xóa sạch dữ liệu thành công!");

      // Reset local React state
      setCandidates([]);
      setEvaluations([]);
      setEmployees([]);
      setSelectedCandidate(null);
      setSelectedEvaluation(null);
      setSelectedEvaluationCandidate(null);
      setSelectedEmployee(null);
      setUploadedPath("");
      setSelectedFiles([]);
      setStatus("idle");
      setPlan([]);
      setCurrentStepIndex(0);
      setResults({});
    } catch (e) {
      alert("Error: " + e.message);
    }
  };



  const handleEditPositionChange = (pos) => {
    setSelectedEditPosition(pos);
    const evalUrl = pos ? `${API_BASE}/schemas/evaluation?position=${pos}` : `${API_BASE}/schemas/evaluation`;
    fetch(evalUrl)
      .then(res => res.json())
      .then(data => {
        setEvaluationSchemaStr(JSON.stringify(data, null, 2));
        setEvaluationSchemaItems(parseSchemaToItems(data));
      })
      .catch(err => console.error(err));
  };

  const handleAddPosition = async () => {
    if (!newPositionCode.trim() || !newPositionName.trim()) {
      alert("Please provide both code and name for the new position.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/positions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newPositionCode.trim(),
          name: newPositionName.trim()
        })
      });
      if (!res.ok) throw new Error("Failed to add position.");
      alert("Position added successfully!");
      setNewPositionCode("");
      setNewPositionName("");
      // Refresh positions
      const fetchRes = await fetch(`${API_BASE}/positions`);
      const data = await fetchRes.json();
      setDbPositions(data);
    } catch (e) {
      alert("Error adding position: " + e.message);
    }
  };

  const handleDeletePosition = async (code) => {
    if (!confirm(`Are you sure you want to delete position "${code}"? This will also clean up its evaluation schema file.`)) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/positions/${code}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete position.");
      alert("Position deleted successfully!");
      if (selectedEditPosition === code) {
        handleEditPositionChange("");
      }
      // Refresh positions
      const fetchRes = await fetch(`${API_BASE}/positions`);
      const data = await fetchRes.json();
      setDbPositions(data);
    } catch (e) {
      alert("Error deleting position: " + e.message);
    }
  };

  const handleSelectEvaluation = (ev) => {
    setSelectedEvaluation(ev);
    setSelectedEvaluationCandidate(null);
    if (ev) {
      const targetPos = ev.position;
      const url = targetPos ? `${API_BASE}/schemas/evaluation?position=${targetPos}` : `${API_BASE}/schemas/evaluation`;
      fetch(url)
        .then(res => res.json())
        .then(schemaData => setEvaluationSchemaItems(parseSchemaToItems(schemaData)))
        .catch(err => console.error("Error fetching evaluation schema for details view:", err));

      // Fetch candidate info dynamically
      fetch(`${API_BASE}/candidates/${ev.candidate_id}`)
        .then(res => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then(candData => setSelectedEvaluationCandidate(candData))
        .catch(err => console.error("Error fetching candidate for evaluation detail:", err));
    }
  };

  // Set up states and fetch proposed questions for live interview session
  const handleStartInterview = async (cand) => {
    setInterviewingCandidate(cand);
    setInterviewFeedback("");
    setInterviewQuestions([]);
    setIsFetchingQuestions(false);
    setInterviewCompleted(false);
    setInterviewEvaluationResult(null);

    // Choose default target position
    const defaultPos = cand.japanese_level === "N1" || cand.japanese_level === "N2" ? "BrSE" : "Front SE";
    setInterviewPosition(defaultPos);

    // Pre-fetch evaluation schema so the result scorecard can render labels correctly
    const evalUrl = defaultPos ? `${API_BASE}/schemas/evaluation?position=${defaultPos}` : `${API_BASE}/schemas/evaluation`;
    fetch(evalUrl)
      .then(res => res.json())
      .then(schemaData => setEvaluationSchemaItems(parseSchemaToItems(schemaData)))
      .catch(err => console.error("Error fetching evaluation schema for interview:", err));
  };

  // Generate questions from backend endpoint
  const fetchQuestions = async (candId, targetPos) => {
    setIsFetchingQuestions(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${API_BASE}/candidates/${candId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: targetPos, provider })
      });
      if (!res.ok) throw new Error("Failed to fetch questions.");
      const data = await res.json();
      setInterviewQuestions(data.questions || []);
    } catch (e) {
      setErrorMsg("Error generating questions: " + e.message);
    } finally {
      setIsFetchingQuestions(false);
    }
  };

  // Send interviewer notes to backend for evaluation score extraction and persistence
  const handleSubmitInterview = async () => {
    setIsSubmittingInterview(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${API_BASE}/candidates/${interviewingCandidate.id}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewer_note: interviewFeedback,
          position: interviewPosition,
          provider
        })
      });
      if (!res.ok) throw new Error("Evaluation failed.");
      const data = await res.json();

      setInterviewEvaluationResult(data.evaluation_result);
      setInterviewCompleted(true);
    } catch (e) {
      setErrorMsg("Error during evaluation: " + e.message);
    } finally {
      setIsSubmittingInterview(false);
    }
  };

  // Export helpers ─────────────────────────────────────────────────────────
  const exportCandidatesToExcel = () => {
    if (!candidates.length) return;

    // Build flat rows – include ALL raw_profile fields plus standard columns
    const rows = candidates.map((c) => {
      const raw = c.raw_profile || {};
      const projects = Array.isArray(raw.project_experience)
        ? raw.project_experience
          .map((p) => `${p.project_name} (${p.role || ''}): ${p.description || ''}`)
          .join(' | ')
        : '';

      // Collect every extra field defined in the schema (from raw_profile)
      const extras = {};
      const dbCols = new Set(['id', 'full_name', 'email', 'phone', 'years_experience', 'japanese_level', 'tech_stack', 'project_experience', 'raw_profile_json', 'created_at']);
      Object.entries(raw).forEach(([key, val]) => {
        if (dbCols.has(key)) return;
        if (val !== undefined && val !== null && val !== '')
          extras[key.replace(/_/g, ' ')] = Array.isArray(val) ? val.join(', ') : String(val);
      });

      return {
        ID: c.id,
        'Full Name': c.full_name,
        Email: c.email || '',
        Phone: c.phone || '',
        'Japanese Level': c.japanese_level || '',
        'Years Experience': c.years_experience ?? '',
        'Tech Stack': Array.isArray(c.tech_stack) ? c.tech_stack.join(', ') : (c.tech_stack || ''),
        'Project Experience': projects,
        'Created At': c.created_at ? new Date(c.created_at).toLocaleString() : '',
        ...extras,
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);

    // Auto-size columns
    const colWidths = Object.keys(rows[0] || {}).map(key => ({
      wch: Math.max(key.length, ...rows.map(r => String(r[key] || '').length).slice(0, 20)) + 2
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Candidates');
    XLSX.writeFile(wb, `candidates_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleCandidatesExcelImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rows = XLSX.utils.sheet_to_json(worksheet);
        if (rows.length === 0) {
          alert("Không tìm thấy dữ liệu trong file Excel.");
          return;
        }

        const importedCandidates = rows.map(row => {
          const mapped = {};
          candidateSchemaItems.forEach(item => {
            const possibleKeys = [
              item.key.toLowerCase(),
              item.key.replace(/_/g, ' ').toLowerCase(),
              item.key.replace(/_/g, '').toLowerCase(),
              (item.description || '').toLowerCase(),
            ];

            let matchedKey = null;
            for (const rowKey of Object.keys(row)) {
              const rowKeyLower = rowKey.toLowerCase().trim();
              if (possibleKeys.includes(rowKeyLower) || 
                  rowKeyLower.includes(item.key.toLowerCase()) || 
                  (item.description && rowKeyLower.includes(item.description.toLowerCase()))) {
                matchedKey = rowKey;
                break;
              }
            }

            let value = matchedKey ? row[matchedKey] : null;
            if (value === undefined || value === null || String(value).trim() === "") {
              if (item.required) {
                value = "TBD";
              } else {
                value = "";
              }
            }

            if (item.type === "array of strings") {
              if (typeof value === "string") {
                mapped[item.key] = value.split(",").map(v => v.trim()).filter(Boolean);
              } else if (Array.isArray(value)) {
                mapped[item.key] = value;
              } else {
                mapped[item.key] = value === "TBD" ? ["TBD"] : [];
              }
            } else {
              mapped[item.key] = value;
            }
          });
          return mapped;
        });

        if (confirm(`Tìm thấy ${importedCandidates.length} ứng viên trong file. Bạn có muốn thực hiện nhập vào hệ thống không?`)) {
          let count = 0;
          for (const cand of importedCandidates) {
            const res = await fetch(`${API_BASE}/candidates`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(cand)
            });
            if (res.ok) count++;
          }
          alert(`Nhập thành công ${count}/${importedCandidates.length} ứng viên.`);
          fetch(`${API_BASE}/candidates`)
            .then(res => res.json())
            .then(data => setCandidates(data))
            .catch(err => console.error(err));
        }
      } catch (err) {
        console.error(err);
        alert("Lỗi khi đọc hoặc nhập dữ liệu Excel: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = null;
  };

  const handleEmployeesExcelImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        let activeSchemaItems = employeeSchemaItems;
        if (activeSchemaItems.length === 0) {
          const res = await fetch(`${API_BASE}/schemas/employee`);
          const schema = await res.json();
          activeSchemaItems = parseSchemaToItems(schema);
          setEmployeeSchemaItems(activeSchemaItems);
        }

        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rows = XLSX.utils.sheet_to_json(worksheet);
        if (rows.length === 0) {
          alert("Không tìm thấy dữ liệu trong file Excel.");
          return;
        }

        const importedEmployees = rows.map(row => {
          const mapped = {};
          activeSchemaItems.forEach(item => {
            const possibleKeys = [
              item.key.toLowerCase(),
              item.key.replace(/_/g, ' ').toLowerCase(),
              item.key.replace(/_/g, '').toLowerCase(),
              (item.description || '').toLowerCase(),
            ];

            let matchedKey = null;
            for (const rowKey of Object.keys(row)) {
              const rowKeyLower = rowKey.toLowerCase().trim();
              if (possibleKeys.includes(rowKeyLower) || 
                  rowKeyLower.includes(item.key.toLowerCase()) || 
                  (item.description && rowKeyLower.includes(item.description.toLowerCase()))) {
                matchedKey = rowKey;
                break;
              }
            }

            let value = matchedKey ? row[matchedKey] : null;
            if (value === undefined || value === null || String(value).trim() === "") {
              if (item.required) {
                value = "TBD";
              } else {
                value = "";
              }
            }

            if (item.type === "array of strings") {
              if (typeof value === "string") {
                mapped[item.key] = value.split(",").map(v => v.trim()).filter(Boolean);
              } else if (Array.isArray(value)) {
                mapped[item.key] = value;
              } else {
                mapped[item.key] = value === "TBD" ? ["TBD"] : [];
              }
            } else {
              mapped[item.key] = value;
            }
          });
          return mapped;
        });

        if (confirm(`Tìm thấy ${importedEmployees.length} nhân viên trong file. Bạn có muốn thực hiện nhập vào hệ thống không?`)) {
          let count = 0;
          for (const emp of importedEmployees) {
            const res = await fetch(`${API_BASE}/employees/import`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(emp)
            });
            if (res.ok) count++;
          }
          alert(`Nhập thành công ${count}/${importedEmployees.length} nhân viên.`);
          fetch(`${API_BASE}/employees`)
            .then(res => res.json())
            .then(data => setEmployees(data))
            .catch(err => console.error(err));
        }
      } catch (err) {
        console.error(err);
        alert("Lỗi khi đọc hoặc nhập dữ liệu Excel: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = null;
  };

  const exportEvaluationsToExcel = () => {
    if (!evaluations.length) return;

    const rows = evaluations.map((ev) => ({
      'Candidate Name': ev.candidate_name || ev.candidate_id,
      'Candidate ID': ev.candidate_id,
      'Technical Score': ev.technical_score ?? '',
      'Japanese Score': ev.japanese_score ?? '',
      'Outsourcing Fit Score': ev.outsourcing_fit_score ?? '',
      Recommendation: ev.recommendation || '',
      Justification: ev.justification || '',
      'Risk Points': Array.isArray(ev.risk_points) ? ev.risk_points.join('; ') : (ev.risk_points || ''),
      Position: ev.position || '',
      'Evaluated At': ev.created_at ? new Date(ev.created_at).toLocaleString() : '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    const colWidths = Object.keys(rows[0] || {}).map(key => ({
      wch: Math.max(key.length, ...rows.map(r => String(r[key] || '').length).slice(0, 20)) + 2
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Evaluations');
    XLSX.writeFile(wb, `evaluations_${new Date().toISOString().split('T')[0]}.xlsx`);
  };
  // ─────────────────────────────────────────────────────────────────────────

  // Delete candidate and evaluations
  const handleDeleteCandidate = async (candId) => {
    if (!confirm("Are you sure you want to delete this candidate and all their evaluations?")) return;
    try {
      const res = await fetch(`${API_BASE}/candidates/${candId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Delete failed.");
      setCandidates(prev => prev.filter(c => c.id !== candId));
      alert("Candidate deleted successfully!");
    } catch (e) {
      alert("Error deleting candidate: " + e.message);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadedPath("");
    setInterviewerNote("");
    setRunId("");
    setThreadId("");
    setStatus("idle");
    setMissingFields([]);
    setClarificationFormValues({});
    setClarificationQuestion("");
    setPlan([]);
    setCurrentStepIndex(0);
    setResults({});
    setErrorMsg("");
    setAuditLogs([]);
    setReviewName("");
    setReviewEmail("");
    setReviewPhone("");
    setReviewJpLevel("None");
    setReviewExp(0);
    setReviewTech("");
    setReviewProjects("[]");
    setReviewTechScore(3);
    setReviewJpScore(3);
    setReviewFitScore(3);
    setReviewRec("hold");
    setReviewJustification("");
    setReviewRiskPoints("");
  };

  const renderSchemaEditor = (items, setItems, onSave, label, description, headerExtra = null) => {
    const handleFieldChange = (index, field, value) => {
      const updated = [...items];
      updated[index] = { ...updated[index], [field]: value };
      setItems(updated);
    };

    const handleDeleteField = (index) => {
      const updated = items.filter((_, i) => i !== index);
      setItems(updated);
    };

    const handleAddField = () => {
      setItems([...items, {
        key: `new_field_${Math.floor(Math.random() * 1000)}`,
        type: "string",
        description: "",
        enumOptions: "",
        required: false
      }]);
    };

    const handleExcelImport = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          const headers = [];
          if (worksheet['!ref']) {
            const range = XLSX.utils.decode_range(worksheet['!ref']);
            const R = range.s.r; // First row
            for (let C = range.s.c; C <= range.e.c; ++C) {
              const cell_address = { c: C, r: R };
              const cell = worksheet[XLSX.utils.encode_cell(cell_address)];
              if (cell && cell.v !== undefined && cell.v !== null) {
                headers.push(String(cell.v).trim());
              }
            }
          }

          if (headers.length === 0) {
            alert("No headers found in the Excel file.");
            return;
          }

          const newItems = headers.map(hdr => {
            const sanitizedKey = hdr.toLowerCase()
              .replace(/[^a-z0-9_]+/g, '_')
              .replace(/^_+|_+$/g, '');
            return {
              key: sanitizedKey || `field_${Math.floor(Math.random() * 1000)}`,
              type: "string",
              description: `Trường thông tin: ${hdr}`,
              enumOptions: "",
              required: false
            };
          });

          if (confirm(`Tìm thấy ${headers.length} cột: ${headers.join(", ")}. Bạn có muốn ghi đè schema hiện tại bằng các cột này không (yêu cầu bắt buộc/require sẽ tự đánh dấu sau)?`)) {
            setItems(newItems);
          }
        } catch (err) {
          console.error(err);
          alert("Lỗi khi đọc file Excel: " + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
      e.target.value = null; // Clear input to allow re-upload of same file
    };

    return (
      <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '650px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <h3 className="panel-title" style={{ margin: 0 }}>{label}</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <label className="glow-btn" style={{ padding: '6px 12px', fontSize: '0.82rem', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              {t.importExcelSchema}
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleExcelImport}
                style={{ display: 'none' }}
              />
            </label>
            <button onClick={() => onSave(items)} className="glow-btn" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
              {t.saveSchemaSettings}
            </button>
          </div>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
          {description}
        </p>

        {headerExtra}

        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', maxHeight: '500px', paddingRight: '8px', marginTop: '10px' }}>
          {items.map((item, index) => (
            <div key={index} className="glass-card" style={{ padding: '14px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '10px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', background: 'rgba(255,255,255,0.01)' }}>
              {/* Delete Button */}
              <button
                onClick={() => handleDeleteField(index)}
                className="glow-btn"
                style={{ position: 'absolute', top: '10px', right: '10px', padding: '2px 8px', background: 'var(--danger)', fontSize: '0.7rem', border: 'none' }}
              >
                {t.delete}
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>{t.keyName}</label>
                  <input
                    type="text"
                    className="text-input"
                    value={item.key}
                    onChange={(e) => handleFieldChange(index, 'key', e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '6px', width: '100%' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>{t.dataType}</label>
                  <select
                    className="select-input"
                    value={item.type}
                    onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '6px', width: '100%', height: '34px' }}
                  >
                    <option value="string">string (Text)</option>
                    <option value="integer">integer (Number)</option>
                    <option value="array of strings">array of strings (List)</option>
                    <option value="select option (enum)">select option (enum)</option>
                  </select>
                </div>
              </div>

              {item.type === "select option (enum)" && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--warning)', marginBottom: '4px' }}>{t.enumOptions}</label>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="e.g. hire, hold, reject"
                    value={item.enumOptions}
                    onChange={(e) => handleFieldChange(index, 'enumOptions', e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '6px', width: '100%' }}
                  />
                </div>
              )}

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>{t.aiPromptInst}</label>
                <textarea
                  className="text-area"
                  value={item.description}
                  onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                  style={{ fontSize: '0.8rem', padding: '6px', minHeight: '50px', width: '100%' }}
                  placeholder={t.aiPromptPlaceholder}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id={`req-${label}-${index}`}
                  checked={item.required}
                  onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                />
                <label htmlFor={`req-${label}-${index}`} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer', margin: 0 }}>{t.isRequired}</label>
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleAddField} className="glow-btn" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--glass-border)', padding: '10px', width: '100%', marginTop: '10px' }}>
          {t.addCustomField}
        </button>
      </div>
    );
  };

  const renderBreadcrumbs = () => {
    const getTabLabel = () => {
      switch (activeTab) {
        case 'run':
          return t.navRun;
        case 'candidates':
          return t.navCandidates;
        case 'evaluations':
          return t.navScorecards;
        case 'employees':
          return t.navEmployees;
        case 'schema_config':
          return t.navSchemaConfig;
        default:
          return '';
      }
    };

    const crumbs = [
      { label: 'Dashboard', onClick: () => { setSelectedCandidate(null); setInterviewingCandidate(null); setSelectedEvaluation(null); setSelectedEmployee(null); setIsEditingEmployee(false); } }
    ];

    crumbs.push({
      label: getTabLabel(),
      onClick: () => {
        setSelectedCandidate(null);
        setInterviewingCandidate(null);
        setSelectedEvaluation(null);
        setSelectedEmployee(null);
        setIsEditingEmployee(false);
      }
    });

    if (activeTab === 'candidates') {
      if (interviewingCandidate) {
        crumbs.push({
          label: `Phỏng vấn: ${interviewingCandidate.full_name}`,
          active: true
        });
      } else if (selectedCandidate) {
        crumbs.push({
          label: `Chi tiết: ${selectedCandidate.full_name}`,
          active: true
        });
      }
    } else if (activeTab === 'evaluations') {
      if (selectedEvaluation) {
        crumbs.push({
          label: `Chi tiết: ${selectedEvaluation.candidate_name || selectedEvaluation.candidate_id}`,
          active: true
        });
      }
    } else if (activeTab === 'employees') {
      if (selectedEmployee) {
        crumbs.push({
          label: isEditingEmployee ? `Chỉnh sửa: ${selectedEmployee.full_name}` : `Chi tiết: ${selectedEmployee.full_name}`,
          active: true
        });
      }
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
        {crumbs.map((crumb, idx) => {
          const isLast = idx === crumbs.length - 1;
          return (
            <React.Fragment key={idx}>
              {idx > 0 && <span style={{ color: 'rgba(255,255,255,0.15)' }}>/</span>}
              <span
                onClick={!isLast && crumb.onClick ? crumb.onClick : undefined}
                style={{
                  color: isLast ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: !isLast && crumb.onClick ? 'pointer' : 'default',
                  fontWeight: isLast ? 600 : 400,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isLast && crumb.onClick) e.target.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  if (!isLast && crumb.onClick) e.target.style.color = 'var(--text-muted)';
                }}
              >
                {crumb.label}
              </span>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-icon">H</div>
          <div className="logo-text">RTeam</div>
        </div>

        <nav className="nav-links" style={{ gap: '16px' }}>
          {/* Section 1: Recruitment */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 12px 6px', userSelect: 'none', opacity: 0.8 }}>
              {t.sectionRecruitment}
            </div>
            <button
              className={`nav-item ${activeTab === 'run' ? 'active' : ''}`}
              onClick={() => setActiveTab('run')}
            >
              <Icons.Compass /> {t.navRun}
            </button>
            <button
              className={`nav-item ${activeTab === 'candidates' ? 'active' : ''}`}
              onClick={() => setActiveTab('candidates')}
            >
              <Icons.Users /> {t.navCandidates}
            </button>
            <button
              className={`nav-item ${activeTab === 'evaluations' ? 'active' : ''}`}
              onClick={() => setActiveTab('evaluations')}
            >
              <Icons.ClipboardList /> {t.navScorecards}
            </button>
          </div>

          {/* Section 2: Employee Management */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 12px 6px', userSelect: 'none', opacity: 0.8 }}>
              {t.sectionEmployeeMgmt}
            </div>
            <button
              className={`nav-item ${activeTab === 'employees' ? 'active' : ''}`}
              onClick={() => setActiveTab('employees')}
            >
              <Icons.Users /> {t.navEmployees}
            </button>
          </div>

          {/* Section 3: Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 12px 6px', userSelect: 'none', opacity: 0.8 }}>
              {t.sectionSettings}
            </div>
            <button
              className={`nav-item ${activeTab === 'schema_config' ? 'active' : ''}`}
              onClick={() => setActiveTab('schema_config')}
            >
              <Icons.Settings /> {t.navSchemaConfig}
            </button>
            <button
              className={`nav-item ${activeTab === 'automation_form_settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('automation_form_settings')}
            >
              <Icons.Settings /> {t.navAutomationFormSettings || 'Cài đặt Form Automation'}
            </button>
          </div>

          {/* Section 4: Automation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 12px 6px', userSelect: 'none', opacity: 0.8 }}>
              {t.sectionAutomation || 'Automation'}
            </div>
            <button
              className={`nav-item ${activeTab === 'hirect_automation' ? 'active' : ''}`}
              onClick={() => setActiveTab('hirect_automation')}
            >
              <Icons.Zap /> {t.navHirect || 'Hirect Form Filler'}
            </button>
          </div>
        </nav>

        {/* Language Switcher */}
        <div style={{ marginTop: 'auto', padding: '0 12px 12px' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px', textAlign: 'center', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Language</div>
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
            {[{ code: 'vi', flag: '🇻🇳', label: 'VI' }, { code: 'en', flag: '🇬🇧', label: 'EN' }, { code: 'ja', flag: '🇯🇵', label: 'JA' }].map(({ code, flag, label }) => (
              <button
                key={code}
                id={`lang-btn-${code}`}
                onClick={() => { setLanguage(code); localStorage.setItem('harness_lang', code); }}
                style={{
                  flex: 1,
                  padding: '5px 2px',
                  borderRadius: '8px',
                  border: language === code ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  background: language === code ? 'var(--accent-primary)20' : 'var(--surface-secondary)',
                  color: language === code ? 'var(--accent-primary)' : 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: language === code ? '700' : '400',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  lineHeight: 1,
                }}
              >
                <span style={{ fontSize: '1rem' }}>{flag}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Reset Database Button */}
        <div style={{ padding: '0 12px 10px' }}>
          <button
            onClick={handleResetDatabase}
            className="glow-btn"
            style={{
              width: '100%',
              padding: '6px 12px',
              fontSize: '0.78rem',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#f87171',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
            {t.resetSystemData}
          </button>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', paddingBottom: '4px' }}>
          {t.version}
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="main-layout">
        <header className="top-header" style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '16px', height: 'auto', alignItems: 'flex-start', justifyContent: 'center' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', margin: 0 }}>
              {activeTab === 'run' && t.headerRun}
              {activeTab === 'candidates' && t.headerCandidates}
              {activeTab === 'evaluations' && t.headerEvaluations}
              {activeTab === 'employees' && t.headerEmployees}
              {activeTab === 'schema_config' && t.headerSchema}
              {activeTab === 'automation_form_settings' && (t.headerAutomationFormSettings || 'Cài đặt — Form Automation')}
              {activeTab === 'hirect_automation' && (t.headerHirect || 'Automation — Hirect')}
            </h2>
          </div>
          {renderBreadcrumbs()}
        </header>

        <div className="content-area">
          {errorMsg && (
            <div style={{ background: 'var(--danger-glow)', border: '1px solid var(--danger)', color: '#fecaca', padding: '12px', borderRadius: '8px', marginBottom: '24px' }}>
              {errorMsg}
            </div>
          )}

          {/* RUN TAB */}
          {activeTab === 'run' && (
            <div className="run-grid">

              {/* Left Column: Input Form */}
              <div className="glass input-panel">
                <h3 className="panel-title">{t.workflowConfig}</h3>

                {/* File Upload */}
                <div className="form-group">
                  <label className="form-label">{t.resumeCvDoc}</label>
                  <label className="file-upload-zone">
                    <input
                      type="file"
                      accept=".pdf,.xlsx,.xls,.txt"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                      multiple
                      disabled={status !== 'idle' && status !== 'collecting_info'}
                    />
                    <div className="upload-icon">
                      {isUploading ? (
                        <div className="animate-spin-slow" style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
                      ) : "↑"}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      {selectedFiles.length > 0 ? t.changeResume : t.uploadCV}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {t.uploadHint}
                    </div>
                  </label>
                  {selectedFiles.length > 0 && (
                    <div className="file-name-indicator" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                          ✓ {file.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Job Position */}
                <div className="form-group">
                  <label className="form-label">{t.positionInJapan}</label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="select-input"
                    disabled={status !== 'idle' && status !== 'collecting_info'}
                  >
                    {dbPositions.map(pos => (
                      <option key={pos.code} value={pos.code}>{pos.name}</option>
                    ))}
                  </select>
                </div>

                {/* Interviewer Note */}
                <div className="form-group">
                  <label className="form-label">{t.interviewerNote}</label>
                  <textarea
                    value={interviewerNote}
                    onChange={(e) => setInterviewerNote(e.target.value)}
                    className="text-area"
                    placeholder={t.interviewerNotePlaceholder}
                    rows={4}
                    disabled={status !== 'idle' && status !== 'collecting_info'}
                  />
                </div>

                {/* Actions */}
                <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
                  {status === 'idle' ? (
                    <button
                      onClick={handleStartWorkflow}
                      className="glow-btn"
                      disabled={isSubmitting || !uploadedPath}
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      <Icons.Play />
                      {isSubmitting ? t.runningPlatform : t.runRecruitmentFlow}
                    </button>
                  ) : (
                    <button
                      onClick={handleReset}
                      className="glow-btn"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', width: '100%', justifyContent: 'center' }}
                    >
                      <Icons.Refresh /> {t.resetHarness}
                    </button>
                  )}
                </div>

                {/* Execution Checklist Display */}
                {plan.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>{t.orchestratorChecklist}</h4>
                    <div className="checklist-container">
                      {plan.map((step, idx) => {
                        let stepState = 'pending';
                        if (idx < currentStepIndex) stepState = 'completed';
                        else if (idx === currentStepIndex && status === 'executing') stepState = 'executing';

                        return (
                          <div key={idx} className={`step-row ${stepState}`}>
                            <div className="step-indicator">
                              {stepState === 'completed' ? "✓" : idx + 1}
                            </div>
                            <div className="step-name">{step.replace('_', ' ')}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recent Runs / Sessions History */}
                {recentRuns.length > 0 && (
                  <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.1rem' }}>🕒</span> Phiên xử lý gần đây
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                      {recentRuns.map((r, idx) => {
                        let statusColor = 'var(--text-muted)';
                        let statusText = r.status;
                        if (r.status === 'completed') {
                          statusColor = '#10b981';
                          statusText = 'Hoàn thành';
                        } else if (r.status === 'error') {
                          statusColor = '#ef4444';
                          statusText = 'Lỗi';
                        } else if (r.status === 'waiting_for_ai_extraction') {
                          statusColor = '#3b82f6';
                          statusText = 'Chờ gọi AI';
                        } else if (r.status === 'waiting_for_profile_review') {
                          statusColor = '#8b5cf6';
                          statusText = 'Chờ duyệt';
                        } else if (r.status === 'collecting_info') {
                          statusColor = '#f59e0b';
                          statusText = 'Cần bổ sung';
                        }

                        const dateStr = r.created_at ? new Date(r.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit' }) : '';

                        return (
                          <div
                            key={r.run_id}
                            onClick={() => handleSelectRecentRun(r)}
                            style={{
                              padding: '8px 12px',
                              background: runId === r.run_id ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                              border: runId === r.run_id ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.05)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'all 0.2s'
                            }}
                            className="recent-run-item"
                          >
                            <div style={{ flex: 1, minWidth: 0, marginRight: '8px' }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {r.inputs?.position || 'Trích xuất CV'}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {dateStr}
                              </div>
                            </div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 500, color: statusColor, padding: '2px 6px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                              {statusText}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Dynamic Terminal / Results */}
              <div className="results-layout">
                {/* 1. LOADING STATE OVERRIDE */}
                {(status === "executing" || isSubmitting) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="glass animate-pulse-slow" style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', border: '1px solid var(--primary)' }}>
                      <div className="animate-spin-slow" style={{ width: '48px', height: '48px', border: '4px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
                      <h3>{t.processingPipeline}</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {t.processingSub}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 2. CLARIFICATION AGENT PANEL */}
                    {status === "collecting_info" && clarificationQuestion && (
                      <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                          <h3 style={{ fontSize: '1.1rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></span>
                            {missingFields.includes("clarification_answer") ? t.contradictionWarning : t.clarificationTitle}
                          </h3>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                          {t.clarificationSubtitle}
                        </p>

                        {/* Agent message box */}
                        <div style={{ 
                          background: missingFields.includes("clarification_answer") ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.08)',
                          border: missingFields.includes("clarification_answer") ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(245, 158, 11, 0.25)',
                          borderRadius: '8px',
                          padding: '16px',
                          fontSize: '0.9rem',
                          color: missingFields.includes("clarification_answer") ? '#f87171' : 'var(--text-primary)',
                          lineHeight: '1.5',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {clarificationQuestion}
                        </div>

                        {/* Input form */}
                        {missingFields.includes("clarification_answer") ? (
                          <div className="form-group">
                            <label className="form-label" style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                              {t.correctionPrompt}
                            </label>
                            <textarea
                              className="text-area"
                              rows={4}
                              placeholder="Nhập thông tin đính chính hoặc giải trình chính xác..."
                              value={clarificationFormValues["clarification_answer"] || ""}
                              onChange={(e) => setClarificationFormValues(prev => ({ ...prev, clarification_answer: e.target.value }))}
                              style={{ width: '100%' }}
                            />
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {missingFields.map((fieldKey) => {
                              const schemaItem = candidateSchemaItems.find(s => s.key === fieldKey);
                              const label = fieldKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                              const isRequired = schemaItem?.required;

                              return (
                                <div key={fieldKey} className="form-group" style={{ gridColumn: (fieldKey === "interviewer_note" || fieldKey === "evaluation") ? '1 / -1' : undefined }}>
                                  <label className="form-label">
                                    {label}
                                    {isRequired && <span style={{ color: 'var(--error)', marginLeft: '4px' }}>*</span>}
                                  </label>
                                  {fieldKey === "position" ? (
                                    <select
                                      value={clarificationFormValues["position"] || ""}
                                      onChange={(e) => setClarificationFormValues(prev => ({ ...prev, position: e.target.value }))}
                                      className="select-input"
                                      style={{ width: '100%' }}
                                    >
                                      <option value="">-- Choose Position --</option>
                                      {dbPositions.map(pos => (
                                        <option key={pos.code} value={pos.code}>{pos.name}</option>
                                      ))}
                                    </select>
                                  ) : (fieldKey === "interviewer_note" || fieldKey === "evaluation" || fieldKey === "note") ? (
                                    <textarea
                                      className="text-area"
                                      rows={3}
                                      placeholder={t.fieldPlaceholder.replace("{fieldName}", label)}
                                      value={clarificationFormValues[fieldKey] || ""}
                                      onChange={(e) => setClarificationFormValues(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                                      style={{ width: '100%' }}
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      className="select-input"
                                      placeholder={t.fieldPlaceholder.replace("{fieldName}", label)}
                                      value={clarificationFormValues[fieldKey] || ""}
                                      onChange={(e) => setClarificationFormValues(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                                      style={{ width: '100%' }}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Submit Row */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                          <button
                            onClick={handleClarificationSubmit}
                            className="glow-btn"
                            disabled={isSubmitting || Object.values(clarificationFormValues).every(val => !val || !String(val).trim())}
                          >
                            <Icons.Play /> {t.submitClarification}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 2b. AI EXTRACTION MANUAL TRIGGER PANEL */}
                    {(status === "waiting_for_ai_extraction" || (status === "error" && results.resume_text)) && (
                      <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                          <h3 style={{ fontSize: '1.1rem', color: status === "error" ? 'var(--error)' : 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            🤖 {status === "error" ? "Thử lại trích xuất hồ sơ AI" : "Kích hoạt trích xuất hồ sơ bằng AI"}
                          </h3>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mã phiên: {runId}</span>
                        </div>

                        {status === "error" ? (
                          <div className="alert-box error" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px 16px', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem' }}>
                            ⚠️ <strong>Lỗi cuộc gọi AI:</strong> {errorMsg || "Dịch vụ AI gặp sự cố tạm thời hoặc lỗi phân tích cú pháp."}
                            <br />
                            Bạn có thể nhấn nút phía dưới để kích hoạt chạy lại riêng cuộc gọi AI mà không cần tải lại tài liệu CV.
                          </div>
                        ) : (
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                            Tài liệu CV ứng viên đã được xử lý và đọc thành công. Hãy bấm nút dưới đây để AI phân tích và bóc tách thông tin chi tiết của ứng viên khớp với Schema.
                          </p>
                        )}

                        {results.resume_text && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nội dung văn bản CV đọc được:</label>
                            <div style={{
                              background: 'rgba(0, 0, 0, 0.2)',
                              border: '1px solid var(--glass-border)',
                              borderRadius: '8px',
                              padding: '12px',
                              maxHeight: '180px',
                              overflowY: 'auto',
                              fontSize: '0.8rem',
                              fontFamily: 'monospace',
                              whiteSpace: 'pre-wrap',
                              color: 'var(--text-muted)'
                            }}>
                              {results.resume_text}
                            </div>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                          <button
                            onClick={handleRunAiExtraction}
                            className="glow-btn"
                            disabled={isSubmitting}
                            style={{
                              background: status === "error" ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <Icons.Play /> {status === "error" ? "Thử lại trích xuất AI" : "Bắt đầu trích xuất AI"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 3. PROFILE MANUAL REVIEW PANEL */}
                    {status === "waiting_for_profile_review" && (
                      <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                          <h3 style={{ fontSize: '1.1rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            ✍️ Candidate Profile Manual Review
                          </h3>
                          <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>{results.candidate_id || "AWAITING PERSISTENCE"}</span>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          Please verify and correct the candidate details parsed from the CV below before saving to the database.
                        </p>

                        {/* Dynamic form from schema fields */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          {Object.entries(reviewProfileFields).map(([fieldKey, fieldVal]) => {
                            const schemaItem = candidateSchemaItems.find(s => s.key === fieldKey);
                            const label = fieldKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                            const isRequired = schemaItem?.required;
                            const isMultiline = typeof fieldVal === 'string' && fieldVal.length > 80;
                            const isJsonArray = typeof fieldVal === 'string' && fieldVal.trim().startsWith('[');

                            return (
                              <div key={fieldKey} className="form-group" style={{ gridColumn: (isMultiline || isJsonArray) ? '1 / -1' : undefined }}>
                                <label className="form-label">
                                  {label}
                                  {isRequired && <span style={{ color: 'var(--error)', marginLeft: '4px' }}>*</span>}
                                </label>
                                {(isMultiline || isJsonArray) ? (
                                  <textarea
                                    className="text-area"
                                    rows={isJsonArray ? 5 : 3}
                                    style={{ fontFamily: isJsonArray ? 'monospace' : 'inherit', fontSize: '0.85rem', width: '100%' }}
                                    value={fieldVal}
                                    onChange={(e) => setReviewProfileFields(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    className="select-input"
                                    value={fieldVal}
                                    onChange={(e) => setReviewProfileFields(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                                    style={{ width: '100%' }}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                          <button
                            onClick={handleConfirmProfile}
                            className="glow-btn"
                            disabled={isSubmitting}
                          >
                            <Icons.Play /> Approve & Save Candidate
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 4. EVALUATION MANUAL REVIEW PANEL */}
                    {status === "waiting_for_evaluation_review" && (
                      <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                          <h3 style={{ fontSize: '1.1rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            ✍️ AI Scorecard Manual Review
                          </h3>
                          <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>{results.candidate_id}</span>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          Please review the candidate's scorecard. Make any adjustments to the fields before saving.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          {(() => {
                            const getFieldCategory = (key) => {
                              if (["type_working", "job_level", "education", "achievements", "can_onsite", "work_experience", "career_path", "strengths_at_work"].includes(key)) {
                                return "General Profile";
                              }
                              if (key.startsWith("japanese_")) {
                                return "Japanese Language Proficiency";
                              }
                              if (key.startsWith("domain_")) {
                                return "Domain & Industry Knowledge";
                              }
                              if (key.startsWith("design_")) {
                                return "System & Data Design";
                              }
                              if (key.startsWith("software_tech_")) {
                                return "Software Tech & Competence";
                              }
                              if (key.startsWith("test_")) {
                                return "Software Testing & QA";
                              }
                              if (key.startsWith("management_")) {
                                return "Management & Organization";
                              }
                              if (key.startsWith("softskill_")) {
                                return "Soft Skills & Teamwork";
                              }
                              if (key === "certifications") {
                                return "Certifications";
                              }
                              if (key.startsWith("ai_proficiency_")) {
                                return "AI Proficiency & Mindset";
                              }
                              if (key === "conclusion") {
                                return "Conclusion";
                              }
                              if (key.startsWith("experiences_")) {
                                return "Applied Position Experiences";
                              }
                              return "Other Details";
                            };

                            const grouped = {};
                            evaluationSchemaItems.forEach(item => {
                              const cat = getFieldCategory(item.key);
                              if (!grouped[cat]) grouped[cat] = [];
                              grouped[cat].push(item);
                            });

                            const categoryOrder = [
                              "General Profile",
                              "Applied Position Experiences",
                              "Japanese Language Proficiency",
                              "Domain & Industry Knowledge",
                              "System & Data Design",
                              "Software Tech & Competence",
                              "Software Testing & QA",
                              "Management & Organization",
                              "Soft Skills & Teamwork",
                              "Certifications",
                              "AI Proficiency & Mindset",
                              "Conclusion",
                              "Other Details"
                            ];

                            return categoryOrder.map((category, catIdx) => {
                              const items = grouped[category];
                              if (!items || items.length === 0) return null;

                              return (
                                <div key={catIdx} className="glass" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                                  <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', marginBottom: '12px', fontWeight: 600 }}>
                                    {category}
                                  </h4>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                                    {items.map((item, idx) => {
                                      const val = reviewEvaluationData[item.key] ?? "";

                                      const handleChange = (newVal) => {
                                        setReviewEvaluationData(prev => ({
                                          ...prev,
                                          [item.key]: newVal
                                        }));
                                      };

                                      if (item.type === "select option (enum)") {
                                        const options = item.enumOptions ? item.enumOptions.split(",").map(o => o.trim()) : [];
                                        return (
                                          <div className="form-group" key={idx} style={{ marginBottom: 0 }}>
                                            <label className="form-label" style={{ fontSize: '0.75rem' }}>{item.key.replace(/_/g, ' ')} {item.required ? "*" : ""}</label>
                                            <select
                                              className="select-input"
                                              value={val}
                                              onChange={(e) => handleChange(e.target.value)}
                                              style={{ width: '100%' }}
                                            >
                                              <option value="">-- Choose --</option>
                                              {options.map((opt, oi) => <option key={oi} value={opt}>{opt}</option>)}
                                            </select>
                                          </div>
                                        );
                                      }

                                      if (item.type === "integer") {
                                        return (
                                          <div className="form-group" key={idx} style={{ marginBottom: 0 }}>
                                            <label className="form-label" style={{ fontSize: '0.75rem' }}>{item.key.replace(/_/g, ' ')} {item.required ? "*" : ""}</label>
                                            <input
                                              type="number"
                                              className="select-input"
                                              value={val}
                                              onChange={(e) => handleChange(Number(e.target.value))}
                                              style={{ width: '100%' }}
                                            />
                                          </div>
                                        );
                                      }

                                      if (item.type === "array of strings") {
                                        return (
                                          <div className="form-group" key={idx} style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                                            <label className="form-label" style={{ fontSize: '0.75rem' }}>{item.key.replace(/_/g, ' ')} {item.required ? "*" : ""}</label>
                                            <textarea
                                              className="text-area"
                                              rows={2}
                                              value={Array.isArray(val) ? val.join("\n") : val}
                                              onChange={(e) => handleChange(e.target.value.split("\n").map(line => line.trim()).filter(Boolean))}
                                              placeholder="One item per line..."
                                              style={{ width: '100%' }}
                                            />
                                          </div>
                                        );
                                      }

                                      return (
                                        <div className="form-group" key={idx} style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                                          <label className="form-label" style={{ fontSize: '0.75rem' }}>{item.key.replace(/_/g, ' ')} {item.required ? "*" : ""}</label>
                                          <textarea
                                            className="text-area"
                                            rows={2}
                                            value={val}
                                            onChange={(e) => handleChange(e.target.value)}
                                            style={{ width: '100%' }}
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                          <button
                            onClick={handleConfirmEvaluation}
                            className="glow-btn"
                            disabled={isSubmitting}
                          >
                            <Icons.Play /> Save Scorecard & Complete
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 5. FINAL RESULTS RENDER */}
                    {status === "completed" && (
                      <div className="results-pane">

                        {/* Candidate Extracted Profile Card - Dynamic (schema-driven) */}
                        {results.candidate_profile && (() => {
                          const profile = results.candidate_profile;
                          const entries = Object.entries(profile).filter(([k]) => !k.startsWith('_'));
                          return (
                            <div className="glass">
                              <div className="card-header">
                                <h3 style={{ fontSize: '1.1rem' }}>Extracted Candidate Profile</h3>
                                <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>{results.candidate_id}</span>
                              </div>
                              <div style={{ padding: '16px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                {entries.map(([key, value]) => {
                                  const schemaItem = candidateSchemaItems.find(s => s.key === key);
                                  const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                                  const isLong = typeof value === 'string' && value.length > 60;
                                  const isArray = Array.isArray(value);

                                  return (
                                    <div key={key} className="info-item" style={{ gridColumn: (isLong || isArray) ? '1 / -1' : undefined }}>
                                      <span className="info-label">{label}</span>
                                      {isArray ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                                          {value.map((item, i) => (
                                            <span key={i} className="tech-tag">
                                              {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="info-value" style={{ whiteSpace: 'pre-wrap' }}>
                                          {value === null || value === undefined || value === '' ? <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span> : String(value)}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Interview Questions Card */}
                        {results.interview_questions && results.interview_questions.length > 0 && (
                          <div className="glass">
                            <div className="card-header">
                              <h3 style={{ fontSize: '1.1rem' }}>Generated Custom Technical Questions</h3>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target: {position}</span>
                            </div>
                            <div className="questions-list">
                              {results.interview_questions.map((q, idx) => (
                                <div key={idx} className="question-card">
                                  <div className="question-meta">
                                    <span className="topic-badge">{q.topic}</span>
                                    <span className="level-badge">{q.level}</span>
                                  </div>
                                  <div className="question-text">
                                    Q{idx + 1}: {q.question}
                                  </div>
                                  <div className="expected-answer">
                                    <strong style={{ color: 'var(--success)' }}>Expected Answer:</strong> {q.expected_answer}
                                  </div>
                                  {q.red_flags && q.red_flags.length > 0 && (
                                    <div className="red-flags-box">
                                      <strong style={{ color: 'var(--danger)' }}>Red Flags to Watch For:</strong>
                                      <ul style={{ paddingLeft: '16px', marginTop: '4px' }}>
                                        {q.red_flags.map((flag, fi) => <li key={fi}>{flag}</li>)}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Candidate Scorecard Evaluation */}
                        {results.evaluation_result && (
                          <div className="glass">
                            <div className="card-header">
                              <h3 style={{ fontSize: '1.1rem' }}>AI Recruiters Scorecard Report</h3>
                            </div>

                            <div className="evaluation-summary">
                              <div className="score-wheels">
                                <div className="score-wheel">
                                  <div className="wheel-circle tech">{results.evaluation_result.technical_score}</div>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Technical</span>
                                </div>
                                <div className="score-wheel">
                                  <div className="wheel-circle jp">{results.evaluation_result.japanese_score}</div>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Japanese</span>
                                </div>
                                <div className="score-wheel">
                                  <div className="wheel-circle fit">{results.evaluation_result.outsourcing_fit_score}</div>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Outsource Fit</span>
                                </div>
                              </div>

                              <div className="recommendation-panel">
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Final Recruitment Ruling</span>
                                <span className={`badge ${results.evaluation_result.recommendation}`}>
                                  {results.evaluation_result.recommendation}
                                </span>
                              </div>
                            </div>

                            {results.evaluation_result.risk_points && results.evaluation_result.risk_points.length > 0 && (
                              <div className="risk-list">
                                <span className="info-label" style={{ color: '#fca5a5' }}>Risk Assessment Logs</span>
                                {results.evaluation_result.risk_points.map((risk, idx) => (
                                  <div key={idx} className="risk-item">
                                    ⚠ {risk}
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="justification-box">
                              <span className="info-label" style={{ display: 'block', marginBottom: '6px' }}>Decision Justification Summary</span>
                              {results.evaluation_result.justification}
                            </div>
                          </div>
                        )}

                      </div>
                    )}

                    {/* 6. DEFAULT PLACEHOLDER */}
                    {status === "idle" && (
                      <div className="glass" style={{ padding: '80px 40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚙</div>
                        <h3>{t.harnessReady}</h3>
                        <p style={{ fontSize: '0.9rem', marginTop: '8px', maxWidth: '400px', margin: '8px auto 0' }}>
                          {t.harnessInstruction}
                        </p>
                      </div>
                    )}
                    {/* Multi-layer Extraction Inspector */}
                    {results && results.extraction_details && (
                      <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
                        <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                          <h3 style={{ fontSize: '1.05rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            🔍 Multi-layer Extraction Inspector / Nhật ký bóc tách hồ sơ chi tiết
                          </h3>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                            Xem chi tiết văn bản thô bóc tách từ từng lớp phát hiện (Native Text vs AI Vision OCR).
                          </p>
                        </div>
                        {Object.entries(results.extraction_details).map(([filename, layers]) => (
                          <FileExtractionDetails key={filename} filename={filename} layers={layers} />
                        ))}
                      </div>
                    )}

                  </>
                )}
              </div>
            </div>
          )}

          {/* CANDIDATES TAB */}
          {activeTab === 'candidates' && (
            interviewingCandidate ? (
              <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                  <button onClick={() => setInterviewingCandidate(null)} className="glow-btn" style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}>
                    ← Back to Talent Pool
                  </button>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>
                    Live Interview Session: {interviewingCandidate.full_name}
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ID: {interviewingCandidate.id}</span>
                </div>

                {interviewCompleted ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="glass" style={{ padding: '20px', background: 'var(--success-glow)', border: '1px solid var(--success)', textAlign: 'center', borderRadius: '12px' }}>
                      <h4 style={{ color: '#a7f3d0', fontSize: '1.1rem' }}>✓ Evaluation Completed & Saved Successfully!</h4>
                      <p style={{ fontSize: '0.85rem', marginTop: '4px', color: 'var(--text-secondary)' }}>
                        The candidate's verbal feedback notes have been parsed, scores generated, and scorecard appended to the database and CSV report.
                      </p>
                    </div>

                    {interviewEvaluationResult && (() => {
                      const entries = Object.entries(interviewEvaluationResult)
                        .filter(([k]) => !['candidate_id', 'position'].includes(k));
                      return (
                        <div className="glass" style={{ padding: '20px' }}>
                          <h4 style={{ marginBottom: '16px' }}>Generated Scorecard Report</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {entries.map(([key, value]) => {
                              const schemaItem = evaluationSchemaItems.find(s => s.key === key);
                              const label = schemaItem?.description
                                ? schemaItem.description.trim()
                                : key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                              const isArray = Array.isArray(value);
                              const isEmpty = value === null || value === undefined || value === '';

                              return (
                                <div key={key} style={{
                                  padding: '12px 16px',
                                  background: 'rgba(255,255,255,0.02)',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                  <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600, display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    {label}
                                  </span>
                                  {isEmpty ? (
                                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>—</span>
                                  ) : isArray ? (
                                    <ul style={{ paddingLeft: '18px', margin: '4px 0', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                                      {value.map((item, i) => <li key={i} style={{ marginBottom: '2px' }}>{String(item)}</li>)}
                                    </ul>
                                  ) : (
                                    <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                      {String(value)}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button onClick={() => setInterviewingCandidate(null)} className="glow-btn">
                        Finish & Close Session
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Left Column: Stats & Questions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="glass-card" style={{ padding: '16px' }}>
                        <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Candidate Stats</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                          <div><strong>Candidate Name:</strong> {interviewingCandidate.full_name}</div>
                          <div>
                            <strong>Japanese Level:</strong>{' '}
                            {(() => {
                              const rawVal = getProfileValue(
                                interviewingCandidate.raw_profile,
                                ['jlpt level', 'japanese level', 'japanese'],
                                interviewingCandidate.japanese_level
                              );
                              return Array.isArray(rawVal) ? rawVal.join(', ') : String(rawVal || 'None');
                            })()}
                          </div>
                          <div>
                            <strong>Tech Stack:</strong>{' '}
                            {(() => {
                              const rawVal = getProfileValue(
                                interviewingCandidate.raw_profile,
                                ['skill', 'skills', 'tech stack', 'tech_stack'],
                                interviewingCandidate.tech_stack
                              );
                              return Array.isArray(rawVal) ? rawVal.join(', ') : String(rawVal || '—');
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <h4 style={{ fontSize: '0.95rem', margin: 0 }}>Proposed Questions</h4>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <select
                              value={interviewPosition}
                              onChange={(e) => setInterviewPosition(e.target.value)}
                              className="provider-select"
                              style={{ padding: '4px 8px', fontSize: '0.8rem', background: 'rgba(15,23,42,0.8)', color: '#fff', border: '1px solid var(--glass-border)', borderRadius: '4px' }}
                            >
                              {dbPositions.map(pos => (
                                <option key={pos.code} value={pos.code}>{pos.name}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => fetchQuestions(interviewingCandidate.id, interviewPosition)}
                              className="glow-btn"
                              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                              disabled={isFetchingQuestions}
                            >
                              {isFetchingQuestions ? "Generating..." : "💡 Generate"}
                            </button>
                          </div>
                        </div>

                        {isFetchingQuestions ? (
                          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                            <div className="animate-spin-slow" style={{ width: '24px', height: '24px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '8px' }}>
                            {interviewQuestions.length > 0 ? (
                              interviewQuestions.map((q, idx) => (
                                <div key={idx} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '0.75rem', padding: '2px 6px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', borderRadius: '4px', fontWeight: 600 }}>{q.topic}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{q.level}</span>
                                  </div>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 500, margin: '4px 0' }}>Q: {q.question}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '4px' }}><strong>Expected:</strong> {q.expected_answer}</div>
                                </div>
                              ))
                            ) : (
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
                                Click "Generate" to generate AI interview questions, or write feedback directly based on your own questions.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Feedback input */}
                    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h4 style={{ fontSize: '1rem' }}>Verbal Interview Feedback</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Conduct the verbal interview. Write down detailed feedback notes regarding their technology expertise, coding projects, Japanese conversation fluency, and cultural fit.
                      </p>

                      <div className="form-group" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <textarea
                          value={interviewFeedback}
                          onChange={(e) => setInterviewFeedback(e.target.value)}
                          className="text-area"
                          placeholder="Type notes here... For example: 'Ứng viên giao tiếp tiếng Nhật trôi chảy tương đương N2, kinh nghiệm Java tốt, nắm vững cơ chế Spring Boot. Tuy nhiên kỹ năng thiết kế hệ thống cơ bản còn hơi yếu...'"
                          style={{ flexGrow: 1, minHeight: '220px', resize: 'vertical', width: '100%' }}
                          disabled={isSubmittingInterview}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button
                          onClick={() => setInterviewingCandidate(null)}
                          className="glow-btn"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}
                          disabled={isSubmittingInterview}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSubmitInterview}
                          className="glow-btn"
                          disabled={isSubmittingInterview || !interviewFeedback.trim()}
                        >
                          {isSubmittingInterview ? (
                            <>
                              <div className="animate-spin-slow" style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#fff', borderRadius: '50%', marginRight: '8px' }} />
                              Analyzing Feedback...
                            </>
                          ) : (
                            <>
                              <Icons.Play /> Submit Evaluation
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : selectedCandidate ? (
              <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
                  <button onClick={() => setSelectedCandidate(null)} className="glow-btn" style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}>
                    {t.backToCandidates}
                  </button>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: 0 }}>
                    {t.detailedCandidate} {selectedCandidate.full_name}
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ID: {selectedCandidate.id}</span>
                </div>

                {/* Dynamic Candidate Profile Table/List conforming strictly to the defined schema */}
                <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                    👤 Candidate Profile Details (Schema fields)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {candidateSchemaItems.map((item, idx) => {
                      const val = selectedCandidate.raw_profile?.[item.key] || selectedCandidate[item.key];
                      const label = item.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

                      const isArray = Array.isArray(val);
                      const isEmpty = val === null || val === undefined || val === '';

                      return (
                        <div key={item.key} style={{
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '14px 16px',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'
                        }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                            {label}
                          </span>
                          {isEmpty ? (
                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>—</span>
                          ) : isArray ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                              {val.map((arrItem, i) => (
                                <span key={i} className="tech-tag" style={{ margin: 0 }}>
                                  {typeof arrItem === 'object' ? JSON.stringify(arrItem) : String(arrItem)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.9rem', color: '#fff', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                              {String(val)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <h3 className="panel-title" style={{ margin: 0 }}>{t.talentPoolRecords}</h3>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <label 
                      className="glow-btn" 
                      style={{ padding: '7px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.35)', color: '#818cf8' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                      Nhập từ Excel
                      <input 
                        type="file" 
                        accept=".xlsx, .xls, .csv" 
                        onChange={handleCandidatesExcelImport} 
                        style={{ display: 'none' }} 
                      />
                    </label>
                    <button
                      onClick={exportCandidatesToExcel}
                      className="glow-btn"
                      disabled={candidates.length === 0}
                      style={{ padding: '7px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.35)', color: '#34d399' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                      {t.exportCandidates}
                    </button>
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  {(() => {
                    const nameItem = candidateSchemaItems.find(item => item.key.toLowerCase().includes("name"));
                    const otherItems = candidateSchemaItems.filter(item => !item.key.toLowerCase().includes("name"));
                    const orderedItems = nameItem ? [nameItem, ...otherItems] : candidateSchemaItems;

                    return (
                      <table className="data-table">
                        <thead>
                          <tr>
                            {orderedItems.map((item, idx) => {
                              const isFirst = idx === 0;
                              return (
                                <th
                                  key={item.key}
                                  style={{
                                    whiteSpace: 'nowrap',
                                    position: isFirst ? 'sticky' : undefined,
                                    left: isFirst ? 0 : undefined,
                                    background: isFirst ? '#111219' : undefined,
                                    zIndex: isFirst ? 10 : undefined,
                                    borderRight: isFirst ? '1px solid var(--glass-border)' : undefined
                                  }}
                                >
                                  {item.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                </th>
                              );
                            })}
                            <th style={{ whiteSpace: 'nowrap' }}>{t.createdAt}</th>
                            <th
                              style={{
                                whiteSpace: 'nowrap',
                                position: 'sticky',
                                right: 0,
                                background: '#111219',
                                zIndex: 10,
                                borderLeft: '1px solid var(--glass-border)'
                              }}
                            >
                              {t.actions}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {candidates.length > 0 ? (
                            candidates.map((cand, idx) => (
                              <tr key={idx} className="clickable-row" onClick={() => setSelectedCandidate(cand)} style={{ cursor: 'pointer' }}>
                                {orderedItems.map((item, colIdx) => {
                                  const val = cand.raw_profile?.[item.key] || cand[item.key];
                                  const isFirst = colIdx === 0;

                                  return (
                                    <td
                                      key={item.key}
                                      style={{
                                        fontSize: '0.85rem',
                                        color: isFirst ? 'var(--primary)' : 'var(--text-secondary)',
                                        fontWeight: isFirst ? 600 : undefined,
                                        maxWidth: '220px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        position: isFirst ? 'sticky' : undefined,
                                        left: isFirst ? 0 : undefined,
                                        background: isFirst ? '#111219' : undefined,
                                        zIndex: isFirst ? 9 : undefined,
                                        borderRight: isFirst ? '1px solid var(--glass-border)' : undefined
                                      }}
                                    >
                                      {Array.isArray(val) ? val.join(", ") : (val !== undefined && val !== null ? String(val) : "—")}
                                    </td>
                                  );
                                })}
                                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                  {new Date(cand.created_at).toLocaleString()}
                                </td>
                                <td
                                  onClick={e => e.stopPropagation()}
                                  style={{
                                    whiteSpace: 'nowrap',
                                    position: 'sticky',
                                    right: 0,
                                    background: '#111219',
                                    zIndex: 9,
                                    borderLeft: '1px solid var(--glass-border)'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button
                                      onClick={() => handleStartInterview(cand)}
                                      className="glow-btn"
                                      style={{
                                        height: '28px',
                                        boxSizing: 'border-box',
                                        padding: '4px 10px',
                                        fontSize: '0.8rem',
                                        border: '1px solid transparent',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                    >
                                      <Icons.Play /> {t.interviewBtn}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCandidate(cand.id)}
                                      className="glow-btn"
                                      style={{
                                        height: '28px',
                                        boxSizing: 'border-box',
                                        padding: '4px 10px',
                                        fontSize: '0.8rem',
                                        background: 'var(--danger)',
                                        border: '1px solid transparent',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                    >
                                      {t.delete}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={orderedItems.length + 2} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{t.noCandidates}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              </div>
            )
          )}

          {/* EVALUATIONS TAB */}
          {activeTab === 'evaluations' && (
            <>
              {/* Hire Confirm Dialog */}
              {hireDialogOpen && hiringFromEvaluation && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="glass" style={{ padding: '32px', maxWidth: '480px', width: '90%', display: 'flex', flexDirection: 'column', gap: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#34d399' }}>✅ {t.hireConfirmTitle}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {t.hireConfirmMsg}
                    </p>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
                      <div><span style={{ color: 'var(--text-muted)' }}>Candidate: </span><strong>{hiringFromEvaluation.candidate_name || hiringFromEvaluation.candidate_id}</strong></div>
                      <div><span style={{ color: 'var(--text-muted)' }}>Position: </span><strong>{hiringFromEvaluation.position || '—'}</strong></div>
                    </div>
                    {hireError && (
                      <div style={{ color: '#fca5a5', fontSize: '0.85rem', background: 'rgba(239,68,68,0.08)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)' }}>
                        ⚠ {hireError}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => { setHireDialogOpen(false); setHireError(""); }}
                        className="glow-btn"
                        disabled={isHiring}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleHireEmployee}
                        className="glow-btn"
                        disabled={isHiring}
                        style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.5)', color: '#34d399', fontWeight: 600 }}
                      >
                        {isHiring ? (
                          <><div className="animate-spin-slow" style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#34d399', borderRadius: '50%', marginRight: '8px' }} />Processing...</>
                        ) : t.hireBtn}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectedEvaluation ? (
                <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
                    <button onClick={() => setSelectedEvaluation(null)} className="glow-btn" style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}>
                      {t.backToScorecards}
                    </button>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)', margin: 0 }}>
                      {t.detailedScorecard} {selectedEvaluation.candidate_name || selectedEvaluation.candidate_id}
                    </h3>
                    <button
                      onClick={() => { setHiringFromEvaluation(selectedEvaluation); setHireError(""); setHireDialogOpen(true); }}
                      className="glow-btn"
                      style={{ padding: '6px 14px', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.4)', color: '#34d399', fontWeight: 600 }}
                    >
                      {t.hireBtn}
                    </button>
                  </div>

                  {/* Candidate Profile Details (Schema fields) */}
                  {selectedEvaluationCandidate && (
                    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h4 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                        👤 Candidate Profile Details (Schema fields)
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {candidateSchemaItems.map((item, idx) => {
                          const val = selectedEvaluationCandidate.raw_profile?.[item.key] || selectedEvaluationCandidate[item.key];
                          const label = item.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

                          const isArray = Array.isArray(val);
                          const isEmpty = val === null || val === undefined || val === '';

                          return (
                            <div key={item.key} style={{
                              display: 'flex',
                              flexDirection: 'column',
                              padding: '14px 16px',
                              borderBottom: '1px solid rgba(255,255,255,0.05)',
                              background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'
                            }}>
                              <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                                {label}
                              </span>
                              {isEmpty ? (
                                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>—</span>
                              ) : isArray ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                                  {val.map((arrItem, i) => (
                                    <span key={i} className="tech-tag" style={{ margin: 0 }}>
                                      {typeof arrItem === 'object' ? JSON.stringify(arrItem) : String(arrItem)}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.9rem', color: '#fff', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                  {String(val)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Scorecard evaluation fields - line-by-line layout (no grid) */}
                  <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                      📝 Scorecard Evaluation Details
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {evaluationSchemaItems.map((item, idx) => {
                        const val = selectedEvaluation[item.key];
                        if (val === undefined || val === null || val === "") return null;

                        const label = item.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

                        const isArray = Array.isArray(val);

                        return (
                          <div key={item.key} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '14px 16px',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'
                          }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                              {label}
                            </span>
                            {isArray ? (
                              <ul style={{ paddingLeft: '18px', margin: '4px 0', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                                {val.map((arrItem, i) => <li key={i} style={{ marginBottom: '2px' }}>{String(arrItem)}</li>)}
                              </ul>
                            ) : (
                              <span style={{ fontSize: '0.9rem', color: '#fff', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                {String(val)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <h3 className="panel-title" style={{ margin: 0 }}>{t.candidateEvaluationScorecards}</h3>
                    <button
                      onClick={exportEvaluationsToExcel}
                      className="glow-btn"
                      disabled={evaluations.length === 0}
                      style={{ padding: '7px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.35)', color: '#34d399' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                      {t.exportEvaluations}
                    </button>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ whiteSpace: 'nowrap', position: 'sticky', left: 0, background: '#111219', zIndex: 10, borderRight: '1px solid var(--glass-border)' }}>
                            {t.candidateName}
                          </th>
                          {evaluationSchemaItems.map(item => (
                            <th key={item.key} style={{ whiteSpace: 'nowrap' }}>
                              {item.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </th>
                          ))}
                          <th style={{ whiteSpace: 'nowrap' }}>{t.loggedDate}</th>
                          <th style={{ whiteSpace: 'nowrap', position: 'sticky', right: 0, background: '#111219', zIndex: 10, borderLeft: '1px solid var(--glass-border)' }}>
                            {t.actions}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {evaluations.length > 0 ? (
                          evaluations.map((ev, idx) => (
                            <tr key={idx} onClick={() => handleSelectEvaluation(ev)} style={{ cursor: 'pointer' }} className="clickable-row">
                              <td style={{ fontWeight: 600, color: 'var(--primary)', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: '#111219', zIndex: 9, borderRight: '1px solid var(--glass-border)' }}>
                                {ev.candidate_name || ev.candidate_id}
                              </td>
                              {evaluationSchemaItems.map(item => {
                                const val = ev[item.key];
                                return (
                                  <td key={item.key} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {Array.isArray(val) ? val.join(", ") : (val !== undefined && val !== null ? String(val) : "—")}
                                  </td>
                                );
                              })}
                              <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                {new Date(ev.created_at).toLocaleString()}
                              </td>
                              <td
                                onClick={e => e.stopPropagation()}
                                style={{
                                  whiteSpace: 'nowrap',
                                  position: 'sticky',
                                  right: 0,
                                  background: '#111219',
                                  zIndex: 9,
                                  borderLeft: '1px solid var(--glass-border)'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setHiringFromEvaluation(ev);
                                      setHireError("");
                                      setHireDialogOpen(true);
                                    }}
                                    className="glow-btn"
                                    style={{
                                      height: '28px',
                                      boxSizing: 'border-box',
                                      padding: '4px 10px',
                                      fontSize: '0.8rem',
                                      background: 'rgba(52,211,153,0.12)',
                                      border: '1px solid rgba(52,211,153,0.4)',
                                      color: '#34d399',
                                      fontWeight: 600,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    {t.hireBtn}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={evaluationSchemaItems.length + 3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{t.noEvaluations}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* EMPLOYEES TAB */}
          {activeTab === 'employees' && (
            selectedEmployee ? (
              <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
                  <button onClick={() => { setSelectedEmployee(null); setIsEditingEmployee(false); }} className="glow-btn" style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}>
                    {t.backToEmployees}
                  </button>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)', margin: 0 }}>
                    {t.detailedEmployee} {selectedEmployee.full_name}
                  </h3>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {!isEditingEmployee ? (
                      <button
                        onClick={handleStartEditEmployee}
                        className="glow-btn"
                        style={{ padding: '6px 14px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.5)', color: '#60a5fa', fontWeight: 600 }}
                      >
                        ✏️ Edit Profile
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsEditingEmployee(false)}
                        className="glow-btn"
                        style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={() => handleDismissEmployee(selectedEmployee.id, selectedEmployee.full_name)}
                      className="glow-btn"
                      style={{ padding: '6px 14px', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', fontWeight: 600 }}
                    >
                      🚫 {t.dismissBtn}
                    </button>
                  </div>
                </div>

                {isEditingEmployee ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {updateEmployeeError && (
                      <div style={{ color: '#fca5a5', fontSize: '0.85rem', background: 'rgba(239,68,68,0.08)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)' }}>
                        ⚠ {updateEmployeeError}
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input
                          type="text"
                          className="select-input"
                          value={editEmployeeFields.full_name || ""}
                          onChange={(e) => setEditEmployeeFields(prev => ({ ...prev, full_name: e.target.value }))}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="select-input"
                          value={editEmployeeFields.email || ""}
                          onChange={(e) => setEditEmployeeFields(prev => ({ ...prev, email: e.target.value }))}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input
                          type="text"
                          className="select-input"
                          value={editEmployeeFields.phone || ""}
                          onChange={(e) => setEditEmployeeFields(prev => ({ ...prev, phone: e.target.value }))}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Position</label>
                        <select
                          className="select-input"
                          value={editEmployeeFields.position || ""}
                          onChange={(e) => setEditEmployeeFields(prev => ({ ...prev, position: e.target.value }))}
                          style={{ width: '100%', height: '38px' }}
                        >
                          {dbPositions.map(pos => (
                            <option key={pos.code} value={pos.code}>{pos.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Japanese Level</label>
                        <select
                          className="select-input"
                          value={editEmployeeFields.japanese_level || "None"}
                          onChange={(e) => setEditEmployeeFields(prev => ({ ...prev, japanese_level: e.target.value }))}
                          style={{ width: '100%', height: '38px' }}
                        >
                          <option value="None">None</option>
                          <option value="N5">N5</option>
                          <option value="N4">N4</option>
                          <option value="N3">N3</option>
                          <option value="N2">N2</option>
                          <option value="N1">N1</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Years Experience</label>
                        <input
                          type="number"
                          step="0.5"
                          className="select-input"
                          value={editEmployeeFields.years_experience ?? 0}
                          onChange={(e) => setEditEmployeeFields(prev => ({ ...prev, years_experience: e.target.value }))}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Tech Stack (comma separated)</label>
                        <input
                          type="text"
                          className="select-input"
                          value={editEmployeeFields.tech_stack || ""}
                          onChange={(e) => setEditEmployeeFields(prev => ({ ...prev, tech_stack: e.target.value }))}
                          style={{ width: '100%' }}
                        />
                      </div>

                      {/* Custom schema fields form */}
                      {employeeSchemaItems.map(item => {
                        const label = item.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                        const isMultiline = item.type === "array of strings" || item.type === "string";

                        return (
                          <div key={item.key} className="form-group" style={{ gridColumn: isMultiline ? '1 / -1' : undefined }}>
                            <label className="form-label">{label}</label>
                            {item.type === "array of strings" ? (
                              <textarea
                                className="text-area"
                                rows={4}
                                placeholder="One item per line..."
                                value={editEmployeeFields[item.key] || ""}
                                onChange={(e) => setEditEmployeeFields(prev => ({ ...prev, [item.key]: e.target.value }))}
                                style={{ width: '100%' }}
                              />
                            ) : item.type === "select option (enum)" ? (
                              <select
                                className="select-input"
                                value={editEmployeeFields[item.key] || ""}
                                onChange={(e) => setEditEmployeeFields(prev => ({ ...prev, [item.key]: e.target.value }))}
                                style={{ width: '100%', height: '38px' }}
                              >
                                <option value="">-- Choose --</option>
                                {item.enumOptions ? item.enumOptions.split(",").map(opt => opt.trim()).map((opt, i) => (
                                  <option key={i} value={opt}>{opt}</option>
                                )) : null}
                              </select>
                            ) : item.type === "integer" ? (
                              <input
                                type="number"
                                className="select-input"
                                value={editEmployeeFields[item.key] ?? ""}
                                onChange={(e) => setEditEmployeeFields(prev => ({ ...prev, [item.key]: e.target.value }))}
                                style={{ width: '100%' }}
                              />
                            ) : (
                              <input
                                type="text"
                                className="select-input"
                                value={editEmployeeFields[item.key] || ""}
                                onChange={(e) => setEditEmployeeFields(prev => ({ ...prev, [item.key]: e.target.value }))}
                                style={{ width: '100%' }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                      <button
                        onClick={() => setIsEditingEmployee(false)}
                        className="glow-btn"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}
                        disabled={isUpdatingEmployee}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEmployee}
                        className="glow-btn"
                        style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.5)', color: '#34d399', fontWeight: 600 }}
                        disabled={isUpdatingEmployee}
                      >
                        {isUpdatingEmployee ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Top stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                      {[
                        { label: 'ID', val: selectedEmployee.id },
                        { label: t.hiredAt, val: selectedEmployee.hired_at ? new Date(selectedEmployee.hired_at).toLocaleDateString() : '—' },
                        { label: 'Position', val: selectedEmployee.position || '—' },
                        { label: 'Japanese', val: selectedEmployee.japanese_level || '—' },
                        { label: 'Experience', val: selectedEmployee.years_experience != null ? `${selectedEmployee.years_experience}y` : '—' },
                      ].map(({ label, val }) => (
                        <div key={label} className="glass" style={{ padding: '12px', textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>{val}</div>
                        </div>
                      ))}
                    </div>

                    {/* Tech Stack */}
                    {Array.isArray(selectedEmployee.tech_stack) && selectedEmployee.tech_stack.length > 0 && (
                      <div className="glass" style={{ padding: '16px' }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '10px', textTransform: 'uppercase' }}>Tech Stack</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {selectedEmployee.tech_stack.map((tech, i) => (
                            <span key={i} className="badge" style={{ fontSize: '0.78rem', padding: '3px 10px' }}>{tech}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* All schema fields - line-by-line list */}
                    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h4 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                        📋 Internal HR Profile Details (Schema fields)
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {employeeSchemaItems.map((item, idx) => {
                          const raw = selectedEmployee.raw_employee || {};
                          const val = raw[item.key] ?? selectedEmployee[item.key];
                          if (val === undefined || val === null || val === '') return null;

                          const label = item.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

                          const isArray = Array.isArray(val);

                          return (
                            <div key={item.key} style={{
                              display: 'flex',
                              flexDirection: 'column',
                              padding: '14px 16px',
                              borderBottom: '1px solid rgba(255,255,255,0.05)',
                              background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'
                            }}>
                              <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                                {label}
                              </span>
                              {isArray ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                                  {val.map((arrItem, i) => (
                                    <span key={i} className="tech-tag" style={{ margin: 0 }}>
                                      {typeof arrItem === 'object' ? JSON.stringify(arrItem) : String(arrItem)}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.9rem', color: '#fff', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                  {String(val)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="glass" style={{ padding: '24px' }}>
                {/* List header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <h3 className="panel-title" style={{ margin: 0 }}>👥 {t.employeeList}</h3>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <label 
                      className="glow-btn" 
                      style={{ padding: '7px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.35)', color: '#818cf8' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                      Nhập từ Excel
                      <input 
                        type="file" 
                        accept=".xlsx, .xls, .csv" 
                        onChange={handleEmployeesExcelImport} 
                        style={{ display: 'none' }} 
                      />
                    </label>
                    <button
                      onClick={exportEmployeesToExcel}
                      className="glow-btn"
                      disabled={employees.length === 0}
                      style={{ padding: '7px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.35)', color: '#34d399' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                      {t.exportEmployees}
                    </button>
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  {(() => {
                    const nameItem = employeeSchemaItems.find(item => item.key.toLowerCase().includes("name"));
                    const otherItems = employeeSchemaItems.filter(item => !item.key.toLowerCase().includes("name"));
                    const orderedItems = nameItem ? [nameItem, ...otherItems] : employeeSchemaItems;

                    return (
                      <table className="data-table">
                        <thead>
                          <tr>
                            {orderedItems.map((item, idx) => {
                              const isFirst = idx === 0;
                              return (
                                <th
                                  key={item.key}
                                  style={{
                                    whiteSpace: 'nowrap',
                                    position: isFirst ? 'sticky' : undefined,
                                    left: isFirst ? 0 : undefined,
                                    background: isFirst ? '#111219' : undefined,
                                    zIndex: isFirst ? 10 : undefined,
                                    borderRight: isFirst ? '1px solid var(--glass-border)' : undefined
                                  }}
                                >
                                  {item.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                </th>
                              );
                            })}
                            <th style={{ whiteSpace: 'nowrap' }}>Hired At</th>
                            <th
                              style={{
                                whiteSpace: 'nowrap',
                                position: 'sticky',
                                right: 0,
                                background: '#111219',
                                zIndex: 10,
                                borderLeft: '1px solid var(--glass-border)'
                              }}
                            >
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {employees.length > 0 ? (
                            employees.map((emp, idx) => (
                              <tr key={idx} className="clickable-row" onClick={() => setSelectedEmployee(emp)} style={{ cursor: 'pointer' }}>
                                {orderedItems.map((item, colIdx) => {
                                  const raw = emp.raw_employee || {};
                                  const val = raw[item.key] ?? emp[item.key];
                                  const isFirst = colIdx === 0;

                                  return (
                                    <td
                                      key={item.key}
                                      style={{
                                        fontSize: '0.85rem',
                                        color: isFirst ? 'var(--primary)' : 'var(--text-secondary)',
                                        fontWeight: isFirst ? 600 : undefined,
                                        maxWidth: '220px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        position: isFirst ? 'sticky' : undefined,
                                        left: isFirst ? 0 : undefined,
                                        background: isFirst ? '#111219' : undefined,
                                        zIndex: isFirst ? 9 : undefined,
                                        borderRight: isFirst ? '1px solid var(--glass-border)' : undefined
                                      }}
                                    >
                                      {Array.isArray(val) ? val.join(", ") : (val !== undefined && val !== null ? String(val) : "—")}
                                    </td>
                                  );
                                })}
                                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                  {emp.hired_at ? new Date(emp.hired_at).toLocaleDateString() : '—'}
                                </td>
                                <td
                                  onClick={e => e.stopPropagation()}
                                  style={{
                                    whiteSpace: 'nowrap',
                                    position: 'sticky',
                                    right: 0,
                                    background: '#111219',
                                    zIndex: 9,
                                    borderLeft: '1px solid var(--glass-border)'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button
                                      onClick={() => handleDismissEmployee(emp.id, emp.full_name)}
                                      className="glow-btn"
                                      style={{
                                        height: '28px',
                                        boxSizing: 'border-box',
                                        padding: '4px 10px',
                                        fontSize: '0.75rem',
                                        background: 'rgba(239,68,68,0.08)',
                                        border: '1px solid rgba(239,68,68,0.3)',
                                        color: '#f87171',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                    >
                                      🚫 {t.dismissBtn}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={orderedItems.length + 2} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{t.noEmployees}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              </div>
            )
          )}

          {/* SCHEMA CONFIG TAB */}
          {activeTab === 'schema_config' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
              {/* Sub tab navigation */}
              <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', overflowX: 'auto' }}>
                <button
                  onClick={() => setActiveSchemaSubTab("candidate")}
                  className={`glow-btn ${activeSchemaSubTab === 'candidate' ? 'active' : ''}`}
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    background: activeSchemaSubTab === 'candidate' ? 'rgba(129,140,248,0.1)' : 'rgba(255,255,255,0.02)',
                    border: activeSchemaSubTab === 'candidate' ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                    color: activeSchemaSubTab === 'candidate' ? 'var(--primary)' : 'var(--text-secondary)'
                  }}
                >
                  📄 {t.cvSchemaEditor}
                </button>
                <button
                  onClick={() => setActiveSchemaSubTab("evaluation")}
                  className={`glow-btn ${activeSchemaSubTab === 'evaluation' ? 'active' : ''}`}
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    background: activeSchemaSubTab === 'evaluation' ? 'rgba(129,140,248,0.1)' : 'rgba(255,255,255,0.02)',
                    border: activeSchemaSubTab === 'evaluation' ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                    color: activeSchemaSubTab === 'evaluation' ? 'var(--primary)' : 'var(--text-secondary)'
                  }}
                >
                  📊 {t.evalSchemaEditor}
                </button>
                <button
                  onClick={() => setActiveSchemaSubTab("employee")}
                  className={`glow-btn ${activeSchemaSubTab === 'employee' ? 'active' : ''}`}
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    background: activeSchemaSubTab === 'employee' ? 'rgba(129,140,248,0.1)' : 'rgba(255,255,255,0.02)',
                    border: activeSchemaSubTab === 'employee' ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                    color: activeSchemaSubTab === 'employee' ? 'var(--primary)' : 'var(--text-secondary)'
                  }}
                >
                  👥 {t.employeeSchemaEditor}
                </button>
              </div>

              {/* Sub tab content */}
              {activeSchemaSubTab === 'candidate' && (
                <div style={{ width: '100%' }}>
                  {renderSchemaEditor(
                    candidateSchemaItems,
                    setCandidateSchemaItems,
                    handleSaveCandidateSchema,
                    t.cvSchemaEditor,
                    t.cvSchemaDesc
                  )}
                </div>
              )}

              {activeSchemaSubTab === 'evaluation' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start', width: '100%' }}>
                  {/* Position Manager */}
                  <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 className="panel-title" style={{ margin: 0 }}>💼 {t.positionList}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                      {dbPositions.length > 0 ? (
                        dbPositions.map((pos) => (
                          <div key={pos.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                            <div>
                              <strong style={{ color: 'var(--primary)', marginRight: '8px' }}>{pos.code}</strong>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{pos.name}</span>
                            </div>
                            <button
                              onClick={() => handleDeletePosition(pos.code)}
                              className="glow-btn"
                              style={{ padding: '2px 8px', fontSize: '0.75rem', background: 'var(--danger)', border: 'none' }}
                            >
                              {t.delete}
                            </button>
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>No positions found.</div>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h4 style={{ fontSize: '0.9rem', margin: 0 }}>➕ {t.addPosition}</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <input
                            type="text"
                            placeholder={t.positionCode}
                            value={newPositionCode}
                            onChange={(e) => setNewPositionCode(e.target.value)}
                            className="text-input"
                            style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px' }}
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <input
                            type="text"
                            placeholder={t.positionName}
                            value={newPositionName}
                            onChange={(e) => setNewPositionName(e.target.value)}
                            className="text-input"
                            style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px' }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleAddPosition}
                        className="glow-btn"
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        {t.addPosition}
                      </button>
                    </div>
                  </div>

                  {/* Scorecard Editor */}
                  <div style={{ flexGrow: 1 }}>
                    {renderSchemaEditor(
                      evaluationSchemaItems,
                      setEvaluationSchemaItems,
                      handleSaveEvaluationSchema,
                      t.evalSchemaEditor,
                      t.evalSchemaDesc,
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {t.selectPositionToEdit}
                        </label>
                        <select
                          value={selectedEditPosition}
                          onChange={(e) => handleEditPositionChange(e.target.value)}
                          className="select-input"
                          style={{ width: '100%', height: '34px', fontSize: '0.85rem', padding: '0 10px' }}
                        >
                          <option value="">-- Default Evaluation Schema (Fallback) --</option>
                          {dbPositions.map(pos => (
                            <option key={pos.code} value={pos.code}>{pos.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeSchemaSubTab === 'employee' && (
                <div style={{ width: '100%' }}>
                  {renderSchemaEditor(
                    employeeSchemaItems,
                    setEmployeeSchemaItems,
                    handleSaveEmployeeSchema,
                    t.employeeSchemaEditor,
                    t.employeeSchemaDesc
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── AUTOMATION FORM SETTINGS TAB ──────────────────────────────── */}
          {activeTab === 'automation_form_settings' && (
            <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Header */}
              <div className="glass" style={{ padding: '20px 24px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)', border: '1px solid rgba(99,102,241,0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg fill="none" stroke="#fff" viewBox="0 0 24 24" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Cấu hình Form Automation (BA / PM / SE)</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Cấu hình danh sách tiêu chí form cho từng vị trí hoặc tự động parse từ Hirec URL</div>
                  </div>
                </div>
              </div>

              {/* Sub-tabs: BA | PM | SE */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {['BA', 'PM', 'SE'].map(ft => (
                  <button
                    key={ft}
                    onClick={() => {
                      setAutoFormTab(ft);
                      setParsedElements(null);
                      setStructureSaveSuccess('');
                      if (formStructures?.[ft]) {
                        setRawJsonStructure(JSON.stringify(formStructures[ft]?.elements || [], null, 2));
                      } else {
                        setRawJsonStructure('[]');
                      }
                    }}
                    style={{
                      flex: 1, padding: '10px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem',
                      background: autoFormTab === ft ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--surface-secondary)',
                      color: autoFormTab === ft ? '#fff' : 'var(--text-muted)',
                      border: autoFormTab === ft ? 'none' : '1px solid var(--glass-border)',
                      cursor: 'pointer', transition: 'all 0.2s ease',
                    }}
                  >
                    Form {ft}
                    {formStructures?.[ft]?.elements?.length > 0 && (
                      <span style={{ marginLeft: '8px', fontSize: '0.72rem', opacity: 0.85, background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '10px' }}>
                        {formStructures?.[ft]?.elements?.length} fields
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Status Message */}
              {structureSaveSuccess && (
                <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399', padding: '12px 16px', borderRadius: '10px', fontSize: '0.85rem' }}>
                  ✅ {structureSaveSuccess}
                </div>
              )}

              {/* Card 1: Parse from URL */}
              <div className="glass" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🔍 Tự động Parse Cấu Trúc Form từ Hirec URL (Cho Form {autoFormTab})
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ marginBottom: '6px', display: 'block', fontSize: '0.8rem' }}>URL Form Hirec live</label>
                  <input type="url" className="text-input" style={{ width: '100%', fontSize: '0.82rem', fontFamily: 'monospace' }}
                    placeholder="https://app.hirec.vn/feedback/..." value={parseUrl} onChange={e => setParseUrl(e.target.value)} disabled={parsingForm} />
                </div>

                {/* Cookies for Parse */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Cookies xác thực (Hirec)</div>
                  <input type="text" className="text-input" style={{ fontSize: '0.72rem', fontFamily: 'monospace' }} placeholder="Cookie: .AspNetCore.Antiforgery..." value={parseCookieAntiforgery} onChange={e => setParseCookieAntiforgery(e.target.value)} />
                  <input type="text" className="text-input" style={{ fontSize: '0.72rem', fontFamily: 'monospace' }} placeholder="Cookie: idsrv..." value={parseCookieIdsrv} onChange={e => setParseCookieIdsrv(e.target.value)} />
                  <input type="text" className="text-input" style={{ fontSize: '0.72rem', fontFamily: 'monospace' }} placeholder="Cookie: idsrv.session..." value={parseCookieIdsrvSession} onChange={e => setParseCookieIdsrvSession(e.target.value)} />
                </div>

                <button className="glow-btn" disabled={parsingForm || !parseUrl.trim()}
                  onClick={async () => {
                    setParsingForm(true);
                    setParsedElements(null);
                    setStructureSaveSuccess('');
                    try {
                      const res = await fetch(`${API_BASE}/automation/parse-form-url`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          url: parseUrl.trim(),
                          cookie_antiforgery: parseCookieAntiforgery.trim(),
                          cookie_idsrv: parseCookieIdsrv.trim(),
                          cookie_idsrv_session: parseCookieIdsrvSession.trim(),
                        }),
                      });
                      const data = await res.json();
                      if (data.success && data.elements) {
                        setParsedElements(data.elements);
                      } else {
                        alert(`❌ Parse thất bại: ${data.error || 'Unknown error'}`);
                      }
                    } catch (err) {
                      alert(`❌ Error: ${err.message}`);
                    } finally {
                      setParsingForm(false);
                    }
                  }}
                  style={{ justifyContent: 'center', padding: '10px 20px', fontSize: '0.88rem', fontWeight: 700 }}
                >
                  {parsingForm ? '⏳ Đang parse form HTML...' : `🔍 Parse Cấu Trúc Form ${autoFormTab}`}
                </button>

                {/* Parsed Elements Preview */}
                {parsedElements && (
                  <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#a78bfa' }}>
                        📋 Đã trích xuất được {parsedElements.length} elements từ URL
                      </div>
                      <button className="glow-btn"
                        onClick={async () => {
                          try {
                            const res = await fetch(`${API_BASE}/automation/form-structures/${autoFormTab}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ elements: parsedElements, label: `${autoFormTab} Form` }),
                            });
                            const d = await res.json();
                            if (d.success) {
                              setFormStructures(prev => ({ ...prev, [autoFormTab]: d.data }));
                              setRawJsonStructure(JSON.stringify(parsedElements, null, 2));
                              setParsedElements(null);
                              setStructureSaveSuccess(`Đã lưu cấu hình mới cho Form ${autoFormTab}!`);
                            }
                          } catch (e) {
                            alert(`Lỗi lưu: ${e.message}`);
                          }
                        }}
                        style={{ padding: '8px 16px', fontSize: '0.8rem', background: '#34d399', border: 'none', color: '#000' }}
                      >
                        ✅ Review OK — Lưu Đè Lên Form {autoFormTab}
                      </button>
                    </div>

                    <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {parsedElements.map((el, i) => (
                        <div key={i} style={{ fontSize: '0.75rem', fontFamily: 'monospace', padding: '4px 8px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', display: 'flex', gap: '10px' }}>
                          <span style={{ color: '#818cf8', minWidth: '70px' }}>[{el.tag}]</span>
                          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{el.id}</span>
                          {el.childInputs?.length > 0 && <span style={{ color: '#94a3b8' }}>({el.childInputs.length} options)</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card 2: Manual JSON Editor */}
              <div className="glass" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    ⚙️ Chỉnh sửa JSON Cấu Trúc Form {autoFormTab} Thủ Công
                  </div>
                  <button className="glow-btn"
                    onClick={async () => {
                      try {
                        const parsed = JSON.parse(rawJsonStructure);
                        const res = await fetch(`${API_BASE}/automation/form-structures/${autoFormTab}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ elements: parsed, label: `${autoFormTab} Form` }),
                        });
                        const d = await res.json();
                        if (d.success) {
                          setFormStructures(prev => ({ ...prev, [autoFormTab]: d.data }));
                          setStructureSaveSuccess(`Đã lưu JSON cấu hình cho Form ${autoFormTab}!`);
                        }
                      } catch (e) {
                        alert(`JSON không hợp lệ: ${e.message}`);
                      }
                    }}
                    style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                  >
                    💾 Lưu JSON {autoFormTab}
                  </button>
                </div>
                <textarea className="text-input" style={{ width: '100%', minHeight: '220px', fontSize: '0.75rem', fontFamily: 'monospace', lineHeight: '1.4' }}
                  value={rawJsonStructure} onChange={e => setRawJsonStructure(e.target.value)} />
              </div>

            </div>
          )}

          {/* ─── HIRECT AUTOMATION TAB ─────────────────────────────────────── */}
          {activeTab === 'hirect_automation' && (
            <div style={{ maxWidth: '920px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="glass" style={{ padding: '20px 24px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)', border: '1px solid rgba(99,102,241,0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg fill="none" stroke="#fff" viewBox="0 0 24 24" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Hirect Form Automation</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Tự động điền form Hirec bằng AI hoặc JSON payload</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {[1, 2, 3].map(s => (
                      <div key={s} style={{
                        width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.78rem', fontWeight: 700,
                        background: hirecStep >= s ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--surface-secondary)',
                        color: hirecStep >= s ? '#fff' : 'var(--text-muted)',
                      }}>{s}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* STEP 1: Input */}
              {hirecStep === 1 && (() => {
                const hasRequiredCookies = hirecCookieIdsrv.trim() !== '' && hirecCookieIdsrvSession.trim() !== '';

                return (
                  <div className="glass" style={{ padding: '28px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                      Bước 1: Chọn loại form &amp; Nhập dữ liệu
                    </div>

                    {/* Form Type & Input Mode Selectors */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      {/* Form Type */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ marginBottom: '6px', display: 'block', fontSize: '0.8rem', fontWeight: 700 }}>
                          📋 Loại Form Hirec
                        </label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {['BA', 'PM', 'SE'].map(ft => (
                            <button key={ft} type="button" onClick={() => setHirecFormType(ft)}
                              style={{
                                flex: 1, padding: '8px 0', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700,
                                background: hirecFormType === ft ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--surface-secondary)',
                                color: hirecFormType === ft ? '#fff' : 'var(--text-muted)',
                                border: hirecFormType === ft ? 'none' : '1px solid var(--glass-border)',
                                cursor: 'pointer', transition: 'all 0.2s ease',
                              }}
                            >
                              Form {ft}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Input Mode */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ marginBottom: '6px', display: 'block', fontSize: '0.8rem', fontWeight: 700 }}>
                          ⚙️ Chế độ Nhập Nhận xét
                        </label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {[
                            { id: 'text', label: '📝 Nhận xét Text' },
                            { id: 'json', label: '{ } Nhập JSON trực tiếp' },
                          ].map(m => (
                            <button key={m.id} type="button" onClick={() => setHirecInputMode(m.id)}
                              style={{
                                flex: 1, padding: '8px 0', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700,
                                background: hirecInputMode === m.id ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--surface-secondary)',
                                color: hirecInputMode === m.id ? '#fff' : 'var(--text-muted)',
                                border: hirecInputMode === m.id ? 'none' : '1px solid var(--glass-border)',
                                cursor: 'pointer', transition: 'all 0.2s ease',
                              }}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* URL Input */}
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>🔗 {t.hirecUrl || 'URL Form Hirect'} <span style={{ color: '#f87171' }}>*</span></label>
                      <input id="hirec-url-input" type="url" className="text-input"
                        style={{ width: '100%', fontSize: '0.88rem', fontFamily: 'monospace' }}
                        placeholder={t.hirecUrlPlaceholder || 'https://app.hirec.vn/feedback/interview-scheduled/...'}
                        value={hirecUrl} onChange={e => setHirecUrl(e.target.value)}
                        disabled={hirecGenerating || hirecRunning}
                      />
                    </div>

                    {/* Text Mode Input */}
                    {hirecInputMode === 'text' && (
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>💬 {t.hirecComment || 'Nhận xét tổng quan'} <span style={{ color: '#f87171' }}>*</span></label>
                        <textarea id="hirec-comment-input" className="text-input"
                          style={{ width: '100%', minHeight: '140px', fontSize: '0.88rem', resize: 'vertical', lineHeight: '1.7' }}
                          placeholder={`Nhập nhận xét tổng quan ứng viên ${hirecFormType}... AI sẽ tự động tạo payload JSON.`}
                          value={hirecComment} onChange={e => setHirecComment(e.target.value)}
                          disabled={hirecGenerating}
                        />
                      </div>
                    )}

                    {/* JSON Mode Input */}
                    {hirecInputMode === 'json' && (
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>{`{ }`} Dán JSON Payload Trực Tiếp <span style={{ color: '#f87171' }}>*</span></label>
                        <textarea id="hirec-json-input" className="text-input"
                          style={{ width: '100%', minHeight: '180px', fontSize: '0.78rem', fontFamily: 'monospace', resize: 'vertical', lineHeight: '1.4' }}
                          placeholder={`{\n  "Japanese_Listening": { "value": "N2", "reason": "Nói lưu khoát và phản xạ tự nhiên" },\n  "Conclusion": "Ứng viên rất phù hợp với vị trí này"\n}`}
                          value={hirecDirectJson} onChange={e => setHirecDirectJson(e.target.value)}
                          disabled={hirecRunning}
                        />
                      </div>
                    )}

                    {/* Cookies Section */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <svg fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24" width="15" height="15"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.hirecCookies || 'Cookie xác thực'}</span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#34d399', fontStyle: 'italic', fontWeight: 600 }}>💾 Tự động lưu local (riêng biệt từng máy)</span>
                      </div>

                      {[
                        { id: 'hirec-cookie-antiforgery', label: t.hirecCookieAntiforgery || '.AspNetCore.Antiforgery', value: hirecCookieAntiforgery, setter: setHirecCookieAntiforgery, rows: 2, required: false },
                        { id: 'hirec-cookie-idsrv', label: t.hirecCookieIdsrv || 'idsrv', value: hirecCookieIdsrv, setter: setHirecCookieIdsrv, rows: 3, required: true },
                        { id: 'hirec-cookie-idsrv-session', label: t.hirecCookieIdsrvSession || 'idsrv.session', value: hirecCookieIdsrvSession, setter: setHirecCookieIdsrvSession, rows: 2, required: true },
                      ].map(({ id, label, value, setter, rows, required }) => (
                        <div key={id} className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ marginBottom: '5px', display: 'block', fontSize: '0.76rem', opacity: 0.85, fontWeight: 600 }}>
                            {label} {required ? <span style={{ color: '#f87171' }}>*</span> : <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 400 }}>(tùy chọn)</span>}
                          </label>
                          <textarea id={id} className="text-input"
                            style={{ width: '100%', minHeight: `${rows * 28}px`, fontSize: '0.72rem', fontFamily: 'monospace', resize: 'vertical', lineHeight: '1.4', borderColor: (required && !value.trim()) ? '#f87171' : '' }}
                            placeholder={t.hirecCookiePlaceholder || 'Dán giá trị cookie...'}
                            value={value} onChange={e => setter(e.target.value)}
                            disabled={hirecGenerating || hirecRunning}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Mandatory Cookie Warning Banner */}
                    {!hasRequiredCookies && (
                      <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '10px', padding: '10px 14px', fontSize: '0.78rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        ⚠️ Vui lòng nhập đầy đủ 2 Cookie xác thực bắt buộc (idsrv, idsrv.session) để chạy automation!
                      </div>
                    )}

                    {/* Action Button: Text Mode -> AI Generate, JSON Mode -> Run Directly */}
                    {hirecInputMode === 'text' ? (
                      <button id="hirec-generate-btn" className="glow-btn"
                        disabled={hirecGenerating || !hirecUrl.trim() || !hirecComment.trim() || !hasRequiredCookies}
                        onClick={async () => {
                          if (!hasRequiredCookies) return;
                          setHirecGenerating(true);
                          setJsonValidationErrors([]);
                          try {
                            const resp = await fetch(`${API_BASE}/automation/hirec-generate`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ comment: hirecComment.trim(), form_type: hirecFormType, lang: language }),
                            });
                            const data = await resp.json();
                            if (data.success && data.payload) {
                              setHirecPayload(data.payload);
                              setMissingFieldsList(data.missing_fields || []);
                              setShortReasonFieldsList(data.short_reason_fields || []);
                              setHirecStep(2);
                            } else {
                              setHirecResult({ success: false, error: data.error || 'Generate thất bại' });
                            }
                          } catch (err) {
                            setHirecResult({ success: false, error: err.message });
                          } finally {
                            setHirecGenerating(false);
                          }
                        }}
                        style={{
                          width: '100%', justifyContent: 'center', padding: '13px 24px',
                          fontSize: '0.95rem', fontWeight: 700,
                          background: (hirecGenerating || !hasRequiredCookies) ? 'var(--surface-secondary)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          border: 'none', opacity: (hirecGenerating || !hirecUrl.trim() || !hirecComment.trim() || !hasRequiredCookies) ? 0.55 : 1,
                          cursor: hasRequiredCookies ? 'pointer' : 'not-allowed',
                        }}
                      >
                        {hirecGenerating ? 'AI đang phân tích & generate payload...' : `✨ AI Generate Form ${hirecFormType} Payload`}
                      </button>
                    ) : (
                      <button id="hirec-run-json-btn" className="glow-btn"
                        disabled={hirecRunning || !hirecUrl.trim() || !hirecDirectJson.trim() || !hasRequiredCookies}
                        onClick={async () => {
                          if (!hasRequiredCookies) return;
                          setJsonValidationErrors([]);
                          let parsedPayload = {};
                          try {
                            parsedPayload = JSON.parse(hirecDirectJson);
                          } catch (e) {
                            setJsonValidationErrors([`Cú pháp JSON không đúng định dạng: ${e.message}`]);
                            return;
                          }

                          // Validate JSON against backend validator
                          try {
                            const vResp = await fetch(`${API_BASE}/automation/validate-json`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ form_type: hirecFormType, payload: parsedPayload }),
                            });
                            const vData = await vResp.json();
                            if (!vData.valid) {
                              setJsonValidationErrors(vData.errors || ["JSON payload không hợp lệ"]);
                              return;
                            }
                          } catch (e) {
                            console.error("Validation error", e);
                          }

                          setHirecRunning(true);
                          setHirecResult(null);
                          setHirecPayload(parsedPayload);
                          try {
                            const resp = await fetch(`${API_BASE}/automation/hirec-fill`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                url: hirecUrl.trim(),
                                comment: '',
                                cookie_antiforgery: hirecCookieAntiforgery.trim(),
                                cookie_idsrv: hirecCookieIdsrv.trim(),
                                cookie_idsrv_session: hirecCookieIdsrvSession.trim(),
                                form_type: hirecFormType,
                                payload: parsedPayload,
                              }),
                            });
                            const data = await resp.json();
                            setHirecResult(data);
                            setHirecStep(3);
                            fetchAutomationHistory();
                          } catch (err) {
                            setHirecResult({ success: false, error: err.message });
                            setHirecStep(3);
                          } finally {
                            setHirecRunning(false);
                          }
                        }}
                        style={{
                          width: '100%', justifyContent: 'center', padding: '13px 24px',
                          fontSize: '0.95rem', fontWeight: 700,
                          background: (hirecRunning || !hasRequiredCookies) ? 'var(--surface-secondary)' : 'linear-gradient(135deg, #10b981, #059669)',
                          border: 'none', opacity: (hirecRunning || !hirecUrl.trim() || !hirecDirectJson.trim() || !hasRequiredCookies) ? 0.55 : 1,
                          cursor: hasRequiredCookies ? 'pointer' : 'not-allowed',
                        }}
                      >
                        {hirecRunning ? 'Đang kiểm tra & chạy automation...' : `▶ Chạy Automation Ngay (2 bước)`}
                      </button>
                    )}

                    {/* Validation errors for JSON Mode */}
                    {jsonValidationErrors.length > 0 && (
                      <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.4)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f87171' }}>
                          ⚠️ Dữ liệu JSON chưa đáp ứng quy định của Hirec (Yêu cầu &gt; 20 ký tự cho lý do &amp; đúng cấu trúc):
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8rem', color: '#fca5a5', lineHeight: '1.6' }}>
                          {jsonValidationErrors.map((err, idx) => (
                            <li key={idx}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Error display */}
                    {hirecResult && !hirecResult.success && hirecStep === 1 && (
                      <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '10px', padding: '12px', fontSize: '0.83rem', color: '#f87171' }}>
                        ❌ {hirecResult.error}
                      </div>
                    )}

                    {/* 📜 History Section */}
                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          📜 Lịch sử Chạy Automation ({hirecHistory.length})
                        </div>
                        <button type="button" onClick={fetchAutomationHistory} style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.78rem', cursor: 'pointer' }}>
                          🔄 Làm mới
                        </button>
                      </div>

                      {hirecHistory.length === 0 ? (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa có lịch sử chạy nào.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                          {hirecHistory.map(item => (
                            <div key={item.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                              <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ color: item.success ? '#34d399' : '#f87171' }}>{item.success ? '✅ Success' : '❌ Failed'}</span>
                                  <span style={{ background: 'rgba(99,102,241,0.2)', color: '#a78bfa', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>Form {item.form_type || 'BA'}</span>
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{new Date(item.timestamp).toLocaleString()}</span>
                                </div>
                                <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {item.url}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                <button type="button" onClick={() => copyToClipboard(item.payload)}
                                  style={{ padding: '4px 8px', fontSize: '0.72rem', background: 'var(--surface-secondary)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: '#c9d1d9', cursor: 'pointer' }}>
                                  📋 Copy JSON
                                </button>
                                <button type="button" onClick={() => downloadJsonFile(item.payload, `hirec_history_${item.form_type}_${item.id}.json`)}
                                  style={{ padding: '4px 8px', fontSize: '0.72rem', background: 'var(--surface-secondary)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: '#c9d1d9', cursor: 'pointer' }}>
                                  ⬇ Download
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* STEP 2: Preview & Edit Payload */}
              {hirecStep === 2 && hirecPayload && (() => {
                const TEXT_KEYS = ['Plus point_Working location', 'Plus point_Experience of working in FSOFT (year)', 'Plus point_Valuable skill', 'Job rank Assessed_BA', 'Job rank Assessed_PM', 'Job rank Assessed_SE'];
                const TEXTAREA_KEYS = ['Conclusion', 'Note'];
                const radioKeys = Object.keys(hirecPayload).filter(k => !TEXT_KEYS.includes(k) && !TEXTAREA_KEYS.includes(k));

                const groupLabel = (k) => {
                  if (k.startsWith('Japanese_')) return '🇯🇵 Tiếng Nhật';
                  if (k.startsWith('English')) return '🇧🇺 Tiếng Anh';
                  if (k.startsWith('Academic') || k.startsWith('Educational') || k.startsWith('IT ') || k.startsWith('Working exp')) return '🎓 Học vấn & Kinh nghiệm';
                  if (k.startsWith('BA_')) return '💼 BA Skills';
                  if (k.startsWith('Management')) return '🔧 Management';
                  if (k.startsWith('Soft Skill')) return '🤝 Soft Skills';
                  return '📌 Khác';
                };

                const cleanKey = (str) => (str || '').replace(/__choose$/, '').replace(/_choose$/, '').replace(/_$/, '').trim();

                const getFieldOptions = (key) => {
                  const currentElements = formStructures[hirecFormType]?.elements || [];
                  const targetClean = cleanKey(key);
                  const found = currentElements.find(e => {
                    const elClean = cleanKey(e.id);
                    return elClean === targetClean;
                  });
                  return found?.childInputs || [];
                };

                // Real-time validation checks for step 2
                const missingValues = radioKeys.filter(k => {
                  const val = hirecPayload[k];
                  return typeof val === 'object' ? !val.value : !val;
                });

                const shortReasons = [];
                radioKeys.forEach(k => {
                  const val = hirecPayload[k];
                  const reason = typeof val === 'object' ? (val.reason || '') : '';
                  if (!reason || reason.trim().length < 20) {
                    shortReasons.push({ key: k, len: reason.trim().length });
                  }
                });

                TEXTAREA_KEYS.forEach(k => {
                  const val = hirecPayload[k] || '';
                  if (!val || val.trim().length < 20) {
                    shortReasons.push({ key: k, len: val.trim().length });
                  }
                });

                const canRunAutomation = missingValues.length === 0 && shortReasons.length === 0;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="glow-btn" onClick={() => { setHirecStep(1); setHirecResult(null); }}
                        style={{ flex: '0 0 auto', padding: '10px 18px', fontSize: '0.85rem', background: 'var(--surface-secondary)', border: '1px solid var(--glass-border)' }}>
                        ← Sửa lại Text
                      </button>
                      <button id="hirec-run-btn" className="glow-btn" disabled={hirecRunning || !canRunAutomation}
                        onClick={async () => {
                          if (!canRunAutomation) return;
                          setHirecRunning(true);
                          setHirecResult(null);
                          try {
                            const resp = await fetch(`${API_BASE}/automation/hirec-fill`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                url: hirecUrl.trim(),
                                comment: hirecComment.trim(),
                                cookie_antiforgery: hirecCookieAntiforgery.trim(),
                                cookie_idsrv: hirecCookieIdsrv.trim(),
                                cookie_idsrv_session: hirecCookieIdsrvSession.trim(),
                                form_type: hirecFormType,
                                payload: hirecPayload,
                              }),
                            });
                            const data = await resp.json();
                            setHirecResult(data);
                            setHirecStep(3);
                            fetchAutomationHistory();
                          } catch (err) {
                            setHirecResult({ success: false, error: err.message });
                            setHirecStep(3);
                          } finally {
                            setHirecRunning(false);
                          }
                        }}
                        style={{
                          flex: 1, justifyContent: 'center', padding: '10px 24px',
                          fontSize: '0.95rem', fontWeight: 700,
                          background: (hirecRunning || !canRunAutomation) ? 'var(--surface-secondary)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          border: 'none', opacity: (hirecRunning || !canRunAutomation) ? 0.5 : 1,
                          cursor: canRunAutomation ? 'pointer' : 'not-allowed'
                        }}
                      >
                        {hirecRunning ? 'Đang chạy automation...' : `▶ Chạy Automation Form ${hirecFormType}`}
                      </button>
                    </div>

                    {/* Warning Box 1: Missing Fields (Classifier detected insufficient info) */}
                    {missingValues.length > 0 && (
                      <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '12px', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          ⚠️ AI Classifier phát hiện thông tin nhận xét chưa cung cấp đủ cho {missingValues.length} mục (không bịa đặt thông tin):
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#fef3c7' }}>
                          Vui lòng chọn giá trị pulldown và nhập lý do (&ge; 20 ký tự) cho các mục bên dưới trước khi bấm chạy automation!
                        </div>
                      </div>
                    )}

                    {/* Warning Box 2: Short / Missing Reasons (< 20 chars) */}
                    {shortReasons.length > 0 && (
                      <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '12px', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          ⛔ Quy định Hirec: Lý do giải trình phải có ÍT NHẤT 20 KÝ TỰ ({shortReasons.length} mục chưa đạt):
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#fca5a5' }}>
                          {shortReasons.map(s => `${s.key} (${s.len}/20 ký tự)`).join(', ')}
                        </div>
                      </div>
                    )}

                    <div className="glass" style={{ padding: '20px', borderRadius: '14px', border: '1px solid rgba(99,102,241,0.2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          👁️ Preview payload do AI generate cho Form <strong>{hirecFormType}</strong>. Chọn giá trị &amp; nhập lý do trước khi chạy.
                        </div>
                        <button type="button" onClick={() => copyToClipboard(hirecPayload)}
                          style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'var(--surface-secondary)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: '#c9d1d9', cursor: 'pointer' }}>
                          📋 Copy JSON
                        </button>
                      </div>

                      {/* Fields Table */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                        {radioKeys.map(key => {
                          const v = hirecPayload[key] || {};
                          const isValueMissing = typeof v === 'object' ? !v.value : !v;
                          const reasonStr = typeof v === 'object' ? (v.reason || '') : '';
                          const isReasonMissing = !reasonStr.trim();
                          const isReasonShort = reasonStr.trim().length > 0 && reasonStr.trim().length < 20;

                          return (
                            <div key={key} style={{
                              display: 'grid', gridTemplateColumns: '220px 180px 1fr', gap: '8px', alignItems: 'start', padding: '8px 10px', borderRadius: '8px',
                              background: isValueMissing ? 'rgba(245,158,11,0.08)' : (isReasonShort || isReasonMissing ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.02)'),
                              border: isValueMissing ? '1px solid rgba(245,158,11,0.4)' : (isReasonShort || isReasonMissing ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--glass-border)'),
                            }}>
                              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', paddingTop: '6px', wordBreak: 'break-word' }}>
                                <span style={{ fontSize: '0.65rem', color: '#a78bfa', display: 'block', marginBottom: '2px' }}>{groupLabel(key)}</span>
                                {key}
                                {isValueMissing && <span style={{ color: '#fbbf24', fontSize: '0.68rem', display: 'block', fontWeight: 700 }}>⚠️ Chưa có dữ liệu</span>}
                              </div>
                              <div>
                                {(() => {
                                  const opts = getFieldOptions(key);
                                  const valStr = typeof v === 'object' ? (v.value || '') : (v || '');

                                  if (opts.length > 0) {
                                    return (
                                      <select className="text-input"
                                        style={{
                                          fontSize: '0.78rem', padding: '5px 8px', height: '32px', width: '100%',
                                          borderColor: isValueMissing ? '#fbbf24' : '',
                                          background: 'var(--surface-secondary)', color: valStr ? 'var(--text-primary)' : '#fbbf24',
                                          fontWeight: valStr ? 600 : 400
                                        }}
                                        value={valStr}
                                        onChange={e => setHirecPayload(prev => ({
                                          ...prev,
                                          [key]: typeof v === 'object' ? { ...prev[key], value: e.target.value } : e.target.value
                                        }))}
                                      >
                                        <option value="" style={{ color: 'var(--text-muted)' }}>-- Chọn giá trị --</option>
                                        {opts.map(opt => (
                                          <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                      </select>
                                    );
                                  }

                                  return (
                                    <input className="text-input" style={{ fontSize: '0.78rem', padding: '5px 8px', height: '32px', width: '100%', borderColor: isValueMissing ? '#fbbf24' : '' }}
                                      value={valStr}
                                      onChange={e => setHirecPayload(prev => ({
                                        ...prev,
                                        [key]: typeof v === 'object' ? { ...prev[key], value: e.target.value } : e.target.value
                                      }))}
                                      placeholder="Chọn/nhập giá trị..."
                                    />
                                  );
                                })()}
                              </div>
                              {typeof v === 'object' && (
                                <div>
                                  <textarea className="text-input" style={{ fontSize: '0.76rem', padding: '4px 8px', resize: 'vertical', minHeight: '32px', lineHeight: '1.4', width: '100%', borderColor: isReasonShort ? '#f87171' : (isReasonMissing ? '#fbbf24' : '') }}
                                    value={v.reason || ''}
                                    onChange={e => setHirecPayload(prev => ({ ...prev, [key]: { ...prev[key], reason: e.target.value } }))}
                                    placeholder="Nhập lý do đánh giá thủ công (bắt buộc ≥ 20 ký tự)..."
                                  />
                                  {isReasonMissing && (
                                    <div style={{ fontSize: '0.68rem', color: '#fbbf24', marginTop: '2px', fontWeight: 600 }}>
                                      ⚠️ Chưa có dữ liệu lý do (bắt buộc ≥ 20 ký tự)
                                    </div>
                                  )}
                                  {isReasonShort && (
                                    <div style={{ fontSize: '0.68rem', color: '#f87171', marginTop: '2px', fontWeight: 600 }}>
                                      ⚠️ {reasonStr.trim().length}/20 ký tự (Hirec yêu cầu &ge; 20 ký tự)
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Text inputs */}
                      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>📌 Plus Points</div>
                        {TEXT_KEYS.map(key => (
                          <div key={key} style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '8px', alignItems: 'center', padding: '6px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{key}</div>
                            <input className="text-input" style={{ fontSize: '0.78rem', padding: '5px 8px', height: '30px' }}
                              value={hirecPayload[key] || ''}
                              onChange={e => setHirecPayload(prev => ({ ...prev, [key]: e.target.value }))}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Conclusion + Note */}
                      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>📝 Tổng kết</div>
                        {TEXTAREA_KEYS.map(key => {
                          const valStr = hirecPayload[key] || '';
                          const isMissing = !valStr.trim();
                          const isShort = valStr.trim().length > 0 && valStr.trim().length < 20;

                          return (
                            <div key={key}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>{key}</label>
                                {isMissing && (
                                  <span style={{ fontSize: '0.68rem', color: '#fbbf24', fontWeight: 700 }}>
                                    ⚠️ Chưa có dữ liệu (bắt buộc &ge; 20 ký tự)
                                  </span>
                                )}
                                {isShort && (
                                  <span style={{ fontSize: '0.68rem', color: '#f87171', fontWeight: 700 }}>
                                    ⚠️ {valStr.trim().length}/20 ký tự (Hirec yêu cầu &ge; 20 ký tự)
                                  </span>
                                )}
                              </div>
                              <textarea className="text-input" style={{ width: '100%', fontSize: '0.82rem', minHeight: '70px', resize: 'vertical', lineHeight: '1.5', borderColor: isShort ? '#f87171' : (isMissing ? '#fbbf24' : '') }}
                                value={valStr}
                                onChange={e => setHirecPayload(prev => ({ ...prev, [key]: e.target.value }))}
                                placeholder={`Nhập ${key} (bắt buộc > 20 ký tự)...`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* STEP 3: Result */}
              {hirecStep === 3 && hirecResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <button className="glow-btn" onClick={() => { setHirecStep(1); setHirecResult(null); setHirecPayload(null); }}
                    style={{ alignSelf: 'flex-start', padding: '8px 16px', fontSize: '0.82rem', background: 'var(--surface-secondary)', border: '1px solid var(--glass-border)' }}>
                    ← Bắt đầu lại
                  </button>
                  <div className="glass" style={{
                    padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px',
                    border: `1px solid ${hirecResult.success ? 'rgba(52,211,153,0.35)' : 'rgba(248,113,113,0.35)'}`,
                    background: hirecResult.success ? 'rgba(52,211,153,0.06)' : 'rgba(248,113,113,0.06)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '1.8rem' }}>{hirecResult.success ? '✅' : '❌'}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: hirecResult.success ? '#34d399' : '#f87171' }}>
                          {hirecResult.success ? '✅ Automation hoàn thành!' : '❌ Có lỗi xảy ra'}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {hirecResult.message || hirecResult.error || ''}
                        </div>
                      </div>
                    </div>
                    {hirecResult.success && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>{hirecResult.filled ?? '—'}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Fields điền</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: (hirecResult.errors?.length > 0) ? '#f87171' : '#34d399' }}>{hirecResult.errors?.length ?? 0}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Lỗi</div>
                        </div>
                        {hirecResult.finalUrl && (
                          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px', gridColumn: '1 / -1' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px', textTransform: 'uppercase' }}>Final URL</div>
                            <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#93c5fd', wordBreak: 'break-all' }}>{hirecResult.finalUrl}</div>
                          </div>
                        )}
                      </div>
                    )}
                    {!hirecResult.success && hirecResult.error && (
                      <pre style={{ margin: 0, padding: '12px', background: '#0d1117', borderRadius: '8px', border: '1px solid #21262d', fontSize: '0.78rem', fontFamily: 'monospace', color: '#f87171', overflowY: 'auto', maxHeight: '150px', whiteSpace: 'pre-wrap' }}>
                        {hirecResult.error}
                      </pre>
                    )}
                    {hirecResult.logs && (
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Logs</div>
                        <pre style={{ margin: 0, padding: '12px', background: '#0d1117', borderRadius: '8px', border: '1px solid #21262d', fontSize: '0.74rem', fontFamily: 'monospace', color: '#c9d1d9', overflowY: 'auto', maxHeight: '180px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                          {hirecResult.logs}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}
          {/* ─── END HIRECT AUTOMATION TAB ──────────────────────────────────── */}

        </div>
      </main>
    </div>
  );
}

export default App;
