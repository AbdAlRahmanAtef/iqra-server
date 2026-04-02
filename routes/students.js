const express = require("express");
const router = express.Router();
const { query } = require("../db");

// Get all students with session counts
router.get("/", async (req, res) => {
  try {
    // Left join sessions to get counts
    const { rows } = await query(`
      SELECT 
        s.id, s.name, s.age, s.created_at,
        COUNT(ses.id)::int AS session_count,
        COALESCE(SUM(CASE WHEN ses.is_paid = false OR ses.is_paid IS NULL THEN 1 ELSE 0 END), 0)::int AS unpaid_session_count
      FROM students s
      LEFT JOIN sessions ses ON s.name = ses.student_name
      GROUP BY s.id, s.name, s.age, s.created_at
      ORDER BY s.name ASC
    `);

    res.json(rows);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// Add a new student
router.post("/", async (req, res) => {
  const { name, age } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Student name is required" });
  }

  try {
    // Check if student already exists
    const existing = await query("SELECT * FROM students WHERE name = $1", [name]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Student already exists" });
    }

    const { rows } = await query(
      "INSERT INTO students (name, age) VALUES ($1, $2) RETURNING id, name, age",
      [name, age || null]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error adding student:", error);
    res.status(500).json({ error: "Failed to add student" });
  }
});

// Update a student
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, age } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Student name is required" });
  }

  try {
    // Check if another student with the same name exists
    const queryResult = await query("SELECT * FROM students WHERE name = $1 AND id != $2", [name, id]);
    
    if (queryResult.rows.length > 0) {
      return res.status(400).json({ error: "Student name already exists" });
    }

    // Since sessions.student_name references students.name ON UPDATE CASCADE,
    // this will automatically update associated sessions in PostgreSQL!
    const { rows } = await query(
      "UPDATE students SET name = $1, age = $2 WHERE id = $3 RETURNING id, name, age",
      [name, age || null, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ error: "Failed to update student" });
  }
});

// Delete a student
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await query("SELECT name FROM students WHERE id = $1", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    const studentName = rows[0].name;

    // Delete associated sessions (should be handled by CASCADE automatically if we set it up)
    // But we'll execute it explicitly just in case.
    await query("DELETE FROM sessions WHERE student_name = $1", [studentName]);

    // Delete the student
    await query("DELETE FROM students WHERE id = $1", [id]);

    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ error: "Failed to delete student" });
  }
});

module.exports = router;
