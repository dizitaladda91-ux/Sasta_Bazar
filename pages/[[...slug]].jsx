import dynamic from 'next/dynamic';
import Head from 'next/head';

const Storefront = dynamic(() => import('../src/App.jsx'), {
  ssr: false,
  loading: () => <div className="min-h-screen grid place-items-center text-sm text-sasta-muted">Loading Sasta Bazaar…</div>
});

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://sasta-bazar-xi.vercel.app').replace(/\/+$/, '');

const STATIC_SEO = {
  '/': {
    title: 'SASTA BAZAAR - Everyday Luxury Ethnic Fashion | Suits, Lehengas & Hijabs',
    description: 'Shop ladies and kids ethnic fashion at Sasta Bazaar: handcrafted suits, bridal lehengas, festive shararas, dresses, and double-stitched jersey hijabs.'
  },
  '/shop': {
    title: 'Shop All Ethnic Wear | SASTA BAZAAR',
    description: 'Browse our complete collection of ladies suits, lehenga choli, sharara sets, kids ethnic wear, unstitched suits, and premium jersey hijabs.'
  },
  '/about': {
    title: 'About Us | SASTA BAZAAR - Everyday Luxury',
    description: 'Discover the story behind Sasta Bazaar — bringing graceful, modest Indian ethnic fashion at honest prices.'
  },
  '/contact': {
    title: 'Contact Us | SASTA BAZAAR',
    description: 'Get in touch with Sasta Bazaar customer care for orders, sizing, and custom stitching enquiries.'
  },
  '/size-guide': {
    title: 'Size Guide & Measurements | SASTA BAZAAR',
    description: 'Check UK/India measurements for ladies suits, lehengas, shararas, and kids ethnic wear.'
  },
  '/faqs': {
    title: 'Frequently Asked Questions | SASTA BAZAAR',
    description: 'Answers about shipping, returns, sizing, and custom orders at Sasta Bazaar.'
  }
};

export async function getServerSideProps({ resolvedUrl }) {
  const cleanPath = (resolvedUrl || '/').split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  const segments = cleanPath.split('/').filter(Boolean);
  const canonical = `${SITE_URL}${cleanPath === '/' ? '' : cleanPath}`;

  let seo = STATIC_SEO[cleanPath] || {
    title: 'SASTA BAZAAR - Everyday Luxury Ethnic Fashion',
    description: 'Shop ladies and kids ethnic fashion at Sasta Bazaar: suits, lehengas, shararas, dresses and hijabs.'
  };
  let ogImage = `${SITE_URL}/logo.png`;
  let ogType = 'website';
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'SASTA BAZAAR - Everyday Luxury',
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'SASTA BAZAAR',
      url: SITE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    }
  ];

  try {
    if (segments[0] === 'collection' && segments[1]) {
      const slug = segments[1];
      const name = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      seo = {
        title: `${name} | SASTA BAZAAR`,
        description: `Shop ${name} at Sasta Bazaar — everyday luxury ethnic wear with fast tracked delivery.`
      };
      jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name,
        url: canonical,
        description: seo.description
      });
    } else if (segments[0] === 'product' && segments[1]) {
      const { query } = await import('../server/db.js');
      const { rows } = await query(
        `SELECT title, description, price, currency, primary_image, stock, vendor
         FROM products WHERE handle = $1 AND is_active = TRUE LIMIT 1`,
        [segments[1]]
      );
      if (rows.length) {
        const p = rows[0];
        const plainDesc = String(p.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        seo = {
          title: `${p.title} | SASTA BAZAAR`,
          description: plainDesc.slice(0, 155) || `Buy ${p.title} at Sasta Bazaar.`
        };
        if (p.primary_image) ogImage = p.primary_image.startsWith('http') ? p.primary_image : `${SITE_URL}${p.primary_image}`;
        ogType = 'product';
        jsonLd.push({
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: p.title,
          image: [ogImage],
          description: seo.description,
          brand: { '@type': 'Brand', name: p.vendor || 'SASTA BAZAAR' },
          offers: {
            '@type': 'Offer',
            url: canonical,
            priceCurrency: p.currency || 'GBP',
            price: Number(p.price || 0).toFixed(2),
            availability: Number(p.stock ?? 1) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
          }
        });
      }
    }
  } catch {
    // Fallback gracefully to default storefront SEO if DB is unavailable.
  }

  return {
    props: {
      seo: {
        ...seo,
        canonical,
        ogImage,
        ogType,
        noindex: ['/admin', '/cart', '/track-order', '/account'].some((p) => cleanPath.startsWith(p)),
        jsonLd
      }
    }
  };
}

export default function StorefrontPage({ seo }) {
  return (
    <>
      {seo && (
        <Head>
          <title>{seo.title}</title>
          <meta name="description" content={seo.description} />
          <link rel="canonical" href={seo.canonical} />
          {seo.noindex && <meta name="robots" content="noindex,nofollow" />}
          <meta property="og:type" content={seo.ogType} />
          <meta property="og:title" content={seo.title} />
          <meta property="og:description" content={seo.description} />
          <meta property="og:url" content={seo.canonical} />
          <meta property="og:image" content={seo.ogImage} />
          <meta name="twitter:title" content={seo.title} />
          <meta name="twitter:description" content={seo.description} />
          <meta name="twitter:image" content={seo.ogImage} />
          {seo.jsonLd?.map((schema, idx) => (
            <script
              key={idx}
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            />
          ))}
        </Head>
      )}
      <Storefront />
    </>
  );
}
