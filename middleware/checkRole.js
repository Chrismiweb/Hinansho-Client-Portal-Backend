const jwt = require('jsonwebtoken');
const User = require('../model/user');

const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    console.log('='.repeat(50));
    console.log('🔐 ALLOW ROLES middleware HIT');
    console.log('📋 Request URL:', req.originalUrl);
    console.log('👤 req.user exists?', !!req.user);
    console.log('👤 Full req.user:', req.user);
    console.log('🎭 Allowed roles:', allowedRoles);
    
    if (!req.user) {
      console.log('❌ NO USER FOUND - returning 401');
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    const role = req.user.role || req.user.user_type || req.user.userType;
    console.log('🎭 User role detected:', role);
    
    if (!allowedRoles.includes(role)) {
      console.log('❌ Role not allowed:', role, 'Allowed:', allowedRoles);
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    console.log('✅ Role check passed!');
    next();
  };
};

module.exports = allowRoles;
