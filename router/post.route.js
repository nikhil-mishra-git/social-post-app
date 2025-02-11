const express = require('express');
const router = express.Router();
const userModel = require('../models/user.model');
const postModel = require('../models/post.model');
const { verifyToken } = require("../middleware/auth");



// View All Posts
router.get('/', async (req, res) => {
    try {
        const posts = await postModel.find({}).populate("user").sort({ createdAt: -1 });
        const user = req.verifiedUser ? await userModel.findOne({ email: req.verifiedUser }) : null;

        res.render("index", { posts, userId: user ? user._id.toString() : null, title: "Home" });
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).render("register", { error: "Internal Server Error", title: "Login" });
    }
});

// Create a Post
router.post("/create", verifyToken, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content.trim()) {
            return res.status(400).json({ error: "Post content cannot be empty." });
        }

        const user = await userModel.findOne({ email: req.verifiedUser }).populate("posts");
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        const post = new postModel({ user: user._id, content: content.trim() });
        await post.save();

        user.posts.push(post._id);
        await user.save();

        const updatedUser = await userModel.findById(user._id).populate("posts");
        res.render('profile', { user: updatedUser, title: "Profile" });

    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Delete a Post
router.post('/delete/:id', verifyToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await postModel.findById(postId);

        if (!post) {
            return res.status(404).json({ error: "Post not found." });
        }

        const user = await userModel.findOne({ email: req.verifiedUser });
        if (!user || post.user.toString() !== user._id.toString()) {
            return res.status(403).json({ error: "Unauthorized to delete this post." });
        }

        await postModel.findByIdAndDelete(postId);

        const updatedUser = await userModel.findByIdAndUpdate(
            user._id,
            { $pull: { posts: postId } },
            { new: true }
        ).populate("posts");

        res.render('profile', { user: updatedUser, title: "Profile" });

    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get Edit Post Page
router.get("/edit/:id", verifyToken, async (req, res) => {
    try {
        const post = await postModel.findById(req.params.id).populate("user");
        res.render("editContent", { post, title: "Profile" });

    } catch (error) {
        console.error("Error fetching post for editing:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Update Post
router.post("/update/:id", verifyToken, async (req, res) => {
    try {
        await postModel.findByIdAndUpdate(req.params.id, { content: req.body.content.trim() });
        res.redirect('/user/profile');

    } catch (error) {
        console.error("Error updating post:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Like/Unlike Post
router.get("/likes/:id", verifyToken, async (req, res) => {
    try {
        const post = await postModel.findById(req.params.id);
        const user = await userModel.findOne({ email: req.verifiedUser });

        if (!post || !user) {
            return res.status(404).json({ error: "Post or User not found." });
        }

        const userId = user._id.toString();
        if (post.likes.includes(userId)) {
            post.likes.pull(userId);
        } else {
            post.likes.push(userId);
        }

        await post.save();
        res.redirect('/user/profile');

    } catch (error) {
        console.error("Error liking post:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Like/Unlike Post from Home Page
router.get("/homelikes/:id", verifyToken, async (req, res) => {
    try {
        const post = await postModel.findById(req.params.id);
        const user = await userModel.findOne({ email: req.verifiedUser });

        if (!post || !user) {
            return res.status(404).json({ error: "Post or User not found." });
        }

        const userId = user._id.toString();
        if (post.likes.includes(userId)) {
            post.likes.pull(userId);
        } else {
            post.likes.push(userId);
        }

        await post.save();
        res.redirect('/');

    } catch (error) {
        console.error("Error liking post:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
