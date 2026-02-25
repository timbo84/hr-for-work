import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: false,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    // Never cache API routes or sensitive pages
    runtimeCaching: [
      {
        // Cache static assets (JS, CSS, fonts, images)
        urlPattern: /^https?.*\.(js|css|woff|woff2|ttf|eot|ico|png|jpg|jpeg|svg|webp)$/,
        handler: "CacheFirst",
        options: {
          cacheName: "static-assets",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
        },
      },
      {
        // Network-only for all API routes (never cache sensitive data)
        urlPattern: /^https?.*\/api\/.*/,
        handler: "NetworkOnly",
      },
      {
        // Network-only for all authenticated/sensitive pages
        urlPattern: /^\/(dashboard|paystubs|employee-info|change-password).*/,
        handler: "NetworkOnly",
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['odbc']
  }
};

export default withPWA(nextConfig);
