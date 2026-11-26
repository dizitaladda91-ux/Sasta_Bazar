export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function stripHtml(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export function computeWordCount(html) {
  const text = stripHtml(html);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

export function computeReadingTime(html) {
  const words = computeWordCount(html);
  return Math.max(1, Math.ceil(words / 200));
}

export function sanitizeBlogHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"');
}

export function extractTocAndInjectIds(html) {
  const toc = [];
  const usedIds = new Map();
  const safeHtml = sanitizeBlogHtml(html);

  const transformed = safeHtml.replace(/<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag, attrs, inner) => {
    const level = Number(tag.slice(1));
    const text = stripHtml(inner);
    if (!text) return match;

    const existingIdMatch = attrs.match(/\sid=["']([^"']+)["']/i);
    let id = existingIdMatch ? existingIdMatch[1] : slugify(text) || `section-${toc.length + 1}`;

    const count = usedIds.get(id) || 0;
    usedIds.set(id, count + 1);
    if (count > 0) id = `${id}-${count + 1}`;

    toc.push({ id, text, level });

    const cleanAttrs = attrs.replace(/\sid=["'][^"']*["']/i, '');
    return `<${tag}${cleanAttrs} id="${id}">${inner}</${tag}>`;
  });

  return { html: transformed, toc };
}

export function evaluateSeoScore({
  title = '',
  metaTitle = '',
  metaDescription = '',
  focusKeyword = '',
  contentHtml = '',
  featuredImageAlt = ''
}) {
  const keyword = String(focusKeyword || '').trim().toLowerCase();
  const plainText = stripHtml(contentHtml);
  const words = plainText ? plainText.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const first100Words = words.slice(0, 100).join(' ').toLowerCase();
  const titleLower = String(title || '').toLowerCase();
  const metaDescLower = String(metaDescription || '').toLowerCase();
  const hasInternalLink = /href=["'](\/(?!\/)|https?:\/\/[^"']*sasta-?baza+r)/i.test(String(contentHtml || ''));

  const checks = [
    {
      id: 'keyword-title',
      label: 'Focus keyword in Title (H1)',
      passed: Boolean(keyword && titleLower.includes(keyword)),
      detail: keyword ? (titleLower.includes(keyword) ? 'Present in H1' : 'Add focus keyword to H1 title') : 'Set a focus keyword first'
    },
    {
      id: 'keyword-intro',
      label: 'Focus keyword in first 100 words',
      passed: Boolean(keyword && first100Words.includes(keyword)),
      detail: keyword ? (first100Words.includes(keyword) ? 'Found in intro' : 'Include keyword in opening paragraph') : 'Set a focus keyword first'
    },
    {
      id: 'keyword-meta',
      label: 'Focus keyword in Meta Description',
      passed: Boolean(keyword && metaDescLower.includes(keyword)),
      detail: keyword ? (metaDescLower.includes(keyword) ? 'Present in meta description' : 'Add keyword to meta description') : 'Set a focus keyword first'
    },
    {
      id: 'image-alt',
      label: 'Featured image alt text present',
      passed: String(featuredImageAlt || '').trim().length >= 5,
      detail: String(featuredImageAlt || '').trim().length >= 5 ? 'Alt text looks good' : 'Add descriptive alt text (5+ chars)'
    },
    {
      id: 'word-count',
      label: 'Word count > 800 words',
      passed: wordCount >= 800,
      detail: `${wordCount} words (${wordCount >= 800 ? 'Great depth' : `need ${800 - wordCount} more`})`
    },
    {
      id: 'internal-links',
      label: 'Internal links present',
      passed: hasInternalLink,
      detail: hasInternalLink ? 'Internal store/blog link detected' : 'Link at least 1 collection or product (/collection/... or /shop)'
    }
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const metaTitleLen = String(metaTitle || title || '').trim().length;
  const metaDescLen = String(metaDescription || '').trim().length;
  const bonus = (metaTitleLen > 0 && metaTitleLen <= 60 ? 5 : 0) + (metaDescLen >= 50 && metaDescLen <= 160 ? 5 : 0);
  const score = Math.min(100, Math.round((passedCount / checks.length) * 90) + bonus);

  return { score, checks, wordCount, readingTime };
}

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://sasta-bazar-xi.vercel.app').replace(/\/+$/, '');
}

export function buildBlogJsonLd({ post, faqs = [], products = [] }) {
  const siteUrl = getSiteUrl();
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const imageUrl = post.ogImage || post.featuredImage || '/logo.png';
  const resolvedImage = imageUrl.startsWith('http') ? imageUrl : `${siteUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;

  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'SASTA BAZAAR - Everyday Luxury',
      url: siteUrl,
      logo: `${siteUrl}/logo.png`
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` },
        ...(post.categoryName
          ? [{
              '@type': 'ListItem',
              position: 3,
              name: post.categoryName,
              item: `${siteUrl}/blog/category/${post.categorySlug}`
            }]
          : []),
        {
          '@type': 'ListItem',
          position: post.categoryName ? 4 : 3,
          name: post.title,
          item: postUrl
        }
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      image: [resolvedImage],
      datePublished: post.publishedAt || post.createdAt,
      dateModified: post.updatedAt || post.publishedAt || post.createdAt,
      author: {
        '@type': 'Person',
        name: post.authorName || 'Sasta Bazaar Editorial'
      },
      publisher: {
        '@type': 'Organization',
        name: 'SASTA BAZAAR',
        logo: { '@type': 'ImageObject', url: `${siteUrl}/logo.png` }
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
      wordCount: post.wordCount || computeWordCount(post.contentHtml),
      keywords: (post.tags || []).map((t) => t.name || t).join(', ')
    }
  ];

  if (faqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer }
      }))
    });
  }

  for (const product of products) {
    const prodImg = product.primaryImage || '/product-placeholder.svg';
    const resolvedProdImg = prodImg.startsWith('http') ? prodImg : `${siteUrl}${prodImg.startsWith('/') ? '' : '/'}${prodImg}`;
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      image: [resolvedProdImg],
      description: stripHtml(product.description || product.title).slice(0, 200),
      brand: { '@type': 'Brand', name: product.vendor || 'SASTA BAZAAR' },
      offers: {
        '@type': 'Offer',
        url: `${siteUrl}/product/${product.handle}`,
        priceCurrency: product.currency === '£' ? 'GBP' : (product.currency || 'GBP'),
        price: Number(product.price || 0).toFixed(2),
        availability: Number(product.stock ?? 1) > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock'
      }
    });
  }

  return schemas;
}
