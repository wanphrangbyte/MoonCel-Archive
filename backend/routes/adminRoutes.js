const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const verifyAdmin = require("../middleware/adminMiddleware");
const upload = require("../middleware/uploadMiddleware");
const adminController = require("../controllers/adminController");

// The route chain: Is Logged In? -> Is Admin? -> Save Image -> Save to Database
router.post(
    "/admin/products", 
    verifyToken, 
    verifyAdmin, 
    upload.single("productImage"), 
    adminController.addProduct
);

router.put(
    "/admin/products/:id/price", 
    verifyToken, 
    verifyAdmin, 
    adminController.updatePrice
);

module.exports = router;

