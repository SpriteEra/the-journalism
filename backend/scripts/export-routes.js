/**
 * Writes the list of every API route (method + path) to routes.json.
 *   node scripts/export-routes.js [output-file]
 * Copy it to the admin panel as  src/test/backend-routes.json  — its contract test then fails if the panel calls an endpoint
 * (or uses a method) that the server does not have.
 */
import { writeFileSync } from 'node:fs';

process.env.ACCESS_TOKEN_SECRET ||= 'export'; process.env.REFRESH_TOKEN_SECRET ||= 'export';
const { buildApp } = await import('../app.js');
const app = await buildApp({ sockets: false, logger: false });
await app.ready();
const routes = [...new Set(app.routeTable.map((r) => `${r.method} ${r.url}`))].sort();
const out = process.argv[2] || 'routes.json';
writeFileSync(out, JSON.stringify({ routes }, null, 2));
console.log(`${routes.length} routes written to ${out}`);
await app.close();
process.exit(0);
