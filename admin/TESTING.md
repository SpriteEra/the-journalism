# Testing the admin panel

`npm run verify` — runs every test and a production build. Nothing needs checking by hand if it is green.

What the tests cover
- **API contract** (`src/test/api-contract.test.js`): every request the panel can send must exist on the server with that method.
  After changing backend routes run `npm run export-routes` in the backend and copy `routes.json` to `src/test/backend-routes.json`.
- **Every page loads** (`src/test/routes.import.test.jsx`): each routed page and component imports cleanly.
- **Page behaviour** (`src/pages/pages.smoke.test.jsx`, `src/components/**`): dashboard, profile (edit + save), reporter profile, logs,
  team performance, ads, scheduled / breaking news, Ora AI, news form (topic, keywords, URL section, drafts, featured story, related stories).
- **Time zones** (`src/lib/time.test.js`): all dates are IST and give the same answers in browsers set to six different zones.
- **Permissions / sidebar** (`src/lib/permissions.test.js`, `src/components/layout`).
