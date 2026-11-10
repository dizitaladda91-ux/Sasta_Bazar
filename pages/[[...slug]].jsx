import dynamic from 'next/dynamic';

const Storefront = dynamic(() => import('../src/App.jsx'), {
  ssr: false,
  loading: () => <div className="min-h-screen grid place-items-center text-sm text-sasta-muted">Loading Sasta Bazaar…</div>
});

export default function StorefrontPage() {
  return <Storefront />;
}
