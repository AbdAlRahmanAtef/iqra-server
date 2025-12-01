const express = require("express");
const router = express.Router();
const db = require("../db");

// Get all sessions
router.get("/", async (req, res) => {
  try {
    const [sessions] = await db.execute(
      "SELECT * FROM sessions ORDER BY date_gregorian DESC, id DESC"
    );
    res.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// Get session by ID
router.get("/:id", async (req, res) => {
  try {
    const [sessions] = await db.execute("SELECT * FROM sessions WHERE id = ?", [
      req.params.id,
    ]);
    if (sessions.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.json(sessions[0]);
  } catch (error) {
    console.error("Error fetching session:", error);
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

// Create session
router.post("/", async (req, res) => {
  const { student_name, new_lesson, review, level, review_level } = req.body;

  if (!student_name || !new_lesson || !review || !level) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const today = new Date();
    const moment = require("moment-hijri");
    moment.locale("ar-sa");
    const dateHijriString = moment().format("iD iMMMM iYYYY");

    const [result] = await db.execute(
      "INSERT INTO sessions (date_hijri, date_gregorian, student_name, new_lesson, review, level, review_level) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        dateHijriString,
        today,
        student_name,
        new_lesson,
        review,
        level,
        review_level || null,
      ]
    );

    res
      .status(201)
      .json({ message: "Session saved successfully", id: result.insertId });
  } catch (error) {
    console.error("Error saving session:", error);
    res.status(500).json({ error: "Failed to save session" });
  }
});

// Update session
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    student_name,
    new_lesson,
    review,
    level,
    review_level,
    date_gregorian,
  } = req.body;

  if (!student_name || !new_lesson || !review || !level) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // If date is provided, recalculate Hijri date
    let dateHijri = null;
    if (date_gregorian) {
      const moment = require("moment-hijri");
      moment.locale("ar-sa");
      dateHijri = moment(date_gregorian).format("iD iMMMM iYYYY");
    }

    const updateQuery = dateHijri
      ? "UPDATE sessions SET student_name = ?, new_lesson = ?, review = ?, level = ?, review_level = ?, date_gregorian = ?, date_hijri = ? WHERE id = ?"
      : "UPDATE sessions SET student_name = ?, new_lesson = ?, review = ?, level = ?, review_level = ? WHERE id = ?";

    const updateParams = dateHijri
      ? [
          student_name,
          new_lesson,
          review,
          level,
          review_level || null,
          date_gregorian,
          dateHijri,
          id,
        ]
      : [student_name, new_lesson, review, level, review_level || null, id];

    const [result] = await db.execute(updateQuery, updateParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({ message: "Session updated successfully" });
  } catch (error) {
    console.error("Error updating session:", error);
    res.status(500).json({ error: "Failed to update session" });
  }
});

// Delete session
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.execute("DELETE FROM sessions WHERE id = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting session:", error);
    res.status(500).json({ error: "Failed to delete session" });
  }
});

module.exports = router;
