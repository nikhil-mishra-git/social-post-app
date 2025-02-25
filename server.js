const express = require('express');
const database = require('./db');
const path = require('path');
const userRoute = require("./router/user.route");
const postRoute = require("./router/post.route");
const cookieParser = require('cookie-parser');
require('dotenv').config();

const PORT = process.env.PORT || 3500;
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// Set EJS as View Engine
app.set('view engine', 'ejs');

// Main Route
app.get('/', postRoute);

// User Routes
app.use('/user', userRoute);

// Post Routes
app.use('/posts', postRoute);

// Start Server
app.listen(PORT, () => {
    console.log(`✅ Server running on PORT: ${PORT}`);
});