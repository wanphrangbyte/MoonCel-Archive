// Import the database connection configuration from your config folder
const db = require("../config/db");

// Import the bcryptjs library, which is used for securely hashing passwords
const bcrypt = require("bcryptjs");

// Import jsonwebtoken, used for generating auth tokens (likely used in your login function)
const jwt = require("jsonwebtoken");

// Export the registerUser asynchronous function so it can be called by your routes
exports.registerUser = async (req, res) => {

    // Extract the username, email, phone, and password from the incoming frontend request body
    const { username, email, phone, password } = req.body;

    // Start a try-catch block to handle any potential server errors during the process
    try {

        // Hash the plain-text password securely using a salt round 
        const hashedPassword = await bcrypt.hash(password, 10);

        // Define the SQL command to insert the new user, defaulting their gacha discount to 0
        const sql = 'INSERT INTO users (username, email, phone, password, discount_percentage) VALUES (?, ?, ?, ?, 0)';

        // Execute the SQL query against your MySQL database
        db.query(

            // Pass the SQL string defined above
            sql,

            // Pass the array of user data to securely replace the '?' placeholders in exact order
            [username, email, phone, hashedPassword],

            // Define the callback function that runs after the database attempts to save the data
            (err, result) => {

                // Check if the database threw an error (for example, if the email already exists)
                if (err) {

                    // Stop execution and send a 500 (Internal Server Error) status and the error details to the frontend
                    return res.status(500).json(err);

                }

                // If no error occurred, send a successful JSON response back to the frontend
                res.json({

                    // Define the success message that your frontend fetch() block is waiting for
                    message: "User registered successfully"

                });

            }

        );

    // If the try block fails (e.g., bcrypt crashes), catch the error here
    } catch (error) {

        // Send a 500 status code and a generic server error message back to the frontend
        res.status(500).json({ message: "Server error during registration." });

    }

};

// LOGIN USER

// Export the loginUser asynchronous function to be used as a route handler
exports.loginUser = async (req, res) => {

    // Destructure 'identifier' (which can be email OR phone) and 'password' from the frontend request body
    const { identifier, password } = req.body;

    // Start a try-catch block to handle any unexpected server crashes
    try {

        // Execute a query on the MySQL database
        db.query(

            // Search the 'users' table where either the email OR the phone matches the user's input
            "SELECT * FROM users WHERE email = ? OR phone = ?",

            // Pass the 'identifier' twice to fill both '?' placeholders in the SQL query
            [identifier, identifier],

            // Callback function that runs once the database responds
            async (err, results) => {

                // If the database encounters an error (e.g., connection lost), handle it
                if (err) {

                    // Return a 500 Internal Server Error status and a JSON message
                    return res.status(500).json({

                        message: "Database error"

                    });

                }

                // If the results array is empty, it means no user matches that email or phone
                if (results.length === 0) {

                    // Return a 404 Not Found status indicating the user doesn't exist
                    return res.status(404).json({

                        message: "User not found"

                    });

                }

                // Grab the first user object from the database results array
                const user = results[0];

                // Use bcrypt to securely compare the typed password against the hashed password in the database
                const validPassword = await bcrypt.compare(
                    password,
                    user.password
                );

                // If the passwords do NOT match...
                if (!validPassword) {

                    // Return a 401 Unauthorized status and block the login
                    return res.status(401).json({

                        message: "Invalid password"

                    });

                }

                // FIX: Check if the admin has blocked this user AFTER verifying the password, not inside the invalid password check
                if (user.is_blocked) {
                    
                    // Return a 403 Forbidden status and block access to the archive
                    return res.status(403).json({ 
                        
                        message: "Your access to the archive has been severed by an administrator." 
                    
                    });
                }

                // If credentials are valid, generate a JSON Web Token (JWT) to keep the user logged in
                const token = jwt.sign(

                    // Payload: Store the user's ID and email inside the encrypted token
                    {

                        id: user.id,

                        email: user.email

                    },

                    // Secret Key: Use the hidden JWT_SECRET from the .env file to sign the token securely
                    process.env.JWT_SECRET,

                    // Options: Set the token to automatically expire and log the user out after 7 days
                    {

                        expiresIn: "1d"

                    }

                );

                // Determine role based on email
                const userRole = user.email === 'admin@mooncel.com' ? 'admin' : 'user';

                // Send a successful 200 JSON response back to the frontend
                res.json({

                    // Send the success message
                    message: "Login successful",

                    // Send the generated JWT token so the frontend can save it in localStorage
                    token,

                    // Send computed role
                    role: userRole

                });

            }

        );

    }

    // Catch any other server-side errors (like bcrypt failing)
    catch (error) {

        // Log the error to the backend terminal for debugging
        console.log(error);

    }

};



const nodemailer = require("nodemailer");

// --- FORGOT PASSWORD (SEND OTP) ---
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        // 1. Check if the user exists
        db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) return res.status(500).json({ message: "Database error" });
            if (results.length === 0) return res.status(404).json({ message: "Email not found in the archive" });

            // 2. Generate a 6-digit OTP and set expiration (15 minutes from now)
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiry = new Date(Date.now() + 15 * 60000); 

            // 3. Save OTP to database
            db.query('UPDATE users SET reset_otp = ?, otp_expiry = ? WHERE email = ?', [otp, expiry, email], async (updateErr) => {
                if (updateErr) return res.status(500).json({ message: "Failed to save OTP" });

                // 4. Configure NodeMailer to send the email
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: 'Mooncel Archive - Password Reset OTP',
                    html: `
                        <div style="background-color: #050505; color: #fff; padding: 30px; text-align: center; border: 1px solid #ff4d6d; border-radius: 10px; font-family: sans-serif;">
                            <h1 style="color: #ff4d6d; letter-spacing: 2px;">MOONCEL ARCHIVE</h1>
                            <p style="font-size: 16px; color: #ccc;">A password reset sequence has been initiated for your account.</p>
                            <div style="margin: 30px 0; padding: 20px; background-color: #111; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #ff4d6d;">
                                ${otp}
                            </div>
                            <p style="font-size: 14px; color: #888;">This catalyst will expire in 15 minutes.</p>
                        </div>
                    `
                };

                // 5. Send the email
                transporter.sendMail(mailOptions, (mailErr) => {
                    if (mailErr) {
                        console.error("Email error:", mailErr);
                        return res.status(500).json({ message: "Failed to send OTP email" });
                    }
                    res.json({ message: "OTP sent successfully to your email" });
                });
            });
        });
    } catch (error) {
        res.status(500).json({ message: "Critical server error" });
    }
};


// --- VERIFY OTP AND RESET PASSWORD ---
exports.resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
        db.query(
            'SELECT * FROM users WHERE email = ? AND reset_otp = ? AND otp_expiry > NOW()', 
            [email, otp], 
            async (err, results) => { // Added async here so we can await bcrypt
                if (err) return res.status(500).json({ message: "Database error" });
                
                if (results.length === 0) {
                    return res.status(400).json({ message: "Invalid or expired Catalyst (OTP). Please request a new one." });
                }

                try {
                    // SECURE: Hash the brand new password before saving it to the database
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(newPassword, salt);

                    db.query(
                        'UPDATE users SET password = ?, reset_otp = NULL, otp_expiry = NULL WHERE email = ?', 
                        [hashedPassword, email], 
                        (updateErr) => {
                            if (updateErr) return res.status(500).json({ message: "Failed to forge new password" });
                            res.json({ message: "Password successfully overwritten. You may now enter the archive." });
                        }
                    );
                } catch (hashError) {
                    console.error("Hashing error:", hashError);
                    return res.status(500).json({ message: "Failed to encrypt new password" });
                }
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Critical server error" });
    }
};



// --- FETCH ALL USERS FOR ADMIN ---
exports.getAllUsers = (req, res) => {
    // Grab everyone EXCEPT the admin
    db.query('SELECT id, email, status FROM users WHERE email != "admin@mooncel.com"', (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(results);
    });
};

// --- BLOCK / UNBLOCK USER ---
exports.toggleUserStatus = (req, res) => {
    const { status } = req.body; // will be either 'active' or 'blocked'
    const userId = req.params.id;

    db.query('UPDATE users SET status = ? WHERE id = ?', [status, userId], (err) => {
        if (err) return res.status(500).json({ message: "Failed to update user status" });
        res.json({ message: `User protocol updated to: ${status}` });
    });
};