import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  CheckCircle,
  Tag,
  Lock
} from 'lucide-react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

function StripePaymentForm({ orderId, total, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const recoveredSecret = React.useRef('');
  const successHandler = React.useRef(onSuccess);
  successHandler.current = onSuccess;

  useEffect(() => {
    const secret = new URLSearchParams(window.location.search).get('payment_intent_client_secret');
    if (!stripe || !secret || recoveredSecret.current === secret) return;
    recoveredSecret.current = secret;
    stripe.retrievePaymentIntent(secret).then(({ paymentIntent, error: retrieveError }) => {
      if (retrieveError) setError(retrieveError.message || 'Unable to verify the payment.');
      else if (paymentIntent?.status === 'succeeded') successHandler.current(paymentIntent);
    }).catch(() => setError('Unable to verify the payment. Please contact store support.'));
  }, [stripe]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError('');
    let result;
    try {
      result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/cart?orderId=${encodeURIComponent(orderId)}`
        },
        redirect: 'if_required'
      });
    } catch {
      setSubmitting(false);
      setError('Payment could not be completed. Please try again.');
      return;
    }
    setSubmitting(false);
    if (result.error) {
      setError(result.error.message || 'Payment could not be completed.');
      return;
    }
    if (result.paymentIntent?.status === 'succeeded') {
      successHandler.current(result.paymentIntent);
    } else if (result.paymentIntent?.status === 'processing') {
      setError('Your payment is processing. Please wait for confirmation before trying again.');
    } else {
      setError('Payment was not completed. Please check your payment details and try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      <PaymentElement />
      {error && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}
      <div className="flex justify-between border-t border-sasta-border pt-3 font-bold text-sm">
        <span>Total to Pay</span>
        <span>£{total.toFixed(2)}</span>
      </div>
      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="w-full bg-sasta-gold hover:bg-sasta-gold-hover text-sasta-heading font-bold text-xs uppercase tracking-wider py-3.5 rounded shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
      >
        <Lock className="w-4 h-4" />
        <span>{submitting ? 'Processing Payment...' : `Pay £${total.toFixed(2)}`}</span>
      </button>
    </form>
  );
}

export default function CartPage() {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    freeShippingRemaining,
    freeShippingProgress
  } = useCart();

  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');
  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart', 'checkout', 'confirmed'
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [payment, setPayment] = useState(null);

  // Customer Checkout Details
  const { user } = useAuth();
  const [customer, setCustomer] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address?.street || '',
    city: user?.address?.city || 'London',
    postcode: user?.address?.postalCode || ''
  });

  React.useEffect(() => {
    if (user) {
      setCustomer(prev => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
        address: prev.address || user.address?.street || '',
        city: prev.city || user.address?.city || 'London',
        postcode: prev.postcode || user.address?.postalCode || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const clientSecret = params.get('payment_intent_client_secret');
    const orderId = params.get('orderId');
    if (clientSecret && orderId) {
      setPayment({ clientSecret, orderId, total: 0 });
      setCheckoutStep('checkout');
    }
  }, []);

  const applyPromo = (e) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'WELCOME10') {
      const discount = subtotal * 0.10;
      setDiscountAmount(discount);
      setPromoMessage('Promo WELCOME10 applied (10% discount)');
    } else {
      setDiscountAmount(0);
      setPromoMessage('Invalid promo code. Try WELCOME10');
    }
  };

  const shippingCost = freeShippingRemaining <= 0 ? 0 : 3.99;
  const grandTotal = Math.max(0, subtotal - discountAmount + (cartItems.length > 0 ? shippingCost : 0));

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setCheckoutError('');
    setLoading(true);
    try {
      const result = await api.createPaymentIntent({
        customer,
        items: cartItems.map((item) => ({
          productId: item.id,
          variantId: item.variantId,
          size: item.size,
          color: item.color,
          quantity: item.quantity
        })),
        promoCode,
        shippingMethod: freeShippingRemaining <= 0 ? 'free' : 'standard'
      });
      setPayment({ clientSecret: result.clientSecret, orderId: result.orderId, total: result.total });
    } catch (error) {
      setCheckoutError(error.message || 'Unable to start secure checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = useCallback((paymentIntent) => {
    setConfirmedOrder({
      orderId: payment?.orderId || new URLSearchParams(window.location.search).get('orderId'),
      total: (paymentIntent.amount_received || paymentIntent.amount || Math.round(payment?.total * 100)) / 100,
      customer
    });
    setCheckoutStep('confirmed');
    clearCart();
    window.history.replaceState({}, '', '/cart');
  }, [payment, customer, clearCart]);

  return (
    <div className="bg-white min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-[10px] font-bold tracking-[0.25em] text-sasta-gold-dark uppercase block mb-1">
            {checkoutStep === 'confirmed' ? 'Purchase Complete' : checkoutStep === 'checkout' ? 'Fast Secure Checkout' : 'Review Your Order'}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-sasta-heading">
            {checkoutStep === 'confirmed' ? 'Order Confirmed!' : checkoutStep === 'checkout' ? 'Customer Details & Delivery' : 'Shopping Bag'}
          </h1>
        </div>

        {/* STEP 3: ORDER CONFIRMED */}
        {checkoutStep === 'confirmed' && confirmedOrder && (
          <div className="max-w-md mx-auto text-center py-12 px-6 bg-sasta-yellow-cream/60 rounded-xl border border-sasta-border shadow-xs space-y-5 animate-fade-in">
            <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto" />
            <h2 className="font-serif text-2xl font-bold text-sasta-heading">
              Thank You, {confirmedOrder.customer?.name}!
            </h2>
            <p className="text-xs sm:text-sm text-sasta-body leading-relaxed">
              Your payment is confirmed. We will prepare your tracked UK delivery shortly.
            </p>
            <div className="p-4 bg-white rounded-lg border border-sasta-border text-xs space-y-1 text-left">
              <div className="flex justify-between">
                <span className="text-sasta-muted">Order ID:</span>
                <strong className="text-sasta-navy font-mono text-sm">{confirmedOrder.orderId}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-sasta-muted">Total Paid:</span>
                <strong>£{confirmedOrder.total?.toFixed(2)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-sasta-muted">Carrier:</span>
                <span>Royal Mail Tracked 48</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <Link
                to={`/track-order?id=${encodeURIComponent(confirmedOrder.orderId)}&email=${encodeURIComponent(confirmedOrder.customer?.email || '')}`}
                className="w-full bg-sasta-navy hover:bg-sasta-navy-light text-white text-xs font-bold uppercase tracking-wider py-3 rounded-md shadow-xs transition-colors"
              >
                Track Live Order Status &rarr;
              </Link>
              <Link
                to="/shop"
                className="w-full bg-sasta-gold hover:bg-sasta-gold-hover text-sasta-heading text-xs font-bold uppercase tracking-wider py-3 rounded-md shadow-xs transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}

        {/* STEP 2: CHECKOUT FORM */}
        {checkoutStep === 'checkout' && (
          <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-xl border border-sasta-border shadow-xs space-y-6 animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-sasta-border">
              <h3 className="font-serif font-bold text-lg text-sasta-heading">
                Delivery &amp; Contact Information
              </h3>
              {!payment && (
                <button
                  onClick={() => setCheckoutStep('cart')}
                  className="text-xs text-sasta-gold-dark font-semibold hover:underline"
                >
                  &larr; Back to Bag
                </button>
              )}
            </div>

            {!payment ? <form onSubmit={handlePlaceOrder} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    placeholder="e.g. Fatima Khan"
                    className="w-full bg-sasta-yellow-cream/30 border border-sasta-border rounded p-2.5 outline-none focus:border-sasta-gold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    placeholder="name@example.co.uk"
                    className="w-full bg-sasta-yellow-cream/30 border border-sasta-border rounded p-2.5 outline-none focus:border-sasta-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Mobile / Telephone</label>
                  <input
                    type="tel"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    placeholder="+44 7700 900123"
                    className="w-full bg-sasta-yellow-cream/30 border border-sasta-border rounded p-2.5 outline-none focus:border-sasta-gold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">City / Town *</label>
                  <input
                    type="text"
                    required
                    value={customer.city}
                    onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                    placeholder="e.g. London / Birmingham"
                    className="w-full bg-sasta-yellow-cream/30 border border-sasta-border rounded p-2.5 outline-none focus:border-sasta-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Street Address *</label>
                <input
                  type="text"
                  required
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                  placeholder="House number, street name"
                  className="w-full bg-sasta-yellow-cream/30 border border-sasta-border rounded p-2.5 outline-none focus:border-sasta-gold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">UK Postcode *</label>
                <input
                  type="text"
                  required
                  value={customer.postcode}
                  onChange={(e) => setCustomer({ ...customer, postcode: e.target.value })}
                  placeholder="e.g. E1 6AN"
                  className="w-full bg-sasta-yellow-cream/30 border border-sasta-border rounded p-2.5 outline-none focus:border-sasta-gold uppercase"
                />
              </div>

              {/* Order Final Summary */}
              <div className="p-4 bg-sasta-yellow-cream/70 rounded-lg border border-sasta-border space-y-1.5 pt-3">
                <div className="flex justify-between">
                  <span>Items Total ({cartItems.length}):</span>
                  <span>£{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount (WELCOME10):</span>
                    <span>-£{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tracked UK Shipping:</span>
                  <span>{shippingCost === 0 ? 'FREE' : `£${shippingCost.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-sasta-heading pt-2 border-t border-sasta-border">
                  <span>Total to Pay:</span>
                  <span>£{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {checkoutError && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{checkoutError}</p>}
              {!stripePromise && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-red-700">Secure card payments are not configured. Please contact store support.</p>}
              <button
                type="submit"
                disabled={loading || !stripePromise}
                className="w-full bg-sasta-gold hover:bg-sasta-gold-hover text-sasta-heading font-bold text-xs uppercase tracking-wider py-3.5 rounded shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>{loading ? 'Preparing Secure Payment...' : 'Continue to Secure Payment'}</span>
              </button>
            </form> : (
              stripePromise ? (
                <Elements stripe={stripePromise} options={{ clientSecret: payment.clientSecret }}>
                  <StripePaymentForm
                    orderId={payment.orderId}
                    total={payment.total}
                    onSuccess={handlePaymentSuccess}
                  />
                </Elements>
              ) : <p role="alert" className="text-red-700">Secure card payments are not configured.</p>
            )}
          </div>
        )}

        {/* STEP 1: CART ITEMS VIEW */}
        {checkoutStep === 'cart' && (
          cartItems.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              {/* Items List */}
              <div className="lg:col-span-8 space-y-6">
                {/* Free Delivery Bar */}
                <div className="bg-sasta-yellow-light/60 p-4 rounded-lg border border-sasta-border text-xs">
                  {freeShippingRemaining > 0 ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sasta-heading font-medium">
                        <span className="flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-sasta-gold-dark" />
                          Add <strong className="text-sasta-navy font-bold">£{freeShippingRemaining.toFixed(2)}</strong> more to unlock FREE UK Delivery
                        </span>
                        <span className="font-bold">{Math.round(freeShippingProgress)}%</span>
                      </div>
                      <div className="w-full bg-sasta-border/50 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-sasta-gold h-full rounded-full transition-all duration-500"
                          style={{ width: `${freeShippingProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                      <Truck className="w-4 h-4 text-emerald-600" />
                      <span>🎉 You've qualified for FREE Tracked UK Delivery!</span>
                    </div>
                  )}
                </div>

                {/* Items Table */}
                <div className="border border-sasta-border rounded-lg overflow-hidden divide-y divide-sasta-border bg-white">
                  {cartItems.map((item) => (
                    <div key={item.itemKey} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Link to={`/product/${item.handle}`} className="shrink-0 w-20 h-28 bg-neutral-100 rounded overflow-hidden">
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        </Link>
                        <div>
                          <Link
                            to={`/product/${item.handle}`}
                            className="font-medium text-sm sm:text-base text-sasta-heading hover:text-sasta-gold-dark line-clamp-2"
                          >
                            {item.title}
                          </Link>
                          <div className="flex flex-wrap gap-2 text-xs text-sasta-muted mt-1.5">
                            {item.size && (
                              <span className="bg-sasta-yellow-cream px-2 py-0.5 rounded border border-sasta-border/60">
                                Size: {item.size}
                              </span>
                            )}
                            {item.color && (
                              <span className="bg-sasta-yellow-cream px-2 py-0.5 rounded border border-sasta-border/60">
                                Color: {item.color}
                              </span>
                            )}
                          </div>
                          <div className="sm:hidden font-bold text-sm text-sasta-heading mt-2">
                            £{item.price.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-sasta-border/50">
                        {/* Qty */}
                        <div className="flex items-center border border-sasta-border rounded bg-white">
                          <button
                            onClick={() => updateQuantity(item.itemKey, item.quantity - 1)}
                            className="p-1.5 hover:bg-neutral-100 text-sasta-heading"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 text-xs font-bold text-sasta-heading">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.itemKey, item.quantity + 1)}
                            className="p-1.5 hover:bg-neutral-100 text-sasta-heading"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Total Line Price */}
                        <div className="text-right min-w-[70px]">
                          <span className="font-bold text-sm sm:text-base text-sasta-heading">
                            £{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeFromCart(item.itemKey)}
                          className="text-sasta-muted hover:text-red-600 p-1 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-sasta-yellow-cream/60 border border-sasta-border rounded-lg p-6 space-y-4 shadow-xs">
                  <h3 className="font-serif font-bold text-base text-sasta-heading pb-3 border-b border-sasta-border">
                    Order Summary
                  </h3>

                  <div className="space-y-2.5 text-xs text-sasta-body">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-semibold text-sasta-heading">£{subtotal.toFixed(2)}</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-800 font-semibold">
                        <span>Promo Discount</span>
                        <span>-£{discountAmount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>Estimated UK Delivery</span>
                      <span>{shippingCost === 0 ? <strong className="text-emerald-700">FREE</strong> : `£${shippingCost.toFixed(2)}`}</span>
                    </div>

                    <div className="pt-3 border-t border-sasta-border flex justify-between text-base font-bold text-sasta-heading">
                      <span>Total (GBP)</span>
                      <span>£{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Promo Code Input */}
                  <form onSubmit={applyPromo} className="pt-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Promo Code (e.g. WELCOME10)"
                        className="flex-1 bg-white border border-sasta-border rounded px-3 py-2 text-xs uppercase focus:outline-none focus:border-sasta-gold"
                      />
                      <button
                        type="submit"
                        className="bg-sasta-navy text-white text-xs font-bold uppercase px-3 py-2 rounded hover:bg-sasta-navy-light transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                    {promoMessage && (
                      <p className={`text-[11px] mt-1.5 font-medium ${discountAmount > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {promoMessage}
                      </p>
                    )}
                  </form>

                  {/* Checkout CTA */}
                  <div className="pt-2">
                    <button
                      onClick={() => setCheckoutStep('checkout')}
                      className="w-full bg-sasta-gold hover:bg-sasta-gold-hover text-sasta-heading font-bold text-xs uppercase tracking-wider py-3.5 rounded shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-center pt-2">
                    <span className="text-[11px] text-sasta-muted flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-sasta-gold-dark" />
                      Guaranteed Safe &amp; Secure Checkout
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto text-center py-20 px-4 space-y-4">
              <div className="w-20 h-20 rounded-full bg-sasta-yellow-soft flex items-center justify-center mx-auto text-sasta-gold-dark">
                <ShoppingBag className="w-10 h-10" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-sasta-heading">
                Your Shopping Bag is Empty
              </h2>
              <p className="text-xs sm:text-sm text-sasta-body leading-relaxed">
                Looks like you haven't added anything to your bag yet. Explore our latest ethnic arrivals and festive collections!
              </p>
              <div className="pt-2">
                <Link
                  to="/shop"
                  className="inline-block bg-sasta-gold hover:bg-sasta-gold-hover text-sasta-heading text-xs font-bold uppercase tracking-wider px-8 py-3 rounded shadow-xs transition-colors"
                >
                  Start Exploring
                </Link>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
