const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const router = express.Router();
const { db } = require("../services/firebaseService");
const { checkRole } = require("../middleware/roleMiddleware");

// Create or update a shop
router.post("/", verifyToken, checkRole("vendor"), async (req, res) => {
  const { name, description, whatsappNumber } = req.body;
  const vendorId = req.user.uid;

  const shopRef = db.collection("shops").doc(vendorId);
  await shopRef.set({ name, description, whatsappNumber, vendorId, approved: false }, { merge: true });

  res.json({ message: "Shop saved" });
});

// Get a vendor's shop
router.get("/:vendorId", async (req, res) => {
  const shop = await db.collection("shops").doc(req.params.vendorId).get();
  res.json(shop.exists ? shop.data() : {});
});

module.exports = router;
