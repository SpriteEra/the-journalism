import User from "../model/user.model.js";
import { notifyUsers } from "../service/notification.service.js";
import tryCatch from "../utils/asyncFunction.js";
import { sendToken } from "../utils/jwtToken.js";
import { buildAccess } from "../service/access.service.js";
import { setCookie } from "../utils/cookies.js";
import ErrorHandler from "../utils/errorHandler.js";
import { dropProfilePhoto, parseAuthorFields, storeProfilePhoto } from "../utils/authorProfile.js";
import sendMail from "../utils/sendMail.js";
import crypto from "crypto";

export const createUser = tryCatch(async (req, res, next) => {
    // Public sign-up hands out newsroom accounts, so it is OFF unless you opt in (admins use POST /admin/add-reporter).
    if (process.env.ALLOW_PUBLIC_SIGNUP !== 'true') return next(new ErrorHandler(403, 'Sign-up is closed. Ask an admin to create your account'));
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
        return res.status(400).json({ success: false, message: "Please provide email, password and username" })
    }

    const user = await User.findOne({ email });
    if (user) {
        return res.status(400).json({ success: false, message: "User already exists" })
    }

    const findByUserName = await User.findOne({ username })
    if (findByUserName) {
        return res.status(400).json({ success: false, message: 'Username already exist' })
    }
    const newUser = new User({
        email,
        password,
        username
    })

    newUser.save()
        .then(async (data) => {
            await sendToken(data, 200, res)
        })
        .catch(err => {
            res.status(500).json({ success: false, message: err.message })
        })
})

export const login = tryCatch(async (req, res, next) => {
    let { email, password } = req.body;
    email = String(email || '').trim();
    password = String(password || '').trim();

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Please provide all details" })
    }

    var user = await User.findOne({ email: email }).select('+password');
    if (!user) {
        user = await User.findOne({ username: email }).select('+password');
        // console.log(user)
    }
    if (!user) {
        return res.status(400).json({ success: false, message: "Invalid credentials" })
    }

    const isPassowrdMatch = await user.comparePassword(password);

    if (!isPassowrdMatch) {
        return res.status(400).json({ success: false, message: "Invalid credentials" })
    }

    if (user.isDeleted) {
        return res.status(400).json({ success: false, message: "Invalid credentials" })
    }
    if (user.is_blocked && user.blockedUntil && user.blockedUntil <= new Date()) {      // temporary block ran out
        user.is_blocked = false; user.blockedUntil = null; user.blockReason = ''; user.blockedAt = null; user.blocked_By = null;
        await user.save({ validateBeforeSave: false });
    }
    if (user.is_blocked) {
        const until = user.blockedUntil ? ` until ${user.blockedUntil.toISOString()}` : '';
        return res.status(401).json({ success: false, message: `Your account is blocked${until}${user.blockReason ? `: ${user.blockReason}` : ''}. Contact an admin.` })
    }

    await sendToken(user, 200, res)
})

export const getUser = tryCatch(async (req, res, next) => {
    const user = req.user;
    const userData = {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        profile: user.profile,
        role: user.role,
        trusted: user.trusted,
        permissions: [...req.access.permissions].sort(),   // the panel shows / hides menus from this
        isSuper: req.access.isSuper,
    }
    res.status(200).json({ success: true, user: userData })
})


export const logOut = tryCatch(async (req, res, next) => {
    setCookie(res, "accessToken", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });
    setCookie(res, "refreshToken", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });
    const user = await User.findById(req.user._id)
    if (user) {
        user.fcm = ""
        user.refreshToken = ""
        await user.save({ validateBeforeSave: false })
    }
    res.status(200).json({ success: true, message: "Logged Out" });
});

const myProfile = (user) => ({
    _id: user._id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    profile: user.profile,
    about: user.about || '',
    designation: user.designation || '',
    location: user.location || '',
    phone: user.phone || '',
    social: user.social?.toObject?.() ?? user.social ?? {},
    account_info: user.account_info,
    createdAt: user.createdAt,
});

export const getMyProfile = tryCatch(async (req, res) => {
    res.status(200).json(myProfile(req.user));
});

/**
 * PUT /admin/profile — people edit THEIR OWN public profile (name, about, photo, designation, location, phone, links).
 * Only those fields: role, email, username and permissions can never be changed from here.
 */
export const updateMyProfile = tryCatch(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) throw new ErrorHandler(404, 'User not found');
    const fields = parseAuthorFields(req.body || {});
    // the public author page needs a name and an about text: they can be changed but not emptied
    if (fields.fullName === undefined && !user.fullName) throw new ErrorHandler(400, 'Add your full name');
    let oldPhoto = '';
    if (req.files?.profile) { oldPhoto = user.profile; user.profile = await storeProfilePhoto(req.files.profile); }
    for (const [k, v] of Object.entries(fields)) user[k] = v;
    await user.save();
    if (oldPhoto) await dropProfilePhoto(oldPhoto);
    return res.status(200).json({ success: true, message: 'Profile updated', profile: myProfile(user) });
});

export const updatePassword = tryCatch(async (req, res, next) => {
    const userId = req.user._id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // 1. Check required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: "All fields are required." });
    }

    // 2. Check new password match
    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "New password and confirm password do not match." });
    }

    // 3. Find user and select password
    const user = await User.findById(userId).select("+password");
    if (!user) {
        return res.status(404).json({ message: "User not found." });
    }

    // 4. Compare current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect." });
    }

    // 5. Hash and update new password
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully." });
});

export const forgotPassword = tryCatch(async (req, res, next) => {
    const email = String(req.body?.email || '').trim();
    console.log('[forgot] request body email:', JSON.stringify(email));
    if (!email) return res.status(400).json({ success: false, message: "Please provide your email" });

    // same response whether or not the account exists, so emails can't be enumerated
    const genericResponse = { success: true, message: "If this email is registered, a reset link has been sent." };

    const user = await User.findOne({ email });
    console.log('[forgot] user found:', Boolean(user), '| isDeleted:', user?.isDeleted, '| is_blocked:', user?.is_blocked);
    if (!user || user.isDeleted || user.is_blocked) {
        console.log('[forgot] stopped before sending: user missing, deleted or blocked');
        return res.status(200).json(genericResponse);
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.ADMIN_URL}/reset-password/${resetToken}`;
    console.log('[forgot] ADMIN_URL:', process.env.ADMIN_URL);
    if (process.env.NODE_ENV !== 'production') console.log('[forgot] resetUrl (dev only):', resetUrl);

    try {
        console.log('[forgot] sending mail to:', user.email);
        await sendMail({
            email: user.email,
            subject: "Reset your password - The Journalism",
            template: "reset-password.ejs",
            data: { name: user.fullName || user.username, resetUrl, expireMinutes: 15 },
        });
        console.log('[forgot] mail sent OK');
    } catch (err) {
        console.error('[forgot] sendMail FAILED:', err.code, '|', err.message, '|', err.response || '');
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new ErrorHandler(500, "Could not send reset email. Try again later"));
    }

    res.status(200).json(genericResponse);
});

export const resetPassword = tryCatch(async (req, res, next) => {
    const { password, confirmPassword } = req.body;
    if (!password || !confirmPassword) return next(new ErrorHandler(400, "All fields are required"));
    if (password !== confirmPassword) return next(new ErrorHandler(400, "Passwords do not match"));

    const hashed = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
        resetPasswordToken: hashed,
        resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) return next(new ErrorHandler(400, "Reset link is invalid or has expired"));

    user.password = password;               // hashed by the pre-save hook
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.refreshToken = "";                 // sign out existing sessions
    await user.save();

    res.status(200).json({ success: true, message: "Password reset successfully. Please sign in." });
});

export const updateFCM = tryCatch(async (req, res, next) => {
    const { fcm } = req.body;
    let user = req.user;
    user.fcm = fcm
    await user.save()
    return res.status(200).json({ message: 'FCM Updated successfully' })
})


export const updateNotificationPreference = async (req, res) => {
    try {
        const userId = req.user._id;
        const { type, enabled } = req.body;

        if (!type || typeof enabled !== "boolean") {
            return res.status(400).json({ message: "Invalid data" });
        }

        const validTypes = [
            "newsAdded",
            "eventNews",
            "newsDeleted",
            "newsUpdated",
            "others",
        ];

        if (!validTypes.includes(type)) {
            return res.status(400).json({ message: "Invalid preference type" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { [`notificationPreferences.${type}`]: enabled } },
            { new: true }
        );

        res.json({
            success: true,
            preferences: updatedUser.notificationPreferences,
        });
    } catch (err) {
        console.error("Error updating preference", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getNotificationPreferences = async (req, res) => {
    try {
        const user = req.user
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user.notificationPreferences);
    } catch (error) {
        console.error("Error fetching preferences:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


export const sendDemoNotification = tryCatch(async (req, res, next) => {
    const usersWithFcm = await User.find({ fcm: { $exists: true, $ne: null } });

    // Call the notifyUsers function
    await notifyUsers({
        users: usersWithFcm,
        event: "demo",
        fcmTitle: "🎉 Demo Notification",
        fcmBody: "This is a test push notification to all users!",
        link: "https://yourdomain.com/demo-notification", // optional
    });

    res.status(200).json({
        success: true,
        message: `Notification sent to ${usersWithFcm.length} users.`,
    });
});