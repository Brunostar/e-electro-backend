const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");

const shopRoutes = require("./routes/shops");
const productRoutes = require("./routes/products");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.use("/api/shops", shopRoutes);
app.use("/api/products", productRoutes);

// Export to Firebase Functions
exports.api = functions.https.onRequest(app);
