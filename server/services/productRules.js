export function getIncomingVariants(input, price, compareAtPrice) {
  const colors = Array.isArray(input.colors) ? input.colors : [];
  const sizes = Array.isArray(input.sizes) && input.sizes.length
    ? input.sizes
    : colors.length ? [] : ['S', 'M', 'L', 'XL', 'XXL'];

  if (Array.isArray(input.variants) && input.variants.length) return input.variants;
  if (sizes.length && colors.length) {
    return sizes.flatMap((size) => colors.map((color) => ({
      title: `${size} / ${color}`, size, color, price, compareAtPrice
    })));
  }
  if (sizes.length) return sizes.map((size) => ({ title: size, size, price, compareAtPrice }));
  return colors.map((color) => ({ title: color, color, price, compareAtPrice }));
}

export function assertTopLevelStockAllowed(stock, variantCount) {
  if (stock !== undefined && variantCount > 1) {
    throw Object.assign(
      new Error('Set stock on each variant instead of using top-level stock for a multi-variant product.'),
      { status: 409 }
    );
  }
}
