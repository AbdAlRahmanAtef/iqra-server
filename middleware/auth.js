const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Simple check for the hardcoded token
  // In a real app, use JWT or proper session management
  if (authHeader === "Bearer admin-token-secret") {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
};

module.exports = authMiddleware;
