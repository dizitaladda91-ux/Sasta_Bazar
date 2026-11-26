import Link from 'next/link';
import Image from 'next/image';

const HEADER_LINKS = [
  { label: 'Shop All', href: '/shop' },
  { label: 'Lehenga Choli', href: '/collection/lehenga-choli' },
  { label: 'Sharara Suits', href: '/collection/sharara-gharara-suits' },
  { label: 'Kids Collection', href: '/collection/kids-collection' },
  { label: 'Hijabs', href: '/collection/scarves' },
  { label: 'Blog', href: '/blog' }
];

export default function BlogShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="bg-sasta-yellow-light border-b border-sasta-border py-2 px-4 text-center text-[11px] sm:text-xs font-medium tracking-wide text-sasta-heading">
        Elegance Crafted for Your Most Beautiful Moments • Up to 50% Off
      </div>

      <header className="sticky top-0 z-40 border-b border-sasta-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Sasta Bazaar Home">
            <Image
              src="/logo.png"
              alt="SASTA BAZAAR - Everyday Luxury"
              width={132}
              height={44}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>

          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-6">
            {HEADER_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-xs font-semibold uppercase tracking-wider transition-colors hover:text-sasta-gold-dark ${
                  item.href === '/blog' ? 'text-sasta-gold-dark' : 'text-sasta-heading'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href="/shop"
              className="rounded-full bg-sasta-gold px-4 py-2 text-xs font-bold uppercase tracking-wider text-sasta-heading transition-colors hover:bg-sasta-gold-hover"
            >
              Shop Now
            </Link>
          </div>
        </div>

        {/* Mobile horizontal nav */}
        <nav
          aria-label="Mobile quick links"
          className="flex md:hidden items-center gap-4 overflow-x-auto border-t border-sasta-border/60 bg-sasta-yellow-cream px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-sasta-heading"
        >
          {HEADER_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap hover:text-sasta-gold-dark">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-sasta-border bg-sasta-yellow-light text-sasta-body">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="space-y-3">
              <Link href="/" className="inline-block">
                <Image
                  src="/logo.png"
                  alt="SASTA BAZAAR"
                  width={140}
                  height={48}
                  className="h-12 w-auto object-contain"
                />
              </Link>
              <p className="text-xs leading-relaxed text-sasta-body max-w-sm">
                Everyday Luxury ethnic fashion — ladies and kids suits, designer lehengas, festive shararas, and double-stitched jersey hijabs.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <h3 className="font-bold uppercase tracking-wider text-sasta-heading">Explore</h3>
              <ul className="space-y-1.5">
                <li><Link href="/blog" className="hover:text-sasta-gold-dark">Style Journal</Link></li>
                <li><Link href="/collection/lehenga-choli" className="hover:text-sasta-gold-dark">Lehenga Choli</Link></li>
                <li><Link href="/collection/sharara-gharara-suits" className="hover:text-sasta-gold-dark">Sharara &amp; Gharara</Link></li>
                <li><Link href="/collection/kids-collection" className="hover:text-sasta-gold-dark">Kids Collection</Link></li>
              </ul>
            </div>

            <div className="space-y-2 text-xs">
              <h3 className="font-bold uppercase tracking-wider text-sasta-heading">Customer Care</h3>
              <ul className="space-y-1.5">
                <li><Link href="/size-guide" className="hover:text-sasta-gold-dark">Size Guide</Link></li>
                <li><Link href="/track-order" className="hover:text-sasta-gold-dark">Track Order</Link></li>
                <li><Link href="/contact" className="hover:text-sasta-gold-dark">Contact Us</Link></li>
                <li><Link href="/blog/rss.xml" className="hover:text-sasta-gold-dark">Blog RSS Feed</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-sasta-border/70 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-sasta-muted">
            <p>&copy; {new Date().getFullYear()} SASTA BAZAAR - Everyday Luxury. All Rights Reserved.</p>
            <Link href="/admin/blog" className="hover:text-sasta-heading">Blog Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
