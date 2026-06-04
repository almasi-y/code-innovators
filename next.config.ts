import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.108', '192.168.1.109', '192.168.1.229', '192.168.13.223', '192.168.1.122'],
  images: {
    qualities: [75, 90, 95],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};
export default nextConfig;