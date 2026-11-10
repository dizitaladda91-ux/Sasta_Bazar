import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { inTransaction, pool, query } from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;
const route = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

app.use(cors());
app.use(express.json());

const toPublicId = (value) => /^\d+$/.test(String(value)) ? Number(value) : value;
const money = (value) => Math.round(Number(value) * 100) / 100;
const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

async function getProducts(where = '', values = [], orderBy = '') {
  const { rows } = await query(
    `SELECT p.*, c.name AS subcategory_name,
            COALESCE(parent.name, c.name) AS category_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN categories parent ON parent.id = c.parent_id
     WHERE p.is_active = TRUE ${where} ${orderBy}`,
    values
  );
  if (!rows.length) return [];
  const variants = await query(
    `SELECT v.*, p.id AS product_id FROM variants v
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
      available: variant.is_available,
      image: variant.image_url || undefined
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
      available: productVariants.some((variant) => variant.available),
      images: row.images,
      primaryImage: row.primary_image,
      hoverImage: row.hover_image,
      isImagePlaceholder: row.is_image_placeholder,
      description: row.description,
      sizes: row.sizes.length ? row.sizes : productVariants.map((variant) => variant.size).filter(Boolean),
      colors: row.colors.length ? row.colors : productVariants.map((variant) => variant.color).filter(Boolean),
      vendor: row.vendor,
      isBestSeller: row.is_best_seller,
      isNewArrival: row.is_new_arrival,
      variants: productVariants
    };
  });
}

async function getOrder(orderId) {
  const result = await query('SELECT * FROM orders WHERE LOWER(order_ref) = LOWER($1)', [orderId]);
  if (!result.rowCount) return null;
  const row = result.rows[0];
  const itemRows = await query(
    `SELECT item.*, variant.external_id AS variant_external_id, product.external_id AS product_external_id
     FROM order_items item
     LEFT JOIN variants variant ON variant.id = item.variant_id
     LEFT JOIN products product ON product.id = item.product_id
     WHERE item.order_id = $1 ORDER BY item.id`,
    [row.id]
  );
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
    items: itemRows.rows.map((item) => ({
      id: toPublicId(item.variant_external_id || item.product_external_id || item.variant_id || item.product_id),
      title: item.product_title,
      variantTitle: item.variant_title,
      size: item.size,
      color: item.color,
      price: Number(item.unit_price),
      quantity: item.quantity,
      image: item.image_url
    })),
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    discount: Number(row.discount),
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

async function getOrders(where = '', values = []) {
  const { rows } = await query(`SELECT order_ref FROM orders ${where} ORDER BY created_at DESC`, values);
  return Promise.all(rows.map(({ order_ref }) => getOrder(order_ref)));
}

async function createProduct(client, input) {
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

  const price = Number(input.price);
  const compareAtPrice = input.compareAtPrice ? Number(input.compareAtPrice) : null;
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
      (category_id, handle, title, raw_title, subcategory, collection_slug, description, price,
       compare_at_price, discount_percent, images, sizes, colors, primary_image, hover_image, is_new_arrival)
     VALUES ($1,$2,$3,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,TRUE) RETURNING id`,
    [categoryId, handle, input.title, subcategory, parentSlug, input.description || '',
      price, compareAtPrice, discount, images, sizes, colors, images[0], images[1] || images[0]]
  );
  const productId = result.rows[0].id;
  const incomingVariants = Array.isArray(input.variants) && input.variants.length
    ? input.variants
    : sizes.length && colors.length
      ? sizes.flatMap((size) => colors.map((color) => ({ title: `${size} / ${color}`, size, color, price, compareAtPrice })))
      : sizes.length
        ? sizes.map((size) => ({ title: size, size, price, compareAtPrice }))
        : colors.map((color) => ({ title: color, color, price, compareAtPrice }));
  for (const variant of incomingVariants) {
    await client.query(
      `INSERT INTO variants (product_id, title, size, color, stock, price, compare_at_price, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [productId, variant.title || variant.size || variant.color || '', variant.size || null,
        variant.color || null, Number(variant.stock) || 0, Number(variant.price ?? price),
        variant.compareAtPrice ? Number(variant.compareAtPrice) : compareAtPrice, variant.image || null]
    );
  }
  return productId;
}

app.get('/api/products', route(async (req, res) => {
  const values = [];
  const filters = [];
  const addFilter = (sql, value) => {
    values.push(value);
    filters.push(sql.replace(/\?/g, `$${values.length}`));
  };
  const { category, subcategory, search, filter, sort, limit } = req.query;
  if (search) addFilter(`(p.title ILIKE '%' || ? || '%' OR p.handle ILIKE '%' || ? || '%' OR c.name ILIKE '%' || ? || '%')`, search);
  if (category && category !== 'All') addFilter(`(c.name = ? OR parent.name = ?)`, category);
  if (subcategory) addFilter(`c.name = ?`, subcategory);
  if (filter === 'sale') filters.push('p.discount_percent > 0');
  if (filter === 'new') filters.push('p.is_new_arrival = TRUE');
  if (filter === 'best-seller') filters.push('p.is_best_seller = TRUE');
  let orderBy = {
    'price-low': 'ORDER BY p.price ASC',
    'price-high': 'ORDER BY p.price DESC',
    discount: 'ORDER BY p.discount_percent DESC',
    newest: 'ORDER BY p.is_new_arrival DESC, p.created_at DESC'
  }[sort] || 'ORDER BY p.created_at DESC';
  if (limit && Number.isInteger(Number(limit)) && Number(limit) > 0) {
    values.push(Math.min(Number(limit), 500));
    orderBy += ` LIMIT $${values.length}`;
  }
  const products = await getProducts(filters.length ? `AND ${filters.join(' AND ')}` : '', values, orderBy);
  res.json({ success: true, count: products.length, products });
}));

app.get('/api/products/:handle', route(async (req, res) => {
  const products = await getProducts('AND (p.handle = $1 OR p.external_id = $1)', [req.params.handle]);
  if (!products.length) return res.status(404).json({ success: false, message: `Product "${req.params.handle}" not found` });
  res.json({ success: true, product: products[0] });
}));

app.get('/api/categories', route(async (_req, res) => {
  const { rows } = await query(`
    SELECT parent.name, COUNT(DISTINCT p.id)::int AS count,
           COALESCE(array_agg(DISTINCT child.name) FILTER (WHERE child.name IS NOT NULL), '{}') AS subcategories
    FROM categories parent
    LEFT JOIN categories child ON child.parent_id = parent.id
    LEFT JOIN products p ON p.category_id = child.id AND p.is_active = TRUE
    WHERE parent.parent_id IS NULL GROUP BY parent.id ORDER BY parent.sort_order, parent.name
  `);
  res.json({ success: true, categories: rows.map(({ name, count, subcategories }) => ({ name, count, subcategories })) });
}));

app.post('/api/orders', route(async (req, res) => {
  const { customer, items, shippingMethod, promoCode, paymentMethod } = req.body;
  if (!customer?.name || !customer?.email || !customer?.address) {
    return res.status(400).json({ success: false, message: 'Missing required customer details (name, email, address)' });
  }
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ success: false, message: 'Cannot place an empty order' });
  const subtotal = money(items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0));
  const discount = promoCode?.toUpperCase() === 'WELCOME10' ? money(subtotal * 0.1) : 0;
  const shipping = subtotal >= 40 || shippingMethod === 'free' ? 0 : 3.99;
  const total = Math.max(0, money(subtotal - discount + shipping));
  const orderRef = `SB-${Math.floor(100000 + Math.random() * 900000)}`;
  await inTransaction(async (client) => {
    const user = await client.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [customer.email]);
    const inserted = await client.query(
      `INSERT INTO orders
        (order_ref,user_id,customer_name,customer_email,customer_phone,shipping_address,shipping_city,
         shipping_postcode,subtotal,shipping,discount,total,payment_method,payment_status,order_status,tracking_number,courier)
       VALUES ($1,$2,$3,LOWER($4),$5,$6,$7,$8,$9,$10,$11,$12,$13,'Paid','Processing',$14,'Royal Mail Tracked 48')
       RETURNING id`,
      [orderRef, user.rows[0]?.id || null, customer.name, customer.email, customer.phone || '',
        customer.address, customer.city || '', customer.postcode || '', subtotal, shipping, discount, total,
        paymentMethod || 'Online Card Payment', `RM${Math.floor(10000000 + Math.random() * 90000000)}GB`]
    );
    for (const item of items) {
      const product = await client.query(
        'SELECT id FROM products WHERE external_id = $1 OR id::text = $1 LIMIT 1',
        [String(item.productId ?? item.id ?? '')]
      );
      let variant = item.variantId == null
        ? { rows: [] }
        : await client.query(
          'SELECT id, product_id FROM variants WHERE external_id = $1 OR id::text = $1 LIMIT 1',
          [String(item.variantId)]
        );
      if (!variant.rowCount && product.rowCount && (item.size || item.color)) {
        variant = await client.query(
          `SELECT id,product_id FROM variants WHERE product_id=$1
           ORDER BY CASE
             WHEN ($2='' OR size=$2) AND ($3='' OR color=$3) THEN 0
             WHEN $3<>'' AND color=$3 THEN 1
             WHEN $2<>'' AND size=$2 THEN 2
             ELSE 3 END
           LIMIT 1`,
          [product.rows[0].id, item.size || '', item.color || '']
        );
        if (variant.rowCount) {
          const variantMatches = await client.query(
            `SELECT id FROM variants WHERE id=$1 AND
              (($2='' OR size=$2 OR color=$3) OR ($3<>'' AND color=$3))`,
            [variant.rows[0].id, item.size || '', item.color || '']
          );
          if (!variantMatches.rowCount) variant = { rows: [] };
        }
      }
      const productId = variant.rows[0]?.product_id || product.rows[0]?.id || null;
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const unitPrice = Number(item.price) || 0;
      await client.query(
        `INSERT INTO order_items
          (order_id,product_id,variant_id,product_title,variant_title,size,color,image_url,unit_price,quantity,line_total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [inserted.rows[0].id, productId, variant.rows[0]?.id || null,
          item.title || '', item.variantTitle || item.size || item.color || '', item.size || '',
          item.color || '', item.image || '', unitPrice, quantity, money(unitPrice * quantity)]
      );
    }
  });
  const order = await getOrder(orderRef);
  res.status(201).json({ success: true, message: 'Order created successfully', order });
}));

app.get('/api/orders/:orderId', route(async (req, res) => {
  const order = await getOrder(req.params.orderId);
  if (!order) return res.status(404).json({ success: false, message: `Order reference "${req.params.orderId}" not found` });
  res.json({ success: true, order });
}));

app.post('/api/contact', route(async (req, res) => {
  const { name, email, orderRef, subject, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
  const id = `INQ-${Date.now()}`;
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

app.post('/api/customization', route(async (req, res) => {
  const { name, email, phone, garmentType, details } = req.body;
  if (!name || !email || !details) return res.status(400).json({ success: false, message: 'Name, email, and tailoring details are required' });
  const id = `TAILOR-${Date.now()}`;
  await query(
    `INSERT INTO inquiries (public_id,type,name,email,phone,garment_type,details,status)
     VALUES ($1,'customization',$2,LOWER($3),$4,$5,$6,'Pending Review')`,
    [id, name, email, phone || '', garmentType || 'Suit Alteration', details]
  );
  res.status(201).json({ success: true, message: 'Tailoring request received. Our coordinator will contact you.',
    request: { id, type: 'customization', name, email, phone: phone || '', garmentType: garmentType || 'Suit Alteration', details, status: 'Pending Review', createdAt: new Date().toISOString() } });
}));

app.post('/api/newsletter', route(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!email.includes('@')) return res.status(400).json({ success: false, message: 'Valid email address is required' });
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

app.post('/api/auth/register', route(async (req, res) => {
  const { name, email, password, phone, newsletter } = req.body;
  if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required' });
  const normalizedEmail = email.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const result = await inTransaction(async (client) => {
      const inserted = await client.query(
        `INSERT INTO users (public_id,name,email,password_hash,phone)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [`USR-${Date.now().toString().slice(-6)}`, name.trim(), normalizedEmail, passwordHash, phone?.trim() || '']
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
    res.status(201).json({ success: true, message: 'Welcome to Sasta Bazaar! Your account has been created.',
      user: safeUser(rows[0], rows[0].street == null ? null : rows[0]), couponCode: 'WELCOME10' });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ success: false, message: 'An account with this email address already exists. Please log in.' });
    throw error;
  }
}));

app.post('/api/auth/login', route(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });
  const { rows } = await userWithAddress(email.toLowerCase().trim());
  if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password. Please check your credentials.' });
  }
  res.json({ success: true, message: 'Signed in successfully!', user: safeUser(rows[0], rows[0].street == null ? null : rows[0]) });
}));

app.get('/api/auth/profile', route(async (req, res) => {
  if (!req.query.email) return res.status(400).json({ success: false, message: 'Email query parameter required' });
  const { rows } = await userWithAddress(String(req.query.email).toLowerCase().trim());
  if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user: safeUser(rows[0], rows[0].street == null ? null : rows[0]) });
}));

app.put('/api/auth/profile', route(async (req, res) => {
  const { email, name, phone, address } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'User email is required' });
  const updated = await inTransaction(async (client) => {
    const user = await client.query(
      `UPDATE users SET name=COALESCE($2,name), phone=COALESCE($3,phone), updated_at=NOW()
       WHERE LOWER(email)=LOWER($1) RETURNING *`, [email.trim(), name?.trim() ?? null, phone?.trim() ?? null]
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
  const { rows } = await userWithAddress(updated.email);
  res.json({ success: true, message: 'Profile updated successfully', user: safeUser(rows[0], rows[0]) });
}));

app.get('/api/auth/orders', route(async (req, res) => {
  if (!req.query.email) return res.status(400).json({ success: false, message: 'Email is required' });
  res.json({ success: true, orders: await getOrders('WHERE LOWER(customer_email)=LOWER($1)', [String(req.query.email).trim()]) });
}));

app.get('/api/admin/stats', route(async (_req, res) => {
  const { rows } = await query(`
    SELECT (SELECT COUNT(*) FROM products WHERE is_active=TRUE)::int AS total_products,
      COUNT(*)::int AS total_orders, COALESCE(SUM(total),0)::numeric AS total_sales,
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

app.get('/api/admin/orders', route(async (_req, res) => res.json({ success: true, orders: await getOrders() })));

app.patch('/api/admin/orders/:orderId', route(async (req, res) => {
  const { orderStatus, trackingNumber, courier } = req.body;
  const result = await query(
    `UPDATE orders SET order_status=COALESCE($2,order_status), tracking_number=COALESCE($3,tracking_number),
       courier=COALESCE($4,courier) WHERE LOWER(order_ref)=LOWER($1)`,
    [req.params.orderId, orderStatus || null, trackingNumber || null, courier || null]
  );
  if (!result.rowCount) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, message: 'Order status updated', order: await getOrder(req.params.orderId) });
}));

app.post('/api/admin/products', route(async (req, res) => {
  const { title, price } = req.body;
  if (!title || !price || !Number.isFinite(Number(price))) return res.status(400).json({ success: false, message: 'Title and price are required' });
  const productId = await inTransaction((client) => createProduct(client, req.body));
  const product = (await getProducts('AND p.id=$1', [productId]))[0];
  res.status(201).json({ success: true, message: 'Product added successfully', product });
}));

app.put('/api/admin/products/:id', route(async (req, res) => {
  const productResult = await query(
    'SELECT id FROM products WHERE external_id=$1 OR id::text=$1 LIMIT 1', [req.params.id]
  );
  if (!productResult.rowCount) return res.status(404).json({ success: false, message: 'Product not found' });
  const productId = productResult.rows[0].id;
  const existing = (await getProducts('AND p.id=$1', [productId]))[0];
  if (!existing) return res.status(404).json({ success: false, message: 'Product not found' });
  const updated = { ...existing, ...req.body };
  await inTransaction(async (client) => {
    const price = Number(updated.price);
    const compareAtPrice = updated.compareAtPrice ? Number(updated.compareAtPrice) : null;
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
      `UPDATE products SET title=$2,raw_title=$3,description=$4,price=$5,compare_at_price=$6,
        discount_percent=$7,images=$8,sizes=$9,colors=$10,primary_image=$11,hover_image=$12,is_best_seller=$13,
        is_new_arrival=$14,category_id=$15,subcategory=$16,updated_at=NOW()
       WHERE id=$1`,
      [productId, updated.title, updated.rawTitle || updated.title, updated.description || '',
        price, compareAtPrice, discount, updated.images || [], updated.sizes || [], updated.colors || [],
        updated.primaryImage || '', updated.hoverImage || '', Boolean(updated.isBestSeller),
        Boolean(updated.isNewArrival), categoryId, updated.subcategory || '']
    );
    if (Array.isArray(req.body.variants)) {
      await client.query('DELETE FROM variants WHERE product_id=$1', [productId]);
      for (const variant of req.body.variants) {
        await client.query(
          `INSERT INTO variants (product_id,title,size,color,stock,is_available,price,compare_at_price,image_url)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [productId, variant.title || '', variant.size || null, variant.color || null, Number(variant.stock) || 0,
            variant.available !== false, Number(variant.price ?? price), variant.compareAtPrice || null, variant.image || null]
        );
      }
    }
  });
  const product = (await getProducts('AND p.id=$1', [productId]))[0];
  res.json({ success: true, message: 'Product updated successfully', product });
}));

app.delete('/api/admin/products/:id', route(async (req, res) => {
  const result = await query(
    'UPDATE products SET is_active=FALSE,updated_at=NOW() WHERE (external_id=$1 OR id::text=$1) AND is_active=TRUE',
    [req.params.id]
  );
  if (!result.rowCount) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, message: 'Product deleted successfully' });
}));

app.get('/api/admin/inquiries', route(async (_req, res) => {
  const { rows } = await query('SELECT * FROM inquiries ORDER BY created_at DESC');
  res.json({ success: true, inquiries: rows.map((row) => ({
    id: row.public_id, type: row.type, name: row.name, email: row.email, phone: row.phone,
    orderRef: row.order_ref, subject: row.subject, message: row.message, garmentType: row.garment_type,
    details: row.details, status: row.status, createdAt: row.created_at
  })) });
}));

app.get('/api/admin/subscribers', route(async (_req, res) => {
  const { rows } = await query('SELECT id,email,coupon_code AS "couponCode",created_at AS "createdAt" FROM subscribers WHERE is_active=TRUE ORDER BY created_at DESC');
  res.json({ success: true, subscribers: rows });
}));

app.use((error, _req, res, _next) => {
  console.error('API request failed:', error);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

pool.query('SELECT 1').then(() => {
  app.listen(PORT, () => console.log(`Sasta Bazaar API listening on http://localhost:${PORT}`));
}).catch((error) => {
  console.error('Unable to connect to PostgreSQL:', error);
  process.exitCode = 1;
});
