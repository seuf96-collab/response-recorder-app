/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  webpack: (config) => {
    config.ignoreWarnings = [
      { module: /next\/font/ },
    ];
    return config;
  },
}

module.exports = nextConfig
