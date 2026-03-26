/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    domains: ['propel-erp-docs.s3.amazonaws.com', 'localhost'],
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'PropelERP',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
