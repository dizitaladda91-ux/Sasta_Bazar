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

export function sortCheckoutItems(items) {
  const compare = (left, right) => left < right ? -1 : left > right ? 1 : 0;
  return [...items].sort((left, right) => (
    compare(String(left.productId), String(right.productId))
    || compare(String(left.variantId ?? ''), String(right.variantId ?? ''))
    || compare(String(left.size ?? ''), String(right.size ?? ''))
    || compare(String(left.color ?? ''), String(right.color ?? ''))
  ));
}

export function assertTopLevelStockAllowed(stock, variantCount) {
  if (stock !== undefined && variantCount > 1) {
    throw Object.assign(
      new Error('Set stock on each variant instead of using top-level stock for a multi-variant product.'),
      { status: 409 }
    );
  }
}

export async function replaceProductVariants(client, productId, variants, { price, compareAtPrice, defaultStock } = {}) {
  const existingResult = await client.query(
    'SELECT id, external_id FROM variants WHERE product_id=$1 ORDER BY id FOR UPDATE',
    [productId]
  );
  const byId = new Map(existingResult.rows.map((variant) => [String(variant.id), variant]));
  const byExternalId = new Map(existingResult.rows
    .filter((variant) => variant.external_id != null)
    .map((variant) => [String(variant.external_id), variant]));
  const retainedIds = [];

  for (const variant of variants) {
    const externalId = variant.externalId == null ? null : String(variant.externalId);
    const identity = externalId ?? (variant.id == null ? null : String(variant.id));
    const existing = identity == null ? null : byExternalId.get(identity) || byId.get(identity);
    const title = variant.title || variant.size || variant.color || '';
    const size = variant.size || null;
    const color = variant.color || null;
    const stock = Number(variant.stock ?? defaultStock ?? 0) || 0;
    const variantPrice = Number(variant.price ?? price);
    const variantCompareAtPrice = variant.compareAtPrice === undefined
      ? compareAtPrice ?? null
      : variant.compareAtPrice;
    const image = variant.image || null;

    if (existing) {
      await client.query(
        `UPDATE variants SET external_id=COALESCE($2,external_id),title=$3,size=$4,color=$5,stock=$6,
           is_available=$7,price=$8,compare_at_price=$9,image_url=$10 WHERE id=$1`,
        [existing.id, externalId, title, size, color, stock, variant.available !== false,
          variantPrice, variantCompareAtPrice, image]
      );
      retainedIds.push(existing.id);
    } else {
      const inserted = await client.query(
        `INSERT INTO variants (product_id,external_id,title,size,color,stock,is_available,price,compare_at_price,image_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [productId, externalId ?? (variant.id == null ? null : String(variant.id)),
          title, size, color, stock, variant.available !== false, variantPrice,
          variantCompareAtPrice, image]
      );
      retainedIds.push(inserted.rows[0].id);
    }
  }

  await client.query(
    'UPDATE variants SET is_available=FALSE,stock=0 WHERE product_id=$1 AND NOT (id=ANY($2::bigint[]))',
    [productId, retainedIds]
  );
}
