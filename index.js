const express = require("express");
const cors = require("cors");
const sessionRoutes = require("./routes/session");
const reportRoutes = require("./routes/report");
const studentRoutes = require("./routes/students");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5174",
    "https://iqra-client-xi.vercel.app",
    "https://iqra-sudent.vercel.app",
    process.env.CLIENT_URL,
  ].filter(Boolean), // Remove undefined values
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

const authMiddleware = require("./middleware/auth");

// Login Route
const db = require("./db");
const bcrypt = require("bcrypt");

// Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [admins] = await db.execute("SELECT * FROM admins WHERE email = ?", [
      email,
    ]);

    if (admins.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const admin = admins[0];

    const isMatch = await bcrypt.compare(password, admin.password);

    if (isMatch) {
      res.json({ token: "admin-token-secret", user: { email: admin.email } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Routes
app.use("/session", authMiddleware, sessionRoutes);
app.use("/report", reportRoutes);
app.use("/students", authMiddleware, studentRoutes);

app.get("/", (req, res) => {
  res.send("Quran Lesson Tracker API is running");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
