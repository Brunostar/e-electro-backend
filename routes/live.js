const express = require("express");

const router = express.Router();

/**
 * Keep alive
 * GET /api/live
 */
router.get("/", async (req, res) => {
    try {
        res.status(200).json({ "res": "Yay!! we are live!!!" });
    } catch (error) {
        console.error("Error ", error);
        res.status(500).json({ error: "Failed to keep alive" });
    }
});