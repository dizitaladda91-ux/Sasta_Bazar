import test from 'node:test';
import assert from 'node:assert/strict';
import { renderOrderInvoiceHtml } from './invoice.js';

test('renderOrderInvoiceHtml generates GST/Amazon-style invoice for COD orders', () => {
  const html = renderOrderInvoiceHtml({
    orderId: 'SB-TEST123',
    createdAt: '2026-11-26T10:00:00.000Z',
    currency: '£',
    paymentMethod: 'COD',
    paymentStatus: 'Pending',
    orderStatus: 'Processing',
    courier: 'Royal Mail Tracked 48',
    subtotal: 50,
    discount: 5,
    shipping: 0,
    total: 45,
    customer: {
      name: 'Ayesha <script>',
      email: 'ayesha@example.com',
      phone: '07700900000',
      address: '10 Downing St',
      city: 'London',
      postcode: 'SW1A 2AA'
    },
    items: [
      { title: 'Silk Lehenga', size: 'M', color: 'Gold', quantity: 1, price: 50 }
    ]
  });

  assert.ok(html.includes('INV-SB-TEST123'));
  assert.ok(html.includes('Tax Invoice'));
  assert.ok(html.includes('COD'));
  assert.ok(html.includes('Silk Lehenga'));
  assert.ok(html.includes('£45.00'));
  assert.ok(!html.includes('<script>'));
});
