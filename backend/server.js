// Load environment variables from the .env file into process.env to keep secrets safe
require("dotenv").config();

// Import the Express framework to build and manage the web server
const express = require("express");

// Import the CORS middleware to allow requests from your frontend (port 5500) to your backend (port 5000)
const cors = require("cors");

// Import the built-in Node.js 'path' module to handle file and directory paths securely
const path = require("path");

// Import the Reality Marble routes to handle the gacha discount system
const realityMarbleRoutes = require("./routes/realityMarbleRoutes");

// Initialize the Express application to start setting up the server
const app = express();

// Execute the database configuration file to establish a connection to MySQL on startup
require("./config/db");

// Import the authentication routes handling user registration and login
const authRoutes = require("./routes/authRoutes");

// Import the product routes handling the retrieval of shop items
const productRoutes = require("./routes/productRoutes");

// Import the checkout routes handling Razorpay order creation and secure verification
const checkoutRoutes = require("./routes/checkoutRoutes");

// Import the order routes handling the retrieval of a user's past summons and history
const orderRoutes = require('./routes/orderRoutes');

// Import the new administrative routes handling user blocking, product creation, and image uploads
const adminRoutes = require("./routes/adminRoutes");

// Apply the CORS middleware to all incoming server requests
app.use(cors());

// Apply the built-in JSON middleware to automatically parse incoming request bodies into JavaScript objects
app.use(express.json());


// Expose the 'uploads' directory to the public so the browser can load images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make the 'uploads' directory publicly accessible so the frontend browser can display the stored product images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Mount the authentication routes to the server
app.use(authRoutes);

// Mount the product routes to the server
app.use(productRoutes);

// Mount the Reality Marble routes to the server
app.use(realityMarbleRoutes);

// Mount the checkout routes to the root path of the server
app.use("/", checkoutRoutes);

// Mount the order history routes to the root path of the server
app.use('/', orderRoutes);

// Mount the new admin management routes to the root path of the server
app.use('/', adminRoutes);

// Define a basic GET route at the root URL ("/") to act as a health check
app.get("/", (req, res) => {

    // Send a simple text string back to the browser to confirm the server is alive
    res.send("Backend Running");

// Close the GET route callback function
});

// Define the port variable by checking the environment variables first, falling back to 5000 if not found
const PORT = process.env.PORT || 5000;

// Command the Express application to actively listen for network traffic on the specified port
app.listen(PORT, () => {

    // Log a success message to the backend terminal indicating the server successfully booted up
    console.log(`Server running on port ${PORT}`);

// Close the listen callback function
});