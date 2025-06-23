const express = require("express");
const { db } = require("../services/firebaseService");
const { verifyToken } = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/roleMiddleware");

const router = express.Router();

/**
 * Helper: update average rating on parent doc
 */
async function updateAverageRating(parentType, parentId) {
  const reviewsRef = db.collection(`${parentType}/${parentId}/reviews`);
  const snap = await reviewsRef.get();

  const totalReviews = snap.size;
  const totalRating = snap.docs.reduce((sum, doc) => sum + doc.data().rating, 0);
  const avgRating = totalReviews > 0 ? totalRating / totalReviews : 0;

  const parentRef = db.collection(parentType).doc(parentId);
  await parentRef.update({
    averageRating: avgRating,
    reviewCount: totalReviews,
  });
}

// POST /api/reviews/product/:productId
router.post("/product/:productId", verifyToken, checkRole("customer"), async (req, res) => {
  const { rating, comment } = req.body;
  const { productId } = req.params;

  if (rating < 1 || rating > 5) return res.status(400).json({ error: "Rating must be 1–5" });

  const reviewRef = db.collection(`products/${productId}/reviews`).doc(req.user.uid);
  await reviewRef.set({
    userId: req.user.uid,
    rating,
    comment: comment || "",
    createdAt: new Date(),
  });

  await updateAverageRating("products", productId);
  res.json({ message: "Product review submitted" });
});

// GET /api/reviews/product/:productId
router.get("/product/:productId", async (req, res) => {
  const { productId } = req.params;

  const snap = await db.collection(`products/${productId}/reviews`)
    .orderBy("createdAt", "desc")
    .get();

  const reviews = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json(reviews);
});

// POST /api/reviews/shop/:shopId
router.post("/shop/:shopId", verifyToken, checkRole("customer"), async (req, res) => {
  const { rating, comment } = req.body;
  const { shopId } = req.params;

  if (rating < 1 || rating > 5) return res.status(400).json({ error: "Rating must be 1–5" });

  const reviewRef = db.collection(`shops/${shopId}/reviews`).doc(req.user.uid);
  await reviewRef.set({
    userId: req.user.uid,
    rating,
    comment: comment || "",
    createdAt: new Date(),
  });

  await updateAverageRating("shops", shopId);
  res.json({ message: "Shop review submitted" });
});

// GET /api/reviews/shop/:shopId
router.get("/shop/:shopId", async (req, res) => {
  const { shopId } = req.params;

  const snap = await db.collection(`shops/${shopId}/reviews`)
    .orderBy("createdAt", "desc")
    .get();

  const reviews = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json(reviews);
});

module.exports = router;
