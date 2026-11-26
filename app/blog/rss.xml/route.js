import { getAllPublishedSlugsForFeed } from '../../../lib/blog-data';
import { getSiteUrl } from '../../../lib/blog-seo';

export const revalidate = 300;

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const siteUrl = getSiteUrl();
  const posts = await getAllPublishedSlugsForFeed();

  const itemsXml = posts
    .filter((p) => !p.noindex)
    .slice(0, 50)
    .map((post) => {
      const link = `${siteUrl}/blog/${post.slug}`;
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(post.excerpt)}</description>
      <category>${escapeXml(post.categoryName)}</category>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>SASTA BAZAAR - Everyday Luxury Style Journal</title>
    <link>${escapeXml(siteUrl)}/blog</link>
    <description>Ethnic fashion guides, wedding lehenga trends, Eid sharara styling, and kids festive outfits.</description>
    <language>en-gb</language>
    <atom:link href="${escapeXml(siteUrl)}/blog/rss.xml" rel="self" type="application/rss+xml" />
    ${itemsXml}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
    }
  });
}
