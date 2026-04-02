const express = require("express");
const router = express.Router();
const { query } = require("../db");

// Get all sessions
router.get("/", async (req, res) => {
  try {
    const { rows } = await query("SELECT * FROM sessions ORDER BY date_gregorian DESC, id DESC");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// Get session by ID
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await query("SELECT * FROM sessions WHERE id = $1", [req.params.id]);
    const session = rows[0];
    
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    
    res.json(session);
  } catch (error) {
    console.error("Error fetching session:", error);
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

// Get sessions by student name
router.get("/student/:studentName", async (req, res) => {
  try {
    const { rows } = await query(
      "SELECT * FROM sessions WHERE student_name = $1 ORDER BY date_gregorian DESC, id DESC", 
      [req.params.studentName]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching student sessions:", error);
    res.status(500).json({ error: "Failed to fetch student sessions" });
  }
});

// Create session
router.post("/", async (req, res) => {
  const { student_name, new_lesson, review, level, review_level, is_paid } =
    req.body;

  if (!student_name || !new_lesson || !review || !level) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const today = new Date();
    const moment = require("moment-hijri");
    moment.locale("ar-sa");
    const dateHijriString = moment().format("iD iMMMM iYYYY");

    const { rows } = await query(
      `INSERT INTO sessions (date_hijri, date_gregorian, student_name, new_lesson, review, level, review_level, is_paid)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [dateHijriString, today, student_name, new_lesson, review, level, review_level || null, is_paid || false]
    );

    res
      .status(201)
      .json({ message: "Session saved successfully", id: rows[0].id });
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
    is_paid,
  } = req.body;

  if (!student_name || !new_lesson || !review || !level) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const updateData = {
      student_name,
      new_lesson,
      review,
      level,
      review_level: review_level || null,
      is_paid: is_paid || false,
    };

    // If date is provided, recalculate Hijri date
    if (date_gregorian) {
      const moment = require("moment-hijri");
      moment.locale("ar-sa");
      updateData.date_hijri = moment(date_gregorian).format("iD iMMMM iYYYY");
      updateData.date_gregorian = new Date(date_gregorian);
    }

    const setClause = Object.keys(updateData).map((key, index) => `${key} = $${index + 1}`).join(", ");
    const values = Object.values(updateData);
    values.push(id);

    const { rows } = await query(
      `UPDATE sessions SET ${setClause} WHERE id = $${values.length} RETURNING id`,
      values
    );

    if (rows.length === 0) {
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
    const { rowCount } = await query("DELETE FROM sessions WHERE id = $1", [req.params.id]);

    if (rowCount === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting session:", error);
    res.status(500).json({ error: "Failed to delete session" });
  }
});

module.exports = router;
