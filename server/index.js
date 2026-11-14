import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { inTransaction, pool, query } from './db.js';
import { clearAuthCookie, optionalAuth, requireAdmin, requireAuth, setAuthCookie } from './middleware/auth.js';
import { validate } from './middleware/validate.js';
import {
  checkoutBody, contactBody, customizationBody, loginBody, newsletterBody, orderIdParams,
  orderStatusBody, pageQuery, productCreateBody, productIdParams, productUpdateBody,
  productsQuery, profileBody, refundBody, registerBody, trackingQuery
} from './validators/index.js';
import { getStripe } from './services/stripe.js';
import { releaseStaleOrders, restoreOrderReservation, syncProductStock } from './services/orders.js';
import { issueOrderRefund } from './services/refunds.js';
import { processStripeEvent } from './services/stripe-webhook.js';
import { verifyPassword } from './services/passwordRules.js';
import { calculateCouponDiscount, hasCouponUsageAvailable } from './services/couponRules.js';
import {
  assertTopLevelStockAllowed, getIncomingVariants, replaceProductVariants, sortCheckoutItems
} from './services/productRules.js';
import { requireCronSecret } from './middleware/cronAuth.js';
import {
  generalLimiter, loginLimiter, registerLimiter, contactLimiter,
  customizationLimiter, newsletterLimiter, trackLimiter, checkoutLimiter
} from './middleware/ratelimit.js';

const app = express();
const PORT = process.env.PORT || 5000;
const route = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);


app.set('trust proxy', 1);
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.includes(origin));
  },
  credentials: true
}));
app.use(helmet({
  contentSecurityPolicy: false,
  strictTransportSecurity: process.env.NODE_ENV === 'production' ? undefined : false
}));

app.post('/api/webhooks/stripe', express.raw({ type: 'application/json', limit: '100kb' }), route(async (req, res) => {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ success: false, message: 'Stripe webhooks are not configured.' });
  }
  let event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid Stripe webhook signature.' });
  }
  const processed = await processStripeEvent(event);
  return res.json({ received: true, duplicate: !processed });
}));

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use('/api', generalLimiter);

app.post('/api/orders', (_req, res) => res.status(410).json({
  success: false,
  message: 'Order creation is only available through the secure Stripe checkout.'
}));

const toPublicId = (value) => /^\d+$/.test(String(value)) ? Number(value) : value;
const money = (value) => Math.round(Number(value) * 100) / 100;
const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const createOrderReference = () => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes = crypto.randomBytes(5);
  let value = 0;
  let bits = 0;
  let reference = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      reference += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
      value &= (1 << bits) - 1;
    }
  }
  return `SB-${reference}`;
};
const withoutImages = (value) => {
  if (Array.isArray(value)) return value.map(withoutImages);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !['image', 'images', 'primaryImage', 'hoverImage'].includes(key))
    .map(([key, entry]) => [key, withoutImages(entry)]));
};

async function getProducts(where = '', values = [], orderBy = '', pagination = null, runQuery = query) {
  const queryValues = [...values];
  let pageClause = '';
  if (pagination) {
    queryValues.push(pagination.limit, (pagination.page - 1) * pagination.limit);
    pageClause = ` LIMIT $${queryValues.length - 1} OFFSET $${queryValues.length}`;
  }
  const { rows } = await runQuery(
    `SELECT p.id, p.external_id, p.handle, p.title, p.raw_title, p.category_id,
            p.subcategory, p.collection_slug, p.price, p.compare_at_price,
            p.discount_percent, p.currency, p.stock, p.description, p.sizes,
            p.colors, p.images, p.primary_image, p.hover_image, p.is_active,
            p.vendor, p.is_best_seller, p.is_new_arrival,
            c.name AS subcategory_name,
            COALESCE(parent.name, c.name) AS category_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN categories parent ON parent.id = c.parent_id
     WHERE p.is_active = TRUE ${where} ${orderBy}${pageClause}`,
    queryValues
  );
  if (!rows.length) return [];
  const variants = await runQuery(
    `SELECT v.id, v.external_id, v.product_id, v.title, v.size, v.color,
            v.stock, v.is_available, v.price, v.compare_at_price FROM variants v
     JOIN products p ON p.id = v.product_id WHERE p.id = ANY($1::bigint[])
     ORDER BY v.id`,
    [rows.map((product) => product.id)]
  );
  return rows.map((row) => {
    const productVariants = variants.rows.filter((variant) => variant.product_id === row.id).map((variant) => ({
      id: toPublicId(variant.external_id || variant.id),
      title: variant.title,
      size: variant.size,
      color: variant.color,
      stock: variant.stock,
      price: Number(variant.price),
      compareAtPrice: variant.compare_at_price == null ? null : Number(variant.compare_at_price),
      available: variant.is_available
    }));
    return {
      id: toPublicId(row.external_id || row.id),
      handle: row.handle,
      title: row.title,
      rawTitle: row.raw_title,
      category: row.category_name || 'Uncategorized',
      subcategory: row.subcategory || row.subcategory_name || '',
      collectionSlug: row.collection_slug,
      price: Number(row.price),
      compareAtPrice: row.compare_at_price == null ? null : Number(row.compare_at_price),
      discountPercent: row.discount_percent,
      currency: '£',
      stock: row.stock,
      available: row.stock > 0,
      description: row.description,
      images: row.images,
      primaryImage: row.primary_image,
      hoverImage: row.hover_image,
      isActive: row.is_active,
      sizes: row.sizes.length ? row.sizes : productVariants.map((variant) => variant.size).filter(Boolean),
      colors: row.colors.length ? row.colors : productVariants.map((variant) => variant.color).filter(Boolean),
      vendor: row.vendor,
      isBestSeller: row.is_best_seller,
      isNewArrival: row.is_new_arrival,
      variants: productVariants
    };
  });
}

function formatOrder(row, itemRows) {
  return {
    orderId: row.order_ref,
    customer: {
      name: row.customer_name,
      email: row.customer_email,
      phone: row.customer_phone,
      address: row.shipping_address,
      city: row.shipping_city,
      postcode: row.shipping_postcode
    },
    items: itemRows.map((item) => ({
      id: toPublicId(item.variant_external_id || item.product_external_id || item.variant_id || item.product_id),
      title: item.product_title,
      variantTitle: item.variant_title,
      size: item.size,
      color: item.color,
      price: Number(item.unit_price),
      quantity: item.quantity,
      image: item.image_url,
      handle: item.product_handle
    })),
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    discount: Number(row.discount),
    refundedAmount: Number(row.refunded_amount || 0),
    total: Number(row.total),
    currency: '£',
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    orderStatus: row.order_status,
    trackingNumber: row.tracking_number,
    courier: row.courier,
    createdAt: row.created_at
  };
}

async function getOrder(orderId) {
  const result = await query('SELECT * FROM orders WHERE LOWER(order_ref) = LOWER($1)', [orderId]);
  if (!result.rowCount) return null;
  const itemRows = await query(
    `SELECT item.id, item.order_id, item.product_id, item.variant_id, item.product_title, item.variant_title,
            item.size, item.color, item.unit_price, item.quantity, item.line_total,
            item.image_url,
            variant.external_id AS variant_external_id,
            product.external_id AS product_external_id, product.handle AS product_handle
     FROM order_items item
     LEFT JOIN variants variant ON variant.id = item.variant_id
     LEFT JOIN products product ON product.id = item.product_id
     WHERE item.order_id = $1 ORDER BY item.id`,
    [result.rows[0].id]
  );
  return formatOrder(result.rows[0], itemRows.rows);
}

async function getOrders(where = '', values = [], pagination = null) {
  const queryValues = [...values];
  let pageClause = '';
  if (pagination) {
    queryValues.push(pagination.limit, (pagination.page - 1) * pagination.limit);
    pageClause = ` LIMIT $${queryValues.length - 1} OFFSET $${queryValues.length}`;
  }
  const { rows } = await query(
    `SELECT * FROM orders ${where} ORDER BY created_at DESC${pageClause}`,
    queryValues
  );
  if (!rows.length) return [];
  const itemRows = await query(
    `SELECT item.id, item.order_id, item.product_id, item.variant_id, item.product_title, item.variant_title,
            item.size, item.color, item.unit_price, item.quantity, item.line_total, item.image_url,
            variant.external_id AS variant_external_id,
            product.external_id AS product_external_id, product.handle AS product_handle
     FROM order_items item
     LEFT JOIN variants variant ON variant.id = item.variant_id
     LEFT JOIN products product ON product.id = item.product_id
     WHERE item.order_id = ANY($1::bigint[]) ORDER BY item.order_id, item.id`,
    [rows.map((row) => row.id)]
  );
  const itemsByOrder = new Map(rows.map((row) => [String(row.id), []]));
  for (const item of itemRows.rows) itemsByOrder.get(String(item.order_id)).push(item);
  return rows.map((row) => formatOrder(row, itemsByOrder.get(String(row.id))));
}

async function createProduct(client, input) {
  const price = Number(input.price);
  const compareAtPrice = input.compareAtPrice ? Number(input.compareAtPrice) : null;
  const incomingVariants = getIncomingVariants(input, price, compareAtPrice);
  assertTopLevelStockAllowed(input.stock, incomingVariants.length);

  const parentName = input.category || 'Ladies Collection';
  const parentSlug = slugify(parentName) || 'uncategorized';
  const parent = await client.query(
    `INSERT INTO categories (name, slug) VALUES ($1, $2)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    [parentName, parentSlug]
  );
  let categoryId = parent.rows[0].id;
  const subcategory = input.subcategory || 'Casual Everyday Wear Suits';
  const subcategorySlug = `${parentSlug}-${slugify(subcategory)}`;
  const child = await client.query(
    `INSERT INTO categories (parent_id, name, slug) VALUES ($1, $2, $3)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id RETURNING id`,
    [categoryId, subcategory, subcategorySlug]
  );
  categoryId = child.rows[0].id;

  const discount = compareAtPrice > price ? Math.round((compareAtPrice - price) / compareAtPrice * 100) : 0;
  const images = Array.isArray(input.images) && input.images.length
    ? input.images
    : ['https://cdn.shopify.com/s/files/1/1083/5361/8269/files/1E1687CB-99B0-4DF8-B0A1-477F97E542DC.png?v=1782829448'];
  const colors = Array.isArray(input.colors) ? input.colors : [];
  const sizes = Array.isArray(input.sizes) && input.sizes.length
    ? input.sizes
    : colors.length ? [] : ['S', 'M', 'L', 'XL', 'XXL'];
  const handle = input.handle || `${slugify(input.title)}-${Date.now()}`;
  const result = await client.query(
    `INSERT INTO products
      (category_id, handle, title, raw_title, subcategory, collection_slug, description, price, stock,
       compare_at_price, discount_percent, images, sizes, colors, primary_image, hover_image, is_new_arrival)
     VALUES ($1,$2,$3,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,TRUE) RETURNING id`,
    [categoryId, handle, input.title, subcategory, parentSlug, input.description || '',
      price, Number(input.stock) || 0, compareAtPrice, discount, images, sizes, colors, images[0], images[1] || images[0]]
  );
  const productId = result.rows[0].id;
  for (const [index, variant] of incomingVariants.entries()) {
    await client.query(
      `INSERT INTO variants (product_id, external_id, title, size, color, stock, price, compare_at_price, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [productId, variant.externalId ?? (variant.id == null ? null : String(variant.id)),
        variant.title || variant.size || variant.color || '', variant.size || null,
        variant.color || null, Number(variant.stock ?? (index === 0 ? input.stock : 0)) || 0, Number(variant.price ?? price),
        variant.compareAtPrice ? Number(variant.compareAtPrice) : compareAtPrice, variant.image || null]
    );
  }
  await syncProductStock(client, productId);
  return productId;
}

app.get('/api/products', validate({ query: productsQuery }), route(async (req, res) => {
  const { page, limit, category, subcategory, search, filter, sort, collection } = req.validated.query;
  const values = [];
  const filters = [];
  const addFilter = (sql, value) => {
    values.push(value);
    filters.push(sql.replace(/\?/g, `$${values.length}`));
  };
  if (search) addFilter(`(p.title ILIKE '%' || ? || '%' OR p.handle ILIKE '%' || ? || '%' OR c.name ILIKE '%' || ? || '%')`, search);
  if (category && category !== 'All') addFilter(`(c.name = ? OR parent.name = ?)`, category);
  if (subcategory) addFilter(`c.name = ?`, subcategory);
  if (collection) addFilter(`p.collection_slug = ?`, collection);
  if (filter === 'sale') filters.push('p.discount_percent > 0');
  if (filter === 'new') filters.push('p.is_new_arrival = TRUE');
  if (filter === 'best-seller') filters.push('p.is_best_seller = TRUE');
  let orderBy = {
    'price-low': 'ORDER BY p.price ASC',
    'price-high': 'ORDER BY p.price DESC',
    discount: 'ORDER BY p.discount_percent DESC',
    newest: 'ORDER BY p.is_new_arrival DESC, p.created_at DESC'
  }[sort] || 'ORDER BY p.created_at DESC';
  const where = filters.length ? `AND ${filters.join(' AND ')}` : '';
  const count = await query(
    `SELECT COUNT(DISTINCT p.id)::int AS total
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN categories parent ON parent.id = c.parent_id
     WHERE p.is_active = TRUE ${where}`,
    values
  );
  const total = count.rows[0].total;
  const paginated = page !== undefined;
  const products = await getProducts(
    where,
    values,
    orderBy,
    paginated ? { page, limit: limit || 20 } : null
  );
  const response = {
    success: true,
    count: products.length,
    total,
    page: page || 1,
    pages: paginated ? Math.max(1, Math.ceil(total / (limit || 20))) : 1,
    products
  };
  res.json(response);
}));

app.get('/api/products/:handle', route(async (req, res) => {
  const products = await getProducts('AND (p.handle = $1 OR p.external_id = $1)', [req.params.handle]);
  if (!products.length) return res.status(404).json({ success: false, message: `Product "${req.params.handle}" not found` });
  res.json({ success: true, product: products[0] });
}));

app.get('/api/categories', route(async (_req, res) => {
  const { rows } = await query(`
    SELECT parent.name, parent.slug, parent.description,
           COUNT(DISTINCT p.id)::int AS count,
           COALESCE(array_agg(DISTINCT child.name) FILTER (WHERE child.name IS NOT NULL), '{}') AS subcategories
    FROM categories parent
    LEFT JOIN categories child ON child.parent_id = parent.id
    LEFT JOIN products p ON p.category_id = child.id AND p.is_active = TRUE
    WHERE parent.parent_id IS NULL GROUP BY parent.id ORDER BY parent.sort_order, parent.name
  `);
  res.json({ success: true, categories: rows.map(({ name, slug, description, count, subcategories }) => ({ name, slug, description, count, subcategories })) });
}));

app.get('/api/storefront/content/:key', route(async (req, res) => {
  const { rows } = await query('SELECT content FROM storefront_content WHERE content_key = $1', [req.params.key]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Store content was not found.' });
  res.json({ success: true, content: withoutImages(rows[0].content) });
}));

app.post('/api/checkout/create-payment-intent', checkoutLimiter, optionalAuth, validate({ body: checkoutBody }), route(async (req, res) => {
  const { customer, items, promoCode } = req.validated.body;
  const orderedItems = sortCheckoutItems(items);
  const stripe = getStripe();
  const createPendingOrder = async () => {
    const orderRef = createOrderReference();
    return inTransaction(async (client) => {
      const variantsById = new Map();
      for (const item of orderedItems) {
        const productResult = await client.query(
          `SELECT id, title, primary_image, is_active FROM products
           WHERE external_id = $1 OR id::text = $1 LIMIT 1 FOR UPDATE`,
          [String(item.productId)]
        );
        if (!productResult.rowCount || !productResult.rows[0].is_active) {
          throw Object.assign(new Error('A product in your bag is unavailable.'), { status: 409 });
        }
        const product = productResult.rows[0];
        const variantResult = item.variantId == null
          ? await client.query(
              `SELECT id, title, size, color, stock, is_available, price
               FROM variants WHERE product_id=$1 AND COALESCE(size,'')=$2 AND COALESCE(color,'')=$3
               FOR UPDATE`,
              [product.id, item.size || '', item.color || '']
            )
          : await client.query(
              `SELECT id, title, size, color, stock, is_available, price
               FROM variants WHERE product_id=$1 AND (external_id=$2 OR id::text=$2) FOR UPDATE`,
              [product.id, String(item.variantId)]
            );
        if (!variantResult.rowCount) {
          throw Object.assign(new Error('A selected product option is no longer available.'), { status: 409 });
        }
        const variant = variantResult.rows[0];
        if (!variant.is_available) {
          throw Object.assign(new Error(`${product.title} is no longer available.`), { status: 409 });
        }
        const key = String(variant.id);
        const existing = variantsById.get(key);
        if (existing) existing.quantity += item.quantity;
        else variantsById.set(key, {
          product, variant, quantity: item.quantity, unitPrice: Number(variant.price)
        });
      }

      const resolvedItems = [...variantsById.values()];
      for (const item of resolvedItems) {
        if (item.variant.stock < item.quantity) {
          throw Object.assign(new Error(`${item.product.title} does not have enough stock for that quantity.`), { status: 409 });
        }
      }
      const subtotal = money(resolvedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
      let coupon = null;
      let discount = 0;
      if (promoCode) {
        const couponResult = await client.query(
          `SELECT id, code, discount_type, discount_value, minimum_order,
                  max_redemptions, redemption_count
           FROM coupons
           WHERE UPPER(code)=UPPER($1) AND is_active=TRUE
             AND (starts_at IS NULL OR starts_at <= NOW())
             AND (expires_at IS NULL OR expires_at > NOW())
           FOR UPDATE`,
          [promoCode]
        );
        coupon = couponResult.rows[0];
        if (!coupon) {
          throw Object.assign(new Error('This promo code is invalid or expired.'), { status: 400 });
        }
        const pending = await client.query(
          `SELECT COUNT(*)::int AS count FROM orders
           WHERE coupon_id=$1 AND payment_status='Pending'
             AND created_at > NOW() - INTERVAL '30 minutes'`,
          [coupon.id]
        );
        if (!hasCouponUsageAvailable(coupon, pending.rows[0].count)) {
          throw Object.assign(new Error('This promo code has reached its redemption limit.'), { status: 400 });
        }
        discount = money(calculateCouponDiscount(subtotal, coupon));
      }
      const shipping = subtotal >= 40 ? 0 : 3.99;
      const total = money(Math.max(0, subtotal - discount + shipping));
      const inserted = await client.query(
        `INSERT INTO orders
          (order_ref,user_id,coupon_id,customer_name,customer_email,customer_phone,shipping_address,shipping_city,
           shipping_postcode,subtotal,shipping,discount,total,payment_method,payment_status,order_status,courier)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'Stripe','Pending','Awaiting Payment','Royal Mail Tracked 48')
         RETURNING id`,
        [orderRef, req.user?.id || null, coupon?.id || null, customer.name, customer.email, customer.phone,
          customer.address, customer.city, customer.postcode, subtotal, shipping, discount, total]
      );
      const orderId = inserted.rows[0].id;
      const productIds = new Set();
      for (const { product, variant, quantity, unitPrice } of resolvedItems) {
        await client.query('UPDATE variants SET stock=stock-$2 WHERE id=$1', [variant.id, quantity]);
        productIds.add(String(product.id));
        await client.query(
          `INSERT INTO order_items
            (order_id,product_id,variant_id,product_title,variant_title,size,color,image_url,unit_price,quantity,line_total)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [orderId, product.id, variant.id, product.title, variant.title || '',
            variant.size || '', variant.color || '', product.primary_image || '',
            unitPrice, quantity, money(unitPrice * quantity)]
        );
      }
      for (const productId of productIds) await syncProductStock(client, productId);
      return { id: orderId, orderRef, total };
    });
  };

  let pendingOrder;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      pendingOrder = await createPendingOrder();
      break;
    } catch (error) {
      if (error.code !== '23505' || error.constraint !== 'orders_order_ref_key' || attempt === 2) throw error;
    }
  }

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(pendingOrder.total * 100),
      currency: 'gbp',
      automatic_payment_methods: { enabled: true },
      receipt_email: customer.email,
      metadata: { order_ref: pendingOrder.orderRef }
    }, { idempotencyKey: pendingOrder.orderRef });
    await query('UPDATE orders SET stripe_payment_intent_id=$2 WHERE id=$1', [pendingOrder.id, paymentIntent.id]);
  } catch (error) {
    if (paymentIntent) {
      try {
        await stripe.paymentIntents.cancel(paymentIntent.id);
      } catch (cancelError) {
        console.error('Unable to cancel an unreturned Stripe payment intent.');
        throw error;
      }
    }
    await inTransaction(async (client) => {
      await client.query(
        `UPDATE orders SET payment_status='Failed', order_status='Cancelled' WHERE id=$1 AND payment_status='Pending'`,
        [pendingOrder.id]
      );
      await restoreOrderReservation(client, pendingOrder.id);
    });
    throw error;
  }

  return res.status(201).json({
    success: true,
    clientSecret: paymentIntent.client_secret,
    orderId: pendingOrder.orderRef,
    total: pendingOrder.total
  });
}));

app.get('/api/orders/:orderId', trackLimiter, optionalAuth,
  validate({ params: orderIdParams, query: trackingQuery }), route(async (req, res) => {
    const { orderId } = req.validated.params;
    const { rows } = await query(
      'SELECT id, user_id, customer_email FROM orders WHERE LOWER(order_ref)=LOWER($1)',
      [orderId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Order not found.' });
    const orderRecord = rows[0];
    const isOwner = req.user && String(req.user.id) === String(orderRecord.user_id);
    const hasMatchingEmail = req.validated.query.email
      && orderRecord.customer_email.toLowerCase() === req.validated.query.email;
    if (!isOwner && !hasMatchingEmail) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    return res.json({ success: true, order: await getOrder(orderId) });
  }));

app.post('/api/contact', contactLimiter, validate({ body: contactBody }), route(async (req, res) => {
  const { name, email, orderRef, subject, message } = req.validated.body;
  const id = `INQ-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  const { rows } = await query(
    `INSERT INTO inquiries (public_id,type,name,email,order_ref,subject,message,status)
     VALUES ($1,'contact',$2,LOWER($3),$4,$5,$6,'Pending') RETURNING *`,
    [id, name, email, orderRef || null, subject || 'General Inquiry', message]
  );
  res.status(201).json({ success: true, message: 'Inquiry received. We will respond within 24 hours.', inquiry: {
    id, type: 'contact', name: rows[0].name, email: rows[0].email, orderRef: rows[0].order_ref,
    subject: rows[0].subject, message: rows[0].message, status: rows[0].status, createdAt: rows[0].created_at
  } });
}));

app.post('/api/customization', customizationLimiter, validate({ body: customizationBody }), route(async (req, res) => {
  const { name, email, phone, garmentType, details } = req.validated.body;
  const id = `TAILOR-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  await query(
    `INSERT INTO inquiries (public_id,type,name,email,phone,garment_type,details,status)
     VALUES ($1,'customization',$2,LOWER($3),$4,$5,$6,'Pending Review')`,
    [id, name, email, phone || '', garmentType || 'Suit Alteration', details]
  );
  res.status(201).json({ success: true, message: 'Tailoring request received. Our coordinator will contact you.',
    request: { id, type: 'customization', name, email, phone: phone || '', garmentType: garmentType || 'Suit Alteration', details, status: 'Pending Review', createdAt: new Date().toISOString() } });
}));

app.post('/api/newsletter', newsletterLimiter, validate({ body: newsletterBody }), route(async (req, res) => {
  const { email } = req.validated.body;
  const result = await query(
    `INSERT INTO subscribers (email,coupon_id,coupon_code)
     VALUES ($1,(SELECT id FROM coupons WHERE code='WELCOME10'),'WELCOME10')
     ON CONFLICT (email) DO NOTHING RETURNING id`,
    [email]
  );
  const created = result.rowCount > 0;
  if (!created) await query('UPDATE subscribers SET is_active=TRUE WHERE email=$1', [email]);
  res.status(created ? 201 : 200).json({
    success: true,
    message: created ? 'Subscribed successfully! Use code WELCOME10 for 10% off your first order.' : 'Welcome back! Your coupon code is WELCOME10 for 10% off.',
    couponCode: 'WELCOME10'
  });
}));

function safeUser(row, address) {
  return {
    id: row.public_id || `USR-${row.id}`,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    joinedAt: row.created_at,
    address: address ? { street: address.street, city: address.city, postalCode: address.postal_code, country: address.country } : null
  };
}

async function userWithAddress(email) {
  return query(
    `SELECT u.*, a.street, a.city, a.postal_code, a.country
     FROM users u LEFT JOIN LATERAL
       (SELECT * FROM addresses WHERE user_id = u.id ORDER BY is_default DESC, id LIMIT 1) a ON TRUE
     WHERE LOWER(u.email) = LOWER($1)`,
    [email]
  );
}

async function userWithAddressById(userId) {
  return query(
    `SELECT u.*, a.street, a.city, a.postal_code, a.country
     FROM users u LEFT JOIN LATERAL
       (SELECT * FROM addresses WHERE user_id = u.id ORDER BY is_default DESC, id LIMIT 1) a ON TRUE
     WHERE u.id = $1`,
    [userId]
  );
}

app.post('/api/auth/register', registerLimiter, validate({ body: registerBody }), route(async (req, res) => {
  const { name, email: normalizedEmail, password, phone, newsletter } = req.validated.body;
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const result = await inTransaction(async (client) => {
      const inserted = await client.query(
        `INSERT INTO users (public_id,name,email,password_hash,phone)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [`USR-${crypto.randomBytes(6).toString('hex').toUpperCase()}`, name, normalizedEmail, passwordHash, phone || '']
      );
      const user = inserted.rows[0];
      await client.query(
        `INSERT INTO addresses (user_id,street,city,postal_code,country,is_default)
         VALUES ($1,'','London','','United Kingdom',TRUE)`, [user.id]
      );
      if (newsletter) {
        await client.query(
          `INSERT INTO subscribers (email,coupon_id,coupon_code)
           VALUES ($1,(SELECT id FROM coupons WHERE code='WELCOME10'),'WELCOME10')
           ON CONFLICT (email) DO NOTHING`, [normalizedEmail]
        );
      }
      return user;
    });
    const { rows } = await userWithAddress(result.email);
    setAuthCookie(res, result);
    res.status(201).json({ success: true, message: 'Welcome to Sasta Bazaar! Your account has been created.',
      user: safeUser(rows[0], rows[0].street == null ? null : rows[0]), couponCode: 'WELCOME10' });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ success: false, message: 'An account with this email address already exists. Please log in.' });
    throw error;
  }
}));

app.post('/api/auth/login', loginLimiter, validate({ body: loginBody }), route(async (req, res) => {
  const { email, password } = req.validated.body;
  const { rows } = await userWithAddress(email);
  if (!(await verifyPassword(password, rows[0]?.password_hash))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }
  setAuthCookie(res, rows[0]);
  res.json({ success: true, message: 'Signed in successfully!', user: safeUser(rows[0], rows[0].street == null ? null : rows[0]) });
}));

app.post('/api/auth/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Signed out successfully.' });
});

app.get('/api/auth/me', requireAuth, route(async (req, res) => {
  const { rows } = await userWithAddressById(req.user.id);
  if (!rows.length) return res.status(401).json({ success: false, message: 'Authentication is required.' });
  return res.json({ success: true, user: safeUser(rows[0], rows[0].street == null ? null : rows[0]) });
}));

app.get('/api/auth/profile', requireAuth, route(async (req, res) => {
  const { rows } = await userWithAddressById(req.user.id);
  if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });
  return res.json({ success: true, user: safeUser(rows[0], rows[0].street == null ? null : rows[0]) });
}));

app.put('/api/auth/profile', requireAuth, validate({ body: profileBody }), route(async (req, res) => {
  const { name, phone, address } = req.validated.body;
  const updated = await inTransaction(async (client) => {
    const user = await client.query(
      `UPDATE users SET name=COALESCE($2,name), phone=COALESCE($3,phone), updated_at=NOW()
       WHERE id=$1 RETURNING *`, [req.user.id, name ?? null, phone ?? null]
    );
    if (!user.rowCount) return null;
    if (address) {
      await client.query(
        `UPDATE addresses SET street=COALESCE($2,street), city=COALESCE($3,city),
           postal_code=COALESCE($4,postal_code), country=COALESCE($5,country)
         WHERE user_id=$1 AND is_default=TRUE`,
        [user.rows[0].id, address.street ?? null, address.city ?? null, address.postalCode ?? null, address.country ?? null]
      );
    }
    return user.rows[0];
  });
  if (!updated) return res.status(404).json({ success: false, message: 'User not found' });
  const { rows } = await userWithAddressById(updated.id);
  res.json({ success: true, message: 'Profile updated successfully', user: safeUser(rows[0], rows[0]) });
}));

app.get('/api/auth/orders', requireAuth, route(async (req, res) => {
  return res.json({ success: true, orders: await getOrders('WHERE user_id=$1', [req.user.id]) });
}));

app.get('/api/cron/release-stale-orders', requireCronSecret, route(async (_req, res) => {
  const summary = await releaseStaleOrders();
  return res.json({ success: true, ...summary });
}));

app.use('/api/admin', requireAdmin);

app.get('/api/admin/stats', route(async (_req, res) => {
  const { rows } = await query(`
    SELECT (SELECT COUNT(*) FROM products WHERE is_active=TRUE)::int AS total_products,
      COUNT(*)::int AS total_orders,
      COALESCE(SUM(total - refunded_amount) FILTER (WHERE payment_status='Paid'),0)::numeric AS total_sales,
      COUNT(*) FILTER (WHERE order_status='Processing')::int AS pending_orders,
      (SELECT COUNT(*) FROM subscribers WHERE is_active=TRUE)::int AS total_subscribers,
      (SELECT COUNT(*) FROM inquiries)::int AS total_inquiries
    FROM orders
  `);
  const row = rows[0];
  res.json({ success: true, stats: {
    totalProducts: row.total_products, totalOrders: row.total_orders, totalSales: money(row.total_sales),
    currency: '£', pendingOrders: row.pending_orders, totalSubscribers: row.total_subscribers, totalInquiries: row.total_inquiries
  } });
}));

app.get('/api/admin/orders', validate({ query: pageQuery }), route(async (req, res) => {
  const { page, limit } = req.validated.query;
  const count = await query('SELECT COUNT(*)::int AS total FROM orders');
  const total = count.rows[0].total;
  const orders = await getOrders('', [], { page, limit });
  res.json({ success: true, orders, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}));

app.patch('/api/admin/orders/:orderId', validate({ params: orderIdParams, body: orderStatusBody }), route(async (req, res) => {
  const { orderStatus, trackingNumber, courier } = req.validated.body;
  const result = await query(
    `UPDATE orders SET order_status=COALESCE($2,order_status), tracking_number=COALESCE($3,tracking_number),
       courier=COALESCE($4,courier) WHERE LOWER(order_ref)=LOWER($1)`,
    [req.validated.params.orderId, orderStatus || null, trackingNumber || null, courier || null]
  );
  if (!result.rowCount) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, message: 'Order status updated', order: await getOrder(req.validated.params.orderId) });
}));

app.post('/api/admin/products', validate({ body: productCreateBody }), route(async (req, res) => {
  const productId = await inTransaction((client) => createProduct(client, req.validated.body));
  const product = (await getProducts('AND p.id=$1', [productId]))[0];
  res.status(201).json({ success: true, message: 'Product added successfully', product });
}));

app.put('/api/admin/products/:id', validate({ params: productIdParams, body: productUpdateBody }), route(async (req, res) => {
  const productResult = await query(
    'SELECT id FROM products WHERE external_id=$1 OR id::text=$1 LIMIT 1', [req.validated.params.id]
  );
  if (!productResult.rowCount) return res.status(404).json({ success: false, message: 'Product not found' });
  const productId = productResult.rows[0].id;
  const fields = req.validated.body;
  await inTransaction(async (client) => {
    const locked = await client.query('SELECT id FROM products WHERE id=$1 FOR UPDATE', [productId]);
    if (!locked.rowCount) throw Object.assign(new Error('Product not found'), { status: 404 });
    const runQuery = (text, values) => client.query(text, values);
    const existing = (await getProducts('AND p.id=$1', [productId], '', null, runQuery))[0];
    if (!existing) throw Object.assign(new Error('Product not found'), { status: 404 });
    const updated = {
      title: fields.title ?? existing.title,
      description: fields.description ?? existing.description,
      price: fields.price ?? existing.price,
      compareAtPrice: fields.compareAtPrice === undefined ? existing.compareAtPrice : fields.compareAtPrice,
      stock: fields.stock ?? existing.stock,
      category: fields.category ?? existing.category,
      subcategory: fields.subcategory ?? existing.subcategory,
      images: fields.images ?? existing.images,
      sizes: fields.sizes ?? existing.sizes,
      colors: fields.colors ?? existing.colors,
      isBestSeller: fields.isBestSeller ?? existing.isBestSeller,
      isNewArrival: fields.isNewArrival ?? existing.isNewArrival,
      isActive: fields.isActive ?? existing.isActive
    };
    const price = Number(updated.price);
    const compareAtPrice = updated.compareAtPrice == null ? null : Number(updated.compareAtPrice);
    const discount = compareAtPrice > price ? Math.round((compareAtPrice - price) / compareAtPrice * 100) : 0;
    const categoryName = updated.category || existing.category;
    const category = await client.query(
      `INSERT INTO categories (name,slug) VALUES ($1,$2)
       ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
      [categoryName, slugify(categoryName)]
    );
    const categoryId = (await client.query(
      `INSERT INTO categories (parent_id,name,slug) VALUES ($1,$2,$3)
       ON CONFLICT (slug) DO UPDATE SET parent_id=EXCLUDED.parent_id,name=EXCLUDED.name RETURNING id`,
      [category.rows[0].id, updated.subcategory || 'Uncategorized',
        `${slugify(categoryName)}-${slugify(updated.subcategory || 'Uncategorized')}`]
    )).rows[0].id;
    await client.query(
      `UPDATE products SET title=$2,raw_title=$3,description=$4,price=$5,stock=$6,compare_at_price=$7,
        discount_percent=$8,images=$9,sizes=$10,colors=$11,primary_image=$12,hover_image=$13,is_best_seller=$14,
        is_new_arrival=$15,category_id=$16,subcategory=$17,is_active=$18,updated_at=NOW()
       WHERE id=$1`,
      [productId, updated.title, updated.title, updated.description || '',
        price, Number(updated.stock) || 0, compareAtPrice, discount, updated.images || [], updated.sizes || [], updated.colors || [],
        updated.images?.[0] || '', updated.images?.[1] || updated.images?.[0] || '', Boolean(updated.isBestSeller),
        Boolean(updated.isNewArrival), categoryId, updated.subcategory || '', Boolean(updated.isActive)]
    );
    if (!Array.isArray(fields.variants)) {
      await client.query('UPDATE variants SET price=$2,compare_at_price=$3 WHERE product_id=$1', [productId, price, compareAtPrice]);
      if (fields.stock !== undefined) {
        const variants = await client.query('SELECT id FROM variants WHERE product_id=$1 ORDER BY id FOR UPDATE', [productId]);
        if (!variants.rowCount) throw Object.assign(new Error('Cannot set stock for a product without variants.'), { status: 409 });
        assertTopLevelStockAllowed(fields.stock, variants.rowCount);
        await client.query('UPDATE variants SET stock=$2 WHERE id=$1', [variants.rows[0].id, updated.stock]);
      }
    }
    if (Array.isArray(fields.variants)) {
      assertTopLevelStockAllowed(fields.stock, fields.variants.length);
      await replaceProductVariants(client, productId, fields.variants, {
        price, compareAtPrice, defaultStock: fields.stock
      });
    }
    await syncProductStock(client, productId);
  });
  const product = (await getProducts('AND p.id=$1', [productId]))[0];
  res.json({ success: true, message: 'Product updated successfully', product });
}));

app.post('/api/admin/orders/:orderId/refund',
  validate({ params: orderIdParams, body: refundBody }), route(async (req, res) => {
  const result = await issueOrderRefund(req.validated.params.orderId, req.validated.body);
  if (result.error) {
    return res.status(result.error.status).json({ success: false, message: result.error.message });
  }
  return res.json({
    success: true,
    message: result.duplicate
      ? 'This refund was already processed.'
      : result.fullyRefunded ? 'Full refund initiated successfully.' : 'Partial refund initiated successfully.',
    refundId: result.refundId,
    amount: result.amount,
    fullyRefunded: result.fullyRefunded
  });
}));

app.delete('/api/admin/products/:id', route(async (req, res) => {
  const result = await query(
    'UPDATE products SET is_active=FALSE,updated_at=NOW() WHERE (external_id=$1 OR id::text=$1) AND is_active=TRUE',
    [req.params.id]
  );
  if (!result.rowCount) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, message: 'Product deleted successfully' });
}));

app.get('/api/admin/inquiries', validate({ query: pageQuery }), route(async (req, res) => {
  const { page, limit } = req.validated.query;
  const count = await query('SELECT COUNT(*)::int AS total FROM inquiries');
  const total = count.rows[0].total;
  const { rows } = await query(
    'SELECT * FROM inquiries ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, (page - 1) * limit]
  );
  res.json({ success: true, inquiries: rows.map((row) => ({
    id: row.public_id, type: row.type, name: row.name, email: row.email, phone: row.phone,
    orderRef: row.order_ref, subject: row.subject, message: row.message, garmentType: row.garment_type,
    details: row.details, status: row.status, createdAt: row.created_at
  }  )), total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}));

app.get('/api/admin/subscribers', validate({ query: pageQuery }), route(async (req, res) => {
  const { page, limit } = req.validated.query;
  const count = await query('SELECT COUNT(*)::int AS total FROM subscribers WHERE is_active=TRUE');
  const total = count.rows[0].total;
  const { rows } = await query(
    `SELECT id,email,coupon_code AS "couponCode",created_at AS "createdAt"
     FROM subscribers WHERE is_active=TRUE ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, (page - 1) * limit]
  );
  res.json({ success: true, subscribers: rows, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}));

app.use((error, _req, res, _next) => {
  console.error('API request failed:', error);
  const status = error.status || 500;
  const message = status < 500
    ? error.message
    : process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message;
  res.status(status).json({ success: false, message });
});

export default app;

const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  pool.query('SELECT 1').then(() => {
    app.listen(PORT, () => console.log(`Sasta Bazaar API listening on http://localhost:${PORT}`));
  }).catch((error) => {
    console.error('Unable to connect to PostgreSQL:', error);
    process.exitCode = 1;
  });
}
