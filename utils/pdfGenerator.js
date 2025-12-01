const PDFDocument = require("pdfkit-table");
const arabicReshaper = require("arabic-reshaper");

// Font path found on system
const fontPath = "/usr/share/fonts/google-noto-vf/NotoNaskhArabic[wght].ttf";

// Helper function to reshape Arabic text for PDF
const reshapeArabic = (text) => {
  if (!text) return text;
  try {
    return arabicReshaper(text);
  } catch (e) {
    return text;
  }
};

const generateDailyReport = (doc, sessions, date) => {
  // Register font
  doc.font(fontPath);

  // Title with reshaped text
  doc
    .fontSize(20)
    .text(reshapeArabic("تقرير درس القرآن اليومي"), { align: "right" });
  doc.moveDown();
  doc.fontSize(14).text(reshapeArabic(`التاريخ: ${date}`), { align: "right" });
  doc.moveDown();

  // Table with reshaped Arabic text
  const table = {
    headers: [
      reshapeArabic("اسم الطالب"),
      reshapeArabic("درس جديد"),
      reshapeArabic("المستوى"),
      reshapeArabic("مراجعة"),
      reshapeArabic("المستوى"),
    ],
    rows: sessions.map((session) => [
      reshapeArabic(session.student_name),
      reshapeArabic(session.new_lesson),
      reshapeArabic(session.level),
      reshapeArabic(session.review),
      reshapeArabic(session.review_level) || "-",
    ]),
  };

  doc.table(table, {
    prepareHeader: () => doc.font(fontPath).fontSize(12),
    prepareRow: () => doc.font(fontPath).fontSize(10),
  });
};

const generateMonthlyReport = (doc, sessions, month) => {
  doc.font(fontPath);
  doc
    .fontSize(20)
    .text(reshapeArabic("تقرير درس القرآن الشهري"), { align: "right" });
  doc.moveDown();
  doc.fontSize(14).text(reshapeArabic(`الشهر: ${month}`), { align: "right" });
  doc.moveDown();

  // Group by date
  const grouped = {};
  const studentNames = new Set();

  sessions.forEach((session) => {
    const date = session.date_hijri;
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(session);
    studentNames.add(session.student_name);
  });

  const students = Array.from(studentNames).sort();
  const headers = [
    reshapeArabic("التاريخ"),
    ...students.map((s) => reshapeArabic(s)),
  ];
  const rows = [];

  Object.keys(grouped).forEach((date) => {
    const daySessions = grouped[date];
    const row = [reshapeArabic(date)];

    students.forEach((student) => {
      const session = daySessions.find((s) => s.student_name === student);
      row.push(
        session
          ? reshapeArabic(
              `جديد: ${session.new_lesson}\nمراجعة: ${session.review}\nمستوى: ${session.level}`
            )
          : "-"
      );
    });

    rows.push(row);
  });

  const table = {
    headers: headers,
    rows: rows,
  };

  doc.table(table, {
    prepareHeader: () => doc.font(fontPath).fontSize(10),
    prepareRow: () => doc.font(fontPath).fontSize(8),
  });
};

const generateStudentReport = (doc, sessions, month, studentName) => {
  doc.font(fontPath);
  doc
    .fontSize(20)
    .text(reshapeArabic(`تقرير الطالب - ${studentName}`), { align: "right" });
  doc.moveDown();
  doc.fontSize(14).text(reshapeArabic(`الشهر: ${month}`), { align: "right" });
  doc.moveDown();

  // Table without student name column, with reshaped Arabic
  const table = {
    headers: [
      reshapeArabic("التاريخ الهجري"),
      reshapeArabic("درس جديد"),
      reshapeArabic("المستوى"),
      reshapeArabic("مراجعة"),
      reshapeArabic("المستوى"),
    ],
    rows: sessions.map((session) => [
      reshapeArabic(session.date_hijri),
      reshapeArabic(session.new_lesson),
      reshapeArabic(session.level),
      reshapeArabic(session.review),
      reshapeArabic(session.review_level) || "-",
    ]),
  };

  doc.table(table, {
    prepareHeader: () => doc.font(fontPath).fontSize(12),
    prepareRow: () => doc.font(fontPath).fontSize(10),
  });
};

module.exports = {
  generateDailyReport,
  generateMonthlyReport,
  generateStudentReport,
};
