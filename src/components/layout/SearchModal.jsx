import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, Tag } from 'lucide-react';
import { api } from '../../services/api';

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      api.getProducts({ search: query, limit: 6 })
        .then(setResults)
        .catch(() => setResults([]));
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onClose();
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleProductClick = (handle) => {
    onClose();
    navigate(`/product/${handle}`);
  };

  const quickSearches = ['Chickenkari', 'Hijab', 'Cotton Suit', 'Lehenga', 'Sharara', 'Dresses'];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-start items-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 animate-fade-in">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl overflow-hidden z-10 mt-12 border border-sasta-border">
        {/* Search Input Bar */}
        <form onSubmit={handleSubmit} className="flex items-center px-4 py-3.5 border-b border-sasta-border bg-sasta-yellow-cream">
          <Search className="w-5 h-5 text-sasta-gold-dark mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for suits, lehengas, hijabs, cotton wear..."
            className="w-full bg-transparent text-sasta-heading text-base placeholder-sasta-muted focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-sasta-muted hover:text-sasta-heading p-1 mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-sasta-muted hover:text-sasta-heading p-1.5 rounded-md hover:bg-white"
          >
            <X className="w-5 h-5" />
          </button>
        </form>

        {/* Quick Suggestions / Popular */}
        {!query && (
          <div className="p-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-sasta-muted block mb-3">
              Popular Searches
            </span>
            <div className="flex flex-wrap gap-2">
              {quickSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="inline-flex items-center gap-1.5 text-xs bg-sasta-yellow-cream border border-sasta-border hover:border-sasta-gold text-sasta-heading px-3 py-1.5 rounded-full transition-all"
                >
                  <Tag className="w-3 h-3 text-sasta-gold-dark" />
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {query && (
          <div className="p-4 max-h-96 overflow-y-auto divide-y divide-sasta-border/40">
            {results.length > 0 ? (
              <>
                <div className="text-xs font-semibold uppercase tracking-wider text-sasta-muted mb-2 px-2">
                  Matching Products ({results.length})
                </div>
                {results.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product.handle)}
                    className="flex items-center gap-4 p-2 hover:bg-sasta-yellow-cream rounded-md cursor-pointer transition-colors"
                  >
                    <img
                      src={product.primaryImage}
                      alt={product.title}
                      className="w-12 h-16 object-cover rounded bg-neutral-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-sasta-heading truncate">
                        {product.title}
                      </h4>
                      <p className="text-xs text-sasta-muted">
                        {product.subcategory || product.category}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-bold text-sasta-heading">
                          £{product.price.toFixed(2)}
                        </span>
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <span className="text-xs text-sasta-muted line-through">
                            £{product.compareAtPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-sasta-muted shrink-0" />
                  </div>
                ))}
                <div className="pt-3 px-2">
                  <button
                    onClick={handleSubmit}
                    className="w-full text-center text-xs font-bold uppercase tracking-wider text-sasta-heading hover:text-sasta-gold-dark py-2"
                  >
                    See all results for "{query}" &rarr;
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-sasta-muted text-sm">
                No products found matching "<span className="text-sasta-heading font-medium">{query}</span>"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
