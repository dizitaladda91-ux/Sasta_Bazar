import { withCategoryImages, withContentImages, withOrderImages, withProductImages } from '../data/imageCatalog';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/+$/, '');

async function request(path, options) {
  const response = await fetch(`${API_BASE}${path}`, { credentials: 'include', ...options });
  const data = await response.json();
  if (!response.ok || data.success === false) {
    const error = new Error(data.message || 'The server could not complete this request.');
    error.status = response.status;
    throw error;
  }
  return data;
}

const json = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export const api = {
  async getContent(key) {
    const content = (await request(`/storefront/content/${encodeURIComponent(key)}`)).content;
    return withContentImages(key, content);
  },
  async getCategories() { return withCategoryImages((await request('/categories')).categories); },
  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return (await request(`/products${query ? `?${query}` : ''}`)).products.map(withProductImages);
  },
  async getProduct(handle) { return withProductImages((await request(`/products/${encodeURIComponent(handle)}`)).product); },
  async createPaymentIntent(payload) {
    return request('/checkout/create-payment-intent', json('POST', payload));
  },
  async trackOrder(orderId, email) {
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    const result = await request(`/orders/${encodeURIComponent(orderId)}${query}`);
    return { ...result, order: withOrderImages(result.order) };
  },
  async submitContact(payload) { return request('/contact', json('POST', payload)); },
  async subscribeNewsletter(email) { return request('/newsletter', json('POST', { email })); },
  async getAdminStats() { return request('/admin/stats'); },
  async getAdminOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/orders${query ? `?${query}` : ''}`);
  },
  async updateOrderStatus(orderId, payload) { return request(`/admin/orders/${encodeURIComponent(orderId)}`, json('PATCH', payload)); },
  async refundOrder(orderId, payload = {}) {
    return request(`/admin/orders/${encodeURIComponent(orderId)}/refund`, json('POST', payload));
  },
  async createProduct(payload) { return request('/admin/products', json('POST', payload)); },
  async updateProduct(id, payload) { return request(`/admin/products/${encodeURIComponent(id)}`, json('PUT', payload)); },
  async deleteProduct(id) { return request(`/admin/products/${encodeURIComponent(id)}`, { method: 'DELETE' }); },
  async register(payload) { return request('/auth/register', json('POST', payload)); },
  async login(payload) { return request('/auth/login', json('POST', payload)); },
  async getMe() { return request('/auth/me'); },
  async logout() { return request('/auth/logout', { method: 'POST' }); },
  async getUserOrders() {
    const result = await request('/auth/orders');
    return { ...result, orders: (result.orders || []).map(withOrderImages) };
  },
  async updateProfile(payload) { return request('/auth/profile', json('PUT', payload)); }
};
