// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // IMPORTANT: Do NOT use output: 'export' - you need SSR and API routes!
  // output: 'standalone', // Optional: reduces deployment size
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Required for Render deployment
  server: {
    port: process.env.PORT || 3000,
    host: '0.0.0.0', // Critical for Render!
  },
};

module.exports = nextConfig;
