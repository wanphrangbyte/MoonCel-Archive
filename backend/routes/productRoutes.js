const express = require("express");
const router = express.Router();
const productController = require("../controllers/productcontroller");
const multer = require("multer");
const path = require("path");

// --- MULTER CONFIGURATION ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // This tells Multer where to save the files. 
        // Note: Make sure you have an 'uploads' folder in your backend directory!
        cb(null, 'uploads/'); 
    },
    filename: function (req, file, cb) {
        // This creates a unique timestamp name for every image uploaded
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// --- ROUTES ---

// Get all products
router.get("/products", productController.getProducts);

// The upgraded upload route (accepts both Front and Back images)
router.post("/products", upload.fields([
    { name: 'image', maxCount: 1 }, 
    { name: 'image_back', maxCount: 1 }
]), productController.addProduct);

// Delete product
router.delete("/products/:id", productController.deleteProduct);

// Update product (Admin Edit)
router.put("/products/:id", productController.updateProductDetails);

module.exports = router;