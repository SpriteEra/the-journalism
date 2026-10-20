import { clearCacheSoon } from './cache.js';

/** Call after anything that changes what the public / admin dashboards show (create, edit, approve, delete, restore). */
export const onNewsChanged = () => {
    clearCacheSoon('home:');
    clearCacheSoon('analytics:');
    clearCacheSoon('tags:');
};
