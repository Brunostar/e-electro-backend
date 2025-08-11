const express = require("express");

const router = express.Router();

// Get cart
router.get("/", async (req, res) => {
  res.json({ "res": "Yay!! we are live!!!" });
});