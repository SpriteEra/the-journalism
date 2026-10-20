import { isAuthenticated, requirePermission } from "../middleware/Authentication.js";
import { P } from "../config/permissions.js";
import { createAdvertisement, deleteAdvertisement, extendExpiry, getadminAdvertisementtitle, updateExpiredAdvertisement, updateTitleAdvertisement } from "../controller/titleadvertisement.controller.js";


// TitleAdvertisementRoutes.get("/get-title-ads", getAdvertisement)





// TitleAdvertisementRoutes.get("/get-advertisement-side", getSideAdvertisement)
// TitleAdvertisementRoutes.put("/admin/ads/update/:id", updateAdvertisement)
// TitleAdvertisementRoutes.post("/admin/ads/update-order", isAuthenticated, requirePermission(P.ADS_MANAGE), updateAdvertisementOrder)


export default TitleAdvertisementRoutes;

export async function TitleAdvertisementRoutes(app) {
    app.post("/ads-title/add", { onRequest: [isAuthenticated, requirePermission(P.ADS_MANAGE)] }, createAdvertisement);
    app.get("/get-admin-title-ads", { onRequest: [isAuthenticated, requirePermission(P.ADS_MANAGE)] }, getadminAdvertisementtitle);
    app.put("/update-title-ads/:id", { onRequest: [isAuthenticated, requirePermission(P.ADS_MANAGE)] }, updateTitleAdvertisement);
    app.delete("/delete-title-ads/:id", { onRequest: [isAuthenticated, requirePermission(P.ADS_MANAGE)] }, deleteAdvertisement);
    app.put("/renew-expiry/:id", { onRequest: [isAuthenticated, requirePermission(P.ADS_MANAGE)] }, updateExpiredAdvertisement);
    app.put("/extend-expiry/:id", { onRequest: [isAuthenticated, requirePermission(P.ADS_MANAGE)] }, extendExpiry);
}
