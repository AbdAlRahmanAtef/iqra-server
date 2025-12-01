const express = require("express");
const cors = require("cors");
const sessionRoutes = require("./routes/session");
const reportRoutes = require("./routes/report");
const studentRoutes = require("./routes/students");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/session", sessionRoutes);
app.use("/report", reportRoutes);
app.use("/students", studentRoutes);

app.get("/", (req, res) => {
  res.send("Quran Lesson Tracker API is running");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
