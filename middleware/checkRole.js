require("dotenv").config();
const jwt = require("jsonwebtoken");
const User = require("../model/user");

const checkRole = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            const token = req.headers.token || req.header('Authorization')?.split(" ")[1];

            if (!token) {
                return res.status(401).json({ message: 'No token, authorization denied', success: false });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!decoded.userId) {
                return res.status(400).json({ success: false, error: 'Token does not contain user ID' });
            }

            const user = await User.findById(decoded.userId);
            if (!user) {
                return res.status(403).json({ message: 'User not found', success: false });
            }

            if (!allowedRoles.includes(user.user_type)) {
                return res.status(403).json({ message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`, success: false });
            }

            req.user = user;
            next();

        } catch (error) {
            console.error("Role Check Error:", error.message);
            return res.status(401).json({ message: 'Invalid token', success: false });
        }
    };
};

module.exports = checkRole;
