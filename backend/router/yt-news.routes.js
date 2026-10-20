import { getRelatedYtNews, getVideoNews, getYtNews } from "../controller/ytnews.controller.js";


export default YtRouter;

async function YtRouter(app) {
    app.get('/video-news', getVideoNews);
    app.get('/video-news/:news_id', getYtNews);
    app.get('/related-news/:news_id', getRelatedYtNews);
}
