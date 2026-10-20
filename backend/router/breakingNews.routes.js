import { Createnews, Deletenews, GetAdminNews, Getallnews, Getnews, Updatenews, getAdminNewsCount } from "../controller/breakingNews.controller.js";
import { isAuthenticated, requirePermission } from "../middleware/Authentication.js";
import { P } from "../config/permissions.js";




export default BreakinNewsRouter

async function BreakinNewsRouter(app) {
    app.post("/admin/create-breaking-news", { onRequest: [isAuthenticated, requirePermission(P.BREAKING_MANAGE)] }, Createnews);
    app.post("/admin/get-breaking-news", { onRequest: [isAuthenticated, requirePermission(P.BREAKING_MANAGE)] }, GetAdminNews);
    app.post("/admin/get-breaking-news-count", { onRequest: [isAuthenticated, requirePermission(P.BREAKING_MANAGE)] }, getAdminNewsCount);
    app.get("/find-news/:id", Getnews);
    app.get("/breaking-news", Getallnews);
    app.put("/admin/update-news/:id", Updatenews);
    app.delete("/admin/delete-breaking-news/:id", Deletenews);
}
