/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5050',
      },
      {
        protocol: 'https',
        hostname: 'bevsl-production.up.railway.app',
      },
    ],
  },
};

export default nextConfig;
