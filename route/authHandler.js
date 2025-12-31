const express = require('express');
const { registerAccount, logout, resendOTP, resetPassword, verifyRegOTP, verifyPassOtp, sendResetOtp, resendResetOtp, login, changePassword } = require('../controller/auth');
const { isLoggedIn } = require('../middleware/auth');
const { checkPermission } = require('../middleware/checkPermission');
const checkRole = require('../middleware/checkRole');
const passport = require('passport');

const authRouter = express.Router();

authRouter.post('/register', registerAccount)
authRouter.post("/verify-otp", verifyRegOTP);
authRouter.post("/resend-otp", resendOTP);
authRouter.post('/login', login)
authRouter.post('/logout', isLoggedIn, logout)
authRouter.post('/forgot-password', sendResetOtp)
authRouter.post('/verify-reset', verifyPassOtp)
authRouter.post('/resend-reset', resendResetOtp)
authRouter.post('/reset-password', resetPassword)
authRouter.post('/change-password', isLoggedIn, changePassword);


module.exports = authRouter;