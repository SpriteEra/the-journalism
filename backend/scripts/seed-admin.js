/**
 * One-time admin seed.
 *
 * Usage (from the project root, MONGO_URL in .env):
 *   ADMIN_EMAIL=you@example.com ADMIN_USERNAME=superadmin ADMIN_PASSWORD='Str0ng#Pass' node scripts/seed-admin.js
 *
 * Safe to re-run: if a user with that email/username already exists, nothing is created.
 * Add --promote to turn an EXISTING user with that email/username into an admin.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../model/user.model.js';
import UpdateStack from '../model/updatedstack.model.js';
import { seedSystemRoles } from '../service/access.service.js';

const { ADMIN_EMAIL, ADMIN_USERNAME = 'superadmin', ADMIN_PASSWORD, ADMIN_FULLNAME = 'Super Admin' } = process.env;
const promote = process.argv.includes('--promote');

if (!process.env.MONGO_URL) { console.error('MONGO_URL missing in .env'); process.exit(1); }
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) { console.error('ADMIN_EMAIL and ADMIN_PASSWORD are required'); process.exit(1); }

try {
    await mongoose.connect(process.env.MONGO_URL);
    await seedSystemRoles();   // make sure the built-in "admin" role exists (User validates against it)

    const email = ADMIN_EMAIL.trim().toLowerCase();
    const username = ADMIN_USERNAME.trim();
    const existing = await User.findOne({ $or: [{ email }, { username }] });

    if (existing) {
        if (promote && existing.role !== 'admin') {
            existing.role = 'admin';
            existing.refreshToken = '';
            await existing.save();
            console.log(`Promoted "${existing.username}" to admin`);
        } else {
            console.log(`User already exists (${existing.username}, role: ${existing.role}) - nothing created`);
        }
    } else {
        const user = new User({ username, email, password: ADMIN_PASSWORD, fullName: ADMIN_FULLNAME, role: 'admin' });
        const stack = new UpdateStack({
            relatedId: user._id,
            type: 'User',
            updates: [{ description: 'Admin seeded via script', updatedByModel: 'User' }],
        });
        user.update_stack = stack._id;
        await user.save();     // password is hashed by the pre-save hook
        await stack.save();
        console.log(`Admin created: ${username} / ${email}`);
    }
} catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}