import 'dotenv/config';
import mongoose from 'mongoose';
import Role from '../model/role.model.js';   // adjust the path/name to your Role model
import User from '../model/user.model.js';   // adjust the path/name to your User model

const PAIRS = [
    ['live.manage.any', 'live.approve'],
    ['video.manage.any', 'video.approve'],
    ['yt.manage', 'yt.approve'],
    ['yt.manage', 'yt.manage.any'],      // rename
    ['video.create', 'yt.create'],       // anyone who could add videos can add YouTube news
    ['video.manage.own', 'yt.manage.own'],
];
await mongoose.connect(process.env.MONGO_URL);   // use the same env variable your app uses

for (const [old, next] of PAIRS) {
    const roles = await Role.updateMany({}, { $pull: { permissions: 'yt.manage' } });

    const users = await User.updateMany({}, { $pull: { 'permissions.grant': 'yt.manage', 'permissions.deny': 'yt.manage' } });
    console.log(`${old} -> ${next}: ${roles.modifiedCount} roles, ${users.modifiedCount} users`);
}

await mongoose.disconnect();
console.log('Done');