import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Instagram, Facebook, Send, ShieldCheck, Check } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setSubscribed(true);
  };

  return (
    <footer className="bg-sasta-yellow-light border-t border-sasta-border text-sasta-body transition-colors">
      {/* Newsletter Strip */}
      <div className="border-b border-sasta-border/70 py-10 px-4 sm:px-6 bg-sasta-yellow-soft/50">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <span className="text-[11px] font-bold tracking-[0.2em] text-sasta-gold-dark uppercase block">
            Join the Sasta Bazaar Family
          </span>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-sasta-heading">
            Subscribe &amp; Receive 10% Off Your First Order
          </h3>
          <p className="text-xs sm:text-sm text-sasta-body max-w-xl mx-auto leading-relaxed">
            Subscribe to get special offers, free giveaways, exclusive previews, and once-in-a-lifetime deals.
          </p>

          <form onSubmit={handleSubscribe} className="max-w-md mx-auto pt-2 flex gap-2">
            {subscribed ? (
              <div className="w-full bg-emerald-100 text-emerald-800 text-xs font-semibold py-3 px-4 rounded-md flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Thank you! Check your inbox for your 10% discount code.</span>
              </div>
            ) : (
              <>
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sasta-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address..."
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-sasta-border rounded-md text-xs text-sasta-heading placeholder-sasta-muted focus:outline-none focus:border-sasta-gold"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-sasta-gold hover:bg-sasta-gold-hover text-sasta-heading text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-md shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <span>Subscribe</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </form>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Column 1: Brand Blurb */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block mb-1">
              <img
                src="/logo.png"
                alt="SASTA BAZAAR - Everyday Luxury"
                className="h-16 w-auto object-contain"
              />
            </Link>
            <p className="text-xs sm:text-sm text-sasta-body leading-relaxed max-w-sm">
              Born from the universal desire for graceful, modest ethnic fashion at honest prices.
              We specialize in ladies and kids ethnic suits, designer lehengas, festive shararas,
              and double-stitched jersey hijabs with fast tracked UK shipping.
            </p>
            <div className="pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sasta-heading block mb-2">
                Connect With Us
              </span>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white border border-sasta-border flex items-center justify-center text-sasta-heading hover:bg-sasta-gold hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://www.facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white border border-sasta-border flex items-center justify-center text-sasta-heading hover:bg-sasta-gold hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href="mailto:support@sastabazaarclothing.com"
                  className="w-8 h-8 rounded-full bg-white border border-sasta-border flex items-center justify-center text-sasta-heading hover:bg-sasta-gold hover:text-white transition-colors"
                  aria-label="Email support"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-sm text-sasta-heading uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/login" className="hover:text-sasta-gold-dark transition-colors font-medium text-sasta-navy">
                  Customer Sign In &amp; Register (10% Off)
                </Link>
              </li>
              <li>
                <Link to="/size-guide" className="hover:text-sasta-gold-dark transition-colors">
                  Size Guide &amp; Measurements
                </Link>
              </li>
              <li>
                <Link to="/track-order" className="hover:text-sasta-gold-dark transition-colors font-medium">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link to="/faqs" className="hover:text-sasta-gold-dark transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link to="/customization" className="hover:text-sasta-gold-dark transition-colors">
                  Customization &amp; Stitching
                </Link>
              </li>
              <li>
                <Link to="/care-instructions" className="hover:text-sasta-gold-dark transition-colors">
                  Care Instructions
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Policies */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-sm text-sasta-heading uppercase tracking-wider">
              Legal &amp; Policies
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/privacy-policy" className="hover:text-sasta-gold-dark transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/shipping-policy" className="hover:text-sasta-gold-dark transition-colors">
                  Shipping &amp; Delivery
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="hover:text-sasta-gold-dark transition-colors">
                  Returns &amp; Exchanges
                </Link>
              </li>
              <li>
                <Link to="/cookie-policy" className="hover:text-sasta-gold-dark transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="hover:text-sasta-gold-dark transition-colors">
                  Terms &amp; Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Our Company */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-sm text-sasta-heading uppercase tracking-wider">
              Our Company
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/about" className="hover:text-sasta-gold-dark transition-colors">
                  About Sasta Bazaar
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-sasta-gold-dark transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-sasta-gold-dark transition-colors">
                  All Collections
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-sasta-gold-dark transition-colors">
                  My Wishlist
                </Link>
              </li>
            </ul>
            <div className="pt-2 text-xs text-sasta-body">
              <span className="font-semibold block text-sasta-heading">Store Enquiries:</span>
              <span>support@sastabazaarclothing.com</span>
            </div>
          </div>
        </div>

        {/* Payment Icons and Copyright */}
        <div className="mt-12 pt-6 border-t border-sasta-border/70 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-sasta-muted">
          <div>
            &copy; {new Date().getFullYear()} SASTA BAZAAR - Everyday Luxury. All Rights Reserved.
          </div>

          {/* Payment Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-semibold text-neutral-600">
            <span className="bg-white border border-sasta-border px-2 py-1 rounded shadow-xs">
              VISA
            </span>
            <span className="bg-white border border-sasta-border px-2 py-1 rounded shadow-xs">
              Mastercard
            </span>
            <span className="bg-white border border-sasta-border px-2 py-1 rounded shadow-xs">
              American Express
            </span>
            <span className="bg-white border border-sasta-border px-2 py-1 rounded shadow-xs">
              Apple Pay
            </span>
            <span className="bg-white border border-sasta-border px-2 py-1 rounded shadow-xs">
              Google Pay
            </span>
            <span className="bg-white border border-sasta-border px-2 py-1 rounded shadow-xs">
              Klarna
            </span>
            <span className="bg-white border border-sasta-border px-2 py-1 rounded shadow-xs">
              Shop Pay
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
