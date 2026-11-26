import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBlogJsonLd,
  evaluateSeoScore,
  extractTocAndInjectIds,
  sanitizeBlogHtml
} from './blog-seo.js';

test('extractTocAndInjectIds extracts h2/h3 and injects unique anchor IDs', () => {
  const { html, toc } = extractTocAndInjectIds(
    '<h2>Top Lehengas</h2><p>Text</p><h3>Velvet Style</h3><h2>Top Lehengas</h2>'
  );
  assert.equal(toc.length, 3);
  assert.deepEqual(toc[0], { id: 'top-lehengas', text: 'Top Lehengas', level: 2 });
  assert.deepEqual(toc[1], { id: 'velvet-style', text: 'Velvet Style', level: 3 });
  assert.deepEqual(toc[2], { id: 'top-lehengas-2', text: 'Top Lehengas', level: 2 });
  assert.ok(html.includes('id="top-lehengas"'));
  assert.ok(html.includes('id="top-lehengas-2"'));
});

test('sanitizeBlogHtml removes script tags and inline event handlers', () => {
  const dirty = '<p onclick="alert(1)">Hello</p><script>evil()</script><a href="javascript:alert(1)">Link</a>';
  const clean = sanitizeBlogHtml(dirty);
  assert.ok(!clean.includes('<script'));
  assert.ok(!clean.includes('onclick'));
  assert.ok(!clean.includes('javascript:'));
});

test('evaluateSeoScore scores all 6 SEO checks accurately', () => {
  const words = Array.from({ length: 820 }, () => 'lehenga').join(' ');
  const result = evaluateSeoScore({
    title: 'Wedding Season Top 10 Lehenga Designs',
    metaTitle: 'Top 10 Lehenga Designs | Sasta Bazaar',
    metaDescription: 'Explore Top 10 Lehenga Designs for weddings in 2026 at Sasta Bazaar.',
    focusKeyword: 'Top 10 Lehenga Designs',
    featuredImageAlt: 'Top 10 Lehenga Designs showcase',
    contentHtml: `<p>Looking for Top 10 Lehenga Designs? Shop our <a href="/collection/lehenga-choli">Lehenga Choli</a>. ${words}</p>`
  });
  assert.equal(result.score, 100);
  assert.ok(result.checks.every((c) => c.passed));
});

test('buildBlogJsonLd emits BlogPosting, BreadcrumbList, Organization, FAQPage, and Product', () => {
  const schemas = buildBlogJsonLd({
    post: {
      title: 'Test Post',
      slug: 'test-post',
      excerpt: 'Excerpt',
      categoryName: 'Wedding Style',
      categorySlug: 'wedding-style',
      authorName: 'Ayesha',
      publishedAt: '2026-11-20T09:00:00.000Z',
      contentHtml: '<p>Hello world</p>'
    },
    faqs: [{ question: 'Q1?', answer: 'A1.' }],
    products: [{ title: 'Silk Lehenga', handle: 'silk-lehenga', price: 50, currency: '£', stock: 5 }]
  });
  const types = schemas.map((s) => s['@type']);
  assert.deepEqual(types, ['Organization', 'BreadcrumbList', 'BlogPosting', 'FAQPage', 'Product']);
});
