import HeroAds from "@/components/ads/HeroAds";

export default function HomeLayout({ children }) {
    return (
        <main className="flex-1 w-full">
            <HeroAds />
            {children}
        </main>
    );
}