export function getCategoryProducts(products, category) {
  if (category.path === '/shop') return products.slice(0, 2);

  const collectionSlug = category.path.replace('/collection/', '');
  const categoryName = category.name.trim().toLowerCase();

  return products
    .filter((product) => (
      product.collectionSlug === collectionSlug
      || product.category?.trim().toLowerCase() === categoryName
      || product.subcategory?.trim().toLowerCase() === categoryName
    ))
    .slice(0, 2);
}
