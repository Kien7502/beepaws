import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve AVIF first (smallest), then WebP — browsers pick the best they support.
    // next/image handles format negotiation automatically.
    formats: ["image/avif", "image/webp"],

    // All image sources the app loads remotely
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",   // product images from Shopify CDN
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com", // hero / placeholder images
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

    // Predefine common widths so Next.js doesn't generate too many variants
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 128, 256, 384],
  },

  // Shopify's privacy policy links its opt-out page on the Shopify-hosted store;
  // the redirect theme sends that path here, so it lands on our own page
  // (app/privacy-choices, 2026-10-26).
  async redirects() {
    return [{ source: "/pages/data-sharing-opt-out", destination: "/privacy-choices", permanent: true }];
  },
};

export default nextConfig;
