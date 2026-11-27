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

export const WOMENS_MENU_GROUPS = [
  'SHOP BY STYLE',
  'OCCASION WEAR',
  'ACCESSORIES'
];

export const KIDS_MENU_GROUPS = [
  'KIDS ETHNIC WEAR',
  'KIDS OCCASIONS'
];

export const MEGA_MENU_GROUPS = [
  'SHOP BY STYLE',
  'OCCASION WEAR',
  'FOR KIDS',
  'ACCESSORIES'
];

export const KIDS_MENU_CATEGORIES = [
  {
    name: 'All Kids Collection',
    slug: 'kids-all',
    path: '/collection/kids-collection',
    image: 'https://cdn.shopify.com/s/files/1/1083/5361/8269/files/81c960b0-5c23-4f4c-bd88-2b25f5b5a124.jpg?v=1782834977',
    badge: 'Popular',
    group: 'KIDS ETHNIC WEAR',
    featuredTitle: 'Kids Festive Edit — Up to 50% Off',
    featuredSubtitle: 'Soft cotton-lined lehengas, shararas, and festive kurta sets for kids.'
  },
  {
    name: 'Kids Lehenga Choli',
    slug: 'kids-lehenga',
    path: '/collection/kids-collection',
    image: 'https://cdn.shopify.com/s/files/1/1083/5361/8269/files/81c960b0-5c23-4f4c-bd88-2b25f5b5a124.jpg?v=1782834977',
    badge: 'Trending',
    group: 'KIDS ETHNIC WEAR',
    featuredTitle: 'Kids Embroidered Lehengas',
    featuredSubtitle: 'Lightweight net & silk lehengas designed for comfortable twirls.'
  },
  {
    name: 'Kids Sharara & Suit Sets',
    slug: 'kids-sharara',
    path: '/collection/kids-collection',
    image: '/hero-collection-3.png',
    badge: 'New',
    group: 'KIDS OCCASIONS',
    featuredTitle: 'Kids Eid & Wedding Suits',
    featuredSubtitle: 'Breathable festive shararas and kurta sets for family celebrations.'
  },
  {
    name: 'Shop All Kids Wear',
    slug: 'kids-shop',
    path: '/shop?category=Kids+Collection',
    image: '/hero-collection-3.png',
    badge: null,
    group: 'KIDS OCCASIONS',
    featuredTitle: 'Budget Kids Festive Wear',
    featuredSubtitle: 'Filter all kids ethnic outfits by size, colour, and price.'
  }
];

export const MEGA_MENU_CATEGORIES = [
  {
    name: 'Shop All',
    slug: 'shop-all',
    path: '/shop',
    image: '/hero-collection-1.png',
    badge: null,
    group: 'SHOP BY STYLE',
    featuredTitle: 'Festive Edit — Up to 50% Off',
    featuredSubtitle: 'Explore every handcrafted suit, lehenga, and ethnic essential.'
  },
  {
    name: 'Casual Everyday Wear Suits',
    slug: 'casual-wear',
    path: '/collection/casual-wear',
    image: 'https://cdn.shopify.com/s/files/1/1083/5361/8269/files/1E1687CB-99B0-4DF8-B0A1-477F97E542DC.png?v=1782829448',
    badge: null,
    group: 'SHOP BY STYLE',
    featuredTitle: 'Everyday Cotton Luxury',
    featuredSubtitle: 'Breathable 3-piece suits with intricate neck patches and dupattas.'
  },
  {
    name: 'Salwar Kameez / Suit Sets',
    slug: 'salwar-kameez-suit-sets',
    path: '/collection/salwar-kameez-suit-sets',
    image: 'https://cdn.shopify.com/s/files/1/1083/5361/8269/files/3A946126-52FC-4483-B2FA-DA3763993990.jpg?v=1782935535',
    badge: 'Bestseller',
    group: 'SHOP BY STYLE',
    featuredTitle: 'Classic Salwar Kameez Sets',
    featuredSubtitle: 'Signature thread & zarkan embroidery in soft slub cotton.'
  },
  {
    name: 'Unstitched Suits',
    slug: 'unstitched-suits',
    path: '/collection/unstitched-suits',
    image: 'https://cdn.shopify.com/s/files/1/1083/5361/8269/files/IMG_3452.jpg?v=1782585999',
    badge: null,
    group: 'SHOP BY STYLE',
    featuredTitle: 'Unstitched Dress Materials',
    featuredSubtitle: 'Pure cotton & silk fabrics with designer dupattas tailored to your fit.'
  },
  {
    name: 'Lehenga Choli',
    slug: 'lehenga-choli',
    path: '/collection/lehenga-choli',
    image: 'https://cdn.shopify.com/s/files/1/1083/5361/8269/files/85338475-1595-428f-853e-2a98d857df58.jpg?v=1782836139',
    badge: 'Trending',
    group: 'OCCASION WEAR',
    featuredTitle: 'Royal Lehenga Choli Edit',
    featuredSubtitle: 'Digital print silk and embroidered lehengas made for wedding season.'
  },
  {
    name: 'Sharara & Gharara Suits',
    slug: 'sharara-gharara-suits',
    path: '/collection/sharara-gharara-suits',
    image: 'https://cdn.shopify.com/s/files/1/1083/5361/8269/files/8a9d93c1-7f57-4374-acdd-49962b2aebd5.jpg?v=1782834331',
    badge: 'New',
    group: 'OCCASION WEAR',
    featuredTitle: 'Festive Sharara & Gharara',
    featuredSubtitle: 'Glamorous tiered silhouettes with sequin work and contrast dupattas.'
  },
  {
    name: 'Dresses',
    slug: 'dresses',
    path: '/collection/dresses',
    image: '/hero-collection-2.png',
    badge: null,
    group: 'OCCASION WEAR',
    featuredTitle: 'Saree-Drape Gowns & Dresses',
    featuredSubtitle: 'Contemporary georgette drapes with hand-embroidered belts.'
  },
  {
    name: 'Kids Collection',
    slug: 'kids-collection',
    path: '/collection/kids-collection',
    image: 'https://cdn.shopify.com/s/files/1/1083/5361/8269/files/81c960b0-5c23-4f4c-bd88-2b25f5b5a124.jpg?v=1782834977',
    badge: null,
    group: 'FOR KIDS',
    featuredTitle: 'Little Heritage Festive Wear',
    featuredSubtitle: 'Soft cotton-lined lehengas and kurta sets crafted for kids.'
  },
  {
    name: 'Scarves',
    slug: 'scarves',
    path: '/collection/scarves',
    image: 'https://cdn.shopify.com/s/files/1/1083/5361/8269/files/01_-_Light_Grey_4373ac79-46cb-446b-9110-f1f7e79839c2.jpg?v=1791976860',
    badge: 'Bestseller',
    group: 'ACCESSORIES',
    featuredTitle: 'Premium Jersey Hijabs',
    featuredSubtitle: 'Ultra-soft, double-stitched hijabs in 30+ pastel and earthy shades.'
  }
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
