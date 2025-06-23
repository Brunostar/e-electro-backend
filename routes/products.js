const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const router = express.Router();
const { db } = require("../services/firebaseService");
const { checkRole } = require("../middleware/roleMiddleware");

// Add a product
router.post("/", verifyToken, checkRole("vendor"), async (req, res) => {
  const { title, description, price, stock, images, category } = req.body;
  const vendorId = req.user.uid;

  const shopRef = db.collection("shops").doc(vendorId);
  const shop = await shopRef.get();

  if (!shop.exists) return res.status(400).json({ error: "Vendor has no shop" });

  const productRef = await db.collection("products").add({
    title, description, price, stock, images, category,
    shopId: shop.id,
    vendorId,
    createdAt: new Date()
  });

  res.json({ id: productRef.id });
});

// Get products by shop
router.get("/shop/:shopId", async (req, res) => {
  const productsSnap = await db.collection("products")
    .where("shopId", "==", req.params.shopId)
    .get();

  const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json(products);
});

module.exports = router;
