/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.resolve.alias.canvas = false;

    if (!isServer) {
      // Stop webpack from bundling the pdf worker entirely
      config.resolve.alias["pdfjs-dist/build/pdf.worker.min.mjs"] = false;
      config.resolve.alias["pdfjs-dist/build/pdf.worker.mjs"] = false;
    }

    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ["pdfjs-dist"],
  },
};

module.exports = nextConfig;
