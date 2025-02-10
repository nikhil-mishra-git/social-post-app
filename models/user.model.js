const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    username: {
        type: String,
        trim: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    posts:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
        }
    ]

}, { timestamps: true })

const user = mongoose.model("User", userSchema);
module.exports = user