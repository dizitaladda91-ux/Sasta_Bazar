function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderOrderInvoiceHtml(order) {
  const currency = order.currency || '£';
  const taxRate = Number(process.env.STORE_TAX_RATE ?? 5); // 5% GST/VAT inclusive breakdown
  const gstin = process.env.STORE_GSTIN || '27AABCS1429B1Z5';
  const sellerName = process.env.STORE_LEGAL_NAME || 'SASTA BAZAAR - Everyday Luxury';
  const sellerAddress = process.env.STORE_ADDRESS || 'London Ethnic Fashion Hub, United Kingdom';

  const invoiceNumber = `INV-${order.orderId}`;
  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const items = order.items || [];
  let totalTaxable = 0;
  let totalTax = 0;

  const itemRowsHtml = items.map((item, idx) => {
    const qty = Number(item.quantity || 1);
    const unitPrice = Number(item.price || 0);
    const lineTotal = unitPrice * qty;
    const taxable = taxRate > 0 ? lineTotal / (1 + taxRate / 100) : lineTotal;
    const taxAmount = lineTotal - taxable;
    totalTaxable += taxable;
    totalTax += taxAmount;

    const variantMeta = [item.size, item.color, item.variantTitle].filter(Boolean).join(' / ');

    return `
      <tr>
        <td>${idx + 1}</td>
        <td>
          <strong>${escapeHtml(item.title)}</strong>
          ${variantMeta ? `<div class="muted">${escapeHtml(variantMeta)}</div>` : ''}
        </td>
        <td class="num">${qty}</td>
        <td class="num">${escapeHtml(currency)}${unitPrice.toFixed(2)}</td>
        <td class="num">${escapeHtml(currency)}${taxable.toFixed(2)}</td>
        <td class="num">${taxRate}% (${escapeHtml(currency)}${taxAmount.toFixed(2)})</td>
        <td class="num"><strong>${escapeHtml(currency)}${lineTotal.toFixed(2)}</strong></td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tax Invoice ${escapeHtml(invoiceNumber)} | SASTA BAZAAR</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 24px; font-family: Arial, Helvetica, sans-serif; color: #1F1F1F; background: #FFFDF5; }
    .toolbar { max-width: 860px; margin: 0 auto 16px; display: flex; justify-content: flex-end; gap: 10px; }
    .btn { background: #F2C94C; color: #1F1F1F; border: 1px solid #C69214; padding: 10px 18px; border-radius: 999px; font-size: 12px; font-weight: 700; cursor: pointer; text-decoration: none; }
    .btn:hover { background: #E0B22E; }
    .sheet { max-width: 860px; margin: 0 auto; background: #FFFFFF; border: 1px solid #EDE3B8; border-radius: 10px; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1F1F1F; padding-bottom: 18px; gap: 16px; flex-wrap: wrap; }
    .brand { font-size: 22px; font-weight: 800; letter-spacing: 0.5px; color: #0F1E36; }
    .tag { font-size: 11px; color: #C69214; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; }
    .inv-title { text-align: right; }
    .inv-title h1 { margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; }
    .inv-title p { margin: 4px 0 0; font-size: 12px; color: #555555; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; font-size: 12px; line-height: 1.6; }
    .box { background: #FFFDF5; border: 1px solid #EDE3B8; border-radius: 8px; padding: 14px; }
    .box h3 { margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #0F1E36; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
    th { background: #FFF8DC; color: #1F1F1F; text-align: left; padding: 10px 8px; border: 1px solid #EDE3B8; font-size: 11px; text-transform: uppercase; }
    td { padding: 10px 8px; border: 1px solid #EDE3B8; vertical-align: top; }
    .num { text-align: right; white-space: nowrap; }
    .muted { font-size: 11px; color: #777777; margin-top: 2px; }
    .summary { margin-top: 20px; display: flex; justify-content: flex-end; }
    .summary-table { width: 320px; border-collapse: collapse; font-size: 12px; }
    .summary-table td { border: 1px solid #EDE3B8; padding: 8px 10px; }
    .summary-table .grand td { background: #0F1E36; color: #FFFFFF; font-weight: 700; font-size: 14px; }
    .footer { margin-top: 28px; padding-top: 16px; border-top: 1px dashed #EDE3B8; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; color: #666666; flex-wrap: wrap; gap: 12px; }
    .sig { text-align: right; }
    .sig strong { display: block; color: #1F1F1F; font-size: 12px; margin-bottom: 4px; }
    @media print {
      body { background: #FFFFFF; padding: 0; }
      .toolbar { display: none; }
      .sheet { border: none; border-radius: 0; padding: 12px; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button type="button" class="btn" onclick="window.print()">Print / Save PDF Invoice</button>
  </div>
  <div class="sheet">
    <div class="header">
      <div>
        <div class="tag">Tax Invoice / Bill of Supply</div>
        <div class="brand">${escapeHtml(sellerName)}</div>
        <p style="margin:4px 0 0;font-size:12px;color:#555555;">${escapeHtml(sellerAddress)}</p>
        <p style="margin:2px 0 0;font-size:12px;color:#555555;">GSTIN / Tax ID: <strong>${escapeHtml(gstin)}</strong></p>
      </div>
      <div class="inv-title">
        <h1>Tax Invoice</h1>
        <p>Invoice No: <strong>${escapeHtml(invoiceNumber)}</strong></p>
        <p>Order ID: <strong>${escapeHtml(order.orderId)}</strong></p>
        <p>Order Date: <strong>${escapeHtml(orderDate)}</strong></p>
      </div>
    </div>

    <div class="grid">
      <div class="box">
        <h3>Billing &amp; Shipping Address</h3>
        <strong>${escapeHtml(order.customer?.name)}</strong><br />
        ${escapeHtml(order.customer?.address)}<br />
        ${escapeHtml(order.customer?.city)}${order.customer?.postcode ? `, ${escapeHtml(order.customer.postcode)}` : ''}<br />
        Phone: ${escapeHtml(order.customer?.phone || 'N/A')}<br />
        Email: ${escapeHtml(order.customer?.email)}
      </div>
      <div class="box">
        <h3>Order &amp; Payment Details</h3>
        Payment Method: <strong>${escapeHtml(order.paymentMethod || 'Stripe')}</strong><br />
        Payment Status: <strong>${escapeHtml(order.paymentStatus || 'Pending')}</strong><br />
        Order Status: <strong>${escapeHtml(order.orderStatus || 'Processing')}</strong><br />
        Courier: <strong>${escapeHtml(order.courier || 'Royal Mail Tracked 48')}</strong>
        ${order.trackingNumber ? `<br />Tracking No: <strong>${escapeHtml(order.trackingNumber)}</strong>` : ''}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Description</th>
          <th class="num">Qty</th>
          <th class="num">Unit Price</th>
          <th class="num">Taxable Value</th>
          <th class="num">GST / Tax</th>
          <th class="num">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRowsHtml}
      </tbody>
    </table>

    <div class="summary">
      <table class="summary-table">
        <tr>
          <td>Taxable Subtotal</td>
          <td class="num">${escapeHtml(currency)}${totalTaxable.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Included GST / Tax (${taxRate}%)</td>
          <td class="num">${escapeHtml(currency)}${totalTax.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Items Subtotal</td>
          <td class="num">${escapeHtml(currency)}${Number(order.subtotal || 0).toFixed(2)}</td>
        </tr>
        ${Number(order.discount || 0) > 0 ? `
        <tr>
          <td>Promo Discount</td>
          <td class="num">-${escapeHtml(currency)}${Number(order.discount).toFixed(2)}</td>
        </tr>` : ''}
        <tr>
          <td>Shipping Charges</td>
          <td class="num">${Number(order.shipping || 0) === 0 ? 'FREE' : `${escapeHtml(currency)}${Number(order.shipping).toFixed(2)}`}</td>
        </tr>
        <tr class="grand">
          <td>Grand Total</td>
          <td class="num">${escapeHtml(currency)}${Number(order.total || 0).toFixed(2)}</td>
        </tr>
      </table>
    </div>

    <div class="footer">
      <div>
        <strong>Declaration:</strong> Goods sold are intended for end-customer consumption. All prices are inclusive of applicable taxes.<br />
        Support: support@sastabazaarclothing.com
      </div>
      <div class="sig">
        <strong>For ${escapeHtml(sellerName)}</strong>
        Authorized Signatory (Computer Generated Invoice)
      </div>
    </div>
  </div>
</body>
</html>`;
}
