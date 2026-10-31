import { LayoutList, Radio } from "lucide-react";
import {
  BarChart3, CalendarCheck, CalendarClock, CalendarCog, CalendarDays, FileText, FolderTree, Images, KeyRound, LayoutGrid, Megaphone,
  PlaySquare, Rss, Save, ScrollText, ShieldCheck, Sparkles, Tags, Trash2, Trophy, UserCog, Users, Video,
} from "lucide-react";

/**
 * Sidebar structure. An item shows when the user has ANY of `perm` (no `perm` = everybody).
 * `superOnly` = built-in admin only (for pages whose backend routes are still role based).
 */
export const NAV = [
  {
    title: "Newsroom",
    items: [
      { label: "Overview", to: "/dashboard", icon: LayoutGrid, end: true, perm: ["analytics.view"] },
      { label: "News", to: "/dashboard/news", icon: FileText, perm: ["news.view.own", "news.view.all"] },
      { label: "Review queue", to: "/dashboard/review-news", icon: ShieldCheck, perm: ["news.approve"] },
      { label: "Drafts", to: "/dashboard/draft-news", icon: Save, perm: ["news.view.own", "news.view.all"] },
      { label: "Scheduled", to: "/dashboard/schedule-news", icon: CalendarClock, perm: ["news.schedule"] },
      { label: "Live news", to: "/dashboard/live", icon: Radio, perm: ["live.create", "live.manage.own", "live.manage.any"] },
      // { label: "Breaking news", to: "/dashboard/breaking-news", icon: Rss, perm: ["breaking.manage"] },
    ],
  },
  {
    title: "Media",
    items: [
      { label: "Shorts & videos", to: "/dashboard/short-videos", icon: PlaySquare, perm: ["video.create", "video.manage.own", "video.manage.any", "video.shorts.manage"] },
      { label: "YouTube news", to: "/dashboard/videos", icon: Video, perm: ["yt.manage"] },
      // { label: "Photo gallery", to: "/dashboard/photo-gallery", icon: Images, perm: ["gallery.create", "gallery.manage.own", "gallery.manage.any"] },
      // { label: "Events", to: "/dashboard/events", icon: CalendarCheck, perm: ["event.create", "event.manage.own", "event.manage.any"] },
      // { label: "Event categories", to: "/dashboard/admin-events", icon: CalendarCog, perm: ["event.category.manage"] },
      // { label: "Panchang", to: "/dashboard/panchang", icon: CalendarDays, perm: ["panchang.manage"] },
    ],
  },
  {
    title: "Content setup",
    items: [
      { label: "Categories", to: "/dashboard/categories", icon: FolderTree, perm: ["taxonomy.view"] },
      { to: "/dashboard/home-sections", label: "Home sections", icon: LayoutList, perms: ["taxonomy.view"] },
      { label: "Topics", to: "/dashboard/tags", icon: Tags, perm: ["taxonomy.view"] },
      {
        label: "Advertising", icon: Megaphone, perm: ["ads.manage"], key: "ads",
        children: [
          { label: "Banner ads", to: "/dashboard/ads/banner-ads" },
          { label: "Side ads", to: "/dashboard/ads/side-ads" },
          // { label: "In-news ads", to: "/dashboard/ads/ads-innews" },
          // { label: "Title ads", to: "/dashboard/ads/title-ads" },
        ],
      },
      { label: "Ora AI", to: "/dashboard/ora-ai", icon: Sparkles, perm: ["tools.ai"] },
    ],
  },
  {
    title: "Team & insights",
    items: [
      { label: "Analytics", to: "/dashboard/analytics", icon: BarChart3, perm: ["analytics.view", "reporter.performance.own", "reporter.performance.all"] },
      { label: "Team performance", to: "/dashboard/team-performance", icon: Trophy, perm: ["reporter.performance.all"] },
      { label: "Reporters", to: "/dashboard/reporters", icon: Users, perm: ["user.view"] },
      { label: "Roles & permissions", to: "/dashboard/roles", icon: KeyRound, perm: ["role.view"] },
      { label: "Activity logs", to: "/dashboard/activity-logs", icon: ScrollText, perm: ["logs.view", "logs.user.view"] },
      { label: "Trash", to: "/dashboard/trash", icon: Trash2, perm: ["trash.view.own", "trash.view.all"] },
      { label: "My profile", to: "/dashboard/profile", icon: UserCog },
    ],
  },
];

/** NAV filtered for a user: `allowed(perms[])` => boolean */
export const visibleNav = (allowed) =>
  NAV.map((section) => ({
    ...section,
    items: section.items.filter((i) => !i.perm || allowed(i.perm)),
  })).filter((s) => s.items.length);

/** Flat list (for the breadcrumb / title lookup) */
export const flatNav = () => NAV.flatMap((s) => s.items.flatMap((i) => (i.children ? i.children.map((c) => ({ ...c, parent: i.label })) : [i])));
