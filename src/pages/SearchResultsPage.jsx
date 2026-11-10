import React, { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, ArrowLeft } from 'lucide-react';
import ProductCard from '../components/common/ProductCard';
import { useProducts } from '../hooks/useProducts';

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  useEffect(() => {
    document.title = `Search: "${query}" | SASTA BAZAAR`;
    window.scrollTo(0, 0);
  }, [query]);

  const { products: results } = useProducts({ search: query, enabled: Boolean(query.trim()) });

  return (
    <div className="bg-white min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-[10px] font-bold tracking-[0.25em] text-sasta-gold-dark uppercase block mb-1">
            Search Results
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-sasta-heading">
            {query ? `Results for "${query}"` : 'Search Our Catalogue'}
          </h1>
          <p className="text-xs sm:text-sm text-sasta-muted mt-2">
            Found {results.length} products matching your inquiry
          </p>
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="max-w-md mx-auto text-center py-16 px-4 space-y-4 bg-sasta-yellow-cream/40 rounded-xl border border-sasta-border">
            <Search className="w-12 h-12 text-sasta-muted mx-auto" />
            <h2 className="font-serif text-xl font-bold text-sasta-heading">
              No matching products found
            </h2>
            <p className="text-xs text-sasta-body leading-relaxed">
              We couldn't find any items matching "{query}". Try checking your spelling or searching for broader terms like "Suits", "Cotton", or "Hijab".
            </p>
            <div className="pt-2">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 bg-sasta-gold hover:bg-sasta-gold-hover text-sasta-heading text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Browse All Products</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
