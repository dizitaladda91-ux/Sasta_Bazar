import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: root,
  webpack(config) {
    config.resolve.alias['react-router-dom'] = path.join(root, 'src/router/compat.js');
    return config;
  },
};

export default nextConfig;
