import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  Users,
  DollarSign,
  Plus,
  Trash2,
  CheckCircle,
  Truck,
  Mail,
  RefreshCw,
  ExternalLink,
  Search,
  Filter
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboardPage() {
  const { user, initializing } = useAuth();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'products', 'subscribers'
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalSales: 0,
    currency: '£',
    pendingOrders: 0,
    totalSubscribers: 0
  });

  const [orders, setOrders] = useState([]);
  const [orderPage, setOrderPage] = useState(1);
  const [orderPages, setOrderPages] = useState(1);
  const [orderTotal, setOrderTotal] = useState(0);
  const [products, setProducts] = useState([]);
  const [stockDrafts, setStockDrafts] = useState({});
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);

  // Add Product Form State
  const [newProduct, setNewProduct] = useState({
    title: '',
    category: 'Ladies Collection',
    subcategory: 'Casual Everyday Wear Suits',
    price: '',
    compareAtPrice: '',
    stock: '0',
    sizes: 'S, M, L, XL, XXL',
    images: 'https://cdn.shopify.com/s/files/1/1083/5361/8269/files/1E1687CB-99B0-4DF8-B0A1-477F97E542DC.png?v=1782829448',
    description: ''
  });
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    document.title = 'Store Admin Dashboard | SASTA BAZAAR';
    window.scrollTo(0, 0);
    if (!initializing && user?.role === 'admin') fetchAdminData();
    else if (!initializing) setAccessDenied(true);
  }, [initializing, user]);

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const fetchAdminData = async (page = orderPage) => {
    setLoading(true);
    try {
      const statsRes = await api.getAdminStats();
      if (statsRes.success) setStats(statsRes.stats);
      const ordersRes = await api.getAdminOrders({ page, limit: 20 });
      if (ordersRes.success) {
        setOrders(ordersRes.orders);
        setOrderPage(ordersRes.page);
        setOrderPages(ordersRes.pages);
        setOrderTotal(ordersRes.total);
      }
      setProducts(await api.getProducts());
    } catch (error) {
      if (error.status === 401 || error.status === 403) setAccessDenied(true);
      else showToast(error.message || 'Could not load admin data.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    const tracking = `RM${Math.floor(10000000 + Math.random() * 90000000)}GB`;
    await api.updateOrderStatus(orderId, {
      orderStatus: newStatus,
      trackingNumber: tracking,
      courier: 'Royal Mail Tracked 48'
    });
    showToast(`Order ${orderId} marked as ${newStatus}`);
    fetchAdminData();
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const payload = {
      ...newProduct,
      price: parseFloat(newProduct.price),
      compareAtPrice: newProduct.compareAtPrice ? parseFloat(newProduct.compareAtPrice) : null,
      sizes: newProduct.sizes.split(',').map(s => s.trim()),
      images: [newProduct.images]
    };

    const res = await api.createProduct(payload);
    if (res.success) {
      showToast('Product created successfully!');
      setShowAddModal(false);
      setNewProduct({
        title: '',
        category: 'Ladies Collection',
        subcategory: 'Casual Everyday Wear Suits',
        price: '',
        compareAtPrice: '',
        stock: '0',
        sizes: 'S, M, L, XL, XXL',
        images: 'https://cdn.shopify.com/s/files/1/1083/5361/8269/files/1E1687CB-99B0-4DF8-B0A1-477F97E542DC.png?v=1782829448',
        description: ''
      });
      fetchAdminData();
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await api.deleteProduct(id);
      showToast('Product deleted');
      fetchAdminData();
    }
  };

  const handleStockSave = async (product) => {
    const stock = Number(stockDrafts[product.id] ?? product.stock);
    if (!Number.isInteger(stock) || stock < 0) return showToast('Stock must be a whole number of zero or more.');
    const result = await api.updateProduct(product.id, { stock });
    if (result.success) {
      setProducts((current) => current.map((item) => item.id === product.id ? result.product : item));
      showToast('Stock quantity updated.');
    }
  };

  const handleRefund = async (orderId, remainingAmount) => {
    const amountInput = window.prompt(
      `Enter a refund amount in GBP, or leave blank to refund the full remaining £${remainingAmount.toFixed(2)}:`
    );
    if (amountInput === null) return;
    const amount = amountInput.trim() ? Number(amountInput) : undefined;
    if (amount !== undefined && (!Number.isFinite(amount) || amount <= 0 || amount > remainingAmount)) {
      showToast('Enter a valid amount up to the remaining refund balance.');
      return;
    }
    const confirmation = amount === undefined
      ? `Refund the remaining £${remainingAmount.toFixed(2)} for order ${orderId}?`
      : `Refund £${amount.toFixed(2)} for order ${orderId}?`;
    if (!window.confirm(confirmation)) return;
    try {
      await api.refundOrder(orderId, amount === undefined ? {} : { amount });
      showToast(`Refund initiated for ${orderId}`);
      await fetchAdminData();
    } catch (error) {
      showToast(error.message || 'Could not refund this order.');
    }
  };

  if (initializing) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-sasta-muted">Checking administrator access...</div>;
  }

  if (accessDenied || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="font-serif text-2xl font-bold text-sasta-heading">Access denied / please sign in</h1>
        <p className="text-sm text-sasta-body">An administrator account is required to view this dashboard.</p>
        <Link to="/login" className="bg-sasta-gold px-5 py-3 rounded font-bold text-sm">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 min-h-screen py-8 sm:py-12 text-sasta-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-sasta-border">
          <div className="flex items-center gap-4">
            <img
              src="/logo.png"
              alt="SASTA BAZAAR"
              className="h-12 w-auto object-contain"
            />
            <div>
              <span className="text-[10px] font-bold tracking-[0.25em] text-sasta-gold-dark uppercase block">
                Independent Store Controller
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-sasta-navy">
                Sasta Bazaar &bull; Store Admin
              </h1>
              <p className="text-xs text-sasta-muted mt-0.5">
                Manage products, orders, inventory &amp; customers without Shopify dependency.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAdminData}
              className="inline-flex items-center gap-1.5 bg-white border border-sasta-border text-xs font-semibold px-3 py-2 rounded-md hover:bg-neutral-100"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 bg-sasta-gold hover:bg-sasta-gold-hover text-sasta-heading text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-md shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {notification && (
          <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-md animate-fade-in text-center">
            {notification}
          </div>
        )}

        {/* Analytics Top Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-lg border border-sasta-border shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-sasta-muted">
              <span className="text-xs font-semibold uppercase">Total Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-sasta-navy">
              £{stats.totalSales?.toFixed(2)}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">All-time collected</span>
          </div>

          <div className="bg-white p-5 rounded-lg border border-sasta-border shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-sasta-muted">
              <span className="text-xs font-semibold uppercase">Total Orders</span>
              <ShoppingBag className="w-4 h-4 text-sasta-gold-dark" />
            </div>
            <div className="text-2xl font-bold text-sasta-navy">
              {stats.totalOrders}
            </div>
            <span className="text-[11px] text-amber-700 font-medium">{stats.pendingOrders} Processing</span>
          </div>

          <div className="bg-white p-5 rounded-lg border border-sasta-border shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-sasta-muted">
              <span className="text-xs font-semibold uppercase">Live Catalog</span>
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-sasta-navy">
              {stats.totalProducts}
            </div>
            <span className="text-[11px] text-sasta-muted">Ethnic garments</span>
          </div>

          <div className="bg-white p-5 rounded-lg border border-sasta-border shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-sasta-muted">
              <span className="text-xs font-semibold uppercase">Newsletter Leads</span>
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-sasta-navy">
              {stats.totalSubscribers}
            </div>
            <span className="text-[11px] text-purple-600 font-medium">Active coupon users</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-sasta-border space-x-6 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'orders'
                ? 'border-sasta-navy text-sasta-navy'
                : 'border-transparent text-sasta-muted hover:text-sasta-heading'
            }`}
          >
            Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'products'
                ? 'border-sasta-navy text-sasta-navy'
                : 'border-transparent text-sasta-muted hover:text-sasta-heading'
            }`}
          >
            Products ({products.length})
          </button>
        </div>

        {/* TAB 1: ORDERS TABLE */}
        {activeTab === 'orders' && (
          <div className="bg-white border border-sasta-border rounded-lg overflow-x-auto shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-sasta-yellow-cream/60 border-b border-sasta-border font-serif text-[11px] uppercase tracking-wider text-sasta-heading">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Courier &amp; Tracking</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sasta-border/60">
                {orders.map((o) => (
                  <tr key={o.orderId} className="hover:bg-neutral-50">
                    <td className="py-3 px-4 font-bold text-sasta-navy">
                      <Link to={`/track-order?id=${encodeURIComponent(o.orderId)}&email=${encodeURIComponent(o.customer.email)}`} className="hover:underline text-sasta-gold-dark font-extrabold flex items-center gap-1">
                        <span>{o.orderId}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <strong>{o.customer.name}</strong>
                      <div className="text-[11px] text-sasta-muted">{o.customer.email}</div>
                      <div className="text-[10px] text-sasta-muted">{o.customer.city}</div>
                    </td>
                    <td className="py-3 px-4">
                      {o.items?.length} item(s)
                    </td>
                    <td className="py-3 px-4 font-bold text-sasta-heading">
                      £{o.total?.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        o.orderStatus === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : o.orderStatus === 'Dispatched'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {o.orderStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[11px]">
                      <div>{o.courier || 'Royal Mail'}</div>
                      <span className="font-mono text-sasta-muted">{o.trackingNumber || 'Pending'}</span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      {o.orderStatus === 'Processing' && (
                        <button
                          onClick={() => handleUpdateStatus(o.orderId, 'Dispatched')}
                          className="bg-sasta-navy hover:bg-sasta-navy-light text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-2xs"
                        >
                          Dispatch
                        </button>
                      )}
                      {o.orderStatus === 'Dispatched' && (
                        <button
                          onClick={() => handleUpdateStatus(o.orderId, 'Delivered')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-2xs"
                        >
                          Delivered
                        </button>
                      )}
                      {o.paymentStatus === 'Paid' && (
                        <button
                          onClick={() => handleRefund(o.orderId, Math.max(0, o.total - (o.refundedAmount || 0)))}
                          className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-2xs"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between gap-3 border-t border-sasta-border px-4 py-3 text-xs">
              <span className="text-sasta-muted">{orderTotal} total orders · Page {orderPage} of {orderPages}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={loading || orderPage <= 1}
                  onClick={() => fetchAdminData(orderPage - 1)}
                  className="rounded border border-sasta-border px-3 py-1.5 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={loading || orderPage >= orderPages}
                  onClick={() => fetchAdminData(orderPage + 1)}
                  className="rounded border border-sasta-border px-3 py-1.5 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS MANAGER */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.slice(0, 24).map((p) => (
                <div key={p.id} className="bg-white rounded-lg border border-sasta-border p-3 flex flex-col justify-between shadow-2xs">
                  <div className="space-y-2">
                    <img
                      src={p.primaryImage}
                      alt={p.title}
                      className="w-full aspect-[3/4] object-cover rounded bg-neutral-100"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sasta-gold-dark block">
                      {p.subcategory || p.category}
                    </span>
                    <h4 className="font-medium text-xs text-sasta-heading line-clamp-2" title={p.title}>
                      {p.title}
                    </h4>
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-sm text-sasta-navy">£{p.price.toFixed(2)}</span>
                      {p.compareAtPrice && (
                        <span className="text-xs text-sasta-muted line-through">£{p.compareAtPrice.toFixed(2)}</span>
                      )}
                    </div>
                    <label className="flex items-center gap-2 text-xs">
                      <span>Stock</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={stockDrafts[p.id] ?? p.stock}
                        onChange={(event) => setStockDrafts({ ...stockDrafts, [p.id]: event.target.value })}
                        className="w-20 border border-sasta-border rounded px-2 py-1"
                      />
                      <button onClick={() => handleStockSave(p)} className="text-sasta-gold-dark font-semibold">Save</button>
                    </label>
                  </div>

                  <div className="pt-3 border-t border-sasta-border/60 flex items-center justify-between text-xs mt-3">
                    <Link to={`/product/${p.handle}`} target="_blank" className="text-sasta-gold-dark font-semibold hover:underline">
                      View Live &rarr;
                    </Link>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="text-sasta-muted hover:text-red-600 p-1"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ADD PRODUCT MODAL */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-white rounded-xl border border-sasta-border max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center pb-3 border-b border-sasta-border">
                <h3 className="font-serif font-bold text-lg text-sasta-heading">
                  Add New Ethnic Garment
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-sasta-muted hover:text-sasta-heading font-bold text-lg">
                  &times;
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={newProduct.title}
                    onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                    placeholder="e.g. SB56 Crimson Red Embroidered Suit"
                    className="w-full border border-sasta-border rounded p-2 focus:border-sasta-gold outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Selling Price (£) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      placeholder="9.99"
                      className="w-full border border-sasta-border rounded p-2 focus:border-sasta-gold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Compare Regular Price (£)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.compareAtPrice}
                      onChange={(e) => setNewProduct({ ...newProduct, compareAtPrice: e.target.value })}
                      placeholder="19.99"
                      className="w-full border border-sasta-border rounded p-2 focus:border-sasta-gold outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Stock quantity *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="w-full border border-sasta-border rounded p-2 focus:border-sasta-gold outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Category</label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="w-full border border-sasta-border rounded p-2"
                    >
                      <option>Ladies Collection</option>
                      <option>Kids Collection</option>
                      <option>Unstitched Suits</option>
                      <option>Scarves</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Subcategory</label>
                    <select
                      value={newProduct.subcategory}
                      onChange={(e) => setNewProduct({ ...newProduct, subcategory: e.target.value })}
                      className="w-full border border-sasta-border rounded p-2"
                    >
                      <option>Casual Everyday Wear Suits</option>
                      <option>Salwar Kameez / Suit Sets</option>
                      <option>Sharara &amp; Gharara Suits</option>
                      <option>Lehenga Choli</option>
                      <option>Dresses</option>
                      <option>Premium Jersey Hijabs</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Image URL (Shopify CDN or direct URL)</label>
                  <input
                    type="url"
                    value={newProduct.images}
                    onChange={(e) => setNewProduct({ ...newProduct, images: e.target.value })}
                    className="w-full border border-sasta-border rounded p-2 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Sizes (comma-separated)</label>
                  <input
                    type="text"
                    value={newProduct.sizes}
                    onChange={(e) => setNewProduct({ ...newProduct, sizes: e.target.value })}
                    className="w-full border border-sasta-border rounded p-2"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-sasta-border">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-sasta-border rounded hover:bg-neutral-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-sasta-gold hover:bg-sasta-gold-hover text-sasta-heading font-bold rounded shadow-xs"
                  >
                    Save Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
