import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#FFF8DC" />
        <meta name="description" content="Shop ladies and kids ethnic fashion at Sasta Bazaar: suits, lehengas, shararas, dresses and hijabs." />
        <meta property="og:site_name" content="SASTA BAZAAR - Everyday Luxury" />
        <meta property="og:locale" content="en_GB" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <body className="bg-white text-sasta-body font-sans antialiased selection:bg-sasta-gold selection:text-sasta-heading">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
