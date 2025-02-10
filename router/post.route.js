const express = require('express');
const router = express.Router();
const userModel = require('../models/user.model');
const postModel = require('../models/post.model');
const { verifyToken } = require("../middleware/auth");


// Create Post
router.post("/create", verifyToken, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content || content.trim() === "") {
            return res.status(400).json({ error: "Post content cannot be empty." });
        }

        const user = await userModel.findOne({ email: req.verifiedUser }).populate("posts");
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        // Create new post
        const post = new postModel({ user: user._id, content: content.trim() });
        await post.save();

        // Add post to user's posts array
        user.posts.push(post._id);
        await user.save();

        // Fetch updated user data
        const updatedUser = await userModel.findById(user._id).populate("posts");

        console.log("✅ Post Created Successfully");
        res.render('profile', { user: updatedUser, title: "Profile" });

    } catch (error) {
        console.error("❌ Error Creating Post:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Delete Post
router.post('/delete/:id', verifyToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await postModel.findById(postId);

        if (!post) {
            return res.status(404).json({ error: "Post not found!" });
        }

        // Verify if the logged-in user owns the post
        const user = await userModel.findOne({ email: req.verifiedUser });
        if (!user || post.user.toString() !== user._id.toString()) {
            return res.status(403).json({ error: "Unauthorized to delete this post." });
        }

        // Delete post from database
        await postModel.findByIdAndDelete(postId);

        // Remove post reference from user’s posts array
        const updatedUser = await userModel.findByIdAndUpdate(
            user._id,
            { $pull: { posts: postId } },
            { new: true }
        ).populate("posts");

        console.log("✅ Post Deleted Successfully");
        res.render('profile', { user: updatedUser, title: "Profile" });

    } catch (error) {
        console.error("❌ Error Deleting Post:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


module.exports = router;
