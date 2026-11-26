import { getSiteUrl } from '../lib/blog-seo';

export default function robots() {
  const siteUrl = getSiteUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/blog', '/cart', '/track-order', '/api/']
      }
    ],
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
