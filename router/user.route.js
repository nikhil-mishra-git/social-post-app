const express = require('express');
const router = express.Router();
const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const { verifyToken, generateToken } = require("../middleware/auth");



// Register User (GET)
router.get('/register', (req, res) => {
    res.render("register", { title: "Profile" });
});

// Register User (POST)
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await userModel.findOne({ email });

        if (existingUser) {
            return res.status(400).render("register", { error: "User already exists!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new userModel({ username, email, password: hashedPassword });

        await user.save();
        const token = generateToken(user.email);
        res.cookie("token", token, { httpOnly: true });

        console.log("✅ User Created:", user.email);
        return res.redirect("/user/profile");

    } catch (error) {
        console.error("❌ Registration Error:", error);
        return res.status(500).render("register", { error: "Internal Server Error" });
    }
});

// Login User (GET)
router.get('/login', (req, res) => {
    res.render("login", { title: "Profile" });
});

// Login User (POST)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(401).render("login", { error: "Invalid email or password" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).render("login", { error: "Invalid email or password" });
        }

        const token = generateToken(user.email);
        res.cookie("token", token, { httpOnly: true });

        console.log("✅ User Logged In:", user.email);
        return res.redirect("/user/profile");

    } catch (error) {
        console.error("❌ Login Error:", error);
        return res.status(500).render("login", { error: "Internal Server Error" });
    }
});

// User Profile (Protected Route)
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.verifiedUser }).populate("posts");
        if (!user) {
            return res.redirect("/user/login");
        }

        res.render("profile", { title: "Profile", user });

    } catch (error) {
        console.error("❌ Error Fetching Profile:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

// User Logout
router.get('/logout', (req, res) => {
    res.clearCookie("token");
    return res.redirect("/user/login");
});

module.exports = router;
