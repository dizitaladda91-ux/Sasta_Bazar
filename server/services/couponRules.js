export function calculateCouponDiscount(subtotal, coupon) {
  const minimumOrder = Number(coupon.minimum_order || 0);
  if (subtotal < minimumOrder) {
    throw Object.assign(new Error("The order subtotal does not meet this promo code's minimum spend."), { status: 400 });
  }
  const value = Number(coupon.discount_value);
  const discount = coupon.discount_type === 'percent'
    ? subtotal * value / 100
    : value;
  return Math.min(subtotal, Math.max(0, discount));
}

export function hasCouponUsageAvailable(coupon, pendingReservations = 0) {
  return coupon.max_redemptions == null
    || Number(coupon.redemption_count) + pendingReservations < Number(coupon.max_redemptions);
}
