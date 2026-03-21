/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Prevent canvas errors
    config.resolve.alias.canvas = false;

    if (!isServer) {
      config.module.rules.push({
        test: /pdf\.worker\.(min\.)?mjs$/,
        type: "asset/resource",
        generator: { filename: "static/chunks/[name].[hash][ext]" },
      });
    }

    return config;
  },
  // Tell Next.js not to bundle pdfjs on the server
  experimental: {
    serverComponentsExternalPackages: ["pdfjs-dist"],
  },
};

module.exports = nextConfig;
