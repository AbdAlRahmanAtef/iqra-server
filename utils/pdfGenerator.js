const puppeteer = require("puppeteer");
const puppeteerCore = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

// HTML template for daily report
const generateDailyReportHTML = (sessions, date) => {
  const sessionRows = sessions
    .map(
      (session, index) => `
    <tr>
      <td>${index + 1}</td>
      <td class="font-bold">${session.student_name}</td>
      <td>${session.new_lesson}</td>
      <td><span class="badge badge-${getBadgeClass(session.level)}">${
        session.level
      }</span></td>
      <td>${session.review}</td>
      <td><span class="badge badge-${getBadgeClass(session.review_level)}">${
        session.review_level || "-"
      }</span></td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تقرير درس القرآن اليومي</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Cairo', sans-serif;
      direction: rtl;
      text-align: right;
      padding: 40px;
      background: #f8fafc;
      color: #1e293b;
      -webkit-print-color-adjust: exact;
    }
    
    .container {
      max-width: 100%;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 16px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 20px;
    }
    
    h1 {
      color: #0f172a;
      font-size: 24px;
      font-weight: 800;
      margin-bottom: 8px;
    }
    
    .date {
      color: #64748b;
      font-size: 14px;
      font-weight: 600;
    }

    .summary-card {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      padding: 12px 24px;
      border-radius: 12px;
      margin-bottom: 25px;
      display: inline-block;
      box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
    }

    .summary-text {
      font-size: 18px;
      font-weight: 700;
    }
    
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin-top: 10px;
    }
    
    thead {
      background-color: #f8fafc;
    }
    
    th {
      padding: 12px 16px;
      text-align: right;
      font-weight: 700;
      font-size: 12px;
      color: #475569;
      border-bottom: 2px solid #e2e8f0;
      white-space: nowrap;
    }

    th:first-child { border-top-right-radius: 8px; }
    th:last-child { border-top-left-radius: 8px; }
    
    td {
      padding: 12px 16px;
      text-align: right;
      border-bottom: 1px solid #f1f5f9;
      font-size: 13px;
      color: #334155;
      vertical-align: middle;
      word-break: keep-all;
    }
    
    tbody tr:last-child td {
      border-bottom: none;
    }
    
    tbody tr:nth-child(even) {
      background-color: #fcfcfc;
    }

    .font-bold {
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
    }
    
    .badge {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      display: inline-block;
      white-space: nowrap;
    }
    
    .badge-excellent { background: #dcfce7; color: #166534; }
    .badge-good { background: #dbeafe; color: #1e40af; }
    .badge-average { background: #fef3c7; color: #92400e; }
    .badge-weak { background: #fee2e2; color: #991b1b; }
    .badge-wait { background: #e0e7ff; color: #3730a3; }
    .badge-repeat { background: #fce7f3; color: #831843; }
    
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #94a3b8;
      font-size: 12px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📖 تقرير درس القرآن اليومي</h1>
      <p class="date">📅 التاريخ: ${date}</p>
    </div>

    <div style="text-align: center; display: flex; justify-content: center; gap: 20px;">
      <div class="summary-card">
        <span class="summary-text">إجمالي الحصص: ${sessions.length}</span>
      </div>
      <div class="summary-card">
        <span class="summary-text">إجمالي الطلاب: ${
          new Set(sessions.map((s) => s.student_name)).size
        }</span>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th style="width: 50px">#</th>
          <th>اسم الطالب</th>
          <th>الحفظ الجديد</th>
          <th>المستوى</th>
          <th>المراجعة</th>
          <th>المستوي</th>
        </tr>
      </thead>
      <tbody>
        ${sessionRows}
      </tbody>
    </table>
    
    <div class="footer">
      <p>نظام متابعة حلقات القرآن - تم الإنشاء بتاريخ ${new Date().toLocaleDateString(
        "ar-EG"
      )}</p>
    </div>
  </div>
</body>
</html>
  `;
};

// HTML template for monthly report
const generateMonthlyReportHTML = (sessions, month, studentName = null) => {
  const sessionRows = sessions
    .map((session, index) => {
      // Remove year from hijri date (assuming format ends with year)
      // Example: "10 Jumada Al-Akhirah 1447" -> "10 Jumada Al-Akhirah"
      const dateWithoutYear = session.date_hijri
        .replace(/\s\d{4}$/, "")
        .replace(/\s\d{4}.*$/, "");

      return `
    <tr>
      <td>${index + 1}</td>
      ${
        !studentName ? `<td class="font-bold">${session.student_name}</td>` : ""
      }
      <td>${dateWithoutYear}</td>
      <td>${session.new_lesson}</td>
      <td><span class="badge badge-${getBadgeClass(session.level)}">${
        session.level
      }</span></td>
      <td>${session.review}</td>
      <td><span class="badge badge-${getBadgeClass(session.review_level)}">${
        session.review_level || "-"
      }</span></td>
    </tr>
  `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>التقرير الشهري</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Cairo', sans-serif;
      direction: rtl;
      text-align: right;
      padding: 40px;
      background: #f8fafc;
      color: #1e293b;
      -webkit-print-color-adjust: exact;
    }
    
    .container {
      max-width: 100%;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 16px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 20px;
    }
    
    h1 {
      color: #4338ca;
      font-size: 24px;
      font-weight: 800;
      margin-bottom: 8px;
    }
    
    .subtitle {
      color: #64748b;
      font-size: 14px;
      font-weight: 600;
      margin-top: 4px;
    }

    .summary-card {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: white;
      padding: 12px 24px;
      border-radius: 12px;
      margin-bottom: 25px;
      display: inline-block;
      box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.3);
    }

    .summary-text {
      font-size: 18px;
      font-weight: 700;
    }
    
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin-top: 10px;
    }
    
    thead {
      background-color: #f8fafc;
    }
    
    th {
      padding: 12px 16px;
      text-align: right;
      font-weight: 700;
      font-size: 12px;
      color: #475569;
      border-bottom: 2px solid #e2e8f0;
      white-space: nowrap;
    }

    th:first-child { border-top-right-radius: 8px; }
    th:last-child { border-top-left-radius: 8px; }
    
    td {
      padding: 12px 16px;
      text-align: right;
      border-bottom: 1px solid #f1f5f9;
      font-size: 13px;
      color: #334155;
      vertical-align: middle;
      word-break: keep-all;
    }
    
    tbody tr:last-child td {
      border-bottom: none;
    }
    
    tbody tr:nth-child(even) {
      background-color: #fcfcfc;
    }

    .font-bold {
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
    }
    
    .badge {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      display: inline-block;
      white-space: nowrap;
    }
    
    .badge-excellent { background: #dcfce7; color: #166534; }
    .badge-good { background: #dbeafe; color: #1e40af; }
    .badge-average { background: #fef3c7; color: #92400e; }
    .badge-weak { background: #fee2e2; color: #991b1b; }
    .badge-wait { background: #e0e7ff; color: #3730a3; }
    .badge-repeat { background: #fce7f3; color: #831843; }
    
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #94a3b8;
      font-size: 12px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 التقرير الشهري</h1>
      <p class="subtitle">📅 ${month}</p>
      ${studentName ? `<p class="subtitle">👤 الطالب: ${studentName}</p>` : ""}
    </div>

    <div style="text-align: center; display: flex; justify-content: center; gap: 20px;">
      <div class="summary-card">
        <span class="summary-text">إجمالي الحصص: ${sessions.length}</span>
      </div>
      ${
        !studentName
          ? `
      <div class="summary-card">
        <span class="summary-text">إجمالي الطلاب: ${
          new Set(sessions.map((s) => s.student_name)).size
        }</span>
      </div>
      `
          : ""
      }
    </div>
    
    <table>
      <thead>
        <tr>
          <th style="width: 50px">#</th>
          ${!studentName ? "<th>اسم الطالب</th>" : ""}
          <th>التاريخ الهجري</th>
          <th>الحفظ الجديد</th>
          <th>المستوى</th>
          <th>المراجعة</th>
          <th>المستوي</th>
        </tr>
      </thead>
      <tbody>
        ${sessionRows}
      </tbody>
    </table>
    
    <div class="footer">
      <p>نظام متابعة حلقات القرآن - تم الإنشاء بتاريخ ${new Date().toLocaleDateString(
        "ar-EG"
      )}</p>
    </div>
  </div>
</body>
</html>
  `;
};

// HTML template for student report
const generateStudentReportHTML = (sessions, month, studentName) => {
  return generateMonthlyReportHTML(sessions, month, studentName);
};

// Helper function to get badge class based on level
const getBadgeClass = (level) => {
  if (!level) return "average";
  const lowerLevel = level.toLowerCase();

  if (lowerLevel.includes("ممتاز")) return "excellent";
  if (lowerLevel.includes("جيد")) return "good";
  if (lowerLevel.includes("مقبول")) return "average";
  if (lowerLevel.includes("ضعيف")) return "weak";
  if (lowerLevel.includes("انتظار")) return "wait";
  if (lowerLevel.includes("إعادة")) return "repeat";

  return "average";
};

// Main function to generate PDF from HTML
const generatePDFFromHTML = async (html) => {
  let browser;

  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    // Production (Vercel/Lambda)
    browser = await puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
  } else {
    // Local development
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "20px",
      right: "20px",
      bottom: "20px",
      left: "20px",
    },
  });

  await browser.close();
  return pdfBuffer;
};

// Export functions
const generateDailyReport = async (sessions, date) => {
  const html = generateDailyReportHTML(sessions, date);
  return await generatePDFFromHTML(html);
};

const generateMonthlyReport = async (sessions, month, studentName = null) => {
  const html = generateMonthlyReportHTML(sessions, month, studentName);
  return await generatePDFFromHTML(html);
};

const generateStudentReport = async (sessions, month, studentName) => {
  const html = generateStudentReportHTML(sessions, month, studentName);
  return await generatePDFFromHTML(html);
};

// HTML template for unpaid lessons report
const generateUnpaidReportHTML = (sessions, studentName) => {
  const sessionRows = sessions
    .map((session, index) => {
      const dateWithoutYear = session.date_hijri
        .replace(/\s\d{4}$/, "")
        .replace(/\s\d{4}.*$/, "");

      return `
    <tr>
      <td>${index + 1}</td>
      <td>${dateWithoutYear}</td>
      <td>${session.new_lesson}</td>
      <td><span class="badge badge-${getBadgeClass(session.level)}">${
        session.level
      }</span></td>
      <td>${session.review}</td>
      <td><span class="badge badge-${getBadgeClass(session.review_level)}">${
        session.review_level || "-"
      }</span></td>
    </tr>
  `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تقرير الحصص غير المدفوعة</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Cairo', sans-serif;
      direction: rtl;
      text-align: right;
      padding: 40px;
      background: #f8fafc;
      color: #1e293b;
      -webkit-print-color-adjust: exact;
    }
    
    .container {
      max-width: 100%;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 16px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 20px;
    }
    
    h1 {
      color: #4338ca;
      font-size: 24px;
      font-weight: 800;
      margin-bottom: 8px;
    }
    
    .subtitle {
      color: #64748b;
      font-size: 14px;
      font-weight: 600;
      margin-top: 4px;
    }

    .summary-card {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: white;
      padding: 12px 24px;
      border-radius: 12px;
      margin-bottom: 25px;
      display: inline-block;
      box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.3);
    }

    .summary-text {
      font-size: 18px;
      font-weight: 700;
    }
    
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin-top: 10px;
    }
    
    thead {
      background-color: #f8fafc;
    }
    
    th {
      padding: 12px 16px;
      text-align: right;
      font-weight: 700;
      font-size: 12px;
      color: #475569;
      border-bottom: 2px solid #e2e8f0;
      white-space: nowrap;
    }

    th:first-child { border-top-right-radius: 8px; }
    th:last-child { border-top-left-radius: 8px; }
    
    td {
      padding: 12px 16px;
      text-align: right;
      border-bottom: 1px solid #f1f5f9;
      font-size: 13px;
      color: #334155;
      vertical-align: middle;
      word-break: keep-all;
    }
    
    tbody tr:last-child td {
      border-bottom: none;
    }
    
    tbody tr:nth-child(even) {
      background-color: #fcfcfc;
    }

    .font-bold {
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
    }
    
    .badge {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      display: inline-block;
      white-space: nowrap;
    }
    
    .badge-excellent { background: #dcfce7; color: #166534; }
    .badge-good { background: #dbeafe; color: #1e40af; }
    .badge-average { background: #fef3c7; color: #92400e; }
    .badge-weak { background: #fee2e2; color: #991b1b; }
    .badge-wait { background: #e0e7ff; color: #3730a3; }
    .badge-repeat { background: #fce7f3; color: #831843; }
    
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #94a3b8;
      font-size: 12px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>تقرير الحصص الجديدة</h1>
      <p class="subtitle">👤 الطالب: ${studentName}</p>
    </div>

    <div style="text-align: center; display: flex; justify-content: center; gap: 20px;">
      <div class="summary-card">
        <span class="summary-text">إجمالي الحصص الجديدة: ${
          sessions.length
        }</span>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th style="width: 50px">#</th>
          <th>التاريخ الهجري</th>
          <th>الحفظ الجديد</th>
          <th>المستوى</th>
          <th>المراجعة</th>
          <th>المستوي</th>
        </tr>
      </thead>
      <tbody>
        ${sessionRows}
      </tbody>
    </table>
    
    <div class="footer">
      <p>نظام متابعة حلقات القرآن - تم الإنشاء بتاريخ ${new Date().toLocaleDateString(
        "ar-EG"
      )}</p>
    </div>
  </div>
</body>
</html>
  `;
};

const generateUnpaidReport = async (sessions, studentName) => {
  const html = generateUnpaidReportHTML(sessions, studentName);
  return await generatePDFFromHTML(html);
};

const generateLastSevenReport = async (sessions, studentName) => {
  const html = generateMonthlyReportHTML(sessions, "آخر 7 حصص", studentName);
  return await generatePDFFromHTML(html);
};

module.exports = {
  generateDailyReport,
  generateMonthlyReport,
  generateStudentReport,
  generateUnpaidReport,
  generateLastSevenReport,
};
