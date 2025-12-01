const express = require("express");
const router = express.Router();
const db = require("../db");

// Get all students with session counts
router.get("/", async (req, res) => {
  try {
    const [students] = await db.execute(`
      SELECT s.*, COUNT(sess.id) as session_count 
      FROM students s 
      LEFT JOIN sessions sess ON s.name = sess.student_name 
      GROUP BY s.id 
      ORDER BY s.name ASC
    `);
    res.json(students);
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
    const [result] = await db.execute(
      "INSERT INTO students (name, age) VALUES (?, ?)",
      [name, age || null]
    );
    res.status(201).json({ id: result.insertId, name, age });
  } catch (error) {
    console.error("Error adding student:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Student already exists" });
    }
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
    const [result] = await db.execute(
      "UPDATE students SET name = ?, age = ? WHERE id = ?",
      [name, age || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({ id: parseInt(id), name, age });
  } catch (error) {
    console.error("Error updating student:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Student name already exists" });
    }
    res.status(500).json({ error: "Failed to update student" });
  }
});

// Delete a student
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // First get the student name
    const [students] = await db.execute(
      "SELECT name FROM students WHERE id = ?",
      [id]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    const studentName = students[0].name;

    // Delete associated sessions
    await db.execute("DELETE FROM sessions WHERE student_name = ?", [
      studentName,
    ]);

    // Delete the student
    await db.execute("DELETE FROM students WHERE id = ?", [id]);

    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ error: "Failed to delete student" });
  }
});

module.exports = router;
