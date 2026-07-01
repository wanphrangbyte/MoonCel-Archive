const multer = require("multer");
const path = require("path");

// Configure exactly where and how files are stored
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // This saves the images inside an 'uploads/products' folder on your backend
        cb(null, "uploads/products/"); 
    },
    filename: (req, file, cb) => {
        // Generates a unique filename using the current timestamp + original extension (e.g., 168493029.jpg)
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

module.exports = upload;