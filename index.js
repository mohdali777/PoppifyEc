// Import necessary modules
const express = require("express");
const path = require("path");
const mongoose = require("./db/connect");
const env = require("dotenv").config();
const UserRoutes = require("./routes/user");
const AdminRoutes = require("./routes/admin")
const session = require("express-session");
const nocache = require("nocache");
const passport = require("./config/passport");

// Initialize the Express app
const app = express();

// Middleware for serving static files and parsing request bodies
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(session({
  secret: process.env.secret, // Secret key for session
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS in production
}));

// Passport session setup
app.use(passport.initialize());
app.use(passport.session());

// Disable caching
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes setup
app.use("/", UserRoutes);
app.use("/admin",AdminRoutes)

// Error handling route
app.use((req, res) => {
  res.render('users/error');
});

// MongoDB connection and error handling
mongoose().catch(err => {
  console.error("Error connecting to MongoDB:", err);
});

// Start the server
app.listen(process.env.PORT, () => {
  console.log("Server is running on port", process.env.PORT);
});
