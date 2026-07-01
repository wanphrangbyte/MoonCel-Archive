const express = require("express");
const router = express.Router();
const { getAllUsers, toggleUserStatus } = require("../controllers/authController");

const { 
    registerUser, 
    loginUser,
    forgotPassword,  // Added this!
    resetPassword    //  Added this too so it doesn't crash on Phase 2!
} = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword); 
router.get("/users", getAllUsers);
router.put("/users/:id/status", toggleUserStatus);

module.exports = router;