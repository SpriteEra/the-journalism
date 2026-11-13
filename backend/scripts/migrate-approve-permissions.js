import 'dotenv/config';
import mongoose from 'mongoose';
import Role from '../model/role.model.js';
import User from '../model/user.model.js';

// [old, next]: anyone who has `old` also gets `next`
const PAIRS = [
    ['live.manage.any', 'live.approve'],
    ['video.manage.any', 'video.approve'],
    ['yt.manage', 'yt.approve'],
    ['yt.manage', 'yt.manage.any'],      // rename
    ['video.create', 'yt.create'],
    ['video.manage.own', 'yt.manage.own'],
];

const RETIRED = ['yt.manage'];            // add old tag keys here if needed

await mongoose.connect(process.env.MONGO_URL);

for (const [old, next] of PAIRS) {
    const roles = await Role.updateMany(
        { permissions: old },
        { $addToSet: { permissions: next } }
    );
    const users = await User.updateMany(
        { 'permissions.grant': old },
        { $addToSet: { 'permissions.grant': next } }
    );
    console.log(`${old} -> ${next}: ${roles.modifiedCount} roles, ${users.modifiedCount} users`);
}

// A per-user deny on the old yt.manage should carry over to the renamed key
const denied = await User.updateMany(
    { 'permissions.deny': 'yt.manage' },
    { $addToSet: { 'permissions.deny': 'yt.manage.any' } }
);
console.log(`deny carried over: ${denied.modifiedCount} users`);

// Remove retired keys last
const rolesClean = await Role.updateMany({}, { $pull: { permissions: { $in: RETIRED } } });
const usersClean = await User.updateMany({}, {
    $pull: {
        'permissions.grant': { $in: RETIRED },
        'permissions.deny': { $in: RETIRED },
    },
});
console.log(`retired removed: ${rolesClean.modifiedCount} roles, ${usersClean.modifiedCount} users`);

await mongoose.disconnect();
console.log('Done');