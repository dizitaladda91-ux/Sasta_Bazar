import React, { useState, useMemo } from 'react';
import SectionTitle from '../common/SectionTitle';
import ProductCard from '../common/ProductCard';
import { useProducts } from '../../hooks/useProducts';
import { useStorefrontContent } from '../../hooks/useStorefrontContent';

export default function NewArrivals() {
  const [activeTab, setActiveTab] = useState('all');
  const { products } = useProducts({ filter: 'new' });
  const { content: copy } = useStorefrontContent('home_copy');

  const tabs = [
    { id: 'all', label: 'All New Arrivals' },
    { id: 'suits', label: 'Casual & Salwar Suits' },
    { id: 'dresses', label: 'Dresses & Gowns' },
    { id: 'hijabs', label: 'Jersey Hijabs' },
  ];

  const filteredProducts = useMemo(() => {
    let list = products;
    if (activeTab === 'suits') {
      list = list.filter(p => p.subcategory.includes('Suits') || p.subcategory.includes('Salwar'));
    } else if (activeTab === 'dresses') {
      list = list.filter(p => p.subcategory === 'Dresses');
    } else if (activeTab === 'hijabs') {
      list = list.filter(p => p.category === 'Scarves');
    }
    return list.slice(0, 8);
  }, [activeTab, products]);

  return (
    <section className="py-12 sm:py-16 bg-sasta-yellow-cream/50 border-y border-sasta-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow={copy?.newArrivals?.eyebrow}
          title={copy?.newArrivals?.title}
          subtitle={copy?.newArrivals?.description}
          linkText="View All New"
          linkTo="/shop?filter=new"
          center={true}
        />

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8 sm:mb-10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-full border transition-all ${
                activeTab === tab.id
                  ? 'bg-sasta-navy text-white border-sasta-navy shadow-xs'
                  : 'bg-white text-sasta-body border-sasta-border hover:border-sasta-gold hover:text-sasta-heading'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 4 cols desktop, 2 cols mobile product grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
