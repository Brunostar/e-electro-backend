const express = require("express");
const { db, auth } = require("../services/firebaseService");
const { verifyToken } = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/roleMiddleware");

const router = express.Router();

// Register user (should be called from frontend after Firebase Auth signup)
router.post("/register", verifyToken, async (req, res) => {
  const { name, email, role } = req.body;
  const uid = req.user.uid;

  if (!["vendor", "customer"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  await db.collection("users").doc(uid).set({ uid, email, name, role });
  res.json({ message: "User registered" });
});

// Admin assigns role to a user
router.post("/set-role", verifyToken, checkRole("admin"), async (req, res) => {
  const { uid, role } = req.body;

  if (!["admin", "vendor", "customer"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  await db.collection("users").doc(uid).update({ role });
  res.json({ message: `Role updated to ${role}` });
});

module.exports = router;
