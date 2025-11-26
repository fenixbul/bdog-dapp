// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export", // enables static HTML export mode
  distDir: "out", // export to 'out' directory for ICP deployment
  trailingSlash: true, // optional: makes URLs end in `/` (e.g., /about/index.html)
  images: {
    unoptimized: true, // required for static export
  },
};

module.exports = nextConfig;
