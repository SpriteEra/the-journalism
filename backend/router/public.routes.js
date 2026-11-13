import { getAuthorNews, getAuthorPublic, getCategoryBySlug, getCategoryTree, getFeaturedPublic, getHomeNews, getLatestNews, getLatestShortVideos, getLiveNewsBySlug, getLiveNewsList, getLiveNewsNext, getNextShortVideos, getRelatedNews, getRelatedYtNews, getShortVideoBySlug, getShortVideos, getSingleNews, getStateBySlug, getStates, getVideoNews, getYtNews, incrementCount, searchNews } from "../controller/public.controller.js";

export default PublicRouter;

async function PublicRouter(app) {
    app.get('/news/home', getHomeNews);
    app.get('/news/latest', getLatestNews);
    app.get('/news/featured', getFeaturedPublic);
    app.get('/search-news', searchNews);
    app.get('/increment-count/:type/:id', incrementCount);

    app.get('/news/get/:news_id', getSingleNews);
    app.get('/news/related-news/:news_id', getRelatedNews);

    app.get('/live/', getLiveNewsList);
    app.get('/live/:slug', getLiveNewsBySlug);
    app.get('/live/:slug/next', getLiveNewsNext);

    app.get('/shorts/latest', getLatestShortVideos);
    app.get('/shorts', getShortVideos);
    app.get('/shorts/:slug/next', getNextShortVideos);
    app.get('/shorts/:slug', getShortVideoBySlug);

    app.get('/yt/video-news', getVideoNews);
    app.get('/yt/video-news/:news_id', getYtNews);
    app.get('/yt/related-news/:news_id', getRelatedYtNews);

    app.get('/taxonomy/categories/:slug', getCategoryBySlug);
    app.get('/taxonomy/categories', getCategoryTree);
    app.get('/taxonomy/states', getStates);
    app.get('/taxonomy/states/:slug', getStateBySlug);

    app.get('/authors/:username', getAuthorPublic);
    app.get('/authors/:username/news', getAuthorNews);


}