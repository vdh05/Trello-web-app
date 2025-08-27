const User = require('../models/User');
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'trello_secret';
const nodemailer = require('nodemailer');

// Utility to send OTP email
async function sendOtpEmail(toEmail, otp) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    await transporter.sendMail({
        from: `"Trello Clone" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: 'Your OTP for Trello Clone Signup',
        text: `Your OTP for email verification is: ${otp}`
    });
}

// Utility to send assignment email
async function sendAssignmentEmail(toEmail, assignedBy, cardTitle, cardDescription) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    await transporter.sendMail({
        from: `"Trello Clone" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: `Task Assigned: ${cardTitle}`,
        text: `Hi, you have been assigned a task by @${assignedBy}.\n\nTask: ${cardTitle}\nDescription: ${cardDescription || 'No description'}`
    });
}

exports.signup = async (req, res) => {
    const { username, password, email } = req.body;
    try {
        if (await User.findOne({ username })) {
            return res.status(400).json({ error: 'User exists' });
        }
        if (await User.findOne({ email })) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await User.create({ username, password, email, otp, emailVerified: false });
        // Send OTP email and handle errors
        try {
            await sendOtpEmail(email, otp);
            res.json({ otpSent: true });
        } catch (mailErr) {
            res.status(500).json({ error: 'Failed to send OTP email. Please check SMTP credentials.' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Signup error' });
    }
};

exports.verifyOtp = async (req, res) => {
    const { username, otp } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: 'User not found' });
        if (user.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
        user.emailVerified = true;
        user.otp = undefined;
        await user.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'OTP verification error' });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username, password });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });
        if (!user.emailVerified) return res.status(400).json({ error: 'Email not verified' });
        const token = jwt.sign({ userId: user._id, username }, SECRET);
        res.json({ token, success: true });
    } catch (err) {
        res.status(500).json({ error: 'Login error' });
    }
};

// Export assignment mail utility for use in boardController
exports.sendAssignmentEmail = sendAssignmentEmail;
