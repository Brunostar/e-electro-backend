const express = require("express");
const { db } = require("../services/firebaseService");
const { verifyToken } = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/roleMiddleware");

const router = express.Router();

// Checkout and create order
router.post("/checkout", verifyToken, checkRole("customer"), async (req, res) => {
  const cartRef = db.collection("carts").doc(req.user.uid);
  const cartSnap = await cartRef.get();

  if (!cartSnap.exists || cartSnap.data().items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  const items = cartSnap.data().items;
  const shopId = items[0].shopId; // Assume single-shop cart for now
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const orderRef = await db.collection("orders").add({
    userId: req.user.uid,
    items,
    shopId,
    total,
    createdAt: new Date()
  });

  // Get vendor WhatsApp number
  const shop = await db.collection("shops").doc(shopId).get();
  if (!shop.exists) return res.status(400).json({ error: "Shop not found" });

  const whatsapp = shop.data().whatsappNumber.replace("+", "");
  const message = encodeURIComponent(
    `Hello, I want to order:\n` +
    items.map(i => `- ${i.title} x${i.quantity}`).join("\n") +
    `\nTotal: ${total}`
  );
  const whatsappUrl = `https://wa.me/${whatsapp}?text=${message}`;

  // Clear cart
  await cartRef.set({ items: [] });

  res.json({ orderId: orderRef.id, whatsappUrl });
});

// View orders
router.get("/", verifyToken, checkRole("customer"), async (req, res) => {
  const snap = await db.collection("orders")
    .where("userId", "==", req.user.uid)
    .orderBy("createdAt", "desc")
    .get();

  const orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json(orders);
});

module.exports = router;
