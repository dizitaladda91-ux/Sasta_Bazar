import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import ProductCard from '../components/common/ProductCard';
import Pagination from '../components/common/Pagination';
import { useProducts } from '../hooks/useProducts';
import { useStorefrontContent } from '../hooks/useStorefrontContent';

const KIDS_STYLE_FILTERS = {
  sharara: {
    label: 'Kids Sharara',
    description: 'Festive kids sharara sets crafted with soft cotton linings and delicate embroidery.',
    keywords: ['sharara', 'gharara']
  },
  'salwar-suit': {
    label: 'Kids Salwar Suit',
    description: 'Comfortable Patiala and classic salwar suits tailored for kids.',
    keywords: ['salwar', 'patiala', 'suit']
  },
  dresses: {
    label: 'Kids Dresses',
    description: 'Graceful ethnic dresses, frocks, and gowns for little ones.',
    keywords: ['dress', 'gown', 'frock', 'anarkali']
  },
  lehenga: {
    label: 'Kids Lehnga',
    description: 'Lightweight embroidered lehenga choli sets made for festive twirls.',
    keywords: ['lehenga', 'lehnga', 'chaniya']
  }
};

export default function CollectionPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const styleParam = (searchParams.get('style') || '').toLowerCase();
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 24;

  const { content: collectionPages } = useStorefrontContent('collection_pages');
  const baseCollectionInfo = collectionPages?.[slug];
  const styleMeta = slug === 'kids-collection' ? KIDS_STYLE_FILTERS[styleParam] : null;
  const collectionInfo = styleMeta
    ? {
        title: styleMeta.label,
        description: styleMeta.description
      }
    : baseCollectionInfo;

  const { products: rawProducts } = useProducts({ collection: slug, limit: 250 });

  const products = useMemo(() => {
    if (!styleMeta) return rawProducts;
    return rawProducts.filter((product) => {
      const haystack = `${product.title || ''} ${product.subcategory || ''} ${product.description || ''}`.toLowerCase();
      return styleMeta.keywords.some((kw) => haystack.includes(kw));
    });
  }, [rawProducts, styleMeta]);

  useEffect(() => {
    setCurrentPage(1);
  }, [slug, styleParam]);

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return products.slice(start, start + PAGE_SIZE);
  }, [products, currentPage]);

  useEffect(() => {
    if (!collectionInfo) return;
    document.title = `${collectionInfo.title} | SASTA BAZAAR`;
    window.scrollTo(0, 0);
  }, [collectionInfo, slug]);

  if (!collectionInfo) return <div className="min-h-[50vh] grid place-items-center text-sm text-sasta-muted">Loading collection…</div>;

  return (
    <div className="bg-white min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-sasta-muted mb-6">
          <Link to="/" className="hover:text-sasta-heading">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/shop" className="hover:text-sasta-heading">Collections</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-sasta-heading">{collectionInfo.title}</span>
        </nav>

        {/* Collection Header Banner */}
        <div className="bg-sasta-yellow-light p-6 sm:p-10 rounded-xl border border-sasta-border mb-10 text-center max-w-4xl mx-auto shadow-2xs">
          <span className="text-[10px] font-bold tracking-[0.25em] text-sasta-gold-dark uppercase block mb-1">
            Everyday Luxury
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-sasta-heading mb-3">
            {collectionInfo.title}
          </h1>
          <p className="text-xs sm:text-sm text-sasta-body max-w-2xl mx-auto leading-relaxed mb-4">
            {collectionInfo.description}
          </p>
          <span className="inline-block text-xs font-semibold text-sasta-navy bg-white/80 border border-sasta-border px-3 py-1 rounded-full">
            {products.length} Products Available in GBP (£)
          </span>
        </div>

        {/* Product Grid */}
        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </>
        ) : (
          <div className="py-20 text-center bg-sasta-yellow-cream/40 rounded-lg border border-dashed border-sasta-border space-y-4">
            <p className="font-serif text-lg font-bold text-sasta-heading">
              New styles coming soon to this collection!
            </p>
            <p className="text-xs text-sasta-body max-w-sm mx-auto">
              Our artisans are currently crafting fresh designs. Explore our other popular collections in the meantime.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-sasta-gold hover:bg-sasta-gold-hover text-sasta-heading text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Explore All Products</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
