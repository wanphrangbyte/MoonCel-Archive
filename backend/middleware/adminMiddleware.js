const db = require("../config/db");

const verifyAdmin = (req, res, next) => {
    // req.user.id is already provided by your first verifyToken middleware
    const userId = req.user.id;

    db.query("SELECT role FROM users WHERE id = ?", [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Database error during authorization." });
        }
        
        if (results.length === 0 || results[0].role !== 'admin') {
            return res.status(403).json({ message: "Access Denied: Master Command clearance required." });
        }

        // If they are an admin, allow the request to proceed to the controller
        next();
    });
};

module.exports = verifyAdmin;