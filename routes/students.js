const express = require("express");
const router = express.Router();
const { getCollection, ObjectId } = require("../db");

// Get all students with session counts
router.get("/", async (req, res) => {
  try {
    const students = await getCollection("students");

    // Use aggregation to get session counts
    const result = await students
      .aggregate([
        {
          $lookup: {
            from: "sessions",
            localField: "name",
            foreignField: "student_name",
            as: "sessions",
          },
        },
        {
          $addFields: {
            session_count: { $size: "$sessions" },
            unpaid_session_count: {
              $size: {
                $filter: {
                  input: "$sessions",
                  as: "session",
                  cond: {
                    $or: [
                      { $eq: ["$$session.is_paid", false] },
                      { $eq: ["$$session.is_paid", null] },
                      { $not: { $ifNull: ["$$session.is_paid", false] } },
                    ],
                  },
                },
              },
            },
          },
        },
        {
          $project: {
            sessions: 0, // Remove the sessions array from output
          },
        },
        {
          $sort: { name: 1 },
        },
      ])
      .toArray();

    res.json(result);
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
    const students = await getCollection("students");

    // Check if student already exists
    const existing = await students.findOne({ name });
    if (existing) {
      return res.status(400).json({ error: "Student already exists" });
    }

    const result = await students.insertOne({
      name,
      age: age || null,
      created_at: new Date(),
    });

    res.status(201).json({ id: result.insertedId, name, age });
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
    const students = await getCollection("students");

    // Check if another student with the same name exists
    const existing = await students.findOne({
      name,
      _id: { $ne: new ObjectId(id) },
    });
    if (existing) {
      return res.status(400).json({ error: "Student name already exists" });
    }

    const result = await students.updateOne(
      { _id: new ObjectId(id) },
      { $set: { name, age: age || null } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({ id, name, age });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ error: "Failed to update student" });
  }
});

// Delete a student
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const students = await getCollection("students");
    const sessions = await getCollection("sessions");

    // First get the student name
    const student = await students.findOne({ _id: new ObjectId(id) });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const studentName = student.name;

    // Delete associated sessions
    await sessions.deleteMany({ student_name: studentName });

    // Delete the student
    await students.deleteOne({ _id: new ObjectId(id) });

    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ error: "Failed to delete student" });
  }
});

module.exports = router;
