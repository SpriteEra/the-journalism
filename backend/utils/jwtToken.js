import { setCookie } from './cookies.js';
import { buildAccess } from '../service/access.service.js';
export const sendToken = async (user, statusCode, res) => {
    try {
        const accessToken = await user.getAccessToken();
        const refreshToken = await user.getRefreshToken();


        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        const options = {
            httpOnly: true,
            secure: false,
        }

        const accessOptions = {
            ...options,
            maxAge: process.env.ACCESS_COOKIE_EXPIRES * 60 * 1000
        }
        const refreshOptions = {
            ...options,
            maxAge: process.env.REFRESH_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
        }
        setCookie(res, 'refreshToken', refreshToken, refreshOptions);
        setCookie(res, 'accessToken', accessToken, accessOptions);

        // the panel shows / hides menus from these, so they are part of the login response (same shape as GET /me)
        const access = await buildAccess(user);
        const userData = {
            id: user._id,
            username: user.username,
            email: user.email,
            profile: user.profile,
            role: user.role,
            trusted: user.trusted,
            permissions: [...access.permissions].sort(),
            isSuper: access.isSuper,
        }
        return res.status(statusCode).json({ success: true, user: userData, accessToken, refreshToken })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}