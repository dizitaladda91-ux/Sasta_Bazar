import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inTransaction, pool } from '../server/db.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_URL = 'https://sastabazaarclothing.com/collections/all/products.json';

const slugify = (value) => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function cleanTitle(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/^📛-product-title-|^product-title-|^Product Title:\s*/i, '')
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function determineCategory(p) {
  const handle = (p.handle || '').toLowerCase();
  const title = (p.title || '').toLowerCase();
  const type = (p.product_type || '').toLowerCase();

  if (handle.includes('hijab') || handle.includes('scarf') || title.includes('hijab') || title.includes('scarf') || type.includes('scarf') || type.includes('hijab')) {
    return { category: 'Scarves', subcategory: 'Premium Jersey Hijabs', collection: 'scarves' };
  }
  if (handle.startsWith('k0') || title.includes('kids') || type.includes('kids')) {
    return { category: 'Kids Collection', subcategory: 'Kids Ethnic Wear', collection: 'kids-collection' };
  }
  if (handle.startsWith('l0') || title.includes('lehenga') || type.includes('lehenga')) {
    return { category: 'Ladies Collection', subcategory: 'Lehenga Choli', collection: 'lehenga-choli' };
  }
  if (handle.startsWith('s001') || title.includes('sharara') || title.includes('gharara')) {
    return { category: 'Ladies Collection', subcategory: 'Sharara & Gharara Suits', collection: 'sharara-gharara-suits' };
  }
  if (handle.startsWith('d0') || title.includes('saree drape') || title.includes('long dress') || title.includes('dress') || title.includes('gown')) {
    return { category: 'Ladies Collection', subcategory: 'Dresses', collection: 'dresses' };
  }
  if (handle.startsWith('sl0') || title.includes('salwar')) {
    return { category: 'Ladies Collection', subcategory: 'Salwar Kameez / Suit Sets', collection: 'salwar-kameez-suit-sets' };
  }
  if (handle.includes('unstitched') || title.includes('unstitched')) {
    return { category: 'Unstitched Suits', subcategory: 'Unstitched Suits', collection: 'unstitched-suits' };
  }
  return { category: 'Ladies Collection', subcategory: 'Casual Everyday Wear Suits', collection: 'casual-wear' };
}

const ethnicSuitPlaceholders = [
  'https://cdn.shopify.com/s/files/1/1083/5361/8269/files/A9A58E82-7169-4537-965C-00EEEA5F386E.jpg?v=1782830760',
  'https://cdn.shopify.com/s/files/1/1083/5361/8269/files/8DA859B8-D954-4D4A-A052-1E1973B90BC9.jpg?v=1782830836',
  'https://cdn.shopify.com/s/files/1/1083/5361/8269/files/8D3E0A65-E3E2-4A12-AD6E-B8322A127AC5.jpg?v=1782830892',
  'https://cdn.shopify.com/s/files/1/1083/5361/8269/files/5B4516CE-1744-4BC4-B5F8-496E0908B7B8.jpg?v=1782830970',
  'https://cdn.shopify.com/s/files/1/1083/5361/8269/files/IMG_3452.jpg?v=1782585999'
];

function transformProduct(p, index) {
  const cleanedName = cleanTitle(p.title);
  const catInfo = determineCategory(p);
  const rawImages = Array.isArray(p.images) && p.images.length > 0 ? p.images.map((img) => img.src).filter(Boolean) : [];
  const isImagePlaceholder = rawImages.length === 0;
  const images = !isImagePlaceholder
    ? rawImages
    : [
        ethnicSuitPlaceholders[index % ethnicSuitPlaceholders.length],
        ethnicSuitPlaceholders[(index + 1) % ethnicSuitPlaceholders.length]
      ];

  const firstVariant = p.variants?.[0] || {};
  const price = parseFloat(firstVariant.price || '9.99');
  let compareAt = firstVariant.compare_at_price ? parseFloat(firstVariant.compare_at_price) : null;
  if (!compareAt && price > 0) {
    if (price === 9.99) compareAt = 19.99;
    else if (price === 2.99) compareAt = 5.99;
    else compareAt = Math.round(price * 1.5 * 100) / 100;
  }

  const discount = compareAt && compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;
  const isAvailable = Array.isArray(p.variants) ? p.variants.some((v) => v.available) : true;

  let sizes = ['S', 'M', 'L', 'XL', 'XXL'];
  let colors = [];
  if (Array.isArray(p.options) && p.options.length > 0) {
    const sizeOpt = p.options.find((o) => o.name && o.name.toLowerCase() === 'size');
    if (sizeOpt?.values?.length) sizes = sizeOpt.values;
    const colorOpt = p.options.find(
      (o) => o.name && ['color', 'colour', 'title'].includes(o.name.toLowerCase())
    );
    if (colorOpt?.values?.length && !sizeOpt) {
      colors = colorOpt.values.filter((v) => v !== 'Default Title');
    }
  }

  return {
    id: p.id,
    handle: p.handle,
    title: cleanedName,
    rawTitle: p.title,
    category: catInfo.category,
    subcategory: catInfo.subcategory,
    collectionSlug: catInfo.collection,
    price,
    compareAtPrice: compareAt,
    discountPercent: discount,
    currency: '£',
    available: isAvailable,
    images,
    primaryImage: images[0],
    hoverImage: images[1] || images[0],
    isImagePlaceholder,
    description: p.body_html || '<p>Experience authentic ethnic luxury crafted with premium fabrics and timeless detailing.</p>',
    sizes,
    colors,
    vendor: p.vendor || 'SASTA BAZAAR',
    isBestSeller: false,
    isNewArrival: true,
    variants: (p.variants || []).map((v) => ({
      id: v.id,
      title: v.title,
      price: parseFloat(v.price || String(price)),
      compareAtPrice: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
      available: Boolean(v.available),
      stock: v.available ? 10 : 0,
      image: v.featured_image ? v.featured_image.src : null
    }))
  };
}

async function fetchAllShopifyProducts() {
  const all = [];
  for (let page = 1; page <= 50; page += 1) {
    const res = await fetch(`${SOURCE_URL}?limit=250&page=${page}`);
    if (!res.ok) throw new Error(`Failed to fetch page ${page}: HTTP ${res.status}`);
    const data = await res.json();
    const batch = data.products || [];
    if (!batch.length) break;
    all.push(...batch);
    if (batch.length < 250) break;
  }
  return all;
}

async function main() {
  console.log(`Fetching products from ${SOURCE_URL}...`);
  const scraped = await fetchAllShopifyProducts();
  console.log(`Scraped ${scraped.length} total products from sastabazaarclothing.com.`);

  const srcPath = path.join(root, 'src', 'data', 'products.json');
  const serverPath = path.join(root, 'server', 'data', 'products.json');

  const existingSrc = JSON.parse(await fs.readFile(srcPath, 'utf8'));
  const existingServer = JSON.parse(await fs.readFile(serverPath, 'utf8'));

  const knownHandles = new Set(existingSrc.map((p) => p.handle));
  const knownIds = new Set(existingSrc.map((p) => String(p.id)));

  const newProducts = [];
  let skippedJson = 0;

  scraped.forEach((raw, idx) => {
    if (knownHandles.has(raw.handle) || knownIds.has(String(raw.id))) {
      skippedJson += 1;
      return;
    }
    knownHandles.add(raw.handle);
    knownIds.add(String(raw.id));
    newProducts.push(transformProduct(raw, idx));
  });

  if (newProducts.length > 0) {
    const mergedSrc = [...existingSrc, ...newProducts];
    const mergedServer = [...existingServer, ...newProducts];
    await fs.writeFile(srcPath, JSON.stringify(mergedSrc, null, 2));
    await fs.writeFile(serverPath, JSON.stringify(mergedServer, null, 2));
    console.log(`Added ${newProducts.length} new products to JSON files (skipped ${skippedJson} already listed).`);
  } else {
    console.log(`No new products to add to JSON files (all ${skippedJson} already listed).`);
  }

  // Transfer new/missing products to DB, skipping already-listed DB products
  const allForDb = newProducts.length > 0 ? newProducts : existingServer;
  let dbInserted = 0;
  let dbSkipped = 0;

  await inTransaction(async (client) => {
    const existingRows = await client.query('SELECT handle, external_id FROM products');
    const dbHandles = new Set(existingRows.rows.map((r) => r.handle));
    const dbExtIds = new Set(existingRows.rows.map((r) => r.external_id).filter(Boolean));

    for (const product of allForDb) {
      if (dbHandles.has(product.handle) || dbExtIds.has(String(product.id))) {
        dbSkipped += 1;
        continue;
      }

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

      const stockTotal = (product.variants || []).reduce((sum, v) => sum + (Number(v.stock) || (v.available ? 10 : 0)), 0);
      const inserted = await client.query(
        `INSERT INTO products
          (external_id, category_id, handle, title, raw_title, subcategory, collection_slug,
           description, price, stock, compare_at_price, discount_percent, currency, images, sizes, colors,
           primary_image, hover_image, is_image_placeholder, vendor, is_best_seller, is_new_arrival)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'GBP', $13, $14, $15, $16, $17, $18, $19, $20, $21)
         ON CONFLICT (handle) DO NOTHING
         RETURNING id`,
        [
          String(product.id), categoryId, product.handle, product.title, product.rawTitle || product.title,
          product.subcategory || '', product.collectionSlug || '', product.description || '',
          product.price || 0, stockTotal, product.compareAtPrice || null, product.discountPercent || 0,
          product.images || [], product.sizes || [], product.colors || [],
          product.primaryImage || '', product.hoverImage || '', Boolean(product.isImagePlaceholder),
          product.vendor || 'SASTA BAZAAR', Boolean(product.isBestSeller), Boolean(product.isNewArrival)
        ]
      );

      if (!inserted.rowCount) {
        dbSkipped += 1;
        continue;
      }

      const productId = inserted.rows[0].id;
      for (const variant of product.variants || []) {
        const title = variant.title || '';
        const isSize = (product.sizes || []).includes(title);
        const isColor = (product.colors || []).includes(title);
        await client.query(
          `INSERT INTO variants
            (external_id, product_id, title, size, color, stock, is_available, price, compare_at_price, image_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (external_id) DO NOTHING`,
          [
            variant.id == null ? null : String(variant.id), productId, title,
            isSize ? title : null, isColor ? title : null,
            Number(variant.stock) || (variant.available ? 10 : 0),
            Boolean(variant.available),
            variant.price ?? product.price ?? 0,
            variant.compareAtPrice || null,
            variant.image || null
          ]
        );
      }

      dbHandles.add(product.handle);
      dbExtIds.add(String(product.id));
      dbInserted += 1;
    }
  });

  console.log(`DB transfer complete: ${dbInserted} inserted, ${dbSkipped} skipped (already in DB).`);
}

main()
  .catch((error) => {
    console.error('Sync failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
