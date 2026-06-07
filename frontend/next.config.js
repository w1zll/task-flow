const createNextIntlPlugin = require('next-intl/plugin');
const { withPigment } = require('@pigment-css/nextjs-plugin');
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

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
};

module.exports = withPigment(withNextIntl(nextConfig));
