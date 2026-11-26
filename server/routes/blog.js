import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import express from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { inTransaction, query } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import { evaluateSeoScore, sanitizeBlogHtml, slugify } from '../../lib/blog-seo.js';
import { isCloudinaryConfigured, uploadToCloudinary } from '../services/cloudinary.js';

const router = express.Router();
router.use(requireAdmin);

const route = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

const faqSchema = z.object({
  question: z.string().trim().min(1).max(500),
  answer: z.string().trim().min(1).max(4000)
});

const postPayloadSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(250),
  slug: z.string().trim().max(250).optional(),
  excerpt: z.string().trim().max(1000).default(''),
  contentHtml: z.string().default(''),
  featuredImage: z.string().trim().max(1000).default(''),
  featuredImageAlt: z.string().trim().max(300).default(''),
  featuredImageWidth: z.coerce.number().int().min(100).max(4000).default(1200),
  featuredImageHeight: z.coerce.number().int().min(100).max(4000).default(675),
  categoryId: z.union([z.coerce.number().int().positive(), z.literal(''), z.null()]).optional(),
  authorName: z.string().trim().min(1).max(120).default('Sasta Bazaar Editorial'),
  status: z.enum(['draft', 'published', 'scheduled']).default('draft'),
  publishedAt: z.string().nullable().optional(),
  focusKeyword: z.string().trim().max(120).default(''),
  metaTitle: z.string().trim().max(160).default(''),
  metaDescription: z.string().trim().max(320).default(''),
  canonicalUrl: z.string().trim().max(1000).default(''),
  ogImage: z.string().trim().max(1000).default(''),
  noindex: z.boolean().default(false),
  tags: z.array(z.string().trim().min(1).max(60)).default([]),
  faqs: z.array(faqSchema).default([]),
  productIds: z.array(z.coerce.number().int().positive()).default([])
});

const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().max(120).optional(),
  description: z.string().trim().max(500).default('')
});

const uploadSchema = z.object({
  filename: z.string().trim().min(1).max(200),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  dataBase64: z.string().min(10)
});

function formatAdminPost(row) {
  return {
    id: Number(row.id),
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt || '',
    contentHtml: row.content_html || '',
    featuredImage: row.featured_image || '',
    featuredImageAlt: row.featured_image_alt || '',
    featuredImageWidth: Number(row.featured_image_width || 1200),
    featuredImageHeight: Number(row.featured_image_height || 675),
    categoryId: row.category_id ? Number(row.category_id) : null,
    categoryName: row.category_name || '',
    categorySlug: row.category_slug || '',
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
    readingTime: Number(row.reading_time || 1),
    wordCount: Number(row.word_count || 0),
    seoScore: Number(row.seo_score || 0)
  };
}

async function syncPostRelations(client, postId, { tags, faqs, productIds }) {
  await client.query('DELETE FROM post_tags WHERE post_id = $1', [postId]);
  const seenTagSlugs = new Set();
  for (const tagName of tags) {
    const tSlug = slugify(tagName);
    if (!tSlug || seenTagSlugs.has(tSlug)) continue;
    seenTagSlugs.add(tSlug);
    const { rows } = await client.query(
      `INSERT INTO tags (name, slug) VALUES ($1, $2)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [tagName.trim(), tSlug]
    );
    await client.query(
      'INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [postId, rows[0].id]
    );
  }

  await client.query('DELETE FROM post_faqs WHERE post_id = $1', [postId]);
  for (let i = 0; i < faqs.length; i += 1) {
    await client.query(
      'INSERT INTO post_faqs (post_id, question, answer, sort_order) VALUES ($1, $2, $3, $4)',
      [postId, faqs[i].question, faqs[i].answer, i]
    );
  }

  await client.query('DELETE FROM post_products WHERE post_id = $1', [postId]);
  const seenProducts = new Set();
  for (let i = 0; i < productIds.length; i += 1) {
    const pid = Number(productIds[i]);
    if (!pid || seenProducts.has(pid)) continue;
    seenProducts.add(pid);
    await client.query(
      'INSERT INTO post_products (post_id, product_id, sort_order) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [postId, pid, i]
    );
  }
}

router.get('/posts', route(async (req, res) => {
  const status = String(req.query.status || 'all');
  const search = String(req.query.search || '').trim();
  const conditions = [];
  const values = [];

  if (status && status !== 'all' && ['draft', 'published', 'scheduled'].includes(status)) {
    values.push(status);
    conditions.push(`p.status = $${values.length}`);
  }
  if (search) {
    values.push(`%${search}%`);
    conditions.push(`(p.title ILIKE $${values.length} OR p.slug ILIKE $${values.length} OR p.focus_keyword ILIKE $${values.length})`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [postsRes, catsRes] = await Promise.all([
    query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM posts p
       LEFT JOIN blog_categories c ON c.id = p.category_id
       ${whereClause}
       ORDER BY p.updated_at DESC, p.id DESC`,
      values
    ),
    query('SELECT id, name, slug, description FROM blog_categories ORDER BY name ASC')
  ]);

  res.json({
    success: true,
    posts: postsRes.rows.map(formatAdminPost),
    categories: catsRes.rows
  });
}));

router.get('/posts/:id', route(async (req, res) => {
  const postId = Number(req.params.id);
  if (!Number.isInteger(postId) || postId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid post ID.' });
  }

  const { rows } = await query(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug
     FROM posts p
     LEFT JOIN blog_categories c ON c.id = p.category_id
     WHERE p.id = $1 LIMIT 1`,
    [postId]
  );
  if (!rows.length) return res.status(404).json({ success: false, message: 'Post not found.' });

  const [tagsRes, faqsRes, productsRes] = await Promise.all([
    query(
      `SELECT t.name FROM tags t JOIN post_tags pt ON pt.tag_id = t.id WHERE pt.post_id = $1 ORDER BY t.name`,
      [postId]
    ),
    query(
      `SELECT question, answer FROM post_faqs WHERE post_id = $1 ORDER BY sort_order ASC, id ASC`,
      [postId]
    ),
    query(
      `SELECT pr.id, pr.title, pr.handle, pr.price, pr.primary_image
       FROM products pr JOIN post_products pp ON pp.product_id = pr.id
       WHERE pp.post_id = $1 ORDER BY pp.sort_order ASC`,
      [postId]
    )
  ]);

  return res.json({
    success: true,
    post: {
      ...formatAdminPost(rows[0]),
      tags: tagsRes.rows.map((r) => r.name),
      faqs: faqsRes.rows,
      productIds: productsRes.rows.map((r) => Number(r.id)),
      products: productsRes.rows
    }
  });
}));

router.post('/posts', route(async (req, res) => {
  const parsed = postPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: parsed.error.issues[0]?.message || 'Invalid post payload.' });
  }

  const data = parsed.data;
  const finalSlug = slugify(data.slug || data.title) || `post-${Date.now()}`;
  const safeHtml = sanitizeBlogHtml(data.contentHtml);
  const seo = evaluateSeoScore({
    title: data.title,
    metaTitle: data.metaTitle,
    metaDescription: data.metaDescription,
    focusKeyword: data.focusKeyword,
    contentHtml: safeHtml,
    featuredImageAlt: data.featuredImageAlt
  });
  const publishedAt = data.publishedAt
    ? new Date(data.publishedAt)
    : data.status === 'published' ? new Date() : null;

  const created = await inTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO posts (
         title, slug, excerpt, content_html, featured_image, featured_image_alt,
         featured_image_width, featured_image_height, category_id, author_name,
         status, published_at, focus_keyword, meta_title, meta_description,
         canonical_url, og_image, noindex, reading_time, word_count, seo_score
       ) VALUES (
         $1, $2, $3, $4, $5, $6,
         $7, $8, $9, $10,
         $11, $12, $13, $14, $15,
         $16, $17, $18, $19, $20, $21
       ) RETURNING id`,
      [
        data.title,
        finalSlug,
        data.excerpt,
        safeHtml,
        data.featuredImage,
        data.featuredImageAlt,
        data.featuredImageWidth,
        data.featuredImageHeight,
        data.categoryId ? Number(data.categoryId) : null,
        data.authorName,
        data.status,
        publishedAt,
        data.focusKeyword,
        data.metaTitle,
        data.metaDescription,
        data.canonicalUrl,
        data.ogImage || data.featuredImage,
        data.noindex,
        seo.readingTime,
        seo.wordCount,
        seo.score
      ]
    );
    const postId = Number(rows[0].id);
    await syncPostRelations(client, postId, data);
    return postId;
  });

  return res.status(201).json({ success: true, id: created, slug: finalSlug });
}));

router.put('/posts/:id', route(async (req, res) => {
  const postId = Number(req.params.id);
  if (!Number.isInteger(postId) || postId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid post ID.' });
  }

  const parsed = postPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: parsed.error.issues[0]?.message || 'Invalid post payload.' });
  }

  const data = parsed.data;
  const newSlug = slugify(data.slug || data.title);
  if (!newSlug) {
    return res.status(400).json({ success: false, message: 'A valid slug is required.' });
  }

  const safeHtml = sanitizeBlogHtml(data.contentHtml);
  const seo = evaluateSeoScore({
    title: data.title,
    metaTitle: data.metaTitle,
    metaDescription: data.metaDescription,
    focusKeyword: data.focusKeyword,
    contentHtml: safeHtml,
    featuredImageAlt: data.featuredImageAlt
  });

  const result = await inTransaction(async (client) => {
    const existing = await client.query('SELECT id, slug, published_at FROM posts WHERE id = $1 LIMIT 1', [postId]);
    if (!existing.rows.length) return null;

    const oldSlug = existing.rows[0].slug;
    const publishedAt = data.publishedAt
      ? new Date(data.publishedAt)
      : (data.status === 'published' ? (existing.rows[0].published_at || new Date()) : null);

    await client.query(
      `UPDATE posts SET
         title = $1, slug = $2, excerpt = $3, content_html = $4,
         featured_image = $5, featured_image_alt = $6,
         featured_image_width = $7, featured_image_height = $8,
         category_id = $9, author_name = $10, status = $11, published_at = $12,
         focus_keyword = $13, meta_title = $14, meta_description = $15,
         canonical_url = $16, og_image = $17, noindex = $18,
         reading_time = $19, word_count = $20, seo_score = $21,
         updated_at = NOW()
       WHERE id = $22`,
      [
        data.title,
        newSlug,
        data.excerpt,
        safeHtml,
        data.featuredImage,
        data.featuredImageAlt,
        data.featuredImageWidth,
        data.featuredImageHeight,
        data.categoryId ? Number(data.categoryId) : null,
        data.authorName,
        data.status,
        publishedAt,
        data.focusKeyword,
        data.metaTitle,
        data.metaDescription,
        data.canonicalUrl,
        data.ogImage || data.featuredImage,
        data.noindex,
        seo.readingTime,
        seo.wordCount,
        seo.score,
        postId
      ]
    );

    if (oldSlug && oldSlug !== newSlug) {
      await client.query('DELETE FROM redirects WHERE old_slug = $1', [newSlug]);
      await client.query(
        `INSERT INTO redirects (old_slug, new_slug, status_code)
         VALUES ($1, $2, 301)
         ON CONFLICT (old_slug) DO UPDATE SET new_slug = EXCLUDED.new_slug, status_code = 301`,
        [oldSlug, newSlug]
      );
      await client.query(
        'UPDATE redirects SET new_slug = $1 WHERE new_slug = $2',
        [newSlug, oldSlug]
      );
    }

    await syncPostRelations(client, postId, data);
    return { oldSlug, newSlug };
  });

  if (!result) return res.status(404).json({ success: false, message: 'Post not found.' });
  return res.json({ success: true, id: postId, slug: result.newSlug, redirectedFrom: result.oldSlug !== result.newSlug ? result.oldSlug : null });
}));

router.post('/posts/:id/duplicate', route(async (req, res) => {
  const postId = Number(req.params.id);
  if (!Number.isInteger(postId) || postId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid post ID.' });
  }

  const duplicated = await inTransaction(async (client) => {
    const { rows } = await client.query('SELECT * FROM posts WHERE id = $1 LIMIT 1', [postId]);
    if (!rows.length) return null;
    const orig = rows[0];
    const copySlug = `${orig.slug}-copy-${crypto.randomBytes(2).toString('hex')}`;

    const { rows: inserted } = await client.query(
      `INSERT INTO posts (
         title, slug, excerpt, content_html, featured_image, featured_image_alt,
         featured_image_width, featured_image_height, category_id, author_name,
         status, published_at, focus_keyword, meta_title, meta_description,
         canonical_url, og_image, noindex, reading_time, word_count, seo_score
       ) VALUES (
         $1, $2, $3, $4, $5, $6,
         $7, $8, $9, $10,
         'draft', NULL, $11, $12, $13,
         $14, $15, $16, $17, $18, $19
       ) RETURNING id`,
      [
        `${orig.title} (Copy)`,
        copySlug,
        orig.excerpt,
        orig.content_html,
        orig.featured_image,
        orig.featured_image_alt,
        orig.featured_image_width,
        orig.featured_image_height,
        orig.category_id,
        orig.author_name,
        orig.focus_keyword,
        orig.meta_title,
        orig.meta_description,
        orig.canonical_url,
        orig.og_image,
        orig.noindex,
        orig.reading_time,
        orig.word_count,
        orig.seo_score
      ]
    );
    const newId = Number(inserted[0].id);

    await client.query(
      'INSERT INTO post_tags (post_id, tag_id) SELECT $1, tag_id FROM post_tags WHERE post_id = $2',
      [newId, postId]
    );
    await client.query(
      'INSERT INTO post_faqs (post_id, question, answer, sort_order) SELECT $1, question, answer, sort_order FROM post_faqs WHERE post_id = $2',
      [newId, postId]
    );
    await client.query(
      'INSERT INTO post_products (post_id, product_id, sort_order) SELECT $1, product_id, sort_order FROM post_products WHERE post_id = $2',
      [newId, postId]
    );

    return { id: newId, slug: copySlug };
  });

  if (!duplicated) return res.status(404).json({ success: false, message: 'Post not found.' });
  return res.status(201).json({ success: true, ...duplicated });
}));

router.delete('/posts/:id', route(async (req, res) => {
  const postId = Number(req.params.id);
  if (!Number.isInteger(postId) || postId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid post ID.' });
  }
  const result = await query('DELETE FROM posts WHERE id = $1', [postId]);
  if (!result.rowCount) return res.status(404).json({ success: false, message: 'Post not found.' });
  return res.json({ success: true, message: 'Post deleted.' });
}));

router.post('/categories', route(async (req, res) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: parsed.error.issues[0]?.message || 'Invalid category.' });
  }
  const { name, description } = parsed.data;
  const catSlug = slugify(parsed.data.slug || name);
  const { rows } = await query(
    `INSERT INTO blog_categories (name, slug, description)
     VALUES ($1, $2, $3)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
     RETURNING id, name, slug, description`,
    [name, catSlug, description]
  );
  return res.status(201).json({ success: true, category: rows[0] });
}));

router.post('/upload', route(async (req, res) => {
  const parsed = uploadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: 'Invalid image payload. Allowed: JPEG, PNG, WebP, AVIF.' });
  }

  const { filename, mimeType, dataBase64 } = parsed.data;
  const cleanBase64 = dataBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
  const buffer = Buffer.from(cleanBase64, 'base64');
  if (buffer.length > 4 * 1024 * 1024) {
    return res.status(413).json({ success: false, message: 'Image must be 4MB or smaller.' });
  }

  const ext = mimeType.split('/')[1].replace('jpeg', 'jpg');
  const safeBase = slugify(path.basename(filename, path.extname(filename))) || 'blog-image';
  const objectName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${safeBase}.${ext}`;

  if (isCloudinaryConfigured()) {
    const dataUri = `data:${mimeType};base64,${cleanBase64}`;
    const uploaded = await uploadToCloudinary({
      dataUri,
      folder: 'sasta-bazaar/blog',
      publicId: `${Date.now()}-${safeBase}`
    });
    return res.json({ success: true, url: uploaded.url, provider: 'cloudinary' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceKey) {
    const supabase = createClient(supabaseUrl, serviceKey);
    const bucket = process.env.SUPABASE_BLOG_BUCKET || 'blog-images';
    await supabase.storage.createBucket(bucket, { public: true }).catch(() => {});
    const { error } = await supabase.storage.from(bucket).upload(objectName, buffer, {
      contentType: mimeType,
      upsert: false
    });
    if (error) {
      return res.status(500).json({ success: false, message: `Supabase upload failed: ${error.message}` });
    }
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(objectName);
    return res.json({ success: true, url: pub.publicUrl });
  }

  if (process.env.VERCEL) {
    return res.status(503).json({
      success: false,
      message: 'Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel to upload images, or paste an image URL.'
    });
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'blog');
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, objectName), buffer);
  return res.json({ success: true, url: `/uploads/blog/${objectName}` });
}));

export default router;
