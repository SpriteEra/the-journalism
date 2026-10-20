import mongoose, { Schema } from "mongoose";
import validator from "validator";
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import Role from './role.model.js'
import { DEFAULT_ROLE } from '../config/permissions.js'
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Please provide a username"],
        unique: true,
        maxLength: [30, "Your username cannot exceed 30 characters"],
        minLength: [3, "Your username must be at least 4 characters long"],
    },
    fullName: {
        type: String,
        default: '',
        maxLength: [60, "Your Full Name cannot exceed 60 characters"],
    },
    // public author profile (author page + its SEO)
    about: { type: String, default: '', maxLength: [800, 'About cannot exceed 800 characters'] },
    designation: { type: String, default: '', maxLength: 80 },
    phone: { type: String, default: '', maxLength: 20 },
    location: { type: String, default: '', maxLength: 80 },
    social: {
        website: { type: String, default: '' }, x: { type: String, default: '' }, facebook: { type: String, default: '' },
        instagram: { type: String, default: '' }, youtube: { type: String, default: '' }, linkedin: { type: String, default: '' },
    },
    profile: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        required: [true, "Please provide your email"],
        unique: true,
        validate: [validator.isEmail, 'Please provide a valid email address']
    },
    password: {
        type: String,
        required: [true, "Please provide a password"],
        minLength: [5, "Your password must be at least 5 characters long"],
        select: false
    },
    // Key of a document in the Role collection ("admin", "reporter" or any custom role).
    // Kept as a string so existing tokens / frontends that read `user.role` keep working.
    role: {
        type: String,
        trim: true,
        lowercase: true,
        default: DEFAULT_ROLE
    },
    // Per-user tweaks on top of the role:  effective = role + trusted extras + grant - deny
    permissionOverrides: {
        grant: { type: [String], default: [] },
        deny: { type: [String], default: [] },
    },
    trusted: {
        type: Boolean,
        default: false,
    },
    account_info: {
        total_news: {
            type: Number,
            default: 0,
        },
    },

    refreshToken: {
        type: String,
        default: ''
    },
    fcm: {
        type: String,
        default: ""
    },
    notificationPreferences: {
        newsAdded: { type: Boolean, default: true },
        eventNews: { type: Boolean, default: true },
        newsDeleted: { type: Boolean, default: false },
        newsUpdated: { type: Boolean, default: false },
        others: { type: Boolean, default: false },
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    isDeleted: {
        default: false,
        type: Boolean,
    },
    update_stack: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UpdateStack',
        required: true,
    },
    is_blocked: {
        type: Boolean,
        default: false,
    },
    blocked_By: {
        type: Schema.Types.ObjectId, ref: "User"
    },
    blockedAt: { type: Date, default: null },
    blockReason: { type: String, default: '', maxLength: [300, 'Block reason cannot exceed 300 characters'] },
    // temporary suspension: when set, the block lifts itself at this time
    blockedUntil: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true })

userSchema.index({ role: 1, isDeleted: 1 });
userSchema.index({ is_blocked: 1, isDeleted: 1 });

// a user can only point at a role that exists and is active
userSchema.pre('validate', async function () {
    if (!this.isNew && !this.isModified('role')) return;
    const role = await Role.findOne({ name: this.role }).select('isActive').lean();
    if (!role) this.invalidate('role', `Role "${this.role}" does not exist`);
    else if (!role.isActive) this.invalidate('role', `Role "${this.role}" is disabled`);
});


userSchema.pre('save', async function () {
    // (the old hook called next() and then hashed anyway — re-hashing an already hashed password)
    if (!this.isModified('password')) return
    this.password = await bcrypt.hash(this.password, 10)
})

// compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}

// get access token
userSchema.methods.getAccessToken = async function () {
    return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRES })
}

// get refresh token
userSchema.methods.getRefreshToken = async function () {
    return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES
    })
}

// get reset password token
userSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    return resetToken;
}
const User = mongoose.model('User', userSchema)

export default User