import productImages from './productImages.json';
import categoryImages from './categoryImages.json';

const FALLBACK_PRODUCT_IMAGE = '/product-placeholder.svg';

export function getProductImageSet(handle) {
  return productImages[handle] || {
    images: [FALLBACK_PRODUCT_IMAGE],
    primaryImage: FALLBACK_PRODUCT_IMAGE,
    hoverImage: FALLBACK_PRODUCT_IMAGE,
    variants: {},
  };
}

export function withProductImages(product) {
  if (!product) return product;
  const media = getProductImageSet(product.handle);
  return {
    ...product,
    ...media,
    variants: (product.variants || []).map((variant) => ({
      ...variant,
      image: media.variants?.[variant.title] || media.primaryImage,
    })),
  };
}

export function withOrderImages(order) {
  if (!order) return order;
  return {
    ...order,
    items: (order.items || []).map((item) => ({
      ...item,
      image: getProductImageSet(item.handle).primaryImage,
    })),
  };
}

export function withContentImages(key, content) {
  if (key === 'home_categories' && Array.isArray(content)) {
    return content.map((item) => ({
      ...item,
      image: categoryImages.categories[item.slug] || FALLBACK_PRODUCT_IMAGE,
    }));
  }
  if (key === 'signature_collections' && Array.isArray(content)) {
    return content.map((item) => ({
      ...item,
      image: categoryImages.signatures[item.id] || FALLBACK_PRODUCT_IMAGE,
    }));
  }
  return content;
}

export function withCategoryImages(categories) {
  return (categories || []).map((category) => ({
    ...category,
    image: categoryImages.categories[category.slug] || FALLBACK_PRODUCT_IMAGE,
  }));
}
