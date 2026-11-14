import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Package, Truck, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { api } from '../services/api';

export default function TrackOrderPage() {
  const [searchParams] = useSearchParams();
  const [orderIdInput, setOrderIdInput] = useState(searchParams.get('id') || '');
  const [emailInput, setEmailInput] = useState(searchParams.get('email') || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Track Your Order | SASTA BAZAAR';
    window.scrollTo(0, 0);
    const initialId = searchParams.get('id');
    const initialEmail = searchParams.get('email');
    if (initialId && initialEmail) {
      handleSearch(initialId, initialEmail);
    }
  }, [searchParams]);

  const handleSearch = async (idToSearch, emailToSearch) => {
    const queryId = (idToSearch || orderIdInput).trim();
    const queryEmail = (emailToSearch || emailInput).trim();
    if (!queryId || !queryEmail) return;

    setLoading(true);
    setError('');
    setOrder(null);

    let result;
    try {
      result = await api.trackOrder(queryId, queryEmail);
    } catch (requestError) {
      result = { success: false, message: requestError.message };
    }
    setLoading(false);

    if (result.success && result.order) {
      setOrder(result.order);
    } else {
      setError(result.message || 'No order found with this reference number.');
    }
  };

  const getStepActive = (stepName) => {
    if (!order) return false;
    const status = order.orderStatus.toLowerCase();
    if (stepName === 'placed') return true;
    if (stepName === 'processing') return status === 'processing' || status === 'dispatched' || status === 'delivered';
    if (stepName === 'dispatched') return status === 'dispatched' || status === 'delivered';
    if (stepName === 'delivered') return status === 'delivered';
    return false;
  };

  return (
    <div className="bg-white min-h-screen py-12 sm:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-bold tracking-[0.25em] text-sasta-gold-dark uppercase block">
            Real-Time Logistics
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-sasta-heading">
            Track Your Order
          </h1>
          <p className="text-xs sm:text-sm text-sasta-body">
            Enter your order ID and the email address used at checkout to check dispatch &amp; courier status.
          </p>
        </div>

        {/* Search Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
        >
          <div className="relative flex-1">
            <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sasta-muted" />
            <input
              type="text"
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              placeholder="e.g. SB-982143"
              required
              className="w-full pl-10 pr-3 py-3 bg-sasta-yellow-cream/40 border border-sasta-border rounded-md text-xs sm:text-sm text-sasta-heading uppercase placeholder-sasta-muted focus:outline-none focus:border-sasta-gold"
            />
          </div>
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="Email used at checkout"
            required
            className="flex-1 px-3 py-3 bg-sasta-yellow-cream/40 border border-sasta-border rounded-md text-xs sm:text-sm text-sasta-heading placeholder-sasta-muted focus:outline-none focus:border-sasta-gold"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-sasta-navy hover:bg-sasta-navy-light text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-md shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? 'Searching...' : 'Track'}</span>
          </button>
        </form>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md text-center">
            {error}
          </div>
        )}

        {/* Order Details Display */}
        {order && (
          <div className="bg-sasta-yellow-cream/30 border border-sasta-border rounded-xl p-6 sm:p-8 space-y-8 animate-fade-in shadow-xs">
            {/* Order Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-sasta-border">
              <div>
                <span className="text-[10px] font-bold text-sasta-muted uppercase tracking-wider block">
                  Order Reference
                </span>
                <h3 className="font-serif text-2xl font-bold text-sasta-navy">
                  {order.orderId}
                </h3>
                <span className="text-xs text-sasta-body">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="sm:text-right">
                <span className="inline-block bg-sasta-yellow-soft border border-sasta-border text-amber-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Status: {order.orderStatus}
                </span>
                <p className="text-xs text-sasta-muted mt-1">
                  Courier: <strong>{order.courier || 'Royal Mail Tracked 48'}</strong>
                </p>
                {order.trackingNumber && (
                  <p className="text-xs text-sasta-muted">
                    Tracking No: <strong className="text-sasta-navy">{order.trackingNumber}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Tracking Timeline Stepper */}
            <div className="py-2">
              <div className="grid grid-cols-4 text-center relative">
                <div className="flex flex-col items-center z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getStepActive('placed') ? 'bg-sasta-gold text-sasta-heading' : 'bg-neutral-200 text-neutral-500'}`}>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold mt-2 text-sasta-heading">Order Placed</span>
                </div>

                <div className="flex flex-col items-center z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getStepActive('processing') ? 'bg-sasta-gold text-sasta-heading' : 'bg-neutral-200 text-neutral-500'}`}>
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold mt-2 text-sasta-heading">Processing</span>
                </div>

                <div className="flex flex-col items-center z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getStepActive('dispatched') ? 'bg-sasta-gold text-sasta-heading' : 'bg-neutral-200 text-neutral-500'}`}>
                    <Truck className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold mt-2 text-sasta-heading">Dispatched</span>
                </div>

                <div className="flex flex-col items-center z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getStepActive('delivered') ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-500'}`}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold mt-2 text-sasta-heading">Delivered</span>
                </div>
              </div>
            </div>

            {/* Delivery Destination & Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-sasta-border text-xs">
              <div>
                <h4 className="font-serif font-bold text-sm text-sasta-heading mb-2">
                  Delivery Address
                </h4>
                <p className="text-sasta-body leading-relaxed">
                  <strong>{order.customer.name}</strong><br />
                  {order.customer.address}<br />
                  {order.customer.city} {order.customer.postcode}<br />
                  {order.customer.email}
                </p>
              </div>

              <div>
                <h4 className="font-serif font-bold text-sm text-sasta-heading mb-2">
                  Payment Summary
                </h4>
                <div className="space-y-1 text-sasta-body">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>£{order.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>{order.shipping === 0 ? 'FREE' : `£${order.shipping?.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sasta-heading pt-1 border-t border-sasta-border/60">
                    <span>Total Paid:</span>
                    <span>£{order.total?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="pt-4 border-t border-sasta-border space-y-3">
              <h4 className="font-serif font-bold text-sm text-sasta-heading">
                Items in This Order ({order.items?.length})
              </h4>
              <div className="space-y-2">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded border border-sasta-border">
                    {item.image && (
                      <img src={item.image} alt={item.title} className="w-10 h-14 object-cover rounded" />
                    )}
                    <div className="flex-1 min-w-0 text-xs">
                      <p className="font-medium text-sasta-heading truncate">{item.title}</p>
                      <span className="text-sasta-muted">Size: {item.size || 'Standard'} &bull; Qty: {item.quantity}</span>
                    </div>
                    <span className="text-xs font-bold text-sasta-heading">
                      £{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
