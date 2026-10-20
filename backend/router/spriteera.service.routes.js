import { isAuthenticated, requirePermission } from '../middleware/Authentication.js'
import { P } from '../config/permissions.js'
import { generateTags, getTop100Trends, getTop24HourRss } from '../controller/spriteera.service.controller.js'



export default SpriteEraServiceRouter

async function SpriteEraServiceRouter(app) {
    app.post('/generate-tags', { onRequest: [isAuthenticated, requirePermission(P.TOOLS_AI)] }, generateTags);
    app.get('/top-100-trends', { onRequest: [isAuthenticated, requirePermission(P.TOOLS_AI)] }, getTop100Trends);
    app.get('/rss', { onRequest: [isAuthenticated, requirePermission(P.TOOLS_AI)] }, getTop24HourRss);
}
