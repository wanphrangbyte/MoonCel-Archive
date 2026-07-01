const db = require("../config/db");

// 1. Add a New Product
exports.addProduct = (req, res) => {
    // Grab the text data from the frontend form
    const { name, price, stock_quantity, category } = req.body;
    
    // Grab the path to the image that Multer just saved
    const image_url = req.file ? `/uploads/products/${req.file.filename}` : null;

    if (!name || !price || !category || !image_url) {
        return res.status(400).json({ message: "Missing required fields or image file." });
    }

    const sql = "INSERT INTO products (name, price, stock_quantity, category, image_url) VALUES (?, ?, ?, ?, ?)";
    
    db.query(sql, [name, price, stock_quantity || 10, category, image_url], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to forge item in database." });
        }
        res.status(201).json({ message: "added to the Archive successfully!" });
    });
};

// 2. Update an Existing Price
exports.updatePrice = (req, res) => {
    // Grab the product ID from the URL (e.g., /admin/products/5/price)
    const productId = req.params.id;
    // Grab the new price from the request body
    const { price } = req.body;

    const sql = "UPDATE products SET price = ? WHERE id = ?";
    
    db.query(sql, [price, productId], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error during price update." });
        res.json({ message: "Price re-calibrated successfully." });
    });
};