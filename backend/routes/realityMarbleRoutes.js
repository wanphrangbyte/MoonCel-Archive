const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const db = require("../config/db");

router.get(
    "/reality-marble-access",
    verifyToken,
    (req, res) => {
        const userId = req.user.id;

        // UPDATE 1: Select discount_percentage along with the expiration date
        const sql = "SELECT reality_marble_expires, discount_percentage FROM users WHERE id = ?";

        db.query(
            sql,
            [userId],
            (err, results) => {
                if (err) {
                    return res.status(500).json({
                        message: "Database error"
                    });
                }

                //CHECK: If the user was deleted from the DB, stop here.
                if (results.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        

                const user = results[0];
                const now = new Date();
                const expires = user.reality_marble_expires;

                if (!expires || new Date(expires) < now) {
                    const nextWeek = new Date();
                    nextWeek.setDate(nextWeek.getDate() + 7);

                    // UPDATE 2: Generate the secure discount on the server (5% to 15%)
                    const secureDiscount = Math.floor(Math.random() * 11) + 5;

                    // UPDATE 3: Save the new discount_percentage to the database
                    db.query(
                        `UPDATE users
                         SET reality_marble_used = true,
                         reality_marble_expires = ?,
                         discount_percentage = ?
                         WHERE id = ?`,
                        [nextWeek, secureDiscount, userId],
                        () => {
                            return res.json({
                                access: true,
                                expires: nextWeek,
                                discount: secureDiscount // Send new discount to frontend
                            });
                        }
                    );
                } else {
                    // UPDATE 4: Send the existing database discount to the frontend
                    return res.json({
                        access: false,
                        expires,
                        discount: user.discount_percentage 
                    });
                }
            }
        );
    }
);

module.exports = router;