const db = require("../config/db");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --- PROCESS INITIAL CHECKOUT & CREATE RAZORPAY ORDER ---
const processCheckout = async (req, res) => {
    const userId = req.user.id;
    const { items } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
    }

    try {
        db.query(
            "SELECT discount_percentage FROM users WHERE id = ?",
            [userId],
            (err, userResults) => {
                if (err) return res.status(500).json({ message: "Database error" });
                
                const discountPercent = userResults[0].discount_percentage || 0;
                const itemIds = items.map(item => item.id);
                const placeholders = itemIds.map(() => '?').join(',');
                
                db.query(
                    `SELECT id, price FROM products WHERE id IN (${placeholders})`,
                    itemIds,
                    async (err, productResults) => {
                        if (err) return res.status(500).json({ message: "Database error" });

                        let subtotal = 0;
                        items.forEach(cartItem => {
                            const dbProduct = productResults.find(p => p.id === cartItem.id);
                            if (dbProduct) {
                                subtotal += (dbProduct.price * cartItem.quantity);
                            }
                        });

                        const discountAmount = subtotal * (discountPercent / 100);
                        const finalTotal = subtotal - discountAmount;

                        const options = {
                            amount: Math.round(finalTotal * 100), 
                            currency: "INR",
                            receipt: `receipt_order_${userId}_${Date.now()}`
                        };

                        try {
                            const order = await razorpay.orders.create(options);
                            
                            res.json({
                                message: "Order created successfully",
                                order: order,
                                subtotal: subtotal.toFixed(2),
                                discountApplied: `${discountPercent}%`,
                                finalTotal: finalTotal.toFixed(2)
                            });
                        } catch (rzpErr) {
                            return res.status(500).json({ message: "Payment gateway error", error: rzpErr });
                        }
                    }
                );
            }
        );
    } catch (error) {
        res.status(500).json(error);
    }
};

// --- VERIFY PAYMENT & DEDUCT STOCK ---
const verifyPayment = (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, itemsPurchased } = req.body;
    const userId = req.user.id; 

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(sign.toString())
        .digest("hex");

    if (razorpay_signature === expectedSign) {
        const sql = `INSERT INTO orders (user_id, razorpay_order_id, razorpay_payment_id, status) VALUES (?, ?, ?, 'COMPLETED')`;
        
        db.query(sql, [userId, razorpay_order_id, razorpay_payment_id], (err, result) => {
            if (err) {
                console.error("Database error saving order:", err);
                return res.status(500).json({ message: "Payment verified, but failed to save order record." });
            }
            
            // Deduct the stock
            if (itemsPurchased && itemsPurchased.length > 0) {
                itemsPurchased.forEach(item => {
                    db.query(
                        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?',
                        [item.quantity, item.id, item.quantity],
                        (updateErr) => {
                            if (updateErr) console.error(`Failed to deduct stock for item ${item.id}:`, updateErr);
                        }
                    );
                });
            }

            // RESET REALITY MARBLE
            console.log(`[CHECKOUT] Resetting Reality Marble for User ID: ${userId}`);
            
            db.query(
                'UPDATE users SET discount_percentage = 0, reality_marble_used = 0, reality_marble_expires = NULL WHERE id = ?', 
                [userId],
                (resetErr, results) => {
                    if (resetErr) {
                        console.error("[CHECKOUT] CRITICAL ERROR resetting Reality Marble:", resetErr);
                    } else {
                        console.log(`[CHECKOUT] DB Update Results: ${results.affectedRows} rows changed.`);
                    }
                    
                    return res.status(200).json({ 
                        success: true, 
                        message: "Payment verified, order saved, stock deducted, and Reality Marble reset!" 
                    });
                }
            );
        });

    } else {
        return res.status(400).json({ message: "Invalid payment signature" });
    }
};

// --- BULLETPROOF EXPORT ---
module.exports = {
    processCheckout,
    verifyPayment
};