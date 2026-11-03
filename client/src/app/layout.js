import { Inter, Mukta, Khand } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import JsonLd from "@/components/common/JsonLd";
import { getMenu, getPopularTopics } from "@/lib/data";
import { abs, siteDescription, siteName, siteUrl, socials } from "@/lib/site";
import { categoryPath, subCategoryPath } from "@/lib/adapters";
import UnderConstruction from "@/components/Underconstruction";
import Footer from "@/components/Footer";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const mukta = Mukta({ variable: "--font-mukta", subsets: ["latin", "devanagari"], weight: ["200", "300", "400", "500", "600", "700", "800"], display: "swap" });
const khand = Khand({ variable: "--font-khand", subsets: ["latin", "devanagari"], weight: ["300", "400", "500", "600", "700"], display: "swap" });

const TWITTER_HANDLE = process.env.NEXT_PUBLIC_TWITTER_HANDLE || "";
const OG_IMAGE = { url: "/og-default.png", width: 1200, height: 630, alt: siteName() };
const AGENCY = { name: "SpriteEra IT Solutions Pvt Ltd", url: "https://spriteera.com" };

// Site-wide defaults only. Page-specific values (canonical, OG title/url, RSS) belong in each route.
export const metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: siteName(), template: `%s | ${siteName()}` },
  description: siteDescription(),
  applicationName: siteName(),
  authors: [{ name: siteName(), url: siteUrl() }],
  creator: siteName(),
  publisher: siteName(),
  category: "news",
  formatDetection: { email: false, address: false, telephone: false },

  openGraph: {
    type: "website",
    siteName: siteName(),
    locale: "hi_IN",
    images: [OG_IMAGE],
  },

  twitter: {
    card: "summary_large_image",
    images: [OG_IMAGE.url],
    ...(TWITTER_HANDLE ? { site: TWITTER_HANDLE, creator: TWITTER_HANDLE } : {}),
  },

  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },

  other: { designer: AGENCY.name, developer: AGENCY.name },
};

const ICONS = { facebook: "/facebook.png", instagram: "/instagram.png", youtube: "/youtube.png", x: "/twitter.png" };
const LABELS = { facebook: "Facebook", instagram: "Instagram", youtube: "YouTube", x: "Twitter" };

export default async function RootLayout({ children }) {
  const [menu, popular] = await Promise.all([getMenu(), getPopularTopics({ limit: 8 })]);
  const items = menu.map((c) => ({
    label: c.name,
    href: categoryPath(c.slug),
    ...(c.children.length
      ? { children: c.children.map((k) => ({ label: k.name, href: subCategoryPath(c.slug, k.slug) })) }
      : {}),
  }));
  const socialList = socials();
  const links = socialList.map(({ name, url }) => ({ label: LABELS[name], href: url, icon: ICONS[name] }));
  const topics = (popular || []).map((t) => ({ label: t.label ?? t.name, href: `/topic/${t.slug}` }));

  const site = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName(),
    url: siteUrl(),
    inLanguage: "hi-IN",
    potentialAction: {
      "@type": "SearchAction",
      target: `${abs("/search")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const org = {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: siteName(),
    url: siteUrl(),
    logo: { "@type": "ImageObject", url: abs("/logo.png") },
    sameAs: socialList.map((s) => s.url).filter(Boolean),
  };

  return (
    <html lang="hi" className={`${inter.variable} ${mukta.variable} ${khand.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <JsonLd data={site} />
        <JsonLd data={org} />
        <UnderConstruction logo="/logo.png" name={siteName()} socials={links} />
        <Navbar items={items} topics={topics} />
        {children}
        <Footer />
      </body>
    </html>
  );
}