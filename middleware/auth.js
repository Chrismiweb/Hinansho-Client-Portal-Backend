require("dotenv").config();
const jwt = require("jsonwebtoken");
const User = require("../model/user");

const isLoggedIn = async (req, res, next) => {
  console.log('🔑 isLoggedIn middleware HIT');
  console.log('📋 Headers:', req.headers);
  
  try {
    let token;

    // ✅ Check Authorization header (case-insensitive)
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
      console.log('✅ Token found in Authorization header:', token.substring(0, 20) + '...');
    } 
    // ✅ Check token header (case-insensitive)
    else if (req.headers.token || req.headers.Token) {
      token = req.headers.token || req.headers.Token;
      console.log('✅ Token found in token header:', token.substring(0, 20) + '...');
    }
    // ✅ Check cookies
    else if (req.cookies?.token) {
      token = req.cookies.token;
      console.log('✅ Token found in cookies');
    }

    console.log('🔑 Final token value:', token ? `${token.substring(0, 20)}...` : 'No token');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token provided"
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decoded successfully. User ID:', decoded.userId);

    // Find user
    const user = await User.findById(decoded.userId).select("-password");
    
    if (!user) {
      console.log('❌ User not found in database for ID:', decoded.userId);
      return res.status(401).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Set user on request
    req.user = user;
    req.role = decoded.role
    console.log('👤 User authenticated:', user.email, 'Role:', user.role);
    
    // FORCE PASSWORD CHANGE CHECK
    const allowedRoutes = [
      '/change-password',
      '/logout',
      '/me'
    ];

    if (
      user.forcePasswordChange &&
      !allowedRoutes.some(route => req.originalUrl.includes(route))
    ) {
      return res.status(403).json({
        success: false,
        mustChangePassword: true,
        message: 'Password change required'
      });
    }
    
    next();

  } catch (error) {
    console.error('❌ Auth error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: "Invalid token" 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: "Token expired" 
      });
    }
    
    return res.status(500).json({ 
      success: false,
      message: "Authentication failed" 
    });
  }
};

module.exports = { isLoggedIn };
