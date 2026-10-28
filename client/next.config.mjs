
/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: false,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/vi/**",
      },
      {
        protocol: "https",
        hostname: "img.vajraled.com",
        pathname: "/image/**",
      },
      {
        protocol: "https",
        hostname: "img.thejournalism.news",
        pathname: "/image/**",
      },
    ],
  },

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
