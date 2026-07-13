const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    proxyClientMaxBodySize: 12 * 1024 * 1024,
    proxyTimeout: 300_000,
  },

  // Proxy API requests to backend in development
  async rewrites() {
    const apiUrl = process.env.API_URL || 'http://localhost:3001';
    console.log('Rewrite destination:', apiUrl);
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/manifest.webmanifest',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
  allowedDevOrigins: ['127.0.0.1'],
};

module.exports = withNextIntl(nextConfig);
