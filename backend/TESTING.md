# Testing the server

`npm test` — runs every test (no database needed).

What the tests cover
- **CORS** (`test/cors.test.js`): the browser preflight for GET / POST / PUT / PATCH / DELETE from the admin origin and local dev, and that an unknown origin is refused.
- **Time zones** (`test/timezone.test.js`): day filters, ranges and the featured-story time give identical results when the server runs in UTC, IST, New York, Tokyo or Auckland.
- **Permissions and routes**: every admin route is protected; new routes (logs, featured story, profile, notifications archive, link search) need a login.
- **Business rules**: keywords, story URL (slug + primary section + canonical redirect), featured story window, related stories (max 5), author profile validation, activity-log retention (10 days).
- After adding or changing routes run `npm run export-routes` and copy `routes.json` into the admin panel's `src/test/backend-routes.json`.
