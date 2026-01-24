require("dotenv").config();
const mongoose = require('mongoose')
const {isStrongPassword} = require("validator");
const User = require("../model/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const speakeasy = require('speakeasy');
const { default: axios } = require("axios");
const crypto = require('crypto');
const { sendContactEmail } = require("../middleware/nodemailerMiddleware");
const { transporter } = require("../middleware/nodemailerMiddleware");
const Otp = require("../model/otp"); 
const blacklist = new Set();
const userDashboardModel = require("../model/userDashboard");
const passport = require("passport");
const { generateOTP, comparePassword, generateToken } = require("../utilis/helpers");

  
// Register Account
// Register Account - Updated Email Template
const registerAccount = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // 1. Required fields
    const required = ['username', 'email', 'password', 'role'];
    const missing = required.filter(k => !req.body[k]);
    if (missing.length) {
      return res.status(400).json({
        error: `Missing: ${missing.join(', ')}`,
        success: false
      });
    }

    const normalisedEmail = email.toLowerCase().trim();

    // 2. Duplicate checks
    if (await User.findOne({ email: normalisedEmail })) {
      return res.status(400).json({ error: 'Email already exists', success: false });
    }
    if (await User.findOne({ username })) {
      return res.status(400).json({ error: 'Username already exists', success: false });
    }

    // 3. Password
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password too weak', success: false });
    }

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Create user
    const newUser = await User.create({
      username,
      email: normalisedEmail,
      password: hashedPassword,
      role,
      isVerified: false
    });

    // 6. OTP
    const otp = generateOTP();
    await Otp.create({
      userId: newUser._id,
      otp,
      otpType: 'register',
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    // 7. Send email with updated template
    await transporter.sendMail({
      from: { name: 'Hinansho Client Portal', address: process.env.ADMIN_EMAIL },
      to: normalisedEmail,
      subject: 'Verify Your Email - Hinansho Client Portal',
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email Verification - Hinansho Client Portal</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F5F7FB;
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #0F172A;
    }

    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #FFFFFF;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 6px 25px rgba(15, 23, 42, 0.08);
    }

    .header {
      padding: 28px 20px;
      text-align: center;
      background-color: #ffffff;
      border-bottom: 2px solid #C9A24D;
    }

    .header img {
      max-width: 90px;
      height: auto;
      display: block;
      margin: 0 auto;
    }

    .header h2 {
      color: #0F172A;
      margin-top: 10px;
      font-weight: 600;
    }

    .content {
      padding: 36px 32px;
    }

    .content h1 {
      font-size: 22px;
      margin-bottom: 14px;
      font-weight: 600;
      color: #0F172A;
    }

    .content p {
      font-size: 15px;
      line-height: 1.7;
      color: #475569;
      margin-bottom: 14px;
    }

    .otp-wrapper {
      text-align: center;
      margin: 28px 0;
    }

    .otp-box {
      display: inline-block;
      background: #C9A24D;
      color: #FFFFFF;
      font-size: 30px;
      font-weight: 700;
      letter-spacing: 6px;
      padding: 16px 36px;
      border-radius: 12px;
      box-shadow: 0 6px 15px rgba(201, 162, 77, 0.35);
    }

    .user-info {
      background: #F8FAFC;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #C9A24D;
    }

    .user-info p {
      margin: 5px 0;
      font-size: 14px;
    }

    .features {
      margin: 25px 0;
    }

    .feature-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 12px;
      font-size: 14px;
      color: #475569;
    }

    .feature-item span {
      color: #C9A24D;
      font-weight: bold;
      margin-right: 10px;
      font-size: 18px;
    }

    .role-specific {
      background: #FFF9ED;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      border: 1px solid #FFE4B5;
    }

    .role-specific h3 {
      color: #0F172A;
      font-size: 16px;
      margin-top: 0;
    }

    .footer {
      background: #0F172A;
      color: #CBD5E1;
      font-size: 12.5px;
      text-align: center;
      padding: 18px 20px;
    }

    .footer span {
      color: #C9A24D;
      font-weight: 600;
    }

    @media (max-width: 600px) {
      .content {
        padding: 28px 22px;
      }

      .otp-box {
        font-size: 24px;
        padding: 14px 28px;
        letter-spacing: 4px;
      }

      .header img {
        max-width: 75px;
      }
    }
  </style>
</head>

<body>
  <div class="container">

    <!-- Header -->
    <div class="header">
      <img src="cid:logo" alt="Hinansho Logo" />
      <h2>Hinansho Client Portal</h2>
    </div>

    <!-- Content -->
    <div class="content">
      <h1>Welcome to Hinansho Client Portal!</h1>

      <p>Hello ${username || "there"},</p>

      <p>
        Welcome to the <strong>Hinansho Client Portal</strong> – your dedicated platform for real estate investment management,
        transparent communication, and seamless financial tracking.
      </p>

      <div class="user-info">
        <p><strong>Account Details:</strong></p>
        <p>Email: ${normalisedEmail}</p>
        <p>Role: ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
      </div>

      <p>
        To activate your account and access your personalized dashboard, please verify your email address
        using the one-time password below:
      </p>

      <div class="otp-wrapper">
        <div class="otp-box">${otp}</div>
      </div>

      <p>
        <strong>This OTP is valid for 10 minutes.</strong> If it expires, you can request a new one from the login page.
      </p>

      <div class="features">
        <p><strong>Once verified, you'll be able to:</strong></p>
        <div class="feature-item"><span>✓</span> Access your personalized dashboard</div>
        <div class="feature-item"><span>✓</span> Track investment portfolios and project progress</div>
        <div class="feature-item"><span>✓</span> View financial statements and rental income</div>
        <div class="feature-item"><span>✓</span> Communicate with your team through our secure messaging system</div>
        <div class="feature-item"><span>✓</span> Access important documents and reports</div>
      </div>

      ${role === 'Investor' ? `
      <div class="role-specific">
        <h3>Investor-Specific Features:</h3>
        <p>As an investor, you'll have access to:</p>
        <ul style="color: #475569; font-size: 14px; padding-left: 20px;">
          <li>Project portfolio tracking across multiple developments</li>
          <li>Detailed construction progress updates with photos/videos</li>
          <li>Rental income tracking and expense breakdowns</li>
          <li>Downloadable financial statements</li>
        </ul>
      </div>
      ` : ''}

      ${role === 'Tenant' ? `
      <div class="role-specific">
        <h3>Tenant-Specific Features:</h3>
        <p>As a tenant, you'll have access to:</p>
        <ul style="color: #475569; font-size: 14px; padding-left: 20px;">
          <li>Online rent payment portal</li>
          <li>Maintenance request system with photo attachments</li>
          <li>Direct messaging with property management</li>
          <li>Rent payment history and receipts</li>
        </ul>
      </div>
      ` : ''}

      <p>
        If you didn't request this account or believe this is an error, please contact our support team immediately.
      </p>

      <p>
        We're excited to help you manage your real estate investments more effectively!
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      © ${new Date().getFullYear()} <span>Hinansho Management</span>. All rights reserved.<br />
      Real Estate Investment Management Platform<br />
      Providing transparency, communication, and financial tracking for investors and tenants.
    </div>

  </div>
</body>
</html>
      `,
      attachments: [
        {
          filename: "logo.png",
          path: "./Hinansho Gold 2 1.png",
          cid: "logo",
        },
      ],
    });

    // 8. Success
    res.status(201).json({
      message: 'Registration successful! Please check your email for verification OTP.',
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        username: newUser.username
      },
      success: true
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(400).json({ error: err.message, success: false });
  }
};

const createInvestorByAdmin = async (req, res) => {
  try {
    const adminId = req.user._id;

    const { username, email, fullName, phone } = req.body;

    // 1️⃣ Required fields
    const required = ['username', 'email', 'fullName'];
    const missing = required.filter(k => !req.body[k]);
    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Missing: ${missing.join(', ')}`
      });
    }

    const normalisedEmail = email.toLowerCase().trim();

    // 2️⃣ Duplicate checks
    if (await User.findOne({ email: normalisedEmail })) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    if (await User.findOne({ username })) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // 3️⃣ Generate secure temporary password
    const tempPassword = crypto.randomBytes(6).toString('base64'); // ~10 chars

    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // 4️⃣ Create investor user
    const investor = await User.create({
      username,
      email: normalisedEmail,
      password: hashedPassword,
      role: 'Investor',
      isVerified: true,
      forcePasswordChange: true,
      createdBy: adminId
    });

    // 5️⃣ Send login credentials email
    await transporter.sendMail({
      from: { name: 'Hinansho Client Portal', address: process.env.ADMIN_EMAIL },
      to: normalisedEmail,
      subject: 'Your Investor Account Has Been Created',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Investor Account Created</title>
</head>
<body style="background:#F5F7FB;font-family:Segoe UI,Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:14px;box-shadow:0 6px 25px rgba(0,0,0,.08);overflow:hidden">
    
    <div style="padding:28px;text-align:center;border-bottom:2px solid #C9A24D">
      <img src="cid:logo" width="90" />
      <h2>Hinansho Client Portal</h2>
    </div>

    <div style="padding:32px">
      <h3>Hello ${fullName},</h3>

      <p>
        An investor account has been created for you on the
        <strong>Hinansho Client Portal</strong>.
      </p>

      <div style="background:#F8FAFC;padding:16px;border-left:4px solid #C9A24D;border-radius:8px">
        <p><strong>Login Details:</strong></p>
        <p>Email: ${normalisedEmail}</p>
        <p>Username: ${username}</p>
        <p>Temporary Password: <strong>${tempPassword}</strong></p>
      </div>

      <p>
        For security reasons, you will be required to change your password
        immediately after your first login.
      </p>

      <p>
        Login here: <br />
        <a href="${process.env.CLIENT_PORTAL_URL}">
          ${process.env.CLIENT_PORTAL_URL}
        </a>
      </p>

      <p>
        If you have any questions, please contact our support team.
      </p>
    </div>

    <div style="background:#0F172A;color:#CBD5E1;font-size:12px;text-align:center;padding:18px">
      © ${new Date().getFullYear()} Hinansho Management
    </div>

  </div>
</body>
</html>
      `,
      attachments: [
        {
          filename: "logo.png",
          path: "./Hinansho Gold 2 1.png",
          cid: "logo",
        },
      ],
    });

    // 6️⃣ Success response
    res.status(201).json({
      success: true,
      message: 'Investor account created and credentials sent via email',
      investor: {
        id: investor._id,
        email: investor.email,
        username: investor.username
      }
    });

  } catch (error) {
    console.error('Create investor error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Verify Register OTP
const verifyRegOTP = async (req, res) => {
    try {
        const { otp } = req.body;

        if (!otp) {
            return res.status(400).json({ error: 'OTP is required', success: false });
        }

        const otpEntry = await Otp.findOne({ otp, otpType: 'register' });
        // console.log('OTP Entry:', otpEntry);

        if (!otpEntry) {
            return res.status(400).json({ error: 'Invalid OTP', success: false });
        }

          // Check if OTP is expired
          if (otpEntry.expiresAt < new Date()) {
            return res.status(400).json({ error: 'OTP has expired', success: false });
        }

        // Find the user associated with OTP
        const user = await User.findById(otpEntry.userId);
        // console.log('User:', user); // Debugging

        if (!user) {
            return res.status(400).json({ error: 'User not found', success: false });
        }

        // Mark user as verified
        user.isVerified = true;

        // Remove OTP entry after verification
        await Otp.deleteOne({ _id: otpEntry._id });

        await userDashboardModel.create({ userId: user._id });
        await user.save();

        res.json({ message: 'Email verified successfully', success: true });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message, success: false });
    }
};

// Resent Register OTP
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required", success: false });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found", success: false });
    if (user.isVerified) return res.status(400).json({ error: "User already verified", success: false });

    const otp = generateOTP();
    const otpExpiration = Date.now() + 10 * 60 * 1000;

    await Otp.deleteMany({ userId: user._id, otpType: "register" });
    await Otp.create({ userId: user._id, otp, otpType: "register", expiresAt: otpExpiration });

    await transporter.sendMail({
      from: { name: "Hinansho Client Portal", address: process.env.ADMIN_EMAIL },
      to: email,
      subject: "New Verification OTP - Hinansho Client Portal",
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Verification OTP - Hinansho Client Portal</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F5F7FB;
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #0F172A;
    }

    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #FFFFFF;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 6px 25px rgba(15, 23, 42, 0.08);
    }

    .header {
      padding: 28px 20px;
      text-align: center;
      background-color: #ffffff;
      border-bottom: 2px solid #C9A24D;
    }

    .header img {
      max-width: 90px;
      height: auto;
      display: block;
      margin: 0 auto;
    }

    .header h2 {
      color: #0F172A;
      margin-top: 10px;
      font-weight: 600;
    }

    .content {
      padding: 36px 32px;
    }

    .content h1 {
      font-size: 22px;
      margin-bottom: 14px;
      font-weight: 600;
      color: #0F172A;
    }

    .content p {
      font-size: 15px;
      line-height: 1.7;
      color: #475569;
      margin-bottom: 14px;
    }

    .otp-wrapper {
      text-align: center;
      margin: 28px 0;
    }

    .otp-box {
      display: inline-block;
      background: #C9A24D;
      color: #FFFFFF;
      font-size: 30px;
      font-weight: 700;
      letter-spacing: 6px;
      padding: 16px 36px;
      border-radius: 12px;
      box-shadow: 0 6px 15px rgba(201, 162, 77, 0.35);
    }

    .info-box {
      background: #F0F9FF;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #3B82F6;
    }

    .warning-box {
      background: #FEF3C7;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #D97706;
    }

    .features {
      margin: 25px 0;
    }

    .feature-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 12px;
      font-size: 14px;
      color: #475569;
    }

    .feature-item span {
      color: #C9A24D;
      font-weight: bold;
      margin-right: 10px;
      font-size: 18px;
    }

    .footer {
      background: #0F172A;
      color: #CBD5E1;
      font-size: 12.5px;
      text-align: center;
      padding: 18px 20px;
    }

    .footer span {
      color: #C9A24D;
      font-weight: 600;
    }

    @media (max-width: 600px) {
      .content {
        padding: 28px 22px;
      }

      .otp-box {
        font-size: 24px;
        padding: 14px 28px;
        letter-spacing: 4px;
      }

      .header img {
        max-width: 75px;
      }
    }
  </style>
</head>

<body>
  <div class="container">

    <!-- Header -->
    <div class="header">
      <img src="cid:logo" alt="Hinansho Logo" />
      <h2>Hinansho Client Portal</h2>
    </div>

    <!-- Content -->
    <div class="content">
      <h1>New Verification Code Requested</h1>

      <p>Hello ${user.username || "there"},</p>

      <div class="info-box">
        <p><strong>Request Details:</strong></p>
        <p>We received a request for a new verification OTP for your Hinansho Client Portal account.</p>
        <p>Email: ${email}</p>
        <p>Request Time: ${new Date().toLocaleString()}</p>
      </div>

      <p>
        To complete your email verification and access your Hinansho Client Portal account,
        please use the new one-time password below:
      </p>

      <div class="otp-wrapper">
        <div class="otp-box">${otp}</div>
      </div>

      <p>
        <strong>This OTP is valid for 10 minutes only.</strong> Please use it immediately to verify your account.
      </p>

      <div class="warning-box">
        <p><strong>Security Notice:</strong></p>
        <p>If you did not request this OTP, please:</p>
        <ul style="color: #92400E; font-size: 14px; padding-left: 20px; margin: 10px 0;">
          <li>Do not use this OTP</li>
          <li>Secure your account by changing your password</li>
          <li>Contact our support team immediately</li>
        </ul>
      </div>

      <div class="features">
        <p><strong>After verification, you'll gain access to:</strong></p>
        <div class="feature-item"><span>✓</span> Your personalized investor/tenant dashboard</div>
        <div class="feature-item"><span>✓</span> Real-time project updates and financial tracking</div>
        <div class="feature-item"><span>✓</span> Secure messaging with property management</div>
        <div class="feature-item"><span>✓</span> Document access and download capabilities</div>
        ${user.role === 'investor' ? 
          '<div class="feature-item"><span>✓</span> Portfolio performance analytics</div>' : 
          '<div class="feature-item"><span>✓</span> Rent payment and maintenance request system</div>'
        }
      </div>

      <p>
        Need help? Contact our support team at 
        <a href="mailto:support@hinansho.com" style="color: #C9A24D; text-decoration: none;">support@hinansho.com</a>
        or call +1 (234) 567-8900.
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      © ${new Date().getFullYear()} <span>Hinansho Management</span>. All rights reserved.<br />
      Real Estate Investment Management Platform<br />
      Providing full transparency, seamless communication, and easy financial tracking.
    </div>

  </div>
</body>
</html>
      `,
      attachments: [
        {
          filename: "logo.png",
          path: "./Hinansho Gold 2 1.png",
          cid: "logo",
        },
      ],
    });

    res.status(200).json({ 
      message: "New verification OTP has been sent to your email", 
      success: true,
      note: "Please check your inbox and spam folder"
    });
  } catch (error) {
    console.error("Error in resendOTP:", error);
    res.status(500).json({ 
      error: "Failed to resend OTP. Please try again later.", 
      success: false 
    });
  }
};

//Add 2FA implementation here
const login = async (req, res) => {
  const { email, password, twoFactorToken } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    //check if 2fa is enabled
    if (user.is2FAEnabled) {
      if (!twoFactorToken) {
        return res.status(400).json({ error: '2FA token required' });
      }
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorToken,
      });
      if (!verified) {
        return res.status(401).json({ error: 'Invalid 2FA token' });
      }

    }

    const token = generateToken(user); // Make sure this includes userId

    if (user.forcePasswordChange) {
      return res.status(200).json({
        success: true,
        forcePasswordChange: true,
        message: 'Password change required',
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role
        }
      });
    }


    res.json({
      message: 'Login successful',
      token,
      forcePasswordChange: false,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const logout = async (req, res) => {
    try {
        // console.log("User trying to logout:", req.user); // Check if user exists

        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const token = req.headers.authorization?.split(' ')[1];
        blacklist.add(token); // Add to token blacklist

        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Send OTP for Password Reset
const sendResetOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required", success: false });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found", success: false });

    const otp = generateOTP();
    const otpExpiration = new Date(Date.now() + 10 * 60 * 1000);

    await Otp.create({ userId: user._id, otp, otpType: "forgot_password", expiresAt: otpExpiration });

    await transporter.sendMail({
      from: { name: "Hinansho Client Portal", address: process.env.ADMIN_EMAIL },
      to: email,
      subject: "Password Reset Request - Hinansho Client Portal",
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset - Hinansho Client Portal</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F5F7FB;
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #0F172A;
    }

    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #FFFFFF;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 6px 25px rgba(15, 23, 42, 0.08);
    }

    .header {
      padding: 28px 20px;
      text-align: center;
      background-color: #ffffff;
      border-bottom: 2px solid #C9A24D;
    }

    .header img {
      max-width: 90px;
      height: auto;
      display: block;
      margin: 0 auto;
    }

    .header h2 {
      color: #0F172A;
      margin-top: 10px;
      font-weight: 600;
    }

    .content {
      padding: 36px 32px;
    }

    .content h1 {
      font-size: 22px;
      margin-bottom: 14px;
      font-weight: 600;
      color: #0F172A;
    }

    .content p {
      font-size: 15px;
      line-height: 1.7;
      color: #475569;
      margin-bottom: 14px;
    }

    .otp-wrapper {
      text-align: center;
      margin: 28px 0;
    }

    .otp-box {
      display: inline-block;
      background: #C9A24D;
      color: #FFFFFF;
      font-size: 30px;
      font-weight: 700;
      letter-spacing: 6px;
      padding: 16px 36px;
      border-radius: 12px;
      box-shadow: 0 6px 15px rgba(201, 162, 77, 0.35);
    }

    .security-box {
      background: #FEF3F3;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #DC2626;
    }

    .request-details {
      background: #F8FAFC;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #3B82F6;
    }

    .steps {
      margin: 25px 0;
      padding-left: 20px;
    }

    .step-item {
      margin-bottom: 12px;
      font-size: 14px;
      color: #475569;
      position: relative;
      padding-left: 25px;
    }

    .step-item:before {
      content: counter(step);
      counter-increment: step;
      position: absolute;
      left: 0;
      top: 0;
      background: #C9A24D;
      color: white;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      text-align: center;
      font-size: 12px;
      line-height: 20px;
      font-weight: bold;
    }

    .footer {
      background: #0F172A;
      color: #CBD5E1;
      font-size: 12.5px;
      text-align: center;
      padding: 18px 20px;
    }

    .footer span {
      color: #C9A24D;
      font-weight: 600;
    }

    @media (max-width: 600px) {
      .content {
        padding: 28px 22px;
      }

      .otp-box {
        font-size: 24px;
        padding: 14px 28px;
        letter-spacing: 4px;
      }

      .header img {
        max-width: 75px;
      }
    }
  </style>
</head>

<body>
  <div class="container">

    <!-- Header -->
    <div class="header">
      <img src="cid:logo" alt="Hinansho Logo" />
      <h2>Hinansho Client Portal</h2>
    </div>

    <!-- Content -->
    <div class="content">
      <h1>Password Reset Request</h1>

      <p>Hello ${user.username || "there"},</p>

      <div class="request-details">
        <p><strong>Account Security Request:</strong></p>
        <p>We received a password reset request for your Hinansho Client Portal account.</p>
        <p>Account: ${email}</p>
        <p>Request Time: ${new Date().toLocaleString()}</p>
        <p>User Role: ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
      </div>

      <p>To reset your password and regain access to your dashboard, please use the one-time password below:</p>

      <div class="otp-wrapper">
        <div class="otp-box">${otp}</div>
      </div>

      <p><strong>This OTP is valid for 10 minutes only.</strong> Please use it immediately to reset your password.</p>

      <div class="security-box">
        <p><strong>🔒 Security Alert:</strong></p>
        <p>For your protection:</p>
        <ul style="color: #92400E; font-size: 14px; padding-left: 20px; margin: 10px 0;">
          <li><strong>Do not share</strong> this OTP with anyone</li>
          <li>Hinansho staff will never ask for your OTP</li>
          <li>This OTP is for one-time use only</li>
          <li>If you didn't request this, please secure your account immediately</li>
        </ul>
      </div>

      <div style="counter-reset: step;">
        <p><strong>Reset Process:</strong></p>
        <div class="step-item">Enter this OTP on the password reset page</div>
        <div class="step-item">Create a new strong password (minimum 8 characters)</div>
        <div class="step-item">Confirm your new password</div>
        <div class="step-item">Log in with your new credentials</div>
      </div>

      <p>
        Need immediate assistance? Contact our security team at 
        <a href="mailto:security@hinansho.com" style="color: #C9A24D; text-decoration: none;">security@hinansho.com</a>
        or call +1 (234) 567-8900.
      </p>

      <p>
        Stay secure,<br>
        <strong>The Hinansho Security Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      © ${new Date().getFullYear()} <span>Hinansho Management</span>. All rights reserved.<br />
      Real Estate Investment Management Platform<br />
      Protecting your financial and property investments with enterprise-grade security.
    </div>

  </div>
</body>
</html>
      `,
      attachments: [
        {
          filename: "logo.png",
          path: "./Hinansho Gold 2 1.png",
          cid: "logo",
        },
      ],
    });

    res.status(200).json({ 
      message: "Password reset OTP sent successfully", 
      success: true,
      note: "Please check your email inbox and spam folder"
    });
  } catch (error) {
    console.error("Error in sendResetOtp:", error);
    res.status(500).json({ 
      error: "Failed to send password reset OTP. Please try again later.", 
      success: false 
    });
  }
};

// Verify OTP
const verifyPassOtp = async (req, res) => {
    try {
        const { otp } = req.body; // Receiving only OTP

        // console.log("🔹 verifyPassOtp function called");
        // console.log("Received OTP:", otp);

        // Find the OTP entry
        const otpEntry = await Otp.findOne({ otp: otp.toString(), otpType: 'forgot_password' });

        // console.log("🔹 OTP Entry from DB:", otpEntry);

        if (!otpEntry) {
            // console.log("❌ OTP not found in DB!");
            return res.status(400).json({ error: "Invalid OTP", success: false });
        }

        // Find the user associated with this OTP
        const user = await User.findById(otpEntry.userId);
        // console.log("🔹 User from DB:", user);

        if (!user) {
            return res.status(400).json({ error: "Invalid OTP", success: false });
        }

        // Check OTP expiration
        if (new Date() > new Date(otpEntry.expiresAt)) {
            return res.status(400).json({ error: "OTP has expired", success: false });
        }

        // Clear OTP after successful verification
        await Otp.deleteOne({ _id: otpEntry._id });

        // OTP verified, allow password reset
        return res.status(200).json({
            message: "OTP verified successfully",
            success: true,
            userId: user._id
        });

    } catch (error) {
        console.error("❌ Error in verifyPassOtp:", error);
        return res.status(500).json({ error: "Internal Server Error", success: false });
    }
};

const resendResetOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required", success: false });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found", success: false });
    }

    // Generate new OTP
    const newOtp = generateOTP();
    const otpExpiration = new Date(Date.now() + 10 * 60 * 1000);

    // Delete existing OTPs
    await Otp.deleteMany({ userId: user._id, otpType: "forgot_password" });

    // Save new OTP
    await Otp.create({
      userId: user._id,
      otp: newOtp,
      otpType: "forgot_password",
      expiresAt: otpExpiration,
    });

    // Send email
    await transporter.sendMail({
      from: { name: "Hinansho Client Portal", address: process.env.ADMIN_EMAIL },
      to: email,
      subject: "New Password Reset OTP - Hinansho Client Portal",
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Password Reset OTP - Hinansho Client Portal</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F5F7FB;
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #0F172A;
    }

    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #FFFFFF;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 6px 25px rgba(15, 23, 42, 0.08);
    }

    .header {
      padding: 28px 20px;
      text-align: center;
      background-color: #ffffff;
      border-bottom: 2px solid #C9A24D;
    }

    .header img {
      max-width: 90px;
      height: auto;
      display: block;
      margin: 0 auto;
    }

    .header h2 {
      color: #0F172A;
      margin-top: 10px;
      font-weight: 600;
    }

    .content {
      padding: 36px 32px;
    }

    .content h1 {
      font-size: 22px;
      margin-bottom: 14px;
      font-weight: 600;
      color: #0F172A;
    }

    .content p {
      font-size: 15px;
      line-height: 1.7;
      color: #475569;
      margin-bottom: 14px;
    }

    .otp-wrapper {
      text-align: center;
      margin: 28px 0;
    }

    .otp-box {
      display: inline-block;
      background: #C9A24D;
      color: #FFFFFF;
      font-size: 30px;
      font-weight: 700;
      letter-spacing: 6px;
      padding: 16px 36px;
      border-radius: 12px;
      box-shadow: 0 6px 15px rgba(201, 162, 77, 0.35);
    }

    .alert-box {
      background: #FFF9ED;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #D97706;
    }

    .request-info {
      background: #F0F9FF;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #3B82F6;
    }

    .quick-tips {
      margin: 25px 0;
    }

    .tip-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 12px;
      font-size: 14px;
      color: #475569;
    }

    .tip-item span {
      color: #C9A24D;
      font-weight: bold;
      margin-right: 10px;
      font-size: 18px;
    }

    .footer {
      background: #0F172A;
      color: #CBD5E1;
      font-size: 12.5px;
      text-align: center;
      padding: 18px 20px;
    }

    .footer span {
      color: #C9A24D;
      font-weight: 600;
    }

    @media (max-width: 600px) {
      .content {
        padding: 28px 22px;
      }

      .otp-box {
        font-size: 24px;
        padding: 14px 28px;
        letter-spacing: 4px;
      }

      .header img {
        max-width: 75px;
      }
    }
  </style>
</head>

<body>
  <div class="container">

    <!-- Header -->
    <div class="header">
      <img src="cid:logo" alt="Hinansho Logo" />
      <h2>Hinansho Client Portal</h2>
    </div>

    <!-- Content -->
    <div class="content">
      <h1>New Password Reset Code</h1>

      <p>Hello ${user.username || "there"},</p>

      <div class="request-info">
        <p><strong>Request Update:</strong></p>
        <p>We've generated a new password reset OTP for your account as requested.</p>
        <p>Account: ${email}</p>
        <p>New OTP Generated: ${new Date().toLocaleString()}</p>
        <p>Previous OTPs for this request have been invalidated.</p>
      </div>

      <div class="alert-box">
        <p><strong>⚠️ Attention:</strong></p>
        <p>For security reasons, each password reset OTP can only be used once.</p>
        <p>The previous OTP sent for this request is no longer valid.</p>
      </div>

      <p>Please use this new one-time password to reset your account password:</p>

      <div class="otp-wrapper">
        <div class="otp-box">${newOtp}</div>
      </div>

      <p><strong>This new OTP is valid for 10 minutes only.</strong> Please use it immediately.</p>

      <div class="quick-tips">
        <p><strong>Password Security Tips:</strong></p>
        <div class="tip-item"><span>✓</span> Create a strong password (minimum 8 characters with mix of letters, numbers, symbols)</div>
        <div class="tip-item"><span>✓</span> Don't reuse passwords from other websites</div>
        <div class="tip-item"><span>✓</span> Consider using a password manager</div>
        <div class="tip-item"><span>✓</span> Enable two-factor authentication for added security</div>
      </div>

      <p>
        <strong>Important:</strong> If you did not request a password reset:
      </p>
      <ul style="color: #DC2626; font-size: 14px; padding-left: 20px; margin: 10px 0;">
        <li>Do not use this OTP</li>
        <li>Change your account password immediately after logging in</li>
        <li>Contact our security team at <a href="mailto:security@hinansho.com" style="color: #C9A24D; text-decoration: none;">security@hinansho.com</a></li>
        <li>Review your account activity in the security section</li>
      </ul>

      <p>
        Need help? Our support team is available 24/7 at 
        <a href="mailto:support@hinansho.com" style="color: #C9A24D; text-decoration: none;">support@hinansho.com</a>
        or call +1 (234) 567-8900.
      </p>

      <p>
        Stay secure,<br>
        <strong>The Hinansho Client Portal Security Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      © ${new Date().getFullYear()} <span>Hinansho Management</span>. All rights reserved.<br />
      Real Estate Investment Management Platform<br />
      Enterprise-grade security for your property investments and financial data.
    </div>

  </div>
</body>
</html>
      `,
      attachments: [
        {
          filename: "logo.png",
          path: "./Hinansho Gold 2 1.png",
          cid: "logo",
        },
      ],
    });

    res.status(200).json({ 
      message: "New password reset OTP has been sent", 
      success: true,
      note: "Previous OTP has been invalidated. Use the new OTP to reset your password."
    });
  } catch (error) {
    console.error("Error in resendResetOtp:", error);
    res.status(500).json({ 
      error: "Failed to resend password reset OTP. Please try again later.", 
      success: false 
    });
  }
};

const resetPassword = async (req, res) => {
    try {
        const { userId, newPassword } = req.body;
        if (!userId || !newPassword) {
            return res.status(400).json({ error: "User ID and new password are required", success: false });
        }

        // Find user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found", success: false });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user's password
        user.password = hashedPassword;
        await user.save();

        // Remove OTP records after password reset
        await Otp.deleteMany({ userId: user._id, otpType: "forgot_password" });

        return res.status(200).json({ message: "Password reset successfully", success: true });

    } catch (error) {
        console.error("Error in resetPassword:", error);
        return res.status(500).json({ error: "Internal Server Error", success: false });
    }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'New password fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 🔐 NORMAL PASSWORD CHANGE
    if (!user.forcePasswordChange) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      const samePassword = await bcrypt.compare(newPassword, user.password);
      if (samePassword) {
        return res.status(400).json({ error: 'New password must be different from current password' });
      }
    }

    // 🔐 FORCE CHANGE (ADMIN-CREATED USERS)
    user.password = await bcrypt.hash(newPassword, 10);
    user.forcePasswordChange = false;

    await user.save();
    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



module.exports = {
    registerAccount,
    createInvestorByAdmin,
    login,
    logout,
    verifyRegOTP,
    resendOTP,
    resetPassword,
    sendResetOtp,
    verifyPassOtp,
    resendResetOtp,
    changePassword,
}