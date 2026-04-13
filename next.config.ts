import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "oss-cf.cjdropshipping.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ae03.alicdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ae01.alicdn.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
