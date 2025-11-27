// @ts-check

const DFXWebPackConfig = require('./dfx.webpack.config');

DFXWebPackConfig.initCanisterIds();

const webpack = require('webpack');
// Make DFX_NETWORK available to Web Browser with default "local" if DFX_NETWORK is undefined
const EnvPlugin = new webpack.EnvironmentPlugin({
  DFX_NETWORK: 'local'
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export", // enables static HTML export mode
  distDir: "out", // export to 'out' directory for ICP deployment
  trailingSlash: true, // optional: makes URLs end in `/` (e.g., /about/index.html)
  images: {
    unoptimized: true, // required for static export
  },
  webpack: (config) => {
    // Plugin
    config.plugins.push(EnvPlugin);
    // Important: return the modified config
    return config;
  }
  /* more next.js config options here */
};

module.exports = nextConfig;
