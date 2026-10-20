import mongoose, { Schema } from 'mongoose';
import { ALL_PERMISSION_KEYS, WILDCARD } from '../config/permissions.js';
import { isConcreteKey, isGroupWildcard } from '../utils/permissions.js';

const roleSchema = new Schema({
    // machine key stored on User.role (e.g. "admin", "reporter", "desk-editor")
    name: {
        type: String, required: [true, 'Role name is required'], unique: true, trim: true, lowercase: true,
        match: [/^[a-z][a-z0-9_-]{1,29}$/, 'Role name must be 2-30 chars: lowercase letters, digits, "-" or "_" and start with a letter'],
    },
    displayName: { type: String, trim: true, maxLength: [40, 'Display name cannot exceed 40 characters'], default: '' },
    description: { type: String, trim: true, maxLength: [200, 'Description cannot exceed 200 characters'], default: '' },
    permissions: { type: [String], default: [] },
    defaultsVersion: { type: Number, default: 1 },   // built-in roles only: which default permission set was last applied
    isSystem: { type: Boolean, default: false },   // admin + reporter: cannot be deleted / renamed
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// A role can only hold keys that exist in config/permissions.js.  `*` is reserved for the built-in admin role.
roleSchema.pre('validate', function (next) {
    const bad = this.permissions.filter((p) => {
        if (p === WILDCARD) return !(this.isSystem && this.name === 'admin');
        return !(isConcreteKey(p) || isGroupWildcard(p));
    });
    if (bad.length) this.invalidate('permissions', `Unknown or forbidden permission(s): ${bad.join(', ')}`);
    next();
});

roleSchema.index({ isActive: 1, name: 1 });

export const KNOWN_PERMISSION_COUNT = ALL_PERMISSION_KEYS.length;
export default mongoose.model('Role', roleSchema);
