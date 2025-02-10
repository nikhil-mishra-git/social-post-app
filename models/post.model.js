const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({

    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    content:{
        type:String,
        required:true,
        trim:true
    },
    likes:[
        {
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        }
    ]


},{timestamps:true})

const post = mongoose.model("Post",postSchema);
module.exports = post