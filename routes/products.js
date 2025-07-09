const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/roleMiddleware");
const { db } = require("../services/firebaseService");
const { sendEmail } = require("../utils/emailService");

const router = express.Router();

/**
 * Add a product
 * POST /api/products
 */
router.post("/", verifyToken, checkRole("vendor"), async (req, res) => {
  const { title, description, price, stock, images, category, subCategory, manufacturer, features } = req.body;
  const vendorId = req.user.uid;

  const shopRef = db.collection("shops").doc(vendorId);
  const shop = await shopRef.get();

  if (!shop.exists) {
    return res.status(400).json({ error: "Vendor has no shop" });
  }

  const productData = {
    title,
    description,
    price,
    stock,
    images: images || [],
    category: category || "Uncategorized",
    subCategory,
    manufacturer: manufacturer || "",
    features,
    shopId: shop.id,
    vendorId,
    createdAt: new Date()
  };

  const productRef = await db.collection("products").add(productData);

  // Notify vendor
  const vendorSnap = await db.collection("users").doc(vendorId).get();
  const vendor = vendorSnap.data();

  await sendEmail({
    to: vendor.email,
    subject: "New Product Added",
    html: `
      <p>Hi ${vendor.name},</p>
      <p>Your product "${title}" has been added successfully to your shop.</p>
    `
  });

  res.status(201).json({ message: "Product added", id: productRef.id, ...productData });
});

/**
 * Get all products
 * GET /api/products
 */
router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("products").orderBy("createdAt", "desc").get();
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

/**
 * Get products by shop
 * GET /api/products/shop/:shopId
 */
router.get("/shop/:shopId", async (req, res) => {
  try {
    const productsSnap = await db.collection("products")
      .where("shopId", "==", req.params.shopId)
      .orderBy("createdAt", "desc")
      .get();

    const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching shop products:", error);
    res.status(500).json({ error: "Failed to fetch products for this shop" });
  }
});

/**
 * Update a product
 * PATCH /api/products/:id
 */
router.patch("/:id", verifyToken, checkRole("vendor"), async (req, res) => {
  const productId = req.params.id;
  const vendorId = req.user.uid;

  try {
    const productRef = db.collection("products").doc(productId);
    const productSnap = await productRef.get();

    if (!productSnap.exists) {
      return res.status(404).json({ error: "Product not found" });
    }

    const existingData = productSnap.data();

    // Check ownership
    if (existingData.vendorId !== vendorId) {
      return res.status(403).json({ error: "You do not have permission to update this product." });
    }

    // Only allow safe fields to be updated
    const allowedFields = [
      "title", "description", "price", "stock",
      "images", "category", "subCategory", "manufacturer", "features"
    ];
    const updateData = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    updateData.updatedAt = new Date();

    await productRef.update(updateData);

    res.status(200).json({ message: "Product updated", id: productId, ...updateData });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

module.exports = router;
