
const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { processCheckout, verifyPayment } = require("../controllers/checkoutController");

router.post("/checkout", verifyToken, processCheckout);

// The new secure verification route
router.post("/verify-payment", verifyToken, verifyPayment);

module.exports = router;