export const CATEGORIES = [
  {
    id: 'ladies',
    name: 'Ladies Collection',
    slug: 'ladies-collection',
    description: 'Explore our exquisite range of handcrafted suits, lehengas, shararas, and everyday designer wear.',
    image: 'https://cdn.shopify.com/s/files/1/1083/5361/8269/files/1E1687CB-99B0-4DF8-B0A1-477F97E542DC.png?v=1782829448',
    itemCount: 48,
    subcategories: [
      { name: 'Casual Everyday Wear Suits', slug: 'casual-wear', path: '/collection/casual-wear' },
      { name: 'Lehenga Choli', slug: 'lehenga-choli', path: '/collection/lehenga-choli' },
      { name: 'Sharara & Gharara Suits', slug: 'sharara-gharara-suits', path: '/collection/sharara-gharara-suits' },
      { name: 'Salwar Kameez / Suit Sets', slug: 'salwar-kameez-suit-sets', path: '/collection/salwar-kameez-suit-sets' },
      { name: 'Dresses', slug: 'dresses', path: '/collection/dresses' },
    ]
  },
  {
    id: 'kids',
    name: 'Kids Collection',
    slug: 'kids-collection',
    description: 'Charming festive attire and lehenga choli sets crafted with soft linings for your little ones.',
    image: 'https://cdn.shopify.com/s/files/1/1083/5361/8269/files/81c960b0-5c23-4f4c-bd88-2b25f5b5a124.jpg?v=1782834977',
    itemCount: 8,
    subcategories: [
      { name: 'Kids Ethnic Wear', slug: 'kids-ethnic-wear', path: '/collection/kids-collection' },
      { name: 'Kids Lehenga Choli', slug: 'kids-lehenga', path: '/collection/kids-collection' }
    ]
  },
  {
    id: 'unstitched',
    name: 'Unstitched Suits',
    slug: 'unstitched-suits',
    description: 'Premium unstitched dress materials in pure cotton, organza, and silk with designer dupattas.',
    image: 'https://cdn.shopify.com/s/files/1/1083/5361/8269/files/IMG_3452.jpg?v=1782585999',
    itemCount: 12,
    subcategories: [
      { name: 'Cotton Unstitched', slug: 'cotton-unstitched', path: '/collection/unstitched-suits' },
      { name: 'Festive Unstitched', slug: 'festive-unstitched', path: '/collection/unstitched-suits' }
    ]
  },
  {
    id: 'scarves',
    name: 'Scarves & Hijabs',
    slug: 'scarves',
    description: 'Ultra-soft, breathable double-stitched jersey hijabs in over 30 timeless shades.',
    image: 'https://cdn.shopify.com/s/files/1/1083/5361/8269/files/01_-_Light_Grey_4373ac79-46cb-446b-9110-f1f7e79839c2.jpg?v=1791976860',
    itemCount: 31,
    subcategories: [
      { name: 'Premium Jersey Hijabs', slug: 'premium-jersey', path: '/collection/scarves' },
      { name: 'Everyday Scarves', slug: 'everyday-scarves', path: '/collection/scarves' }
    ]
  }
];

export const NAV_CATEGORIES = [
  { name: 'All', path: '/shop' },
  { name: 'Casual Everyday Wear Suits', path: '/collection/casual-wear' },
  { name: 'Salwar Kameez / Suit Sets', path: '/collection/salwar-kameez-suit-sets' },
  { name: 'Dresses', path: '/collection/dresses' },
  { name: 'Lehenga Choli', path: '/collection/lehenga-choli' },
  { name: 'Sharara & Gharara Suits', path: '/collection/sharara-gharara-suits' },
  { name: 'Kids Collection', path: '/collection/kids-collection' },
  { name: 'Unstitched Suits', path: '/collection/unstitched-suits' },
  { name: 'Scarves', path: '/collection/scarves' }
];

export const SIGNATURE_COLLECTIONS = [
  {
    id: 'casual-wear',
    title: 'Casual Wear',
    subtitle: 'Pure Cotton Comfort',
    image: 'https://cdn.shopify.com/s/files/1/1083/5361/8269/files/1E1687CB-99B0-4DF8-B0A1-477F97E542DC.png?v=1782829448',
    link: '/collection/casual-wear',
    tag: 'Daily Chic'
  },
  {
    id: 'sharara',
    title: 'Sharara & Gharara',
    subtitle: 'Festive Twirls & Embroidery',
    image: 'https://cdn.shopify.com/s/files/1/1083/5361/8269/files/8a9d93c1-7f57-4374-acdd-49962b2aebd5.jpg?v=1782834331',
    link: '/collection/sharara-gharara-suits',
    tag: 'Wedding & Parties'
  },
  {
    id: 'kids-wear',
    title: 'Kids Wear',
    subtitle: 'Adorable Heritage Fits',
    image: 'https://cdn.shopify.com/s/files/1/1083/5361/8269/files/81c960b0-5c23-4f4c-bd88-2b25f5b5a124.jpg?v=1782834977',
    link: '/collection/kids-collection',
    tag: 'Mini Ethnic'
  },
  {
    id: 'lehenga',
    title: 'Lehenga Choli',
    subtitle: 'Timeless Royal Silhouettes',
    image: 'https://cdn.shopify.com/s/files/1/1083/5361/8269/files/85338475-1595-428f-853e-2a98d857df58.jpg?v=1782836139',
    link: '/collection/lehenga-choli',
    tag: 'Occasion Wear'
  },
  {
    id: 'salwar-suits',
    title: 'Salwar Kameez Sets',
    subtitle: 'Thread & Zarkan Work',
    image: 'https://cdn.shopify.com/s/files/1/1083/5361/8269/files/3A946126-52FC-4483-B2FA-DA3763993990.jpg?v=1782935535',
    link: '/collection/salwar-kameez-suit-sets',
    tag: 'Best Sellers'
  }
];
