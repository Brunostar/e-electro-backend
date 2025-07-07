const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/roleMiddleware");
const { db } = require("../services/firebaseService");
const { sendEmail } = require("../utils/emailService");
const { getAdminEmails } = require("../utils/adminUtils");

const router = express.Router();

/**
 * Create or update a shop
 * POST /api/shops
 */
router.post("/", verifyToken, async (req, res) => {
  const { name, category, description, whatsappNumber, location, logoUrl, coverPhotoUrl } = req.body;
  const vendorId = req.user.uid;

  const shopData = {
    name,
    category,
    description,
    whatsappNumber,
    location: location || "",
    logoUrl: logoUrl || "",
    coverPhotoUrl: coverPhotoUrl || "",
    vendorId,
    approved: false,
    updatedAt: new Date()
  };

  const shopRef = db.collection("shops").doc(vendorId);
  await shopRef.set(shopData, { merge: true });

  // Get vendor info
  const userSnap = await db.collection("users").doc(vendorId).get();
  const vendor = userSnap.data();

  // Email the vendor
  await sendEmail({
    to: vendor.email,
    subject: "Shop Created",
    html: `
      <p>Hi ${vendor.name},</p>
      <p>Your shop "${name}" has been created and is pending admin approval.</p>
    `
  });

  // Notify all admins
  const adminEmails = await getAdminEmails();

  if (adminEmails.length > 0) {
    await sendEmail({
      to: adminEmails,
      subject: "New Shop Awaiting Approval",
      html: `
        <p>Admins,</p>
        <p>The shop "${name}" was created by ${vendor.name} (${vendor.email}) and needs approval.</p>
      `
    });
  }

  res.status(200).json({ message: "Shop saved", data: shopData });
});

/**
 * Approve a shop (admin only)
 * POST /api/shops/:vendorId/approve
 */
router.post("/:vendorId/approve", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const vendorId = req.params.vendorId;
    const shopRef = db.collection("shops").doc(vendorId);

    const shopSnap = await shopRef.get();
    if (!shopSnap.exists) {
      return res.status(404).json({ error: "Shop not found" });
    }

    await shopRef.update({ approved: true, approvedAt: new Date() });

    // Notify vendor
    const vendorSnap = await db.collection("users").doc(vendorId).get();
    const vendor = vendorSnap.data();

    await sendEmail({
      to: vendor.email,
      subject: "Your Shop Has Been Approved",
      html: `
        <p>Hi ${vendor.name},</p>
        <p>Your shop "${shopSnap.data().name}" has been approved and is now live on the platform.</p>
      `
    });

    res.status(200).json({ message: "Shop approved" });
  } catch (error) {
    console.error("Error approving shop:", error);
    res.status(500).json({ error: "Failed to approve shop" });
  }
});

/**
 * Get all shops
 * GET /api/shops
 */
router.get("/", async (req, res) => {
  try {
    const snap = await db.collection("shops").get();
    const shops = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(shops);
  } catch (error) {
    console.error("Error fetching shops:", error);
    res.status(500).json({ error: "Failed to fetch shops" });
  }
});

/**
 * Get a vendor's shop
 * GET /api/shops/:vendorId
 */
router.get("/:vendorId", async (req, res) => {
  try {
    const shopSnap = await db.collection("shops").doc(req.params.vendorId).get();
    if (!shopSnap.exists) {
      return res.status(404).json({ error: "Shop not found" });
    }
    res.status(200).json({ id: shopSnap.id, ...shopSnap.data() });
  } catch (error) {
    console.error("Error fetching shop:", error);
    res.status(500).json({ error: "Failed to fetch shop" });
  }
});

module.exports = router;
