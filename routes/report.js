const express = require("express");
const router = express.Router();
const db = require("../db");
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

    // Hijri date for title
    const hijriDate = moment().format("iD iMMMM iYYYY");

    const pdfBuffer = await generateDailyReport(sessions, hijriDate);

    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length,
      "Content-Disposition": "attachment; filename=daily-report.pdf",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    });
    res.end(pdfBuffer);
  } catch (error) {
    console.error("Error generating daily report:", error);
    if (!res.headersSent) {
      res.status(500).send("Error generating report: " + error.message);
    }
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

    const currentMonth = moment().format("iMMMM iYYYY");
    const pdfBuffer = await generateMonthlyReport(sessions, currentMonth);

    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length,
      "Content-Disposition": "attachment; filename=monthly-report.pdf",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    });
    res.end(pdfBuffer);
  } catch (error) {
    console.error("Error generating monthly report:", error);
    if (!res.headersSent) {
      res.status(500).send("Error generating report: " + error.message);
    }
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

    const pdfBuffer = await generateStudentReport(
      sessions,
      currentMonth,
      studentName
    );

    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length,
      "Content-Disposition": 'attachment; filename="student-report.pdf"',
      "Cache-Control": "no-cache, no-store, must-revalidate",
    });
    res.end(pdfBuffer);
  } catch (error) {
    console.error("Error generating student report:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate student report" });
    }
  }
});

module.exports = router;
