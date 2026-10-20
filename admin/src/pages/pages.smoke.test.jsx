import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import userReducer from "../redux/slices/user.slice";
import "../i18n";
import { ConfirmProvider } from "../components/ui/ConfirmProvider";

// ── fixtures the hooks return ──
const q = (data) => ({ data, isLoading: false, isPending: false, isFetching: false, isError: false, error: null, refetch: () => {} });
const report = {
  summary: { published: 12, totalViews: 3400, avgViewsPerArticle: 283, bestArticleViews: 900, activeDays: 9, articlesPerWeek: 3, consistencyPercent: 60, drafts: 2, pendingApproval: 1, scheduledWaiting: 0, deleted: 0, lastPublishedAt: "2026-10-10T10:00:00Z" },
  comparison: { publishedChangePercent: 10, viewsChangePercent: -5 }, rank: { byViews: 2, totalActiveReporters: 9 },
  trends: { daily: [{ date: "2026-10-01", published: 1, views: 10 }], monthly: [{ month: "2026-10", published: 3, views: 90 }] },
  timing: { byHour: [{ hour: 10, articles: 2, views: 20 }], byWeekday: [{ isoWeekday: 1, articles: 2 }] },
  breakdown: { byCategory: [{ name: "Politics", articles: 5 }], byState: [{ name: "UP", articles: 4 }], topTags: [{ name: "modi", articles: 3 }] },
  topArticles: [{ news_id: "n1", title: "खबर", views: 900 }],
  otherContent: { gallery: { published: 1, views: 5 }, events: { published: 0, views: 0 }, youtubeVideos: { published: 2, views: 50 }, liveNews: { published: 0, views: 0 }, shortVideos: { shorts: { published: 3, views: 30 }, total: { published: 3, views: 30 } } },
  allTime: { published: 100, views: 9999 },
};
const dash = { data: {
  overview: { news: { published: 5, views: 100, avgViews: 20, activeReporters: 2, change: { publishedPercent: 1, viewsPercent: 2 } }, people: { total: 4, byRole: [{ role: "reporter", users: 3, blocked: 0 }] }, workflow: {}, otherContent: report.otherContent },
  timeseries: { series: [{ bucket: "2026-10-01", published: 1, views: 10 }] }, categories: [{ name: "Politics", articles: 5 }], states: [{ name: "UP", articles: 4 }],
  reporters: [{ reporter: { _id: "u1", username: "ravi" }, published: 3, views: 90 }], approval: { pending: 2, aging: { over6h: 1, over24h: 1, over72h: 0 }, avgApprovalHours: 3 },
  heatmap: { grid: Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => ({ views: 1, articles: 1 }))) }, topArticles: [{ news_id: "n1", title: "खबर", author: { username: "ravi" }, category: [{ name: "Politics" }], activity: { total_reads: 9 } }],
  dataQuality: { publishedWithoutCategory: 0, publishedWithoutTags: 0 },
}, cache: {} };

vi.mock("../hooks/admin", async (orig) => {
  const real = await orig();
  return {
    ...real,
    useAnalyticsDashboard: () => q(dash),
    useReporterPerformance: () => q(report),
    useUserDetail: () => q({ user: { _id: "u1", username: "ravi", fullName: "Ravi K", email: "r@x.in", role: "reporter", createdAt: "2026-01-01", trusted: false }, access: { permissions: ["news.create"], isSuper: false } }),
    useActivityLogs: () => q({ logs: [{ _id: "1", createdAt: "2026-10-10T10:00:00Z", actorName: "ravi", actorRole: "reporter", action: "Created news", method: "POST", path: "/api/v1/admin/create-news", statusCode: 201, ip: "1.1.1.1" }], total: 1 }),
    useActivityLogStats: () => q({ totals: { total: 4, failed: 1 }, daily: [{ day: "2026-10-10", total: 4, failed: 1 }], topActors: [{ name: "ravi", count: 4 }], topActions: [] }),
    useCategories: () => q([]), useStates: () => q([]), useDistricts: () => q([]),
    useApiMutation: () => ({ mutate: () => {}, isPending: false }),
    useRoles: () => q([{ name: "reporter", permissions: ["news.create"] }, { name: "admin", permissions: ["*"] }]),
    usePermissionCatalog: () => q({ groups: [{ group: "News", items: [{ key: "news.create", label: "Create news" }, { key: "news.feature", label: "Feature a story" }] }], mine: ["news.create", "news.feature"] }),
    useReportersLeaderboard: () => q([{ rank: 1, reporter: { _id: "u1", username: "ravi", fullName: "Ravi K", role: "reporter" }, published: 4, views: 400, avgViews: 100, activeDays: 3, lastPublishedAt: "2026-10-10T10:00:00Z" }]),
  };
});
vi.mock("../hooks/news", () => ({
  useFetchNews: () => q({ total: 1, news: [{ news_id: "n1", title: "मोदी की रैली", description: "d", banner: "https://x/y.jpg", createdAt: "2026-10-10T10:00:00Z", author: { _id: "u1", username: "ravi" }, category: [{ slug: "c", name: "Politics" }], tags: [{ slug: "t", title: "modi" }], keywords: { hi: ["मोदी"], en: ["modi"] }, activity: { total_reads: 12 }, need_approval: false, isPublished: true }] }),
  useNewsAuthors: () => q([{ _id: "u1", username: "ravi", total: 3 }]),
  useFetchScheduleNews: () => q({ total: 1, news: [{ news_id: "s1", title: "निर्धारित खबर", banner: "https://x/y.jpg", post_time: { date: "2026-10-20", time: "10:00 AM" }, author: { username: "ravi" } }] }),
  useFetchBreakingNews: () => q({ total: 1, news: [{ _id: "b1", title: "ब्रेकिंग शीर्षक", createdAt: "2026-10-10T10:00:00Z", author: { username: "ravi" } }] }),
  fetchSingleNews: async () => ({}),
}));
vi.mock("../hooks/panchang", () => ({ useFetchPanchang: () => q([{ _id: "p1", image: "https://x/p.jpg", createdAt: "2026-10-10T10:00:00Z", author: { username: "ravi" } }]) }));
const ADS_DATA = q({ banner: [{ _id: "a1", banner: { url: "https://x/a.jpg" }, createdAt: "2026-10-01T10:00:00Z", expireDate: "2026-11-01T10:00:00Z", author: { username: "ravi" }, link: "https://adv.in" }], square: [], detail: [] });
vi.mock("../hooks/ads", () => ({ useFetchAds: () => ADS_DATA }));
const PROFILE = q({ _id: "u1", username: "ravi", fullName: "Ravi K", email: "r@x.in", createdAt: "2026-01-01", profile: "https://x/p.jpg", about: "", designation: "", location: "", phone: "", social: {} });
vi.mock("../hooks/user", () => ({ useFetchProfile: () => PROFILE }));
vi.mock("../api/httpClient", () => ({ default: { get: vi.fn(async () => ({ data: {} })), post: vi.fn(), delete: vi.fn(), patch: vi.fn(async () => ({ data: {} })), put: vi.fn(async () => ({ data: { profile: { fullName: "Ravi K", profile: "https://x/p.jpg" } } })) } }));
vi.mock("../hooks/useTrends", () => ({
  useFetchTopTrends: () => TRENDS, useFetchRss: () => RSS, useFetchRelatedTags: () => q(null),
}));
vi.mock("../components/NotificationSettings", () => ({ default: () => null }));

const TRENDS = { ...q({ data: [{ keyword: "modi", searchVolume: 5000 }, { keyword: "चुनाव", searchVolume: 3000 }, { keyword: "ipl", searchVolume: 1000 }] }), dataUpdatedAt: Date.now() };
const RSS = q({ data: [{ _id: "r1", title: "आज की बड़ी खबर", state: "UP", searchVolume: 2000, pubDate: "2026-10-10T10:00:00Z", link: "https://news.example/1" }] });

const admin = { id: "u1", username: "asha", role: "admin" };
const mount = (ui, path = "/") => render(
  <Provider store={configureStore({ reducer: { user: userReducer }, preloadedState: { user: { user: admin, loading: false, error: null, isAuthenticated: true } } })}>
    <QueryClientProvider client={new QueryClient()}><ConfirmProvider><MemoryRouter initialEntries={[path]}><Routes><Route path="*" element={ui} /><Route path="/r/:id" element={ui} /></Routes></MemoryRouter></ConfirmProvider></QueryClientProvider>
  </Provider>
);

describe("new pages render without crashing", () => {
  it("Overview (dashboard graphs)", async () => {
    const { default: Overview } = await import("./overview/Overview");
    mount(<Overview />);
    expect(await screen.findByText("Category mix")).toBeTruthy();
    expect(screen.getByText("Review pipeline")).toBeTruthy();
    expect(screen.getByText("Best publishing hours")).toBeTruthy();
  });
  it("ActivityLogs", async () => {
    const { default: ActivityLogs } = await import("./logs/ActivityLogs");
    mount(<ActivityLogs />);
    expect(await screen.findByText("Admin panel log")).toBeTruthy();
    expect(screen.getAllByText("Created news").length).toBeGreaterThan(0);
  });
  it("ReporterProfile", async () => {
    const { default: ReporterProfile } = await import("./reporters/ReporterProfile");
    mount(<ReporterProfile />, "/r/u1");
    expect((await screen.findAllByText("Ravi K")).length).toBeGreaterThan(0);
    expect(screen.getByText("Top stories")).toBeTruthy();
  });
  it("Profile", async () => {
    const { default: Profile } = await import("./Profile");
    mount(<Profile />);
    expect(await screen.findByText("Appearance & language")).toBeTruthy();
  });
  it("NewsList with filters + cards", async () => {
    const { default: NewsList } = await import("../components/news/NewsList");
    mount(<NewsList title="News" />);
    expect(await screen.findByText("मोदी की रैली")).toBeTruthy();
    // creator + date range live inside the Filters panel
    expect(screen.queryByText("Any date")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Filters/ }));
    expect(await screen.findByText("Any date")).toBeTruthy();
    expect(screen.getAllByText("Created by").length).toBeGreaterThan(0);
  });
  it("NewsPreview shows the story, keywords and device switch", async () => {
    const { default: NewsPreview } = await import("../components/news/NewsPreview");
    render(<NewsPreview open onClose={() => {}} news={{ title: "शीर्षक", description: "सार", banner: "", keywords: { hi: ["मोदी"], en: ["modi"] }, topics: ["Politics"], categories: ["News"], author: "Ravi", content: [{ blocks: [{ type: "paragraph", data: { text: "नमस्ते <b>दुनिया</b><script>alert(1)</script>" } }] }] }} />);
    expect(screen.getByText("शीर्षक")).toBeTruthy();
    expect(screen.getByText("#मोदी")).toBeTruthy();
    expect(document.body.innerHTML).not.toContain("<script>");
    expect(screen.getByRole("tab", { name: /Mobile/ })).toBeTruthy();
  });
  it("YouTube news form", async () => {
    const { default: CreateVideo, parseYouTubeId } = await import("./video/CreateVideo");
    expect(parseYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeId("nonsense")).toBeNull();
    mount(<CreateVideo />);
    await waitFor(() => expect(screen.getByText("Video link")).toBeTruthy());
  });

  it("Team performance (leaderboard + trending)", async () => {
    const { default: TeamPerformance } = await import("./team/TeamPerformance");
    mount(<TeamPerformance />);
    expect(await screen.findByText("Leaderboard")).toBeTruthy();
    expect(screen.getByText("Trending this week")).toBeTruthy();
    expect(screen.getAllByText("Ravi K").length).toBeGreaterThan(0);
  });
  it("Add team member is a page with required photo / name / about", async () => {
    const { default: ReporterForm } = await import("./reporters/ReporterForm");
    mount(<ReporterForm />);
    expect(await screen.findByText("Add team member")).toBeTruthy();
    expect(screen.getByText("Profile photo")).toBeTruthy();
    expect(screen.getByText("Author page preview")).toBeTruthy();
    expect(screen.getByLabelText("Choose profile photo")).toBeTruthy();
  });
  it("Per-person permissions panel on the profile", async () => {
    const { default: Panel } = await import("../components/users/PermissionOverridesPanel");
    mount(<Panel userId="u1" role="reporter" />);
    expect(await screen.findByText("Feature a story")).toBeTruthy();
    expect(screen.getAllByRole("radiogroup").length).toBe(2);
  });

  it("Scheduled news, Breaking news, Panchang follow the News structure (header + action, red Delete)", async () => {
    const Sched = (await import("./ScheduledNews")).default;
    const { unmount } = mount(<Sched />);
    expect(await screen.findByText("Scheduled news")).toBeTruthy();
    expect(screen.getByText("निर्धारित खबर")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Delete/ }).className).toMatch(/danger/);
    unmount();
    const Breaking = (await import("./BreakingNews")).default;
    const b = mount(<Breaking />);
    expect(await screen.findByText("ब्रेकिंग शीर्षक")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Add breaking news/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Delete/ }).className).toMatch(/danger/);
    b.unmount();
    const Panchang = (await import("./Panchang")).default;
    mount(<Panchang />);
    expect(await screen.findByRole("button", { name: /Add panchang/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Delete/ }).className).toMatch(/danger/);
  });
  it("Ads page: create on top, list rows with a red Delete", async () => {
    const Banner = (await import("./AdsPages/BannerAds")).default;
    mount(<Banner />);
    expect(await screen.findByRole("button", { name: /Create ad/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Delete/ }).className).toMatch(/danger/);
    expect(screen.getByRole("button", { name: /Extend 30 days/ })).toBeTruthy();
  });
  it("InfoTip explains a field on hover", async () => {
    const { InfoTip } = await import("../components/ui");
    render(<InfoTip>Shown under the headline.</InfoTip>);
    fireEvent.mouseEnter(screen.getByRole("button", { name: "What is this?" }).parentElement);
    expect(await screen.findByRole("tooltip")).toBeTruthy();
    expect(screen.getByText("Shown under the headline.")).toBeTruthy();
  });

  it("My profile: an incomplete profile opens the editor; saving sends the profile to the server", async () => {
    const { default: Profile } = await import("./Profile");
    const httpClient = (await import("../api/httpClient")).default;
    mount(<Profile />);
    expect(await screen.findByText("Edit profile")).toBeTruthy();
    expect(screen.getByText("Profile photo")).toBeTruthy();
    fireEvent.change(document.querySelector("textarea"), { target: { value: "Senior reporter covering the region for ten years." } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(httpClient.put).toHaveBeenCalledWith("/profile", expect.any(FormData)));
    const body = httpClient.put.mock.calls[0][1];
    expect(body.get("fullName")).toBe("Ravi K");
    expect(body.get("about")).toMatch(/Senior reporter/);
  });
  it("Reporter profile: Account tab offers password reset (and the header keeps the avatar above the cover)", async () => {
    const { default: ReporterProfile } = await import("./reporters/ReporterProfile");
    mount(<ReporterProfile />, "/r/u1");
    expect((await screen.findAllByText("Ravi K")).length).toBeGreaterThan(0);
    const body = screen.getByRole("heading", { name: "Ravi K" }).closest(".relative.z-10");
    expect(body, "the identity body must be a positioned z-10 layer above the cover").toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: /Account/ }));
    expect(await screen.findByRole("button", { name: /Reset password/ })).toBeTruthy();
  });
  it("Ora AI page: premium hero, top 10, trending and news feed, copy works", async () => {
    const { default: Ora } = await import("../components/keywords/AIDashboard");
    const write = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText: write }, configurable: true });
    mount(<Ora />);
    expect(await screen.findByText(/Trend Intelligence/)).toBeTruthy();
    expect(screen.getByText("Top 10 keywords")).toBeTruthy();
    fireEvent.click(screen.getAllByText("modi")[0]);
    await waitFor(() => expect(write).toHaveBeenCalledWith("modi"));
    fireEvent.click(screen.getByRole("tab", { name: "News feed" }));
    expect(await screen.findByText("आज की बड़ी खबर")).toBeTruthy();
  });
});
