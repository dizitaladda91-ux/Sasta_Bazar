import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function MegaMenu({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      onMouseLeave={onClose}
      className="absolute top-full left-0 w-full bg-white border-b border-sasta-border shadow-xl z-50 animate-fade-in"
    >
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Column 1: Ladies Collection */}
          <div className="col-span-3">
            <Link
              to="/collection/ladies-collection"
              onClick={onClose}
              className="group flex items-center justify-between text-xs font-bold uppercase tracking-wider text-sasta-heading pb-2 border-b border-sasta-border mb-4 hover:text-sasta-gold-dark transition-colors"
            >
              <span>Ladies Collection</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/collection/casual-wear"
                  onClick={onClose}
                  className="text-sasta-body hover:text-sasta-heading hover:translate-x-1 inline-block transition-all"
                >
                  Casual Everyday Wear Suits
                </Link>
              </li>
              <li>
                <Link
                  to="/collection/lehenga-choli"
                  onClick={onClose}
                  className="text-sasta-body hover:text-sasta-heading hover:translate-x-1 inline-block transition-all"
                >
                  Lehenga Choli
                </Link>
              </li>
              <li>
                <Link
                  to="/collection/sharara-gharara-suits"
                  onClick={onClose}
                  className="text-sasta-body hover:text-sasta-heading hover:translate-x-1 inline-block transition-all"
                >
                  Sharara &amp; Gharara Suits
                </Link>
              </li>
              <li>
                <Link
                  to="/collection/salwar-kameez-suit-sets"
                  onClick={onClose}
                  className="text-sasta-body hover:text-sasta-heading hover:translate-x-1 inline-block transition-all"
                >
                  Salwar Kameez / Suit Sets
                </Link>
              </li>
              <li>
                <Link
                  to="/collection/dresses"
                  onClick={onClose}
                  className="text-sasta-body hover:text-sasta-heading hover:translate-x-1 inline-block transition-all"
                >
                  Dresses &amp; Gowns
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Kids & Unstitched */}
          <div className="col-span-3">
            <div className="mb-6">
              <Link
                to="/collection/kids-collection"
                onClick={onClose}
                className="group flex items-center justify-between text-xs font-bold uppercase tracking-wider text-sasta-heading pb-2 border-b border-sasta-border mb-3 hover:text-sasta-gold-dark transition-colors"
              >
                <span>Kids Collection</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/collection/kids-collection"
                    onClick={onClose}
                    className="text-sasta-body hover:text-sasta-heading hover:translate-x-1 inline-block transition-all"
                  >
                    Kids Ethnic Suits &amp; Lehengas
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <Link
                to="/collection/unstitched-suits"
                onClick={onClose}
                className="group flex items-center justify-between text-xs font-bold uppercase tracking-wider text-sasta-heading pb-2 border-b border-sasta-border mb-3 hover:text-sasta-gold-dark transition-colors"
              >
                <span>Unstitched Suits</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/collection/unstitched-suits"
                    onClick={onClose}
                    className="text-sasta-body hover:text-sasta-heading hover:translate-x-1 inline-block transition-all"
                  >
                    Pure Cotton &amp; Slub Unstitched
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 3: Scarves & Hijabs */}
          <div className="col-span-3">
            <Link
              to="/collection/scarves"
              onClick={onClose}
              className="group flex items-center justify-between text-xs font-bold uppercase tracking-wider text-sasta-heading pb-2 border-b border-sasta-border mb-4 hover:text-sasta-gold-dark transition-colors"
            >
              <span>Scarves &amp; Hijabs</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/collection/scarves"
                  onClick={onClose}
                  className="text-sasta-body hover:text-sasta-heading hover:translate-x-1 inline-block transition-all flex items-center gap-1.5"
                >
                  
                  Premium Jersey Hijabs (31 Shades)
                </Link>
              </li>
              <li>
                <Link
                  to="/collection/scarves"
                  onClick={onClose}
                  className="text-sasta-body hover:text-sasta-heading hover:translate-x-1 inline-block transition-all"
                >
                  Double Stitched Collection
                </Link>
              </li>
              <li>
                <span className="inline-block text-xs font-medium text-amber-800 bg-sasta-yellow-soft px-2 py-0.5 rounded mt-2">
                  Special Offer: Buy 4 for £9.99
                </span>
              </li>
            </ul>
          </div>

          {/* Column 4: Visual Highlights */}
          <div className="col-span-3 bg-sasta-yellow-cream p-4 rounded-lg border border-sasta-border">
            <div className="relative aspect-[4/3] rounded-md overflow-hidden mb-3">
              <img
                src="https://cdn.shopify.com/s/files/1/1083/5361/8269/files/1E1687CB-99B0-4DF8-B0A1-477F97E542DC.png?v=1782829448"
                alt="New In Chickenkari"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-2 left-2 bg-sasta-gold text-sasta-heading text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded">
                Trending
              </span>
            </div>
            <h4 className="font-serif font-bold text-sm text-sasta-heading mb-1">
              Chickenkari Kurta Sets
            </h4>
            <p className="text-xs text-sasta-body mb-3">
              Soft cotton fabrics with delicate thread embroidery. From £9.99.
            </p>
            <Link
              to="/shop?category=Casual Everyday Wear Suits"
              onClick={onClose}
              className="text-xs font-semibold text-sasta-heading hover:text-sasta-gold-dark flex items-center gap-1 group"
            >
              Shop All Suits
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Mega Menu Footer Strip */}
        <div className="mt-8 pt-4 border-t border-sasta-border flex items-center justify-between text-xs text-sasta-muted">
          <div className="flex items-center gap-6">
            <Link to="/size-guide" onClick={onClose} className="hover:text-sasta-heading transition-colors">
              Size Guide
            </Link>
            <Link to="/care-instructions" onClick={onClose} className="hover:text-sasta-heading transition-colors">
              Fabric Care Instructions
            </Link>
            <Link to="/customization" onClick={onClose} className="hover:text-sasta-heading transition-colors">
              Custom Stitching Inquiries
            </Link>
          </div>
          <Link
            to="/shop"
            onClick={onClose}
            className="font-semibold text-sasta-heading hover:text-sasta-gold-dark transition-colors flex items-center gap-1"
          >
            Explore Complete Catalogue &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
