require('dotenv').config()
const mongoose = require('mongoose');
// const DATABASE_URI = process.env.DATABASE_LOCAL;
const DATABASE_URI = process.env.DATABASE_URI;

const Database = mongoose.connect(DATABASE_URI).then(()=>{
    console.log("Database Connected");
}).catch((err)=>{
    console.log("Error to connect Database",err);
})

module.exports = Database