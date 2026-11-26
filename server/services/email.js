const RESEND_API_URL = 'https://api.resend.com/emails';

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://sasta-bazar-xi.vercel.app').replace(/\/+$/, '');
}

async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'SASTA BAZAAR <orders@sastabazaarclothing.com>';
  if (!apiKey || !to) {
    console.info(`[email:skipped] to=${to || 'none'} subject="${subject}" (set RESEND_API_KEY to enable live emails)`);
    return { sent: false, skipped: true };
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from, to: Array.isArray(to) ? to : [to], subject, html }),
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[email:failed] status=${res.status} body=${body}`);
      return { sent: false, error: body };
    }
    return { sent: true };
  } catch (error) {
    console.error('[email:error]', error.message);
    return { sent: false, error: error.message };
  }
}

export async function sendOrderConfirmationEmail({ orderRef, customerName, customerEmail, total, paymentMethod = 'Stripe' }) {
  const trackUrl = `${getSiteUrl()}/track-order?id=${encodeURIComponent(orderRef)}&email=${encodeURIComponent(customerEmail)}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#FFFDF5;border:1px solid #EDE3B8;border-radius:12px;color:#1F1F1F;">
      <p style="font-size:11px;font-weight:700;letter-spacing:2px;color:#C69214;text-transform:uppercase;margin:0 0 8px;">SASTA BAZAAR - Everyday Luxury</p>
      <h1 style="font-size:22px;margin:0 0 12px;">Order Confirmed: ${orderRef}</h1>
      <p style="font-size:14px;line-height:1.6;color:#555555;">Hi ${customerName || 'Customer'},</p>
      <p style="font-size:14px;line-height:1.6;color:#555555;">Thank you for shopping with Sasta Bazaar! Your order <strong>${orderRef}</strong> (${paymentMethod}) for <strong>£${Number(total || 0).toFixed(2)}</strong> is confirmed and now being prepared.</p>
      <p style="margin:20px 0;">
        <a href="${trackUrl}" style="display:inline-block;background:#F2C94C;color:#1F1F1F;font-weight:700;font-size:13px;padding:12px 22px;border-radius:999px;text-decoration:none;">Track Your Order</a>
      </p>
      <p style="font-size:12px;color:#888888;margin:0;">Questions? Reply to this email or contact support@sastabazaarclothing.com.</p>
    </div>
  `;
  return sendEmail({
    to: customerEmail,
    subject: `Order Confirmed (${orderRef}) — SASTA BAZAAR`,
    html
  });
}

export async function sendAdminNewOrderAlert({ orderRef, customerName, customerEmail, total, paymentMethod = 'Stripe' }) {
  const adminTo = process.env.ORDER_ALERT_EMAIL || process.env.ADMIN_EMAIL;
  if (!adminTo) return { sent: false, skipped: true };
  return sendEmail({
    to: adminTo,
    subject: `New Order ${orderRef} (£${Number(total || 0).toFixed(2)} • ${paymentMethod})`,
    html: `<p>New order <strong>${orderRef}</strong> placed by ${customerName} (${customerEmail}). Total: <strong>£${Number(total || 0).toFixed(2)}</strong> via ${paymentMethod}.</p>`
  });
}

export async function sendOrderDispatchedEmail({ orderRef, customerName, customerEmail, orderStatus, trackingNumber, courier }) {
  const trackUrl = `${getSiteUrl()}/track-order?id=${encodeURIComponent(orderRef)}&email=${encodeURIComponent(customerEmail)}`;
  return sendEmail({
    to: customerEmail,
    subject: `Order ${orderStatus}: ${orderRef} — SASTA BAZAAR`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#FFFDF5;border:1px solid #EDE3B8;border-radius:12px;color:#1F1F1F;">
        <h1 style="font-size:20px;margin:0 0 12px;">Your Order is ${orderStatus}!</h1>
        <p style="font-size:14px;color:#555555;">Hi ${customerName || 'Customer'},</p>
        <p style="font-size:14px;color:#555555;">Your order <strong>${orderRef}</strong> has been updated to <strong>${orderStatus}</strong>.</p>
        ${courier ? `<p style="font-size:14px;color:#555555;">Courier: <strong>${courier}</strong></p>` : ''}
        ${trackingNumber ? `<p style="font-size:14px;color:#555555;">Tracking Number: <strong>${trackingNumber}</strong></p>` : ''}
        <p style="margin:20px 0;">
          <a href="${trackUrl}" style="display:inline-block;background:#0F1E36;color:#FFFFFF;font-weight:700;font-size:13px;padding:12px 22px;border-radius:999px;text-decoration:none;">View Live Tracking</a>
        </p>
      </div>
    `
  });
}
