import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  MapPin,
  Sparkles,
  ShieldCheck,
  Truck,
  Heart,
  Tag,
  ArrowRight,
  LogOut,
  Package,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import SEO from '../components/common/SEO';

export default function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, login, register, logout, updateProfile } = useAuth();

  // Mode: 'login' or 'register'
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState(initialMode);

  // Sync mode with URL
  useEffect(() => {
    const qMode = searchParams.get('mode');
    if (qMode === 'register') setMode('register');
    else if (qMode === 'login') setMode('login');
  }, [searchParams]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setSearchParams({ mode: newMode });
    setError('');
    setSuccessMsg('');
  };

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    rememberMe: true,
    newsletter: true,
    agreeTerms: true
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [registeredCoupon, setRegisteredCoupon] = useState('');

  // Customer Dashboard State (when logged in)
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressData, setAddressData] = useState({
    street: '',
    city: 'London',
    postalCode: '',
    country: 'United Kingdom'
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch orders if logged in
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      setAddressData(user.address || {
        street: '',
        city: 'London',
        postalCode: '',
        country: 'United Kingdom'
      });
      fetchUserOrders(user.email);
    }
  }, [isAuthenticated, user]);

  const fetchUserOrders = async (email) => {
    setLoadingOrders(true);
    try {
      const res = await api.getUserOrders(email);
      if (res.success && res.orders) {
        setUserOrders(res.orders);
      }
    } catch (e) {
      console.error('Error fetching user orders', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim() || !formData.password) {
      setError('Please provide your email address and password.');
      return;
    }

    setLoading(true);
    const res = await login(formData.email.trim(), formData.password);
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Signed in successfully! Welcome back.');
    } else {
      setError(res.message || 'Invalid credentials. Please verify your email and password.');
    }
  };

  // Quick Demo Login Helper
  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    const res = await login('ayesha.khan@example.co.uk', 'password123');
    setLoading(false);
    if (!res.success) {
      setError('Could not sign into demo account.');
    }
  };

  // Handle Registration Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (!formData.agreeTerms) {
      setError('Please agree to the Terms & Conditions to proceed.');
      return;
    }

    setLoading(true);
    const res = await register({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      password: formData.password,
      newsletter: formData.newsletter
    });
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Account created successfully! Welcome to Sasta Bazaar.');
      setRegisteredCoupon(res.couponCode || 'WELCOME10');
    } else {
      setError(res.message || 'Registration failed. An account may already exist with this email.');
    }
  };

  // Save Address handler
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    const res = await updateProfile({ address: addressData });
    if (res.success) {
      setIsEditingAddress(false);
    }
  };

  // ==========================================
  // VIEW: LOGGED IN CUSTOMER DASHBOARD
  // ==========================================
  if (isAuthenticated && user) {
    return (
      <div className="bg-neutral-50 min-h-screen py-8 sm:py-14 text-sasta-heading">
        <SEO
          title={`My Account | ${user.name} | SASTA BAZAAR UK`}
          description="Manage your Sasta Bazaar customer account, track recent UK ethnic wear orders, view saved delivery addresses and access VIP promo discounts."
          keywords="sasta bazaar account, customer profile, ethnic clothes orders uk, my orders"
          canonical="/account"
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Welcome Header */}
          <div className="bg-white rounded-xl border border-sasta-border p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-sasta-yellow-cream border-2 border-sasta-gold flex items-center justify-center text-sasta-navy font-serif font-bold text-xl sm:text-2xl shadow-2xs">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-sasta-heading">
                    Welcome back, {user.name}!
                  </h1>
                  <span className="hidden sm:inline-block bg-sasta-yellow-light text-sasta-gold-dark text-[10px] font-bold px-2 py-0.5 rounded-full border border-sasta-border uppercase tracking-wider">
                    VIP Member
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-sasta-muted mt-1 flex items-center gap-2">
                  <span>{user.email}</span>
                  {user.phone && <span>&bull; {user.phone}</span>}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/shop"
                className="bg-sasta-gold hover:bg-sasta-gold-hover text-sasta-heading font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-md shadow-xs transition-colors flex items-center gap-2"
              >
                <span>Continue Shopping</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 border border-sasta-border hover:bg-rose-50 hover:text-rose-600 text-sasta-body text-xs font-semibold px-4 py-2.5 rounded-md transition-colors"
                title="Sign out of your account"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Account Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-sasta-border shadow-2xs">
              <div className="flex items-center justify-between text-sasta-muted mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
                <Package className="w-4 h-4 text-sasta-gold-dark" />
              </div>
              <div className="text-2xl font-serif font-bold text-sasta-heading">
                {userOrders.length}
              </div>
              <p className="text-[11px] text-sasta-muted mt-1">
                Dispatched via Royal Mail UK Tracked
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-sasta-border shadow-2xs">
              <div className="flex items-center justify-between text-sasta-muted mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Active Promo Code</span>
                <Tag className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-lg font-bold text-sasta-navy font-mono">
                WELCOME10
              </div>
              <p className="text-[11px] text-emerald-700 font-medium mt-1">
                10% off your purchase at checkout
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-sasta-border shadow-2xs">
              <div className="flex items-center justify-between text-sasta-muted mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Store Origin</span>
                <MapPin className="w-4 h-4 text-sasta-gold-dark" />
              </div>
              <div className="text-sm font-bold text-sasta-heading flex items-center gap-1.5">
                <span>London, United Kingdom</span>
                <span>🇬🇧</span>
              </div>
              <p className="text-[11px] text-sasta-muted mt-1">
                All prices processed in British Pounds (£)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Order History */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-sasta-border p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-sasta-border">
                  <div>
                    <h2 className="font-serif text-lg font-bold text-sasta-heading">
                      Order History &amp; Royal Mail Tracking
                    </h2>
                    <p className="text-xs text-sasta-muted mt-0.5">
                      Review previous purchases and track your parcels in real-time.
                    </p>
                  </div>
                  <Link
                    to="/track-order"
                    className="text-xs font-bold text-sasta-navy hover:text-sasta-gold-dark flex items-center gap-1"
                  >
                    <span>Courier Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                {loadingOrders ? (
                  <div className="py-10 text-center text-xs text-sasta-muted">
                    Loading your orders...
                  </div>
                ) : userOrders.length > 0 ? (
                  <div className="space-y-4">
                    {userOrders.map((order) => (
                      <div
                        key={order.orderId}
                        className="border border-sasta-border rounded-lg p-4 bg-sasta-yellow-cream/20 hover:border-sasta-gold transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-sasta-border/60">
                          <div>
                            <span className="font-mono font-bold text-xs text-sasta-navy">
                              {order.orderId}
                            </span>
                            <span className="text-[11px] text-sasta-muted ml-3">
                              {new Date(order.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                order.orderStatus === 'Dispatched'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {order.orderStatus}
                            </span>
                            <span className="font-bold text-xs text-sasta-heading">
                              £{order.total?.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="py-3 space-y-2">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-xs">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="w-10 h-12 object-cover rounded border border-sasta-border"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sasta-heading truncate">
                                  {item.title}
                                </p>
                                <p className="text-[11px] text-sasta-muted">
                                  Size: {item.size || 'Standard'} &bull; Qty: {item.quantity}
                                </p>
                              </div>
                              <span className="font-semibold text-sasta-heading">
                                £{(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Tracking Link */}
                        <div className="pt-2.5 border-t border-sasta-border/60 flex items-center justify-between text-xs">
                          <span className="text-sasta-muted text-[11px]">
                            Tracking:{' '}
                            <strong className="text-sasta-heading font-mono">
                              {order.trackingNumber || 'Pending Dispatch'}
                            </strong>
                          </span>
                          <Link
                            to={`/track-order?orderId=${order.orderId}`}
                            className="inline-flex items-center gap-1 font-bold text-sasta-navy hover:text-sasta-gold-dark"
                          >
                            <span>Live Status</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-3">
                    <Package className="w-10 h-10 text-sasta-gold-dark/60 mx-auto" />
                    <p className="text-sm font-semibold text-sasta-heading">
                      No orders placed yet
                    </p>
                    <p className="text-xs text-sasta-muted max-w-sm mx-auto">
                      Explore our handcrafted ladies suits, celebratory lehengas, and kids collections.
                    </p>
                    <Link
                      to="/shop"
                      className="inline-block bg-sasta-gold hover:bg-sasta-gold-hover text-sasta-heading font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded shadow-xs"
                    >
                      Start Shopping
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Col: Saved UK Shipping Address */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-sasta-border p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-sasta-border">
                  <h3 className="font-serif text-base font-bold text-sasta-heading">
                    Delivery Address
                  </h3>
                  <button
                    onClick={() => setIsEditingAddress(!isEditingAddress)}
                    className="text-xs font-bold text-sasta-gold-dark hover:underline"
                  >
                    {isEditingAddress ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                {isEditingAddress ? (
                  <form onSubmit={handleSaveAddress} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-sasta-muted mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={addressData.street}
                        onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
                        placeholder="e.g. 14 Kensington High St"
                        className="w-full px-3 py-2 border border-sasta-border rounded focus:outline-none focus:border-sasta-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-sasta-muted mb-1">
                        City / Town
                      </label>
                      <input
                        type="text"
                        value={addressData.city}
                        onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                        className="w-full px-3 py-2 border border-sasta-border rounded focus:outline-none focus:border-sasta-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-sasta-muted mb-1">
                        UK Postcode
                      </label>
                      <input
                        type="text"
                        value={addressData.postalCode}
                        onChange={(e) => setAddressData({ ...addressData, postalCode: e.target.value })}
                        placeholder="e.g. W8 4EP"
                        className="w-full px-3 py-2 border border-sasta-border rounded focus:outline-none focus:border-sasta-gold uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-sasta-muted mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        disabled
                        value="United Kingdom"
                        className="w-full px-3 py-2 border border-sasta-border rounded bg-neutral-100 text-sasta-muted cursor-not-allowed"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-sasta-navy text-white font-bold py-2 rounded text-xs hover:bg-neutral-800 transition-colors mt-2"
                    >
                      Save Address
                    </button>
                  </form>
                ) : (
                  <div className="space-y-2 text-xs text-sasta-body">
                    <p className="font-semibold text-sasta-heading">{user.name}</p>
                    <p>{user.address?.street || 'No street address saved'}</p>
                    <p>
                      {user.address?.city || 'London'}
                      {user.address?.postalCode ? `, ${user.address.postalCode}` : ''}
                    </p>
                    <p className="font-medium text-sasta-navy">
                      {user.address?.country || 'United Kingdom 🇬🇧'}
                    </p>
                    <p className="text-sasta-muted pt-2 text-[11px]">
                      Phone: {user.phone || 'Not provided'}
                    </p>
                  </div>
                )}
              </div>

              {/* Support & Assistance Card */}
              <div className="bg-sasta-yellow-cream/50 rounded-xl border border-sasta-border p-5 text-xs space-y-3">
                <div className="flex items-center gap-2 text-sasta-navy font-serif font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-sasta-gold-dark" />
                  <span>London Customer Concierge</span>
                </div>
                <p className="text-sasta-body leading-relaxed text-[11px]">
                  Need help with custom stitching, sizing adjustments, or an existing order? Our London customer team is available Monday to Saturday.
                </p>
                <div className="pt-1 flex flex-col gap-1.5">
                  <Link
                    to="/customization"
                    className="text-sasta-navy hover:text-sasta-gold-dark font-bold inline-flex items-center gap-1"
                  >
                    <span>Request Custom Alterations</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                  <Link
                    to="/contact"
                    className="text-sasta-navy hover:text-sasta-gold-dark font-bold inline-flex items-center gap-1"
                  >
                    <span>Send Support Inquiry</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: SPLIT-SCREEN LOGIN & REGISTRATION
  // ==========================================
  return (
    <div className="min-h-screen bg-white">
      <SEO
        title={mode === 'register' ? 'Create Account | Get 10% Off | SASTA BAZAAR UK' : 'Sign In | Customer Account | SASTA BAZAAR UK'}
        description="Sign in or register for Sasta Bazaar - Everyday Luxury. London-based ladies and kids ethnic fashion store. Get 10% off your first order with code WELCOME10."
        keywords="sasta bazaar login, create account, pakistani suits uk sign in, ladies ethnic wear london login, modest fashion registration"
        canonical={mode === 'register' ? '/register' : '/login'}
      />

      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12">
        {/* ========================================================= */}
        {/* LEFT SIDE: BRAND SHOWCASE & LOCATION HERITAGE (LONDON, UK) */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 bg-sasta-yellow-light border-b lg:border-b-0 lg:border-r border-sasta-border p-6 sm:p-10 lg:p-14 flex flex-col justify-between animate-slide-left">
          <div className="space-y-6 sm:space-y-8">
            {/* Brand Logo & Title */}
            <div className="space-y-4">
              <Link to="/" className="inline-block group">
                <img
                  src="/logo.png"
                  alt="SASTA BAZAAR - Everyday Luxury"
                  className="h-20 sm:h-24 md:h-28 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </Link>

              <div>
                <span className="text-[10px] font-bold tracking-[0.25em] text-sasta-gold-dark uppercase block mb-1">
                  Everyday Luxury &bull; Ethnic Fashion
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-sasta-heading leading-tight">
                  SASTA BAZAAR
                </h2>
                <p className="text-xs sm:text-sm text-sasta-body mt-1">
                  Ladies &amp; Kids South Asian Ethnic Fashion
                </p>
              </div>
            </div>

            {/* UK Origin & Location Badge */}
            <div className="bg-white p-4 rounded-xl border border-sasta-border shadow-2xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">🇬🇧</span>
                <div>
                  <h3 className="font-serif text-sm font-bold text-sasta-navy">
                    Proudly Based in London, United Kingdom
                  </h3>
                  <p className="text-[11px] text-sasta-muted">
                    Fast tracked Royal Mail dispatch throughout the UK
                  </p>
                </div>
              </div>
              <p className="text-xs text-sasta-body leading-relaxed pt-1 border-t border-sasta-border/60">
                Operating directly from London, we bring you high-grade Pakistani and Indian ethnic garments without the expensive boutique markups. All transactions are securely processed in <strong>British Pounds (GBP £)</strong>.
              </p>
            </div>

            {/* Exclusive VIP Perks */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-sasta-muted">
                Member Benefits &amp; Privileges
              </h4>

              <div className="space-y-2.5 text-xs text-sasta-heading">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-sasta-yellow-cream border border-sasta-gold flex items-center justify-center shrink-0 mt-0.5">
                    <Tag className="w-3 h-3 text-sasta-gold-dark" />
                  </div>
                  <div>
                    <span className="font-bold text-sasta-navy">10% Off First Order:</span>
                    <span className="text-sasta-body ml-1">
                      Receive coupon code <strong className="font-mono text-sasta-heading">WELCOME10</strong> immediately upon registration.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-sasta-yellow-cream border border-sasta-gold flex items-center justify-center shrink-0 mt-0.5">
                    <Truck className="w-3 h-3 text-sasta-gold-dark" />
                  </div>
                  <div>
                    <span className="font-bold text-sasta-navy">Live Royal Mail Tracking:</span>
                    <span className="text-sasta-body ml-1">
                      Monitor delivery progress from our depot straight to your doorstep.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-sasta-yellow-cream border border-sasta-gold flex items-center justify-center shrink-0 mt-0.5">
                    <Heart className="w-3 h-3 text-sasta-gold-dark" />
                  </div>
                  <div>
                    <span className="font-bold text-sasta-navy">Saved Wishlist &amp; Fast Checkout:</span>
                    <span className="text-sasta-body ml-1">
                      Store favorite suits and enjoy seamless 1-click checkout.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Testimonial */}
            <div className="bg-sasta-yellow-cream/60 border border-sasta-border p-4 rounded-xl text-xs space-y-2">
              <div className="flex text-amber-500 gap-0.5 text-xs">
                {'★'.repeat(5)}
              </div>
              <p className="italic text-sasta-heading font-serif text-[12px] leading-relaxed">
                &ldquo;Finding ready-to-wear stitched Pakistani suits in the UK with this kind of fabric quality at £9.99 &ndash; £25 is impossible elsewhere. Dispatched from London and arrived in 48 hours!&rdquo;
              </p>
              <div className="flex items-center justify-between text-[11px] text-sasta-muted pt-1">
                <span className="font-bold text-sasta-navy">&mdash; Ayesha K.</span>
                <span className="text-emerald-700 font-semibold">Verified UK Buyer &bull; Birmingham</span>
              </div>
            </div>
          </div>

          {/* Bottom Trust Guarantee */}
          <div className="pt-6 border-t border-sasta-border/80 text-[11px] text-sasta-muted flex items-center justify-between gap-4">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-sasta-gold-dark" />
              <span>100% Genuine Fabrics</span>
            </span>
            <span>&bull;</span>
            <span>Free UK Delivery &gt; £40</span>
            <span>&bull;</span>
            <span>14-Day Returns</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT SIDE: INTERACTIVE LOGIN & REGISTRATION FORMS */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-16 flex flex-col justify-center max-w-xl mx-auto w-full animate-slide-right">
          {/* Form Switcher Tabs */}
          <div className="flex border-b border-sasta-border mb-8">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`pb-3.5 text-sm sm:text-base font-bold uppercase tracking-wider flex-1 text-center transition-all border-b-2 ${
                mode === 'login'
                  ? 'border-sasta-navy text-sasta-navy'
                  : 'border-transparent text-sasta-muted hover:text-sasta-heading'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`pb-3.5 text-sm sm:text-base font-bold uppercase tracking-wider flex-1 text-center transition-all border-b-2 ${
                mode === 'register'
                  ? 'border-sasta-navy text-sasta-navy'
                  : 'border-transparent text-sasta-muted hover:text-sasta-heading'
              }`}
            >
              Create Account
              <span className="ml-1.5 hidden sm:inline-block bg-sasta-gold text-sasta-heading text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                10% OFF
              </span>
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Alert */}
          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
              {registeredCoupon && (
                <div className="bg-white p-2.5 rounded border border-emerald-200 flex items-center justify-between text-xs">
                  <span>Your 10% Discount Code:</span>
                  <span className="font-mono font-bold text-sasta-navy bg-sasta-yellow-light px-2 py-0.5 rounded border border-sasta-border">
                    {registeredCoupon}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* --------------------------------------------------------- */}
          {/* MODE 1: SIGN IN FORM */}
          {/* --------------------------------------------------------- */}
          {mode === 'login' ? (
            <form key="login-form" onSubmit={handleLoginSubmit} className="space-y-5 animate-slide-right">
              <div>
                <h3 className="font-serif text-2xl font-bold text-sasta-heading">
                  Welcome to Your Account
                </h3>
                <p className="text-xs text-sasta-muted mt-1">
                  Access your orders, saved sizes, and member privileges.
                </p>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-sasta-heading">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sasta-muted">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="name@example.co.uk"
                    className="w-full pl-10 pr-3.5 py-3 border border-sasta-border rounded-lg text-sm bg-white focus:outline-none focus:border-sasta-gold transition-colors text-sasta-heading"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-sasta-heading">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Password reset link has been simulated. Please enter your registered email to receive reset instructions.')}
                    className="text-[11px] font-semibold text-sasta-gold-dark hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sasta-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-3 border border-sasta-border rounded-lg text-sm bg-white focus:outline-none focus:border-sasta-gold transition-colors text-sasta-heading"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-sasta-muted hover:text-sasta-heading"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="rounded border-sasta-border text-sasta-navy focus:ring-sasta-gold"
                  />
                  <span className="text-sasta-body">Keep me signed in</span>
                </label>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sasta-gold hover:bg-sasta-gold-hover text-sasta-heading font-bold text-xs uppercase tracking-wider py-3.5 rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Sign In to Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Quick Demo Login Option */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="w-full bg-white hover:bg-sasta-yellow-cream border border-sasta-border text-sasta-navy text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  
                  <span>⚡ Quick Demo Sign In (Ayesha Khan)</span>
                </button>
              </div>

              {/* Switch to Register */}
              <div className="pt-4 text-center border-t border-sasta-border">
                <p className="text-xs text-sasta-body">
                  New to Sasta Bazaar?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="font-bold text-sasta-navy hover:text-sasta-gold-dark hover:underline ml-1"
                  >
                    Create an account &amp; get 10% off &rarr;
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* --------------------------------------------------------- */
            /* MODE 2: REGISTRATION FORM */
            /* --------------------------------------------------------- */
            <form key="register-form" onSubmit={handleRegisterSubmit} className="space-y-4 animate-slide-right">
              <div>
                <h3 className="font-serif text-2xl font-bold text-sasta-heading">
                  Create Your Luxury Account
                </h3>
                <p className="text-xs text-sasta-muted mt-1">
                  Enjoy 10% off your first order, track Royal Mail deliveries &amp; save favorites.
                </p>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-sasta-heading">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sasta-muted">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Ayesha Khan"
                    className="w-full pl-10 pr-3.5 py-2.5 border border-sasta-border rounded-lg text-sm bg-white focus:outline-none focus:border-sasta-gold transition-colors text-sasta-heading"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-sasta-heading">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sasta-muted">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="name@example.co.uk"
                    className="w-full pl-10 pr-3.5 py-2.5 border border-sasta-border rounded-lg text-sm bg-white focus:outline-none focus:border-sasta-gold transition-colors text-sasta-heading"
                  />
                </div>
              </div>

              {/* UK Phone Number (Optional) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold uppercase tracking-wider text-sasta-heading">
                    UK Phone Number
                  </label>
                  <span className="text-[10px] text-sasta-muted">For courier delivery updates</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sasta-muted">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+44 7700 900000"
                    className="w-full pl-10 pr-3.5 py-2.5 border border-sasta-border rounded-lg text-sm bg-white focus:outline-none focus:border-sasta-gold transition-colors text-sasta-heading"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-sasta-heading">
                    Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-sasta-muted">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      minLength={6}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Min 6 chars"
                      className="w-full pl-9 pr-8 py-2.5 border border-sasta-border rounded-lg text-sm bg-white focus:outline-none focus:border-sasta-gold transition-colors text-sasta-heading"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-sasta-muted hover:text-sasta-heading"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-sasta-heading">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-sasta-muted">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Re-enter password"
                      className="w-full pl-9 pr-8 py-2.5 border border-sasta-border rounded-lg text-sm bg-white focus:outline-none focus:border-sasta-gold transition-colors text-sasta-heading"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-sasta-muted hover:text-sasta-heading"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-2 pt-2 text-xs">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="newsletter"
                    checked={formData.newsletter}
                    onChange={handleInputChange}
                    className="mt-0.5 rounded border-sasta-border text-sasta-navy focus:ring-sasta-gold"
                  />
                  <span className="text-sasta-body">
                    🎁 Email me exclusive discount code <strong>WELCOME10</strong> (10% off) &amp; VIP ethnic drop previews.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleInputChange}
                    className="mt-0.5 rounded border-sasta-border text-sasta-navy focus:ring-sasta-gold"
                  />
                  <span className="text-sasta-body">
                    I agree to Sasta Bazaar{' '}
                    <Link to="/terms-of-service" className="text-sasta-navy underline font-medium">
                      Terms
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy-policy" className="text-sasta-navy underline font-medium">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sasta-gold hover:bg-sasta-gold-hover text-sasta-heading font-bold text-xs uppercase tracking-wider py-3.5 rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
              >
                {loading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create My Luxury Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Switch to Login */}
              <div className="pt-4 text-center border-t border-sasta-border">
                <p className="text-xs text-sasta-body">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="font-bold text-sasta-navy hover:text-sasta-gold-dark hover:underline ml-1"
                  >
                    Sign In here &rarr;
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
