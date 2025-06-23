const express = require("express");
const { db } = require("../services/firebaseService");
const { verifyToken } = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/roleMiddleware");

const router = express.Router();

// Get cart
router.get("/", verifyToken, checkRole("customer"), async (req, res) => {
  const cart = await db.collection("carts").doc(req.user.uid).get();
  res.json(cart.exists ? cart.data() : { items: [] });
});

// Add/update item in cart
router.post("/", verifyToken, checkRole("customer"), async (req, res) => {
  const { productId, title, quantity, price, image, shopId } = req.body;

  const cartRef = db.collection("carts").doc(req.user.uid);
  const cartSnap = await cartRef.get();
  let items = cartSnap.exists ? cartSnap.data().items : [];

  // Replace if exists, else add
  const index = items.findIndex(i => i.productId === productId);
  if (index >= 0) {
    items[index].quantity = quantity;
  } else {
    items.push({ productId, title, quantity, price, image, shopId });
  }

  await cartRef.set({ items }, { merge: true });
  res.json({ message: "Cart updated" });
});

// Remove item from cart
router.delete("/:productId", verifyToken, checkRole("customer"), async (req, res) => {
  const productId = req.params.productId;
  const cartRef = db.collection("carts").doc(req.user.uid);
  const cartSnap = await cartRef.get();

  if (!cartSnap.exists) return res.status(404).json({ error: "Cart not found" });

  const items = cartSnap.data().items.filter(i => i.productId !== productId);
  await cartRef.set({ items });
  res.json({ message: "Item removed" });
});

module.exports = router;
