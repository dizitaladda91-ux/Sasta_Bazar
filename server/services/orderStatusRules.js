const transitions = {
  'Awaiting Payment': ['Processing', 'Cancelled'],
  Processing: ['Dispatched', 'Shipped', 'Cancelled'],
  Dispatched: ['Delivered', 'Cancelled'],
  Shipped: ['Delivered', 'Cancelled'],
  Delivered: [],
  Cancelled: []
};

export function assertOrderStatusTransition(currentStatus, nextStatus, paymentStatus) {
  if (['Shipped', 'Dispatched', 'Delivered'].includes(nextStatus) && paymentStatus !== 'Paid') {
    throw Object.assign(new Error('An order must be paid before it can be shipped or delivered.'), { status: 409 });
  }
  if (nextStatus === currentStatus) return;
  if (currentStatus === 'Cancelled') {
    throw Object.assign(new Error('Cancelled orders cannot be reopened.'), { status: 409 });
  }
  if (!transitions[currentStatus]?.includes(nextStatus)) {
    throw Object.assign(new Error(`Order status cannot transition from ${currentStatus} to ${nextStatus}.`), { status: 409 });
  }
}
