const db = require("../config/db");

// --- GET ALL PRODUCTS ---
exports.getProducts = (req, res) => {
    db.query('SELECT * FROM products', (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(results);
    });
};

// --- ADD NEW PRODUCT (Handles Front & Back Images) ---
exports.addProduct = (req, res) => {
    const { name, price, category, stock_quantity, description, available_sizes } = req.body;
    
    // Safely extract Multer image paths
    const imageUrl = req.files && req.files['image'] ? `/uploads/${req.files['image'][0].filename}` : null;
    const imageBackUrl = req.files && req.files['image_back'] ? `/uploads/${req.files['image_back'][0].filename}` : null;
    
    // Apply defaults if fields are empty
    const finalDesc = description || 'A legendary relic forged in the Mooncel Archive.';
    const finalSizes = (category === 'poster' || category === 'relic') ? 'N/A' : (available_sizes || 'S, M, L, XL');

    const sql = 'INSERT INTO products (name, price, category, stock_quantity, image_url, image_url_back, description, available_sizes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    
    db.query(sql, [name, price, category, stock_quantity, imageUrl, imageBackUrl, finalDesc, finalSizes], (err, result) => {
        if (err) return res.status(500).json({ message: "Failed to upload relic to archive" });
        res.json({ message: "Relic successfully added to archive!" });
    });
};

// --- DELETE PRODUCT ---
exports.deleteProduct = (req, res) => {
    const productId = req.params.id;
    db.query('DELETE FROM products WHERE id = ?', [productId], (err, result) => {
        if (err) return res.status(500).json({ message: "Failed to delete relic" });
        res.json({ message: "Relic permanently purged from archive." });
    });
};

// --- UPDATE PRODUCT (Admin Edit) ---
exports.updateProductDetails = (req, res) => {
    const productId = req.params.id;
    const { name, price, description, available_sizes } = req.body;

    const sql = 'UPDATE products SET name = ?, price = ?, description = ?, available_sizes = ? WHERE id = ?';
    
    db.query(sql, [name, price, description, available_sizes, productId], (err, result) => {
        if (err) return res.status(500).json({ message: "Failed to update archive record." });
        res.json({ message: "Archive record successfully updated!" });
    });
};