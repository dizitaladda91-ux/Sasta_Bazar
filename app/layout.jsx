import { Montserrat } from 'next/font/google';
import '../src/index.css';
import { getSiteUrl } from '../lib/blog-seo';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap'
});

export const metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: 'SASTA BAZAAR - Everyday Luxury Ethnic Fashion',
    template: '%s | SASTA BAZAAR'
  },
  description:
    'Shop ladies and kids ethnic fashion at Sasta Bazaar: suits, lehengas, shararas, dresses and hijabs.',
  openGraph: {
    siteName: 'SASTA BAZAAR - Everyday Luxury',
    locale: 'en_GB',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={montserrat.className}>
      <body className="bg-white text-sasta-body font-sans antialiased selection:bg-sasta-gold selection:text-sasta-heading">
        {children}
      </body>
    </html>
  );
}
