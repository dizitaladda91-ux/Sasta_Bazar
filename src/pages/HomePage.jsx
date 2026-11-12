import React, { useEffect } from 'react';
import SEO from '../components/common/SEO';
import SEORankingContent from '../components/common/SEORankingContent';
import HeroBanner from '../components/home/HeroBanner';
import NewArrivals from '../components/home/NewArrivals';
import SignatureCollection from '../components/home/SignatureCollection';
import EditorialBlocks from '../components/home/EditorialBlocks';
import BestSellersCarousel from '../components/home/BestSellersCarousel';
import TrustStrip from '../components/home/TrustStrip';

export default function HomePage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const homeSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://sastabazaarclothing.com/#organization',
        'name': 'SASTA BAZAAR - Everyday Luxury',
        'url': 'https://sastabazaarclothing.com',
        'logo': 'https://sastabazaarclothing.com/logo.png',
        'description': 'Premier online clothing store for Ladies & Kids ethnic wear in the UK, specializing in ready-to-wear Salwar Kameez, Shararas, Lehengas, and Jersey Hijabs.',
        'address': {
          '@type': 'PostalAddress',
          'addressCountry': 'GB',
          'addressLocality': 'London'
        },
        'contactPoint': {
          '@type': 'ContactPoint',
          'contactType': 'Customer Support',
          'email': 'support@sastabazaarclothing.com',
          'availableLanguage': ['English', 'Urdu', 'Hindi']
        }
      },
      {
        '@type': 'WebSite',
        '@id': 'https://sastabazaarclothing.com/#website',
        'url': 'https://sastabazaarclothing.com',
        'name': 'SASTA BAZAAR',
        'potentialAction': {
          '@type': 'SearchAction',
          'target': 'https://sastabazaarclothing.com/search?q={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      }
    ]
  };

  return (
    <div className="min-h-screen">
      <SEO
        title="SASTA BAZAAR | Everyday Luxury - Ladies &amp; Kids Ethnic Fashion UK"
        description="Shop elegant ready-to-wear Pakistani suits, Indian ethnic wear, embroidered lehengas, shararas &amp; jersey hijabs with fast tracked UK delivery in GBP (£)."
        keywords="sasta bazaar, everyday luxury, pakistani suits uk, indian ethnic wear uk, salwar kameez online london, ready to wear suits uk, chickenkari kurta, lehenga choli uk, sharara suit, kids ethnic clothes, jersey hijabs uk, modest fashion uk, ladies dresses uk"
        canonical="/"
        schema={homeSchema}
      />
      <HeroBanner />
      <NewArrivals />
      <SignatureCollection />
      <EditorialBlocks />
      <BestSellersCarousel />
      <SEORankingContent />
      <TrustStrip />
    </div>
  );
}
