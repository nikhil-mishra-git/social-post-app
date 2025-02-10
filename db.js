const mongoose = require('mongoose');
const MONGODB_URL = "mongodb://127.0.0.1:27017/SocialPostApp";


const Database = mongoose.connect(MONGODB_URL).then(()=>{
    console.log("Database Connected");
}).catch((err)=>{
    console.log("Error to connect Database",err);
})

module.exports = Database