const express = require("express");
const router = express.Router();
const db = require("../db");
const PDFDocument = require("pdfkit-table");
const {
  generateDailyReport,
  generateMonthlyReport,
  generateStudentReport,
} = require("../utils/pdfGenerator");
const moment = require("moment-hijri");

router.get("/today", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const [sessions] = await db.execute(
      "SELECT * FROM sessions WHERE date_gregorian = ?",
      [today]
    );

    const doc = new PDFDocument({ margin: 30, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=daily-report.pdf"
    );

    doc.pipe(res);

    // Hijri date for title
    const hijriDate = moment().format("iD iMMMM iYYYY");
    generateDailyReport(doc, sessions, hijriDate);

    doc.end();
  } catch (error) {
    console.error("Error generating daily report:", error);
    res.status(500).send("Error generating report");
  }
});

router.get("/month", async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const startStr = startOfMonth.toISOString().split("T")[0];

    const [sessions] = await db.execute(
      "SELECT * FROM sessions WHERE date_gregorian >= ? ORDER BY date_gregorian ASC",
      [startStr]
    );

    const doc = new PDFDocument({ margin: 30, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=monthly-report.pdf"
    );

    doc.pipe(res);

    const currentMonth = moment().format("iMMMM iYYYY");
    generateMonthlyReport(doc, sessions, currentMonth);

    doc.end();
  } catch (error) {
    console.error("Error generating monthly report:", error);
    res.status(500).send("Error generating report");
  }
});

// Generate report for specific student
router.get("/student/:studentName", async (req, res) => {
  try {
    const { studentName } = req.params;
    moment.locale("ar-sa");

    const currentMonth = moment().format("iMMMM iYYYY");

    // Get sessions from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split("T")[0];

    const [sessions] = await db.execute(
      "SELECT * FROM sessions WHERE student_name = ? AND date_gregorian >= ? ORDER BY date_gregorian ASC",
      [studentName, startDate]
    );

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="student-report.pdf"'
    );
    doc.pipe(res);

    generateStudentReport(doc, sessions, currentMonth, studentName);

    doc.end();
  } catch (error) {
    console.error("Error generating student report:", error);
    res.status(500).json({ error: "Failed to generate student report" });
  }
});

module.exports = router;
