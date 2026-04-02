const express = require("express");
const router = express.Router();
const { query } = require("../db");
const {
  generateDailyReport,
  generateMonthlyReport,
  generateStudentReport,
  generateUnpaidReport,
  generateLastSevenReport,
} = require("../utils/pdfGenerator");
const moment = require("moment-hijri");

router.get("/today", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { rows } = await query(
      "SELECT * FROM sessions WHERE date_gregorian >= $1 AND date_gregorian < $2 ORDER BY date_gregorian ASC",
      [today, tomorrow]
    );

    // Hijri date for title
    const hijriDate = moment().format("iD iMMMM iYYYY");

    const pdfBuffer = await generateDailyReport(rows, hijriDate);

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
    let startDate, endDate;

    if (req.query.startDate) {
      console.log(
        "Monthly report - Received startDate param:",
        req.query.startDate
      );
      const [year, month, day] = req.query.startDate.split("-").map(Number);
      startDate = new Date(Date.UTC(year, month - 1, day - 1, 22, 0, 0, 0));
    } else {
      const now = new Date();
      startDate = new Date(
        Date.UTC(now.getFullYear(), now.getMonth(), 0, 22, 0, 0, 0)
      );
    }

    endDate = new Date();
    endDate = new Date(
      Date.UTC(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
        23,
        59,
        59,
        999
      )
    );

    console.log(
      "Query range:",
      startDate.toISOString(),
      "to",
      endDate.toISOString()
    );

    const { rows } = await query(
      "SELECT * FROM sessions WHERE date_gregorian >= $1 AND date_gregorian <= $2 ORDER BY date_gregorian ASC",
      [startDate, endDate]
    );

    console.log("Found sessions:", rows.length);

    const startMoment = moment(startDate);
    const endMoment = moment(endDate);
    const dateRangeTitle = `${startMoment.format(
      "iD iMMMM"
    )} - ${endMoment.format("iD iMMMM iYYYY")}`;

    const pdfBuffer = await generateMonthlyReport(rows, dateRangeTitle);

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

    let startDate, endDate;

    if (req.query.startDate) {
      console.log("Received startDate param:", req.query.startDate);
      const [year, month, day] = req.query.startDate.split("-").map(Number);
      startDate = new Date(Date.UTC(year, month - 1, day - 1, 22, 0, 0, 0));
    } else {
      const now = new Date();
      startDate = new Date(
        Date.UTC(now.getFullYear(), now.getMonth(), 0, 22, 0, 0, 0)
      );
    }

    endDate = new Date();
    endDate = new Date(
      Date.UTC(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
        23,
        59,
        59,
        999
      )
    );

    console.log(
      "Query range:",
      startDate.toISOString(),
      "to",
      endDate.toISOString()
    );

    const startMoment = moment(startDate);
    const endMoment = moment(endDate);
    const dateRangeTitle = `${startMoment.format(
      "iD iMMMM"
    )} - ${endMoment.format("iD iMMMM iYYYY")}`;

    const { rows } = await query(
      "SELECT * FROM sessions WHERE student_name = $1 AND date_gregorian >= $2 AND date_gregorian <= $3 ORDER BY date_gregorian ASC",
      [studentName, startDate, endDate]
    );

    console.log("Found sessions:", rows.length);
    rows.forEach((s) => {
      console.log(
        `Session: ${s.date_gregorian} (${s.date_hijri}) - ${s.new_lesson}`
      );
    });

    const pdfBuffer = await generateStudentReport(
      rows,
      dateRangeTitle,
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

// Generate unpaid lessons report for specific student
router.get("/unpaid/:studentName", async (req, res) => {
  try {
    const { studentName } = req.params;
    moment.locale("ar-sa");

    const { rows } = await query(
      "SELECT * FROM sessions WHERE student_name = $1 AND (is_paid = false OR is_paid IS NULL) ORDER BY date_gregorian ASC",
      [studentName]
    );

    console.log("Found unpaid sessions:", rows.length);

    const pdfBuffer = await generateUnpaidReport(rows, studentName);

    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length,
      "Content-Disposition": 'attachment; filename="unpaid-lessons-report.pdf"',
      "Cache-Control": "no-cache, no-store, must-revalidate",
    });
    res.end(pdfBuffer);
  } catch (error) {
    console.error("Error generating unpaid report:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate unpaid report" });
    }
  }
});

// Generate last 7 lessons report for specific student
router.get("/last7/:studentName", async (req, res) => {
  try {
    const { studentName } = req.params;
    moment.locale("ar-sa");

    const { rows } = await query(
      "SELECT * FROM sessions WHERE student_name = $1 ORDER BY date_gregorian DESC LIMIT 7",
      [studentName]
    );

    let result = rows.reverse();

    console.log("Found last 7 sessions:", result.length);

    const pdfBuffer = await generateLastSevenReport(result, studentName);

    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length,
      "Content-Disposition": 'attachment; filename="last7-lessons-report.pdf"',
      "Cache-Control": "no-cache, no-store, must-revalidate",
    });
    res.end(pdfBuffer);
  } catch (error) {
    console.error("Error generating last 7 report:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate last 7 report" });
    }
  }
});

module.exports = router;
