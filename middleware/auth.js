require("dotenv").config();
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const blacklist = new Set();

// Middleware to check if user is logged in
const isLoggedIn = async (req, res, next) => {
    let token = req.headers.token;

    // console.log("Headers:", req.headers);
    // console.log("Extracted Token:", token);

    if (!token) {
        return res.status(401).json({ message: "Not authorized, no token" });
    }

    if (blacklist.has(token)) {
        console.log("Token is blacklisted");
        return res.status(401).json({ message: "Token is invalid or expired" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // console.log("Decoded Token:", decoded);

        req.user = await User.findById(decoded.userId).select("-password"); // Fix userId reference
        // console.log("Authenticated User:", req.user);

        if (!req.user) {
            return res.status(401).json({ message: "Not authorized" });
        }

        next();
    } catch (error) {
        // console.error("Auth error:", error.message);
        return res.status(401).json({ message: "Not authorized, invalid token" });
    }
};

// Middleware to authenticate user
const authenticateUser = (req, res, next) => {
    const token = req.headers.token; // Extract token directly from "token" header

    if (!token) {
        return res.status(401).json({ success: false, message: "Authentication token is missing" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Add user info to request object
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: "Invalid or expired token" });
    }
};

module.exports = { isLoggedIn, authenticateUser };
