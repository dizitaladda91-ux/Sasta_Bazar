import fs from 'node:fs/promises';
import path from 'node:path';
import { query } from '../server/db.js';
import { SAMPLE_BLOG_CATEGORIES, SAMPLE_BLOG_POSTS } from '../server/data/sample-blogs.js';
import { computeReadingTime, computeWordCount, slugify } from './blog-seo.js';

let cachedJsonProducts = null;
async function loadFallbackProducts() {
  if (cachedJsonProducts) return cachedJsonProducts;
  try {
    const file = path.join(process.cwd(), 'src', 'data', 'products.json');
    cachedJsonProducts = JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    cachedJsonProducts = [];
  }
  return cachedJsonProducts;
}

function mapPostRow(row) {
  return {
    id: Number(row.id),
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt || '',
    contentHtml: row.content_html || '',
    featuredImage: row.featured_image || '/hero-collection-1.png',
    featuredImageAlt: row.featured_image_alt || row.title,
    featuredImageWidth: Number(row.featured_image_width || 1200),
    featuredImageHeight: Number(row.featured_image_height || 675),
    categoryId: row.category_id ? Number(row.category_id) : null,
    categoryName: row.category_name || 'Style Guide',
    categorySlug: row.category_slug || 'style-guide',
    authorName: row.author_name || 'Sasta Bazaar Editorial',
    status: row.status,
    publishedAt: row.published_at ? new Date(row.published_at).toISOString() : null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    focusKeyword: row.focus_keyword || '',
    metaTitle: row.meta_title || '',
    metaDescription: row.meta_description || '',
    canonicalUrl: row.canonical_url || '',
    ogImage: row.og_image || '',
    noindex: Boolean(row.noindex),
    readingTime: Number(row.reading_time || computeReadingTime(row.content_html)),
    wordCount: Number(row.word_count || computeWordCount(row.content_html)),
    seoScore: Number(row.seo_score || 0)
  };
}

async function getFallbackPosts() {
  const allProducts = await loadFallbackProducts();
  const catMap = new Map(SAMPLE_BLOG_CATEGORIES.map((c) => [c.slug, c]));

  return SAMPLE_BLOG_POSTS.map((post, idx) => {
    const cat = catMap.get(post.categorySlug) || { name: 'Style Guide', slug: 'style-guide' };
    const linkedProducts = (post.productHandles || [])
      .map((handle) => allProducts.find((p) => p.handle === handle))
      .filter(Boolean)
      .map((p) => ({
        id: Number(p.id),
        handle: p.handle,
        title: p.title,
        price: Number(p.price),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        currency: p.currency || '£',
        primaryImage: p.images?.[0] || '/product-placeholder.svg',
        stock: 10,
        description: p.description || '',
        vendor: p.vendor || 'SASTA BAZAAR'
      }));

    return {
      id: idx + 1,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      contentHtml: post.contentHtml,
      featuredImage: post.featuredImage,
      featuredImageAlt: post.featuredImageAlt,
      featuredImageWidth: post.featuredImageWidth || 1200,
      featuredImageHeight: post.featuredImageHeight || 675,
      categoryId: idx + 1,
      categoryName: cat.name,
      categorySlug: cat.slug,
      authorName: post.authorName,
      status: 'published',
      publishedAt: post.publishedAt,
      createdAt: post.publishedAt,
      updatedAt: post.publishedAt,
      focusKeyword: post.focusKeyword,
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      canonicalUrl: '',
      ogImage: post.featuredImage,
      noindex: false,
      readingTime: computeReadingTime(post.contentHtml),
      wordCount: computeWordCount(post.contentHtml),
      seoScore: 95,
      tags: (post.tags || []).map((name) => ({ name, slug: slugify(name) })),
      faqs: post.faqs || [],
      products: linkedProducts
    };
  });
}

const PUBLISHED_FILTER = `(p.status = 'published' OR (p.status = 'scheduled' AND p.published_at <= NOW()))`;

export async function getPublishedPosts({ page = 1, limit = 9, categorySlug = '', tagSlug = '', search = '' } = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(24, Math.max(1, Number(limit) || 9));
  const offset = (safePage - 1) * safeLimit;

  try {
    const conditions = [PUBLISHED_FILTER];
    const values = [];

    if (categorySlug) {
      values.push(categorySlug);
      conditions.push(`c.slug = $${values.length}`);
    }
    if (tagSlug) {
      values.push(tagSlug);
      conditions.push(`EXISTS (SELECT 1 FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = p.id AND t.slug = $${values.length})`);
    }
    if (search) {
      values.push(`%${search.trim()}%`);
      conditions.push(`(p.title ILIKE $${values.length} OR p.excerpt ILIKE $${values.length})`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const countRes = await query(
      `SELECT COUNT(*)::int AS total FROM posts p LEFT JOIN blog_categories c ON c.id = p.category_id ${whereClause}`,
      values
    );
    const total = countRes.rows[0]?.total || 0;

    const listValues = [...values, safeLimit, offset];
    const { rows } = await query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM posts p
       LEFT JOIN blog_categories c ON c.id = p.category_id
       ${whereClause}
       ORDER BY COALESCE(p.published_at, p.created_at) DESC
       LIMIT $${listValues.length - 1} OFFSET $${listValues.length}`,
      listValues
    );

    const posts = rows.map(mapPostRow);
    return {
      posts,
      total,
      page: safePage,
      totalPages: Math.max(1, Math.ceil(total / safeLimit))
    };
  } catch {
    let posts = await getFallbackPosts();
    if (categorySlug) posts = posts.filter((p) => p.categorySlug === categorySlug);
    if (tagSlug) posts = posts.filter((p) => p.tags.some((t) => t.slug === tagSlug));
    if (search) {
      const q = search.trim().toLowerCase();
      posts = posts.filter((p) => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q));
    }
    const total = posts.length;
    return {
      posts: posts.slice(offset, offset + safeLimit),
      total,
      page: safePage,
      totalPages: Math.max(1, Math.ceil(total / safeLimit))
    };
  }
}

export async function getPublishedPostBySlug(slug) {
  try {
    const { rows } = await query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM posts p
       LEFT JOIN blog_categories c ON c.id = p.category_id
       WHERE p.slug = $1 AND ${PUBLISHED_FILTER}
       LIMIT 1`,
      [slug]
    );

    if (!rows.length) {
      const redir = await query(
        `SELECT new_slug, status_code FROM redirects WHERE old_slug = $1 LIMIT 1`,
        [slug]
      );
      if (redir.rows.length) {
        return { redirectTo: redir.rows[0].new_slug, statusCode: redir.rows[0].status_code || 301 };
      }
      return null;
    }

    const post = mapPostRow(rows[0]);
    const [tagsRes, faqsRes, productsRes] = await Promise.all([
      query(
        `SELECT t.id, t.name, t.slug FROM tags t
         JOIN post_tags pt ON pt.tag_id = t.id WHERE pt.post_id = $1 ORDER BY t.name`,
        [post.id]
      ),
      query(
        `SELECT id, question, answer FROM post_faqs WHERE post_id = $1 ORDER BY sort_order ASC, id ASC`,
        [post.id]
      ),
      query(
        `SELECT pr.id, pr.handle, pr.title, pr.price, pr.compare_at_price, pr.currency,
                pr.primary_image, pr.images, pr.stock, pr.description, pr.vendor
         FROM products pr
         JOIN post_products pp ON pp.product_id = pr.id
         WHERE pp.post_id = $1 AND pr.is_active = TRUE
         ORDER BY pp.sort_order ASC`,
        [post.id]
      )
    ]);

    post.tags = tagsRes.rows;
    post.faqs = faqsRes.rows;
    post.products = productsRes.rows.map((pr) => ({
      id: Number(pr.id),
      handle: pr.handle,
      title: pr.title,
      price: Number(pr.price),
      compareAtPrice: pr.compare_at_price ? Number(pr.compare_at_price) : null,
      currency: pr.currency === 'GBP' ? '£' : (pr.currency || '£'),
      primaryImage: pr.primary_image || pr.images?.[0] || '/product-placeholder.svg',
      stock: Number(pr.stock ?? 0),
      description: pr.description || '',
      vendor: pr.vendor || 'SASTA BAZAAR'
    }));

    return { post };
  } catch {
    const posts = await getFallbackPosts();
    const post = posts.find((p) => p.slug === slug);
    return post ? { post } : null;
  }
}

export async function getRelatedPosts(postId, categorySlug, limit = 3) {
  try {
    const { rows } = await query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM posts p
       LEFT JOIN blog_categories c ON c.id = p.category_id
       WHERE p.id <> $1 AND ${PUBLISHED_FILTER}
       ORDER BY (CASE WHEN c.slug = $2 THEN 0 ELSE 1 END), COALESCE(p.published_at, p.created_at) DESC
       LIMIT $3`,
      [postId, categorySlug || '', limit]
    );
    return rows.map(mapPostRow);
  } catch {
    const posts = await getFallbackPosts();
    return posts.filter((p) => p.id !== postId).slice(0, limit);
  }
}

export async function getAllBlogCategories() {
  try {
    const { rows } = await query(
      `SELECT c.id, c.name, c.slug, c.description, COUNT(p.id)::int AS post_count
       FROM blog_categories c
       LEFT JOIN posts p ON p.category_id = c.id AND ${PUBLISHED_FILTER}
       GROUP BY c.id
       ORDER BY c.name ASC`
    );
    return rows;
  } catch {
    return SAMPLE_BLOG_CATEGORIES.map((c, idx) => ({ ...c, id: idx + 1, post_count: 1 }));
  }
}

export async function getAllBlogTags() {
  try {
    const { rows } = await query(
      `SELECT t.id, t.name, t.slug, COUNT(pt.post_id)::int AS post_count
       FROM tags t
       JOIN post_tags pt ON pt.tag_id = t.id
       JOIN posts p ON p.id = pt.post_id AND ${PUBLISHED_FILTER}
       GROUP BY t.id
       ORDER BY post_count DESC, t.name ASC`
    );
    return rows;
  } catch {
    const posts = await getFallbackPosts();
    const map = new Map();
    for (const post of posts) {
      for (const tag of post.tags) {
        map.set(tag.slug, { ...tag, post_count: (map.get(tag.slug)?.post_count || 0) + 1 });
      }
    }
    return Array.from(map.values());
  }
}

export async function getAllPublishedSlugsForFeed() {
  try {
    const { rows } = await query(
      `SELECT p.slug, p.title, p.excerpt, p.author_name, p.published_at, p.updated_at, p.noindex,
              c.name AS category_name, c.slug AS category_slug
       FROM posts p
       LEFT JOIN blog_categories c ON c.id = p.category_id
       WHERE ${PUBLISHED_FILTER}
       ORDER BY COALESCE(p.published_at, p.created_at) DESC`
    );
    return rows.map((r) => ({
      slug: r.slug,
      title: r.title,
      excerpt: r.excerpt,
      authorName: r.author_name,
      publishedAt: r.published_at ? new Date(r.published_at).toISOString() : new Date().toISOString(),
      updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
      noindex: Boolean(r.noindex),
      categoryName: r.category_name || 'Style Guide',
      categorySlug: r.category_slug || 'style-guide'
    }));
  } catch {
    const posts = await getFallbackPosts();
    return posts.map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      authorName: p.authorName,
      publishedAt: p.publishedAt,
      updatedAt: p.updatedAt,
      noindex: p.noindex,
      categoryName: p.categoryName,
      categorySlug: p.categorySlug
    }));
  }
}
