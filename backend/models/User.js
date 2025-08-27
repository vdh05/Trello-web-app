const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
    email: { type: String, unique: true, required: true },
    emailVerified: { type: Boolean, default: false },
    otp: String // store OTP for verification
});

module.exports = mongoose.model('User', UserSchema);
