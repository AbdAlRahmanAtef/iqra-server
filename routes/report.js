const express = require("express");
const router = express.Router();
const { getCollection } = require("../db");
const {
  generateDailyReport,
  generateMonthlyReport,
  generateStudentReport,
} = require("../utils/pdfGenerator");
const moment = require("moment-hijri");

router.get("/today", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessions = await getCollection("sessions");
    const result = await sessions
      .find({
        date_gregorian: {
          $gte: today,
          $lt: tomorrow,
        },
      })
      .toArray();

    // Hijri date for title
    const hijriDate = moment().format("iD iMMMM iYYYY");

    const pdfBuffer = await generateDailyReport(result, hijriDate);

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
    startOfMonth.setHours(0, 0, 0, 0);

    const sessions = await getCollection("sessions");
    const result = await sessions
      .find({
        date_gregorian: { $gte: startOfMonth },
      })
      .sort({ date_gregorian: 1 })
      .toArray();

    const currentMonth = moment().format("iMMMM iYYYY");
    const pdfBuffer = await generateMonthlyReport(result, currentMonth);

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
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const sessions = await getCollection("sessions");
    const result = await sessions
      .find({
        student_name: studentName,
        date_gregorian: { $gte: thirtyDaysAgo },
      })
      .sort({ date_gregorian: 1 })
      .toArray();

    const pdfBuffer = await generateStudentReport(
      result,
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
