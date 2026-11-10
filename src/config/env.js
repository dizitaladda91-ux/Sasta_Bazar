// Application Environment Configuration
export const ENV = {
  storeName: process.env.NEXT_PUBLIC_STORE_NAME || 'SASTA BAZAAR',
  tagline: process.env.NEXT_PUBLIC_STORE_TAGLINE || 'Everyday Luxury',
  currencySymbol: process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '£',
  currencyCode: process.env.NEXT_PUBLIC_CURRENCY_CODE || 'GBP',
  freeShippingThreshold: Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD) || 40.00,
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@sastabazaarclothing.com',
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+447000000000',
  instagramHandle: process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE || '@sastabazaarclothing',

  // Optional external integrations
  shopifyDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '',
  shopifyToken: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN || '',
  stripeKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  gaId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '',
  pixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID || '',
};
