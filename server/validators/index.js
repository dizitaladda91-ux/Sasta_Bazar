import { z } from 'zod';

const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const boundedText = (max) => z.string().trim().max(max);
const optionalText = (max) => boundedText(max).optional();
const customerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email,
  phone: optionalText(40).default(''),
  address: z.string().trim().min(1).max(240),
  city: z.string().trim().min(1).max(100),
  postcode: z.string().trim().toUpperCase().regex(
    /^(GIR 0AA|(?:[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}))$/,
    'Enter a valid UK postcode.'
  )
}).strict();

const identifier = z.union([
  z.string().trim().min(1).max(100),
  z.number().int().positive()
]);

const productVariant = z.object({
  id: identifier.optional(),
  externalId: identifier.optional(),
  title: boundedText(160).optional(),
  size: boundedText(40).nullable().optional(),
  color: boundedText(60).nullable().optional(),
  stock: z.coerce.number().int().min(0).optional(),
  price: z.coerce.number().min(0).optional(),
  compareAtPrice: z.coerce.number().min(0).nullable().optional(),
  image: boundedText(2000).nullable().optional(),
  available: z.boolean().optional()
}).strict();

const productFields = {
  title: z.string().trim().min(1).max(200).optional(),
  description: boundedText(10000).optional(),
  price: z.coerce.number().min(0).optional(),
  compareAtPrice: z.coerce.number().min(0).nullable().optional(),
  stock: z.coerce.number().int().min(0).optional(),
  category: z.string().trim().min(1).max(120).optional(),
  subcategory: z.string().trim().min(1).max(120).optional(),
  images: z.array(boundedText(2000)).max(20).optional(),
  sizes: z.array(boundedText(40)).max(100).optional(),
  colors: z.array(boundedText(60)).max(100).optional(),
  variants: z.array(productVariant).min(1).max(500).optional(),
  isBestSeller: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isActive: z.boolean().optional()
};

export const registerBody = z.object({
  name: z.string().trim().min(2).max(80),
  email,
  password: z.string().min(8).max(128),
  phone: optionalText(40),
  newsletter: z.boolean().optional()
}).strict();

export const loginBody = z.object({
  email,
  password: z.string().min(1).max(128)
}).strict();

export const profileBody = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: optionalText(40),
  address: z.object({
    street: optionalText(240),
    city: optionalText(100),
    postalCode: optionalText(12),
    country: optionalText(80)
  }).strict().optional()
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one profile field is required.');

export const checkoutBody = z.object({
  customer: customerSchema,
  items: z.array(z.object({
    id: identifier.optional(),
    productId: identifier.optional(),
    variantId: identifier.optional(),
    size: optionalText(40),
    color: optionalText(60),
    quantity: z.number().int().min(1).max(20)
  }).strict()
    .refine((item) => item.id != null || item.productId != null, 'Either id or productId is required.')
    .transform(({ id, productId, ...item }) => ({ ...item, productId: productId ?? id }))
  ).min(1).max(50),
  promoCode: z.string().trim().max(30).optional(),
  shippingMethod: z.enum(['standard', 'free'])
}).strict();

export const trackingQuery = z.object({
  email: email.optional()
}).strict();

export const contactBody = z.object({
  name: z.string().trim().min(2).max(80),
  email,
  orderRef: optionalText(100),
  subject: optionalText(160),
  message: z.string().trim().min(1).max(5000)
}).strict();

export const customizationBody = z.object({
  name: z.string().trim().min(2).max(80),
  email,
  phone: optionalText(40),
  garmentType: optionalText(120),
  details: z.string().trim().min(1).max(5000)
}).strict();

export const newsletterBody = z.object({ email }).strict();

export const productCreateBody = z.object({
  title: z.string().trim().min(1).max(200),
  price: z.coerce.number().min(0),
  ...Object.fromEntries(Object.entries(productFields).filter(([key]) => !['title', 'price'].includes(key)))
}).strict();

export const productUpdateBody = z.object(productFields).partial().strict()
  .refine((value) => Object.keys(value).length > 0, 'At least one product field is required.');

export const orderStatusBody = z.object({
  orderStatus: z.enum(['Processing', 'Dispatched', 'Shipped', 'Delivered', 'Cancelled']).optional(),
  trackingNumber: optionalText(100),
  courier: optionalText(100)
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one order field is required.');

export const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
}).strict();

export const productsQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  category: optionalText(120),
  subcategory: optionalText(120),
  search: optionalText(200),
  collection: optionalText(120),
  filter: z.enum(['sale', 'new', 'best-seller']).optional(),
  sort: z.enum(['price-low', 'price-high', 'discount', 'newest']).optional()
}).strict();

export const orderIdParams = z.object({ orderId: z.string().trim().min(1).max(100) }).strict();
export const productIdParams = z.object({ id: z.string().trim().min(1).max(100) }).strict();

export const refundBody = z.object({
  amount: z.number().positive().multipleOf(0.01).optional(),
  reason: z.enum(['requested_by_customer', 'duplicate', 'fraudulent']).optional()
}).strict();
