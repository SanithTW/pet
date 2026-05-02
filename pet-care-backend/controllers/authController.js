const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const OTP = require('../models/OTP');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Nodemailer transporter helper
const sendEmailOTP = async (email, otp, purpose = 'registration') => {
  // If you configure EMAIL_USER and EMAIL_PASS in .env, it will use them.
  // Otherwise, fallback to a console.log for easy development testing.
  const subject = purpose === 'login'
    ? 'Pet Care App - Login OTP'
    : 'Pet Care App - Verification OTP';
  const text = purpose === 'login'
    ? `Your OTP for login is: ${otp}`
    : `Your OTP for registration is: ${otp}`;

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      text
    };

    await transporter.sendMail(mailOptions);
  } else if (process.env.NODE_ENV !== 'production') {
    console.log(`\n===========================================`);
    console.log(`[DEVELOPMENT] OTP for ${email} is: ${otp}`);
    console.log(`(Configure EMAIL_USER and EMAIL_PASS in .env to send real emails)`);
    console.log(`===========================================\n`);
  } else {
    throw new Error('Email transport is not configured');
  }
};

// @desc    Send OTP via Email for registration or login
// @route   POST /api/auth/send-otp
// @access  Public
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      res.status(400);
      throw new Error('Please provide an email address');
    }

    const userExists = await User.findOne({ email });
    const purpose = userExists ? 'login' : 'registration';

    const mailConfigured = Boolean(process.env.EMAIL_USER?.trim() && process.env.EMAIL_PASS?.trim());
    if (process.env.NODE_ENV === 'production' && !mailConfigured) {
      return res.status(503).json({
        message: 'OTP email is not configured on this server. Contact support.',
      });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email });

    // Save new OTP
    await OTP.create({
      email,
      otp
    });

    // Send the email
    await sendEmailOTP(email, otp, purpose);

    const responsePayload = { message: `OTP sent successfully for ${purpose}` };
    if (!mailConfigured && process.env.NODE_ENV !== 'production') {
      responsePayload.otp = otp;
    }

    res.status(200).json(responsePayload);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Login with OTP
// @route   POST /api/auth/login-otp
// @access  Public
const loginWithOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400);
      throw new Error('Please provide email and OTP');
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(400);
      throw new Error('No account found with this email');
    }

    const validOtpRecord = await OTP.findOne({ email, otp });
    if (!validOtpRecord) {
      res.status(400);
      throw new Error('Invalid or expired OTP');
    }

    await OTP.deleteMany({ email });

    res.status(200).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, otp } = req.body;

    if (!name || !email || !password || !otp) {
      res.status(400);
      throw new Error('Please add all fields including OTP');
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    // Verify OTP
    const validOtpRecord = await OTP.findOne({ email, otp });
    if (!validOtpRecord) {
      res.status(400);
      throw new Error('Invalid or expired OTP');
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone
    });

    // After successful registration, delete the OTP record
    await OTP.deleteMany({ email });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    if (!user) {
      res.status(400);
      throw new Error('Invalid credentials');
    }
    
    // Check if they are a google-only user
    if (user.authProvider === 'google' && !user.password) {
      res.status(400);
      throw new Error('Please login with Google');
    }

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid credentials');
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Google Login / Register
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
  try {
    if (process.env.ALLOW_INSECURE_GOOGLE_AUTH !== 'true') {
      return res.status(403).json({
        message: 'Google sign-in is disabled. Use email and password or OTP.',
      });
    }

    const { email, name } = req.body;

    if (!email) {
      res.status(400);
      throw new Error('No email provided from Google');
    }

    const displayName = (name && String(name).trim()) || String(email).split('@')[0] || 'User';

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: displayName,
        email,
        authProvider: 'google'
      });
    }

    const isNewUser = user.createdAt.getTime() === user.updatedAt.getTime();

    res.status(isNewUser ? 201 : 200).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
      role: user.role,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json(req.user);
};

module.exports = {
  sendOTP,
  registerUser,
  loginUser,
  loginWithOTP,
  googleLogin,
  getMe,
};
