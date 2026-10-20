import { getMyNews } from '../controller/dashboard.controller.js'
import { isAuthenticated } from '../middleware/Authentication.js'

export default DashboardNewsRoutes

async function DashboardNewsRoutes(app) {
    app.post('/get-my-news', { onRequest: [isAuthenticated] }, getMyNews);
}
