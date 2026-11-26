import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inTransaction, pool, query } from '../server/db.js';
import { SAMPLE_BLOG_CATEGORIES, SAMPLE_BLOG_POSTS } from '../server/data/sample-blogs.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function stripHtml(html) {
  return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function seedBlog() {
  const blogSchema = await fs.readFile(path.join(root, 'server', 'db', 'blog-schema.sql'), 'utf8');
  await query(blogSchema);

  await inTransaction(async (client) => {
    const categoryMap = new Map();
    for (const cat of SAMPLE_BLOG_CATEGORIES) {
      const { rows } = await client.query(
        `INSERT INTO blog_categories (name, slug, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
         RETURNING id, slug`,
        [cat.name, cat.slug, cat.description]
      );
      categoryMap.set(rows[0].slug, rows[0].id);
    }

    for (const post of SAMPLE_BLOG_POSTS) {
      const text = stripHtml(post.contentHtml);
      const wordCount = text ? text.split(/\s+/).length : 0;
      const readingTime = Math.max(1, Math.ceil(wordCount / 200));
      const categoryId = categoryMap.get(post.categorySlug) || null;

      const { rows: postRows } = await client.query(
        `INSERT INTO posts (
           title, slug, excerpt, content_html, featured_image, featured_image_alt,
           featured_image_width, featured_image_height, category_id, author_name,
           status, published_at, focus_keyword, meta_title, meta_description,
           canonical_url, og_image, noindex, reading_time, word_count, seo_score
         ) VALUES (
           $1, $2, $3, $4, $5, $6,
           $7, $8, $9, $10,
           $11, $12, $13, $14, $15,
           $16, $17, FALSE, $18, $19, 95
         )
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title,
           excerpt = EXCLUDED.excerpt,
           content_html = EXCLUDED.content_html,
           featured_image = EXCLUDED.featured_image,
           featured_image_alt = EXCLUDED.featured_image_alt,
           category_id = EXCLUDED.category_id,
           author_name = EXCLUDED.author_name,
           status = EXCLUDED.status,
           published_at = EXCLUDED.published_at,
           focus_keyword = EXCLUDED.focus_keyword,
           meta_title = EXCLUDED.meta_title,
           meta_description = EXCLUDED.meta_description,
           reading_time = EXCLUDED.reading_time,
           word_count = EXCLUDED.word_count,
           updated_at = NOW()
         RETURNING id`,
        [
          post.title,
          post.slug,
          post.excerpt,
          post.contentHtml.trim(),
          post.featuredImage,
          post.featuredImageAlt,
          post.featuredImageWidth || 1200,
          post.featuredImageHeight || 675,
          categoryId,
          post.authorName,
          post.status,
          post.publishedAt,
          post.focusKeyword,
          post.metaTitle,
          post.metaDescription,
          '',
          post.featuredImage,
          readingTime,
          wordCount
        ]
      );
      const postId = postRows[0].id;

      await client.query('DELETE FROM post_tags WHERE post_id = $1', [postId]);
      for (const tagName of post.tags || []) {
        const tagSlug = slugify(tagName);
        if (!tagSlug) continue;
        const { rows: tagRows } = await client.query(
          `INSERT INTO tags (name, slug) VALUES ($1, $2)
           ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [tagName, tagSlug]
        );
        await client.query(
          `INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [postId, tagRows[0].id]
        );
      }

      await client.query('DELETE FROM post_faqs WHERE post_id = $1', [postId]);
      for (let i = 0; i < (post.faqs || []).length; i += 1) {
        const faq = post.faqs[i];
        await client.query(
          `INSERT INTO post_faqs (post_id, question, answer, sort_order) VALUES ($1, $2, $3, $4)`,
          [postId, faq.question, faq.answer, i]
        );
      }

      await client.query('DELETE FROM post_products WHERE post_id = $1', [postId]);
      for (let i = 0; i < (post.productHandles || []).length; i += 1) {
        const handle = post.productHandles[i];
        const { rows: prodRows } = await client.query(
          'SELECT id FROM products WHERE handle = $1 LIMIT 1',
          [handle]
        );
        if (prodRows.length) {
          await client.query(
            `INSERT INTO post_products (post_id, product_id, sort_order)
             VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
            [postId, prodRows[0].id, i]
          );
        }
      }
    }
  });

  console.log(`Seeded ${SAMPLE_BLOG_CATEGORIES.length} blog categories and ${SAMPLE_BLOG_POSTS.length} sample blog posts.`);
}

seedBlog()
  .catch((error) => {
    console.error('Blog seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
