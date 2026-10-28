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

// every page gets "<page title> | Site name"; pages that have their own SEO title use `title.absolute`
export const metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: siteName(), template: `%s | ${siteName()}` },
  description: siteDescription(),
  applicationName: siteName(),
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: siteName(), locale: "hi_IN", title: siteName(), description: siteDescription() },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
};

const ICONS = { facebook: "/facebook.png", instagram: "/instagram.png", youtube: "/youtube.png", x: "/twitter.png" };
const LABELS = { facebook: "Facebook", instagram: "Instagram", youtube: "YouTube", x: "Twitter" };

export default async function RootLayout({ children }) {
  const [menu, popular] = await Promise.all([getMenu(), getPopularTopics({ limit: 8 })]);
  const items = menu.map((c) => ({
    label: c.name,
    href: categoryPath(c.slug),
    ...(c.children.length ? { children: c.children.map((k) => ({ label: k.name, href: subCategoryPath(c.slug, k.slug) })) } : {}),
  }));
  const links = socials().map(({ name, url }) => ({ label: LABELS[name], href: url, icon: ICONS[name] }));

  const site = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName(),
    url: siteUrl(),
    potentialAction: { "@type": "SearchAction", target: `${abs("/search")}?q={search_term_string}`, "query-input": "required name=search_term_string" },
  };

  return (
    <html lang="hi" className={`${inter.variable} ${mukta.variable} ${khand.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <JsonLd data={site} />
        <UnderConstruction logo="/logo.png" name={siteName()} socials={links} />
        <Navbar items={items} socials={links} popular={popular.map((t) => t.label)} />
        {children}
        <Footer />
      </body>
    </html>
  );
}
