import {withSentryConfig} from "@sentry/nextjs";
import withSerwistInit from "@serwist/next";
/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  turbopack: {
    // Empty config to silence Turbopack warning, we use webpack for SVG handling
  },
  webpack(config) {
    // Grab the existing rule that handles SVG imports
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.(".svg")
    );

    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      // Convert all other *.svg imports to React components
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] }, // exclude if *.svg?url
        use: ["@svgr/webpack"],
      },
      // Add rule for handling video files
      {
        test: /\.(mp4|webm|ogg|ogv)$/i,
        type: "asset/resource",
        generator: {
          filename: "static/media/[name].[hash][ext]",
        },
      }
    );

    // Modify the file loader rule to ignore *.svg, since we have it handled now.
    fileLoaderRule.exclude = /\.svg$/i;

    return config;
  },
  output: 'standalone',
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Other Next.js config options (if any)
};

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  // Never build (or register, see ServiceWorkerProvider.tsx) the service
  // worker outside production — avoids any interference with dev-mode HMR
  // and matches the approved rollout ("не активировать Service Worker в
  // development").
  disable: process.env.NODE_ENV !== "production",
  // No offline fallback page in this first version — see src/sw.ts, there
  // is deliberately no catch-all runtime route either.
  additionalPrecacheEntries: [],
  cacheOnNavigation: false,
  reloadOnOnline: false,
  // The webpack-asset precache manifest otherwise includes every imported
  // image/video (landing-page hero shots, doctor photos, logos, …) —
  // nothing sensitive, but tens of MB a PWA install shouldn't have to pull
  // up front. Only JS/CSS/webfonts need to be ready before first paint;
  // marketing media can keep loading over the network like it always has.
  //
  // .map is excluded too: @serwist/next's own default exclude predicate
  // (see its index.mjs) only filters the SW's own output, server/*
  // assets and root *.json — it does NOT filter sourcemaps, so without
  // this they'd get swept into the precache whenever they exist as
  // webpack-emitted assets (confirmed empirically: a build with
  // Sentry's sourcemap step active precached 193 *.js.map files until
  // this was added).
  exclude: [
    /\/static\/media\/.*\.(?:png|jpe?g|gif|webp|avif|mp4|webm|ogg?v)$/i,
    /\.map$/,
  ],
});

export default withSerwist(withSentryConfig(nextConfig, {
// For all available options, see:
// https://www.npmjs.com/package/@sentry/webpack-plugin#options

org: "itry",
project: "javascript-nextjs",

// Only print logs for uploading source maps in CI
silent: !process.env.CI,

// For all available options, see:
// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

// Upload a larger set of source maps for prettier stack traces (increases build time)
widenClientFileUpload: true,

// Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
// This can increase your server load as well as your hosting bill.
// Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
// side errors will fail.
tunnelRoute: "/monitoring",

// Automatically tree-shake Sentry logger statements to reduce bundle size
disableLogger: true,

// Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
// See the following for more information:
// https://docs.sentry.io/product/crons/
// https://vercel.com/docs/cron-jobs
automaticVercelMonitors: true,
}));