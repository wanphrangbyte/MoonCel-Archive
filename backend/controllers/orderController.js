const db = require("../config/db");

exports.getUserOrders = (req, res) => {
    // req.user.id is provided by your verifyToken middleware
    const userId = req.user.id; 

    const sql = `
        SELECT id, razorpay_order_id, status, created_at 
        FROM orders 
        WHERE user_id = ? 
        ORDER BY created_at DESC
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Failed to retrieve archive records." });
        }
        res.status(200).json(results);
    });
};