const jwt = require("jsonwebtoken");
const User = require("../model/user");

const checkPermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            const token = req.headers.token || req.header("Authorization")?.split(" ")[1];

            if (!token) {
                return res.status(401).json({ message: "No token provided", success: false });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);

            if (!user) {
                return res.status(404).json({ message: "User not found", success: false });
            }

            req.user = user; // Attach to request for controller access

            // Grant full access to Master Admin
            if (user.user_type === "Master") {
                return next();
            }

            // Check permission for Admin
            if (user.user_type === "Admin" && Array.isArray(user.permissions) && user.permissions.includes(requiredPermission)) {
                return next();
            }

            return res.status(403).json({ message: "Access denied. Insufficient permissions.", success: false });

        } catch (error) {
            return res.status(500).json({ message: "Server error: " + error.message, success: false });
        }
    };
};

module.exports = { checkPermission };
