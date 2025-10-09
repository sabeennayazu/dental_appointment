/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Ignore ESLint during production builds to avoid blocking CI for non-critical lint rules
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
