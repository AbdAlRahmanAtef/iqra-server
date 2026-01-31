const express = require("express");
const router = express.Router();
const { getCollection, ObjectId } = require("../db");

// Get all sessions
router.get("/", async (req, res) => {
  try {
    const sessions = await getCollection("sessions");
    const result = await sessions
      .find()
      .sort({ date_gregorian: -1, _id: -1 })
      .toArray();
    res.json(result);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// Get session by ID
router.get("/:id", async (req, res) => {
  try {
    const sessions = await getCollection("sessions");
    const session = await sessions.findOne({
      _id: new ObjectId(req.params.id),
    });
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
    const sessions = await getCollection("sessions");
    const result = await sessions
      .find({ student_name: req.params.studentName })
      .sort({ date_gregorian: -1, _id: -1 })
      .toArray();
    res.json(result);
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

    const sessions = await getCollection("sessions");
    const result = await sessions.insertOne({
      date_hijri: dateHijriString,
      date_gregorian: today,
      student_name,
      new_lesson,
      review,
      level,
      review_level: review_level || null,
      is_paid: is_paid || false,
      created_at: new Date(),
    });

    res
      .status(201)
      .json({ message: "Session saved successfully", id: result.insertedId });
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

    const sessions = await getCollection("sessions");
    const result = await sessions.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
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
    const sessions = await getCollection("sessions");
    const result = await sessions.deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting session:", error);
    res.status(500).json({ error: "Failed to delete session" });
  }
});

module.exports = router;
