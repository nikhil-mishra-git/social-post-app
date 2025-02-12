const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const userModel = require("../models/user.model");
const postModel = require("../models/post.model");
const { verifyToken } = require("../middleware/auth");
const upload = require("../middleware/postUpload");


// View All Posts
router.get("/", async (req, res) => {
    try {
        const posts = await postModel.find({}).populate("user").sort({ createdAt: -1 });
        const user = req.verifiedUser ? await userModel.findById(req.verifiedUser) : null;
        res.render("index", { posts, userId: user ? user._id.toString() : null, title: "Home" });
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).render("register", { error: "Internal Server Error", title: "Login" });
    }
});

// Create a Post
router.post("/create", verifyToken, upload.single("postImage"), async (req, res) => {
    try {
        const { content } = req.body;
        const postImage = req.file ? req.file.filename : "";

        if (!content.trim() && !postImage) return res.status(400).json({ error: "Post must contain text or an image." });

        const user = await userModel.findOne({ email: req.verifiedUser }).populate("posts");
        if (!user) return res.status(404).json({ error: "User not found." });

        const post = new postModel({ user: user._id, content: content.trim(), image: postImage });
        await post.save();

        user.posts.push(post._id);
        await user.save();

        res.redirect("/user/profile");
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Delete a Post (With Image Deletion)
router.post("/delete/:id", verifyToken, async (req, res) => {
    try {
        const post = await postModel.findById(req.params.id);
        if (!post) return res.status(404).json({ error: "Post not found." });
    
        // Find the user by email
        const user = await userModel.findOne({ email: req.verifiedUser });
        if (!user || post.user.toString() !== user._id.toString()) 
            return res.status(403).json({ error: "Unauthorized." });
    
        // Delete post image if exists
        if (post.image) {
            const imagePath = path.join(__dirname, "../public/uploads/postImages", post.image);
            fs.existsSync(imagePath) && fs.unlinkSync(imagePath);
        }
    
        // Delete post & update user posts list
        await postModel.findByIdAndDelete(post._id);
        await userModel.findOneAndUpdate(
            { email: req.verifiedUser },
            { $pull: { posts: post._id } }
        );
    
        res.redirect("/user/profile");
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
    
});

// Get Edit Post Page
router.get("/edit/:id", verifyToken, async (req, res) => {
    try {
        const post = await postModel.findById(req.params.id).populate("user");
        if (!post) return res.status(404).json({ error: "Post not found." });

        res.render("editContent", { post, title: "Edit Post" });
    } catch (error) {
        console.error("Error fetching post for editing:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Update Post
router.post("/update/:id", verifyToken, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content.trim()) return res.status(400).json({ error: "Post content cannot be empty." });

        await postModel.findByIdAndUpdate(req.params.id, { content: content.trim() });
        res.redirect("/user/profile");
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

// Download Image
router.get("/download/:imageName", async (req, res) => {
    try {
        const imageName = req.params.imageName;
        const filePath = path.join(__dirname, "../public/uploads/postImages", imageName);

        if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found." });

        res.download(filePath, imageName);
    } catch (error) {
        console.error("Error downloading file:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
