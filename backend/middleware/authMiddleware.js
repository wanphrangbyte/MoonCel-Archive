const jwt = require("jsonwebtoken");
const db = require("../config/db"); // Required to check user status in database

const verifyToken = (req, res, next) => {
    // Get the authorization header
    const authHeader = req.headers.authorization;

    // If no header, stop and deny access
    if (!authHeader) {
        return res.status(401).json({ message: "No token provided" });
    }

    // Split the header to get the actual token
    const token = authHeader.split(" ")[1];

    // Try to verify the user token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user is blocked in database
        db.query("SELECT status FROM users WHERE id = ?", [decoded.id], (err, results) => {
            // If database error or no user found
            if (err || results.length === 0) {
                return res.status(403).json({ message: "Invalid user account" });
            }

            // If user status is blocked
            if (results[0].status === 'blocked') {
                // Deny access with 403 forbidden
                return res.status(403).json({ message: "Account has been blocked" });
            }

            // Save user info and move to next step
            req.user = decoded;
            next();
        });

    // Catch any token errors
    } catch (error) {
        // Send invalid token error
        res.status(401).json({ message: "Invalid token" });
    }
};

module.exports = verifyToken;