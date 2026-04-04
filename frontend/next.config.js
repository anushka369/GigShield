/** @type {import('next').NextConfig} */
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
  },
  runtimeCaching: [
    {
      urlPattern: /^https?:\/\/.*\/api\/v1\/workers\/me/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'worker-profile',
        expiration: { maxEntries: 1, maxAgeSeconds: 3600 },
      },
    },
    {
      urlPattern: /^https?:\/\/.*\/(dashboard|onboarding)/,
      handler: 'NetworkFirst',
      options: { cacheName: 'pages' },
    },
  ],
})

const nextConfig = {
  images: { unoptimized: true },
}

module.exports = withPWA(nextConfig)
