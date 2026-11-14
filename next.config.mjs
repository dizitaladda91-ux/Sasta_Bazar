import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const development = process.env.NODE_ENV === 'development';

// A nonce-based strict CSP is a later upgrade once Next.js can attach nonces to every inline script.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' https://js.stripe.com 'unsafe-inline'${development ? " 'unsafe-eval'" : ''}`,
  "connect-src 'self' https://api.stripe.com",
  'frame-src https://js.stripe.com https://hooks.stripe.com',
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://cdn.shopify.com https://*.supabase.co https://*.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'"
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: root,
  async headers() {
    const headers = [
      { key: 'Content-Security-Policy', value: contentSecurityPolicy },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
    ];
    if (process.env.NODE_ENV === 'production') {
      headers.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains'
      });
    }
    return [{ source: '/(.*)', headers }];
  },
  webpack(config) {
    config.resolve.alias['react-router-dom'] = path.join(root, 'src/router/compat.js');
    return config;
  },
};

export default nextConfig;
