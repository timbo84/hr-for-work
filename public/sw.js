if (!self.define) {
  let e,
    s = {};
  const i = (i, a) => (
    (i = new URL(i + ".js", a).href),
    s[i] ||
      new Promise((s) => {
        if ("document" in self) {
          const e = document.createElement("script");
          ((e.src = i), (e.onload = s), document.head.appendChild(e));
        } else ((e = i), importScripts(i), s());
      }).then(() => {
        let e = s[i];
        if (!e) throw new Error(`Module ${i} didn’t register its module`);
        return e;
      })
  );
  self.define = (a, n) => {
    const c =
      e ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (s[c]) return;
    let t = {};
    const r = (e) => i(e, c),
      o = { module: { uri: c }, exports: t, require: r };
    s[c] = Promise.all(a.map((e) => o[e] || r(e))).then((e) => (n(...e), t));
  };
}
define(["./workbox-0c822247"], function (e) {
  "use strict";
  (importScripts(
    "/fallback-ce627215c0e4a9af.js",
    "/worker-89c230afdac5d25e.js",
  ),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: "/County-Logo.png",
          revision: "cf43628bec635a124ea0da70914348f7",
        },
        {
          url: "/_next/static/J3i9voMA8N68UP0mMKjh5/_buildManifest.js",
          revision: "c155cce658e53418dec34664328b51ac",
        },
        {
          url: "/_next/static/J3i9voMA8N68UP0mMKjh5/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        {
          url: "/_next/static/chunks/605-bad2d4847d44aca8.js",
          revision: "J3i9voMA8N68UP0mMKjh5",
        },
        {
          url: "/_next/static/chunks/997-a498ded289f959cc.js",
          revision: "J3i9voMA8N68UP0mMKjh5",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-e0dd96298a37eb4d.js",
          revision: "J3i9voMA8N68UP0mMKjh5",
        },
        {
          url: "/_next/static/chunks/app/change-password/page-ba026d3fe3288173.js",
          revision: "J3i9voMA8N68UP0mMKjh5",
        },
        {
          url: "/_next/static/chunks/app/contact/page-eb8cd13de00bb24d.js",
          revision: "J3i9voMA8N68UP0mMKjh5",
        },
        {
          url: "/_next/static/chunks/app/dashboard/page-88f272ebcf9860da.js",
          revision: "J3i9voMA8N68UP0mMKjh5",
        },
        {
          url: "/_next/static/chunks/app/employee-info/page-d8d0923214ebb93e.js",
          revision: "J3i9voMA8N68UP0mMKjh5",
        },
        {
          url: "/_next/static/chunks/app/layout-48b6c472da034336.js",
          revision: "J3i9voMA8N68UP0mMKjh5",
        },
        {
          url: "/_next/static/chunks/app/offline/page-1e35ca048dda17f4.js",
          revision: "J3i9voMA8N68UP0mMKjh5",
        },
        {
          url: "/_next/static/chunks/app/page-485bb7f59db48514.js",
          revision: "J3i9voMA8N68UP0mMKjh5",
        },
        {
          url: "/_next/static/chunks/app/paystubs/%5BcheckNumber%5D/page-0f785d26d661da35.js",
          revision: "J3i9voMA8N68UP0mMKjh5",
        },
        {
          url: "/_next/static/chunks/app/paystubs/page-8091375f6b1362ec.js",
          revision: "J3i9voMA8N68UP0mMKjh5",
        },
        {
          url: "/_next/static/chunks/fd9d1056-4a43c3ba43a0759a.js",
          revision: "J3i9voMA8N68UP0mMKjh5",
        },
        {
          url: "/_next/static/chunks/framework-f66176bb897dc684.js",
          revision: "J3i9voMA8N68UP0mMKjh5",
        },
        {
          url: "/_next/static/chunks/main-942ee92a4afdad1b.js",
          revision: "J3i9voMA8N68UP0mMKjh5",
        },
        {
          url: "/_next/static/chunks/main-app-9383db440631e678.js",
          revision: "J3i9voMA8N68UP0mMKjh5",
        },
        {
          url: "/_next/static/chunks/pages/_app-72b849fbd24ac258.js",
          revision: "J3i9voMA8N68UP0mMKjh5",
        },
        {
          url: "/_next/static/chunks/pages/_error-7ba65e1336b92748.js",
          revision: "J3i9voMA8N68UP0mMKjh5",
        },
        {
          url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
          revision: "846118c33b2c0e922d7b3a7676f81f6f",
        },
        {
          url: "/_next/static/chunks/webpack-03f7c6bc932ce1e3.js",
          revision: "J3i9voMA8N68UP0mMKjh5",
        },
        {
          url: "/_next/static/css/fcbf6bfde2d6bf13.css",
          revision: "fcbf6bfde2d6bf13",
        },
        {
          url: "/apple-touch-icon.png",
          revision: "7fabd716ba8a6187543e85b7454fe630",
        },
        {
          url: "/fallback-ce627215c0e4a9af.js",
          revision: "4f20e76600cac989810927f2e95e5b79",
        },
        {
          url: "/favicon-16x16.png",
          revision: "3014665bd497e219907a194b913daafd",
        },
        {
          url: "/favicon-32x32.png",
          revision: "6b726a7b7dc56f7002df151bc35e0d82",
        },
        { url: "/file.svg", revision: "d09f95206c3fa0bb9bd9fefabfd0ea71" },
        { url: "/globe.svg", revision: "2aaafa6a49b6563925fe440891e32717" },
        {
          url: "/icon-192x192.png",
          revision: "f8810183b5b5e6774d97fa39446bc439",
        },
        {
          url: "/icon-512x512.png",
          revision: "f3af8cc6184a2e6321f8f9a4ba6e3a8d",
        },
        { url: "/icon.svg", revision: "9521e2d7b0424a32540ac6ffbaf09dca" },
        { url: "/manifest.json", revision: "18af832beee88f0827bac02c086ef7b8" },
        { url: "/next.svg", revision: "8e061864f388b47f33a1c3780831193e" },
        { url: "/offline", revision: "J3i9voMA8N68UP0mMKjh5" },
        { url: "/vercel.svg", revision: "c0af2f507b369b085b35ef4bbe3bcf1e" },
        { url: "/window.svg", revision: "a2760511c65806022ad20adf74370ff3" },
        {
          url: "/worker-89c230afdac5d25e.js",
          revision: "9ba480cb2eea4b229a9f9d0b9b1c3a8b",
        },
      ],
      { ignoreURLParametersMatching: [/^utm_/, /^fbclid$/] },
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      "/",
      new e.NetworkFirst({
        cacheName: "start-url",
        plugins: [
          {
            cacheWillUpdate: async ({ response: e }) =>
              e && "opaqueredirect" === e.type
                ? new Response(e.body, {
                    status: 200,
                    statusText: "OK",
                    headers: e.headers,
                  })
                : e,
          },
          {
            handlerDidError: async ({ request: e }) =>
              "undefined" != typeof self ? self.fallback(e) : Response.error(),
          },
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /^https?.*\.(js|css|woff|woff2|ttf|eot|ico|png|jpg|jpeg|svg|webp)$/,
      new e.CacheFirst({
        cacheName: "static-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 604800 }),
          {
            handlerDidError: async ({ request: e }) =>
              "undefined" != typeof self ? self.fallback(e) : Response.error(),
          },
        ],
      }),
      "GET",
    ),
    e.registerRoute(/^https?.*\/api\/.*/, new e.NetworkOnly(), "GET"),
    e.registerRoute(
      /^\/(dashboard|paystubs|employee-info|change-password).*/,
      new e.NetworkOnly(),
      "GET",
    ));
});
