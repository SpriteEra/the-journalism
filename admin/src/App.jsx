import { useState, useEffect, Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useDispatch } from "react-redux";
import "./App.css";
import useSocket from "./hooks/useSocket";
import NotificationToast from "./components/notification/NotificationToast";
import ProtectedRoute from "./utils/ProtectedRoute";
import {
  getUser,
  getUserSuccess,
  getUserFail,
} from "./redux/slices/user.slice";
import httpClient from "./api/httpClient";
import Loader from "./components/Loader";
import TrendsDashboard from "./components/keywords/AIDashboard";
import ShortVideoFormPage from "./pages/shortVideos/ShortVideoForm";

const AdminLayout = lazy(() => import("./components/layout/AdminLayout"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const News = lazy(() => import("./pages/News"));
const Videos = lazy(() => import("./pages/Videos"));
const BreakingNews = lazy(() => import("./pages/BreakingNews"));
const ScheduledNews = lazy(() => import("./pages/ScheduledNews"));
const DraftNews = lazy(() => import("./pages/DraftNews"));
const CreateNews = lazy(() => import("./pages/news/CreateNews"));
const CreateVideo = lazy(() => import("./pages/video/CreateVideo"));
const UpdateVideo = lazy(() => import("./pages/video/UpdateVideo"));
const EventNews = lazy(() => import("./pages/event/EventNews"));
const CreateEventNews = lazy(() => import("./pages/event/CreateEventNews"));
const EditEventNews = lazy(() => import("./pages/event/EditEventNews"));
const Reporters = lazy(() => import("./pages/reporters/Reporters"));
const ReporterProfile = lazy(() => import("./pages/reporters/ReporterProfile"));
const TeamPerformance = lazy(() => import("./pages/team/TeamPerformance"));
const ReporterForm = lazy(() => import("./pages/reporters/ReporterForm"));
const ActivityLogs = lazy(() => import("./pages/logs/ActivityLogs"));
const Overview = lazy(() => import("./pages/overview/Overview"));
const Analytics = lazy(() => import("./pages/analytics/Analytics"));
const NewsDetails = lazy(() => import("./pages/news/NewsDetails"));
const CreatephoteGallery = lazy(() =>
  import("./pages/photoGallery/CreatephoteGallery")
);
const UpdatePhotoGallery = lazy(() =>
  import("./pages/photoGallery/UpdatePhoteGallery")
);
const UpdateDraftPhotoGallery = lazy(() =>
  import("./pages/photoGallery/UpdateDraftPhotoGallery")
);
const PhotoGallery = lazy(() => import("./pages/photoGallery/PhotoGallery"));
const DraftPhotoGallery = lazy(() =>
  import("./pages/photoGallery/DraftPhotGallery")
);
const ReviewNews = lazy(() => import("./pages/reviewNews/ReviewNews"));
const Trash = lazy(() => import("./pages/trash/Trash"));
const Profile = lazy(() => import("./pages/Profile"));
const TitleAds = lazy(() => import("./pages/TitleAds"));
const VideoNews = lazy(() => import("./pages/VideoNews"));
const Home = lazy(() => import("./pages/Home"));
const AdminEvent = lazy(() => import("./pages/event/AdminEvent"));
const EventAdminNews = lazy(() => import("./pages/event/AdminEventNews"));
const AdsSquare = lazy(() => import("./pages/AdsPages/AdsSquare"));
const BannerAds = lazy(() => import("./pages/AdsPages/BannerAds"));
const AdsInNews = lazy(() => import("./pages/AdsPages/AdsInNews"));
const Panchang = lazy(() => import("./pages/Panchang"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const Roles = lazy(() => import("./pages/roles/Roles"));
const Tags = lazy(() => import("./pages/tags/Tags"));
const Categories = lazy(() => import("./pages/taxonomy/Categories"));
const HomeSections = lazy(() => import("./pages/homesection/HomeSection"));   // 👈 new
const ShortVideos = lazy(() => import("./pages/shortVideos/ShortVideos"));

const App = () => {
  const dispatch = useDispatch();
  const [currentToast, setCurrentToast] = useState(null);
  const [appInitialized, setAppInitialized] = useState(false);
  const { newNotifications } = useSocket();
  const VIDEO_PERMS = ["video.create", "video.manage.own", "video.manage.any", "video.shorts.manage"];
  // ✅ Load user data on app initialization
  useEffect(() => {
    const loadUserData = async () => {
      try {
        dispatch(getUser());

        // Make API call to get user data
        const response = await httpClient.get("/me"); // Adjust endpoint as needed

        if (response.data?.success) {
          dispatch(getUserSuccess({ user: response.data.user }));
        } else {
          // Invalid response
          localStorage.removeItem("accessToken");
          sessionStorage.removeItem("refreshToken");
          dispatch(getUserFail("Failed to load user"));
        }
      } catch (error) {
        console.error("Failed to load user:", error);

        // Clear invalid token
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");

        dispatch(
          getUserFail(
            error.response?.data?.message ||
            error.message ||
            "Failed to load user"
          )
        );
      } finally {
        setAppInitialized(true);
      }
    };

    loadUserData();
  }, [dispatch]);

  useEffect(() => {
    if (newNotifications.length > 0) {
      setCurrentToast(newNotifications[0]);
    }
  }, [newNotifications]);

  const handleToastClose = () => setCurrentToast(null);

  const handleToastAction = () => {
    if (currentToast?.link) {
      setCurrentToast(null);
    }
  };

  // ✅ Show loading while initializing
  if (!appInitialized) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-canvas">
        <Loader />
      </div>
    );
  }

  return (
    <BrowserRouter>
      {currentToast && (
        <NotificationToast
          notification={currentToast}
          onClose={handleToastClose}
          onAction={handleToastAction}
        />
      )}

      {/* Suspense fallback while lazy components load */}
      <Suspense
        fallback={
          <div className="flex min-h-dvh items-center justify-center bg-canvas">
            <Loader />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          <Route path="/dashboard" element={<AdminLayout />}>
            <Route index element={<ProtectedRoute component={Overview} />} />

            {/* newsroom */}
            <Route path="news" element={<ProtectedRoute component={News} permission={["news.view.own", "news.view.all"]} />} />
            <Route path="news/create" element={<ProtectedRoute component={CreateNews} permission="news.create" />} />
            <Route path="news/:news_id" element={<ProtectedRoute component={NewsDetails} permission={["news.view.own", "news.view.all"]} />} />
            <Route path="news/edit-news/:news_id" element={<ProtectedRoute component={CreateNews} permission={["news.update.own", "news.update.any"]} />} />
            <Route path="draft-news" element={<ProtectedRoute component={DraftNews} permission={["news.view.own", "news.view.all"]} />} />
            <Route path="schedule-news" element={<ProtectedRoute component={ScheduledNews} permission="news.schedule" />} />
            <Route path="review-news" element={<ProtectedRoute component={ReviewNews} permission="news.approve" />} />
            <Route path="review-news/edit-news/:news_id" element={<ProtectedRoute component={CreateNews} permission="news.approve" />} />
            <Route path="breaking-news" element={<ProtectedRoute component={BreakingNews} permission="breaking.manage" />} />

            {/* media */}

            <Route path="short-videos" element={<ProtectedRoute component={ShortVideos} permission={VIDEO_PERMS} />} />
            <Route path="short-videos/new" element={<ProtectedRoute component={ShortVideoFormPage} permission={["video.create"]} />} />
            <Route path="short-videos/:slug/edit" element={<ProtectedRoute component={ShortVideoFormPage} permission={["video.manage.own", "video.manage.any", "video.shorts.manage"]} />} />

            <Route path="videos" element={<ProtectedRoute component={Videos} permission="yt.manage" />} />
            <Route path="videos/create" element={<ProtectedRoute component={CreateVideo} permission="yt.manage" />} />
            <Route path="videos/edit/:news_id" element={<ProtectedRoute component={UpdateVideo} permission="yt.manage" />} />
            <Route path="video-news" element={<ProtectedRoute component={VideoNews} permission="yt.manage" />} />
            <Route path="add-video" element={<ProtectedRoute component={VideoNews} permission="yt.manage" />} />
            <Route path="photo-gallery" element={<ProtectedRoute component={PhotoGallery} permission={["gallery.manage.own", "gallery.manage.any"]} />} />
            <Route path="draft-photo-gallery" element={<ProtectedRoute component={DraftPhotoGallery} permission={["gallery.manage.own", "gallery.manage.any"]} />} />
            <Route path="photo-gallery/create" element={<ProtectedRoute component={CreatephoteGallery} permission="gallery.create" />} />
            <Route path="photo-gallery/edit/:news_id" element={<ProtectedRoute component={UpdatePhotoGallery} permission={["gallery.manage.own", "gallery.manage.any"]} />} />
            <Route path="draft-photo-gallery/edit/:news_id" element={<ProtectedRoute component={UpdateDraftPhotoGallery} permission={["gallery.manage.own", "gallery.manage.any"]} />} />
            <Route path="events" element={<ProtectedRoute component={EventNews} permission={["event.manage.own", "event.manage.any"]} />} />
            <Route path="events/create" element={<ProtectedRoute component={CreateEventNews} permission="event.create" />} />
            <Route path="events/edit/:news_id" element={<ProtectedRoute component={EditEventNews} permission={["event.manage.own", "event.manage.any"]} />} />
            <Route path="admin-events" element={<ProtectedRoute component={AdminEvent} permission="event.category.manage" />} />
            <Route path="admin-events/:id" element={<ProtectedRoute component={EventAdminNews} permission="event.category.manage" />} />
            <Route path="panchang" element={<ProtectedRoute component={Panchang} permission="panchang.manage" />} />

            {/* content setup */}
            <Route path="categories" element={<ProtectedRoute component={Categories} permission="taxonomy.view" />} />
            <Route path="home-sections" element={<ProtectedRoute component={HomeSections} permission="taxonomy.view" />} />
            <Route path="tags" element={<ProtectedRoute component={Tags} permission="taxonomy.view" />} />
            <Route path="ora-ai" element={<ProtectedRoute component={TrendsDashboard} permission="tools.ai" />} />

            <Route path="ads/side-ads" element={<ProtectedRoute component={AdsSquare} permission="ads.manage" />} />
            <Route path="ads/banner-ads" element={<ProtectedRoute component={BannerAds} permission="ads.manage" />} />
            <Route path="ads-square" element={<ProtectedRoute component={AdsSquare} permission="ads.manage" />} />
            <Route path="ads/ads-innews" element={<ProtectedRoute component={AdsInNews} permission="ads.manage" />} />
            <Route path="ads/title-ads" element={<ProtectedRoute component={TitleAds} permission="ads.manage" />} />

            {/* team & insights */}
            <Route path="analytics" element={<ProtectedRoute component={Analytics} permission={["analytics.view", "reporter.performance.own", "reporter.performance.all"]} />} />
            <Route path="reporters" element={<ProtectedRoute component={Reporters} permission="user.view" />} />
            <Route path="team-performance" element={<ProtectedRoute component={TeamPerformance} permission="reporter.performance.all" />} />
            <Route path="reporters/new" element={<ProtectedRoute component={ReporterForm} permission="user.create" />} />
            <Route path="reporters/:id/edit" element={<ProtectedRoute component={ReporterForm} permission="user.update" />} />
            <Route path="reporters/:id" element={<ProtectedRoute component={ReporterProfile} permission="user.view" />} />
            <Route path="activity-logs" element={<ProtectedRoute component={ActivityLogs} permission={["logs.view", "logs.user.view"]} />} />
            <Route path="roles" element={<ProtectedRoute component={Roles} permission="role.view" />} />
            <Route path="trash" element={<ProtectedRoute component={Trash} permission={["trash.view.own", "trash.view.all"]} />} />
            <Route path="profile" element={<ProtectedRoute component={Profile} />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
