
import { authorizeroles, isAuthenticated } from "../middleware/Authentication.js";
import { createAdvertisement, deleteAdvertisement, getAdminAdvertisement, getAdvertisement, updateAdvertisement, updateAdvertisementOrder } from "../controller/advertisement.controller.js";
import { getTitleAdvertisement } from "../controller/titleadvertisement.controller.js";

export async function AdvertisementRoutes(app) {
    app.get("/get-advertisement", getAdvertisement);
    app.get('/get-title-advertisement', getTitleAdvertisement);
}
