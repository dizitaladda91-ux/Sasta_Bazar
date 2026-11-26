import productImages from './productImages.json';
import categoryImages from './categoryImages.json';

const FALLBACK_PRODUCT_IMAGE = '/product-placeholder.svg';
const CLOUDINARY_CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_FETCH = process.env.NEXT_PUBLIC_CLOUDINARY_FETCH === 'true';

export function optimizeImageUrl(url) {
  if (!url || typeof url !== 'string') return FALLBACK_PRODUCT_IMAGE;
  if (url.startsWith('/') || url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (!CLOUDINARY_CLOUD) return url;

  if (url.includes('res.cloudinary.com/') && !url.includes('/f_auto')) {
    return url.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
  }
  if (CLOUDINARY_FETCH && url.startsWith('https://') && !url.includes('res.cloudinary.com/')) {
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/fetch/f_auto,q_auto/${encodeURIComponent(url)}`;
  }
  return url;
}

export function getProductImageSet(handle) {
  const entry = productImages[handle];
  if (!entry) {
    return {
      images: [FALLBACK_PRODUCT_IMAGE],
      primaryImage: FALLBACK_PRODUCT_IMAGE,
      hoverImage: FALLBACK_PRODUCT_IMAGE,
      variants: {},
    };
  }
  return {
    images: (entry.images || [FALLBACK_PRODUCT_IMAGE]).map(optimizeImageUrl),
    primaryImage: optimizeImageUrl(entry.primaryImage),
    hoverImage: optimizeImageUrl(entry.hoverImage || entry.primaryImage),
    variants: entry.variants || {},
  };
}

export function withProductImages(product) {
  if (!product) return product;
  const catalogEntry = productImages[product.handle];
  const rawImages = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : (catalogEntry?.images || []);
  const images = rawImages.length > 0
    ? rawImages.map(optimizeImageUrl)
    : [FALLBACK_PRODUCT_IMAGE];
  const primaryImage = optimizeImageUrl(product.primaryImage || catalogEntry?.primaryImage || images[0]);
  const hoverImage = optimizeImageUrl(product.hoverImage || catalogEntry?.hoverImage || images[1] || primaryImage);

  return {
    ...product,
    images,
    primaryImage,
    hoverImage,
    variants: (product.variants || []).map((variant) => ({
      ...variant,
      image: optimizeImageUrl(variant.image || catalogEntry?.variants?.[variant.title] || primaryImage),
    })),
  };
}

export function withOrderImages(order) {
  if (!order) return order;
  return {
    ...order,
    items: (order.items || []).map((item) => ({
      ...item,
      image: optimizeImageUrl(item.image || getProductImageSet(item.handle).primaryImage),
    })),
  };
}

export function withContentImages(key, content) {
  if (key === 'home_categories' && Array.isArray(content)) {
    return content.map((item) => ({
      ...item,
      image: optimizeImageUrl(categoryImages.categories[item.slug] || item.image || FALLBACK_PRODUCT_IMAGE),
    }));
  }
  if (key === 'signature_collections' && Array.isArray(content)) {
    return content.map((item) => ({
      ...item,
      image: optimizeImageUrl(categoryImages.signatures[item.id] || item.image || FALLBACK_PRODUCT_IMAGE),
    }));
  }
  return content;
}

export function withCategoryImages(categories) {
  return (categories || []).map((category) => ({
    ...category,
    image: optimizeImageUrl(categoryImages.categories[category.slug] || category.image || FALLBACK_PRODUCT_IMAGE),
  }));
}
