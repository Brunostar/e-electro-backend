const express = require("express");
const { db } = require("../services/firebaseService");
const { verifyToken } = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/roleMiddleware");
const { sendEmail } = require("../utils/emailService");

const router = express.Router();

/**
 * Register user after Firebase Auth signup
 * POST /api/users/register
 */
router.post("/register", verifyToken, async (req, res) => {
  const { name, email, role } = req.body;
  const uid = req.user.uid;

  if (!["vendor", "customer"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  await db.collection("users").doc(uid).set({ uid, email, name, role }, { merge: true });

  // Send welcome email
  await sendEmail({
    to: email,
    subject: "Welcome to E-Electro!",
    html: `
      <p>Hello ${name},</p>
      <p>Welcome to E-Electro! Your account has been registered as a <strong>${role}</strong>.</p>
      <p>Happy selling and shopping!</p>
    `
  });

  res.status(201).json({ message: "User registered" });
});

/**
 * Admin assigns a role to a user
 * POST /api/users/set-role
 */
router.post("/set-role", verifyToken, checkRole("admin"), async (req, res) => {
  const { uid, role } = req.body;

  if (!["admin", "vendor", "customer"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  await db.collection("users").doc(uid).update({ role });
  res.status(200).json({ message: `Role updated to ${role}` });
});

/**
 * Get all users (admin only)
 * GET /api/users
 */
router.get("/", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/**
 * Get single user by UID
 * GET /api/users/:id
 */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const userSnap = await db.collection("users").doc(req.params.id).get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ id: userSnap.id, ...userSnap.data() });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

module.exports = router;
