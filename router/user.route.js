const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const userModel = require('../models/user.model');
const { verifyToken, generateToken } = require("../middleware/auth");



// GET Register Page
router.get('/register', (req, res) => {
    res.render("register", { title: "Register" });
});

// POST Register User
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        if (await userModel.findOne({ email })) {
            return res.status(400).render("register", { error: "User already exists!",title:"Profile" });
        }

        // Hash password & save user
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new userModel({ username, email, password: hashedPassword });
        await user.save();

        // Generate token & set cookie
        const token = generateToken(user.email);
        res.cookie("token", token, { httpOnly: true });

        console.log("User Registered:", user.email);
        return res.redirect("/user/profile");

    } catch (error) {
        console.error("Registration Error:", error);
        return res.status(500).render("register", { error: "Something went wrong. Please try again!" });
    }
});

// GET Login Page
router.get('/login', (req, res) => {
    res.render("login", { title: "Login" });
});

// POST Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).render("login", { error: "Invalid email or password",title:"Login" });
        }

        // Generate token & set cookie
        const token = generateToken(user.email);
        res.cookie("token", token, { httpOnly: true });

        console.log("User Logged In:", user.email);
        return res.redirect("/user/profile");

    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).render("login", { error: "Something went wrong. Please try again!",title:"Login"});
    }
});

// GET User Profile (Protected)
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.verifiedUser }).populate("posts");
        if (!user) return res.redirect("/user/login");

        res.render("profile", { title: "Profile", user });

    } catch (error) {
        console.error("Error Fetching Profile:", error);
        return res.redirect("/user/login");
    }
});

// GET Logout
router.get('/logout', (req, res) => {
    res.clearCookie("token");
    return res.redirect("/user/login");
});

module.exports = router;
