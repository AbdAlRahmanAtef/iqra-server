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
    let startDate, endDate;

    // Check if a start date was provided (format: YYYY-MM-DD)
    // Check if a start date was provided (format: YYYY-MM-DD)
    if (req.query.startDate) {
      console.log(
        "Monthly report - Received startDate param:",
        req.query.startDate
      );
      // Parse the date and set to beginning of day UTC
      // Dates in MongoDB are stored at 22:00 UTC (midnight Cairo time)
      const [year, month, day] = req.query.startDate.split("-").map(Number);
      // Set start date to the previous day 22:00 UTC to catch the actual day
      startDate = new Date(Date.UTC(year, month - 1, day - 1, 22, 0, 0, 0));
    } else {
      // Default: first day of current month
      const now = new Date();
      startDate = new Date(
        Date.UTC(now.getFullYear(), now.getMonth(), 0, 22, 0, 0, 0)
      );
    }

    // End date is tomorrow at 00:00 UTC to include today's sessions
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

    const sessions = await getCollection("sessions");
    const result = await sessions
      .find({
        date_gregorian: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .sort({ date_gregorian: 1 })
      .toArray();

    console.log("Found sessions:", result.length);

    // Format the date range for the PDF title
    const startMoment = moment(startDate);
    const endMoment = moment(endDate);
    const dateRangeTitle = `${startMoment.format(
      "iD iMMMM"
    )} - ${endMoment.format("iD iMMMM iYYYY")}`;

    const pdfBuffer = await generateMonthlyReport(result, dateRangeTitle);

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

    // Check if a start date was provided (format: YYYY-MM-DD)
    if (req.query.startDate) {
      console.log("Received startDate param:", req.query.startDate);
      // Parse the date and set to beginning of day UTC
      // Dates in MongoDB are stored at 22:00 UTC (midnight Cairo time)
      // So for Oct 4, the stored date is Oct 3 22:00 UTC
      const [year, month, day] = req.query.startDate.split("-").map(Number);
      // Set start date to the previous day 22:00 UTC to catch the actual day
      startDate = new Date(Date.UTC(year, month - 1, day - 1, 22, 0, 0, 0));
    } else {
      // Default: first day of current month
      const now = new Date();
      startDate = new Date(
        Date.UTC(now.getFullYear(), now.getMonth(), 0, 22, 0, 0, 0)
      );
    }

    // End date is tomorrow at 00:00 UTC to include today's sessions
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

    // Format the date range for the PDF title
    const startMoment = moment(startDate);
    const endMoment = moment(endDate);
    const dateRangeTitle = `${startMoment.format(
      "iD iMMMM"
    )} - ${endMoment.format("iD iMMMM iYYYY")}`;

    const sessions = await getCollection("sessions");
    const result = await sessions
      .find({
        student_name: studentName,
        date_gregorian: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .sort({ date_gregorian: 1 })
      .toArray();

    console.log("Found sessions:", result.length);
    result.forEach((s) => {
      console.log(
        `Session: ${s.date_gregorian} (${s.date_hijri}) - ${s.new_lesson}`
      );
    });

    const pdfBuffer = await generateStudentReport(
      result,
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

module.exports = router;
