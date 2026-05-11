// PWA commented out — not a current requirement, re-enable when needed
// import withPWAInit from "@ducanh2912/next-pwa";
//
// const withPWA = withPWAInit({
//   dest: "public",
//   cacheOnFrontEndNav: false,
//   reloadOnOnline: true,
//   disable: process.env.NODE_ENV === "development",
//   customWorkerSrc: "worker",
//   fallbacks: {
//     document: "/offline",
//   },
//   workboxOptions: {
//     runtimeCaching: [
//       {
//         urlPattern: /^https?.*\.(js|css|woff|woff2|ttf|eot|ico|png|jpg|jpeg|svg|webp)$/,
//         handler: "CacheFirst",
//         options: {
//           cacheName: "static-assets",
//           expiration: { maxEntries: 64, maxAgeSeconds: 7 * 24 * 60 * 60 },
//         },
//       },
//       {
//         urlPattern: /^https?.*\/api\/.*/,
//         handler: "NetworkOnly",
//       },
//       {
//         urlPattern: /^\/(dashboard|paystubs|employee-info|change-password).*/,
//         handler: "NetworkOnly",
//       },
//     ],
//   },
// });

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['odbc']
  }
};

export default nextConfig;
// export default withPWA(nextConfig);  // re-enable when PWA is needed
