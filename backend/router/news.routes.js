import { getFeaturedPublic, getLatestNews, fetchOnlyToday, fetchStateNewsDistrictWise, findStateNews, getGoogleNewsXMLData, getHomeNews, getLiteratureNews, getNewses, getNewsInfiniteScroll, getNewsXMLData, getRelatedNews, getSingleNews, searchNews } from '../controller/news.controller.js';
import { getAuthorPublic } from '../controller/author.controller.js';
import { getBreakingNews } from '../controller/breaking.news.controller.js';
import { getEventNews, getEventNewsByCateogry, getRandomEventNews, incrementEventNewsCount } from '../controller/event.controller.js';
import { getClientPanchang } from '../controller/panchang.controller.js';
import { getGalleryNews, getGalleryNewsSingle, getRelatedGalleryNews } from '../controller/gallerynews.controller.js';










export default newsRouter;

async function newsRouter(app) {
    app.post('/get-news-query', getNewses);
    app.get('/home', getHomeNews);
    app.get('/latest', getLatestNews);
    app.get('/featured', getFeaturedPublic);
    app.get('/authors/:username', getAuthorPublic);
    app.get('/literature', getLiteratureNews);
    app.get('/related-news/:news_id', getRelatedNews);
    app.get("/fetch-state-news", fetchStateNewsDistrictWise);
    app.get("/fetch-all-state-news", findStateNews);
    app.get('/get/:news_id', getSingleNews);
    app.get('/:news_id/scroll', getNewsInfiniteScroll);
    app.get('/search-news', searchNews);
    app.get('/sitemap-news', getNewsXMLData);
    app.get('/google-news-sitemap', getGoogleNewsXMLData);
    app.get('/breaking-news', getBreakingNews);
    app.get('/today-news', fetchOnlyToday);
    app.get('/gallery-news', getGalleryNews);
    app.get('/gallery-news/:news_id', getGalleryNewsSingle);
    app.get('/gallery-related-news/:news_id', getRelatedGalleryNews);
    app.get('/event-news', getEventNewsByCateogry);
    app.get('/event/:news_id', getEventNews);
    app.get('/random-event-news', getRandomEventNews);
    app.get('/event-news-count/:news_id', incrementEventNewsCount);
    app.get('/panchang', getClientPanchang);
}
