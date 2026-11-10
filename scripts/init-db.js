import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcrypt';
import { inTransaction, pool, query } from '../server/db.js';
import { CATEGORIES, SIGNATURE_COLLECTIONS } from '../src/data/categories.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = async (relativePath, fallback = []) => {
  try {
    return JSON.parse(await fs.readFile(path.join(root, relativePath), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
};

const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const schema = await fs.readFile(path.join(root, 'server', 'db', 'schema.sql'), 'utf8');

try {
  await query(schema);
  await inTransaction(async (client) => {
    const contentRows = [
      ['home_categories', CATEGORIES],
      ['signature_collections', SIGNATURE_COLLECTIONS],
      ['collection_pages', Object.fromEntries([
        ...CATEGORIES.map((item) => [item.slug, { title: item.name, description: item.description }]),
        ['casual-wear', { title: 'Casual Everyday Wear Suits', description: 'Breezy cotton and slub 3-piece suit sets tailored with intricate neck patches and lightweight dupattas.' }],
        ['lehenga-choli', { title: 'Lehenga Choli', description: 'Exquisite digital print and embroidered silk lehengas crafted for weddings and festive celebrations.' }],
        ['sharara-gharara-suits', { title: 'Sharara & Gharara Suits', description: 'Glamorous tiered sharara silhouettes embellished with sequin work and contrast dupattas.' }],
        ['salwar-kameez-suit-sets', { title: 'Salwar Kameez / Suit Sets', description: 'Classic thread & zarkan work suits made from premium slub cotton fabrics for comfortable elegance.' }],
        ['dresses', { title: 'Dresses & Saree-Drape Gowns', description: 'Contemporary georgette drape styled dresses with hand-embroidered belts and modern cuts.' }],
        ['kids-collection', { title: 'Kids Ethnic Collection', description: 'Comfortable, charming festive wear and lehenga choli sets designed specially for kids.' }],
        ['unstitched-suits', { title: 'Unstitched Suits', description: 'Premium unstitched dress material in pure cotton and silk with designer dupattas ready to tailor.' }],
        ['scarves', { title: 'Premium Jersey Hijabs & Scarves', description: 'Ultra-soft, breathable double-stitched jersey hijabs available in over 30 beautiful pastel and earthy tones.' }]
      ])],
      ['home_copy', {
        announcement: 'Elegance Crafted for Your Most Beautiful Moments',
        hero: {
          eyebrow: 'SPECIAL OFFERS • UP TO 50% OFF',
          title: 'Everyday Luxury Ethnic Fashion',
          description: 'Enjoy up to 50% off with our best price guarantee. Discover timeless suits, festive lehengas, breathable cotton kurtas, and double-stitched jersey hijabs tailored for graceful comfort.',
          primaryCta: 'Shop Now',
          secondaryCta: 'Explore Suits'
        },
        categories: {
          eyebrow: 'Curated Categories',
          title: 'Shop By Collection',
          description: 'Handpicked ethnic elegance tailored with fine embroidery, soft cotton blends, and modern cuts.'
        },
        newArrivals: {
          eyebrow: 'Just Landed',
          title: 'New Arrivals',
          description: 'Explore the latest additions to our ethnic wardrobe, designed for modern silhouettes and everyday luxury.'
        }
      }]
    ];
    for (const [contentKey, content] of contentRows) {
      await client.query(
        `INSERT INTO storefront_content (content_key, content) VALUES ($1, $2::jsonb)
         ON CONFLICT (content_key) DO NOTHING`,
        [contentKey, JSON.stringify(content)]
      );
    }

    await client.query(
      `UPDATE storefront_content
       SET content = jsonb_set(content, '{announcement}', to_jsonb($1::text), TRUE)
       WHERE content_key = 'home_copy' AND NOT (content ? 'announcement')`,
      ['Elegance Crafted for Your Most Beautiful Moments']
    );

    await client.query(`
      INSERT INTO coupons (code, discount_type, discount_value, is_active)
      VALUES ('WELCOME10', 'percent', 10, TRUE)
      ON CONFLICT (code) DO NOTHING
    `);

    const products = await readJson('server/data/products.json');
    for (const product of products) {
      const parentSlug = slugify(product.category || 'Uncategorized') || 'uncategorized';
      const parent = await client.query(
        `INSERT INTO categories (name, slug) VALUES ($1, $2)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [product.category || 'Uncategorized', parentSlug]
      );
      let categoryId = parent.rows[0].id;
      if (product.subcategory) {
        const childSlug = `${parentSlug}-${slugify(product.subcategory)}`;
        const child = await client.query(
          `INSERT INTO categories (parent_id, name, slug)
           VALUES ($1, $2, $3)
           ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name
           RETURNING id`,
          [categoryId, product.subcategory, childSlug]
        );
        categoryId = child.rows[0].id;
      }

      const inserted = await client.query(
        `INSERT INTO products
          (external_id, category_id, handle, title, raw_title, subcategory, collection_slug,
           description, price, compare_at_price, discount_percent, currency, images, sizes, colors,
           primary_image, hover_image, is_image_placeholder, vendor, is_best_seller, is_new_arrival)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'GBP', $12, $13, $14, $15, $16, $17, $18, $19, $20)
         ON CONFLICT (handle) DO UPDATE SET
           category_id = EXCLUDED.category_id, title = EXCLUDED.title, raw_title = EXCLUDED.raw_title,
           subcategory = EXCLUDED.subcategory, collection_slug = EXCLUDED.collection_slug,
           description = EXCLUDED.description, price = EXCLUDED.price,
           compare_at_price = EXCLUDED.compare_at_price, discount_percent = EXCLUDED.discount_percent,
           images = EXCLUDED.images, sizes = EXCLUDED.sizes, colors = EXCLUDED.colors,
           primary_image = EXCLUDED.primary_image, hover_image = EXCLUDED.hover_image,
           is_image_placeholder = EXCLUDED.is_image_placeholder, vendor = EXCLUDED.vendor,
           is_best_seller = EXCLUDED.is_best_seller, is_new_arrival = EXCLUDED.is_new_arrival
         RETURNING id`,
        [
          String(product.id), categoryId, product.handle, product.title, product.rawTitle || product.title,
          product.subcategory || '', product.collectionSlug || '', product.description || '',
          product.price || 0, product.compareAtPrice || null, product.discountPercent || 0,
          product.images || [], product.sizes || [], product.colors || [],
          product.primaryImage || '', product.hoverImage || '', Boolean(product.isImagePlaceholder),
          product.vendor || 'SASTA BAZAAR', Boolean(product.isBestSeller), Boolean(product.isNewArrival)
        ]
      );
      const productId = inserted.rows[0].id;
      for (const variant of product.variants || []) {
        const title = variant.title || '';
        const isSize = (product.sizes || []).includes(title);
        const isColor = (product.colors || []).includes(title);
        await client.query(
          `INSERT INTO variants
            (external_id, product_id, title, size, color, stock, is_available, price, compare_at_price, image_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (external_id) DO UPDATE SET
             product_id = EXCLUDED.product_id, title = EXCLUDED.title, size = EXCLUDED.size,
             color = EXCLUDED.color, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available, price = EXCLUDED.price,
             compare_at_price = EXCLUDED.compare_at_price, image_url = EXCLUDED.image_url`,
          [
            variant.id == null ? null : String(variant.id), productId, title,
            isSize ? title : null, isColor ? title : null, Number(variant.stock) || 0, Boolean(variant.available),
            variant.price ?? product.price ?? 0, variant.compareAtPrice || null, variant.image || null
          ]
        );
      }
    }

    const users = await readJson('server/data/users.json');
    for (const user of users) {
      const passwordHash = /^\$2[aby]\$/.test(user.password || '')
        ? user.password
        : await bcrypt.hash(user.password || crypto.randomBytes(32).toString('hex'), 12);
      const result = await client.query(
        `INSERT INTO users (public_id, name, email, password_hash, phone, role, created_at)
         VALUES ($1, $2, LOWER($3), $4, $5, $6, COALESCE($7::timestamptz, NOW()))
         ON CONFLICT (email) DO NOTHING RETURNING id`,
        [user.id || null, user.name, user.email, passwordHash, user.phone || '', user.role || 'customer', user.joinedAt || null]
      );
      if (result.rowCount && user.address) {
        await client.query(
          `INSERT INTO addresses (user_id, street, city, postal_code, country, is_default)
           VALUES ($1, $2, $3, $4, $5, TRUE)`,
          [result.rows[0].id, user.address.street || '', user.address.city || '', user.address.postalCode || '', user.address.country || 'United Kingdom']
        );
      }
    }

    const inquiries = await readJson('server/data/inquiries.json');
    for (const inquiry of inquiries) {
      await client.query(
        `INSERT INTO inquiries
          (public_id, type, name, email, phone, order_ref, subject, message, garment_type, details, status, created_at)
         VALUES ($1, $2, $3, LOWER($4), $5, $6, $7, $8, $9, $10, $11, COALESCE($12::timestamptz, NOW()))
         ON CONFLICT (public_id) DO NOTHING`,
        [
          inquiry.id || `INQ-${Date.now()}`, inquiry.type === 'customization' ? 'customization' : 'contact',
          inquiry.name, inquiry.email, inquiry.phone || '', inquiry.orderRef || null, inquiry.subject || '',
          inquiry.message || '', inquiry.garmentType || '', inquiry.details || '', inquiry.status || 'Pending',
          inquiry.createdAt || null
        ]
      );
    }

    const subscribers = await readJson('server/data/subscribers.json');
    for (const subscriber of subscribers) {
      await client.query(
        `INSERT INTO subscribers (email, coupon_id, coupon_code, created_at)
         VALUES (LOWER($1), (SELECT id FROM coupons WHERE code = $2), $2, COALESCE($3::timestamptz, NOW()))
         ON CONFLICT (email) DO NOTHING`,
        [subscriber.email, subscriber.couponCode || 'WELCOME10', subscriber.createdAt || null]
      );
    }

    const orders = await readJson('server/data/orders.json');
    for (const order of orders) {
      const customer = order.customer || {};
      const insertedOrder = await client.query(
        `INSERT INTO orders
          (order_ref, customer_name, customer_email, customer_phone, shipping_address, shipping_city,
           shipping_postcode, subtotal, shipping, discount, total, payment_method, payment_status,
           order_status, tracking_number, courier, created_at)
         VALUES ($1, $2, LOWER($3), $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, COALESCE($17::timestamptz, NOW()))
         ON CONFLICT (order_ref) DO NOTHING RETURNING id`,
        [
          order.orderId, customer.name || '', customer.email || '', customer.phone || '',
          customer.address || '', customer.city || '', customer.postcode || '',
          order.subtotal || 0, order.shipping || 0, order.discount || 0, order.total || 0,
          order.paymentMethod || '', order.paymentStatus || 'Pending', order.orderStatus || 'Processing',
          order.trackingNumber || '', order.courier || '', order.createdAt || null
        ]
      );
      if (!insertedOrder.rowCount) continue;
      for (const item of order.items || []) {
        const product = await client.query(
          'SELECT id FROM products WHERE external_id = $1 LIMIT 1', [String(item.productId ?? item.id ?? '')]
        );
        const variant = await client.query(
          'SELECT id FROM variants WHERE external_id = $1 LIMIT 1', [String(item.variantId ?? '')]
        );
        await client.query(
          `INSERT INTO order_items
            (order_id, product_id, variant_id, product_title, variant_title, size, color, image_url, unit_price, quantity, line_total)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            insertedOrder.rows[0].id, product.rows[0]?.id || null, variant.rows[0]?.id || null,
            item.title || '', item.variantTitle || item.size || item.color || '', item.size || '', item.color || '',
            item.image || '', item.price || 0, item.quantity || 1, (item.price || 0) * (item.quantity || 1)
          ]
        );
      }
    }
  });
  console.log('PostgreSQL schema is ready and existing JSON data has been imported.');
} finally {
  await pool.end();
}
