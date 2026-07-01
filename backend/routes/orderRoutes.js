const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { getUserOrders } = require("../controllers/orderController");

// Protect this route so only authenticated users can see their history
router.get("/user-history", verifyToken, getUserOrders);

module.exports = router;