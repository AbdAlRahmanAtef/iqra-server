const puppeteer = require("puppeteer");
const puppeteerCore = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

// HTML template for daily report
const generateDailyReportHTML = (sessions, date) => {
  const sessionRows = sessions
    .map(
      (session) => `
    <tr>
      <td>${session.student_name}</td>
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
      background: #f9fafb;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 20px;
    }
    
    h1 {
      color: #1e40af;
      font-size: 28px;
      margin-bottom: 10px;
    }
    
    .date {
      color: #6b7280;
      font-size: 16px;
      margin-top: 10px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    
    thead {
      background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
      color: white;
    }
    
    th {
      padding: 15px;
      text-align: right;
      font-weight: 600;
      font-size: 14px;
    }
    
    td {
      padding: 12px;
      text-align: right;
      border-bottom: 1px solid #e5e7eb;
      font-size: 13px;
    }
    
    tbody tr:hover {
      background-color: #f3f4f6;
    }
    
    .badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      display: inline-block;
    }
    
    .badge-excellent { background: #dcfce7; color: #166534; }
    .badge-good { background: #dbeafe; color: #1e40af; }
    .badge-average { background: #fef3c7; color: #92400e; }
    .badge-weak { background: #fee2e2; color: #991b1b; }
    .badge-wait { background: #e0e7ff; color: #3730a3; }
    .badge-repeat { background: #fce7f3; color: #831843; }
    
    .footer {
      margin-top: 30px;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📖 تقرير درس القرآن اليومي</h1>
      <p class="date">📅 التاريخ: ${date}</p>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>اسم الطالب</th>
          <th>درس جديد</th>
          <th>المستوى</th>
          <th>مراجعة</th>
          <th>مستوى المراجعة</th>
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
    .map(
      (session) => `
    <tr>
      <td>${session.date_hijri}</td>
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
      background: #f9fafb;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #6366f1;
      padding-bottom: 20px;
    }
    
    h1 {
      color: #4338ca;
      font-size: 28px;
      margin-bottom: 10px;
    }
    
    .subtitle {
      color: #6b7280;
      font-size: 16px;
      margin-top: 10px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    
    thead {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
    }
    
    th {
      padding: 15px;
      text-align: right;
      font-weight: 600;
      font-size: 14px;
    }
    
    td {
      padding: 12px;
      text-align: right;
      border-bottom: 1px solid #e5e7eb;
      font-size: 13px;
    }
    
    tbody tr:hover {
      background-color: #f3f4f6;
    }
    
    .badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      display: inline-block;
    }
    
    .badge-excellent { background: #dcfce7; color: #166534; }
    .badge-good { background: #dbeafe; color: #1e40af; }
    .badge-average { background: #fef3c7; color: #92400e; }
    .badge-weak { background: #fee2e2; color: #991b1b; }
    .badge-wait { background: #e0e7ff; color: #3730a3; }
    .badge-repeat { background: #fce7f3; color: #831843; }
    
    .footer {
      margin-top: 30px;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
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
    
    <table>
      <thead>
        <tr>
          <th>التاريخ الهجري</th>
          <th>درس جديد</th>
          <th>المستوى</th>
          <th>مراجعة</th>
          <th>مستوى المراجعة</th>
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

module.exports = {
  generateDailyReport,
  generateMonthlyReport,
  generateStudentReport,
};
