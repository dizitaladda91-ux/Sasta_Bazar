import React, { useCallback, useMemo } from 'react';
import NextLink from 'next/link';
import { useRouter as useNextRouter } from 'next/router';

export const Link = React.forwardRef(function Link({ to, href, ...props }, ref) {
  return <NextLink ref={ref} href={href || to || '/'} {...props} />;
});

export function useNavigate() {
  const router = useNextRouter();
  return useCallback((destination, options = {}) => {
    if (typeof destination === 'number') return router.back();
    return router.push(destination, undefined, { scroll: options.preventScrollReset !== true });
  }, [router]);
}

export function useLocation() {
  const router = useNextRouter();
  const [pathname, search = ''] = router.asPath.split('?');
  return { pathname, search: search ? `?${search}` : '' };
}

export function useParams() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  return { slug: segments[1], handle: segments[1] };
}

export function useSearchParams() {
  const router = useNextRouter();
  const search = router.asPath.split('?')[1]?.split('#')[0] || '';
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const setSearchParams = useCallback((nextParams) => {
    const query = new URLSearchParams(nextParams).toString();
    const pathname = router.asPath.split(/[?#]/)[0];
    return router.push(`${pathname}${query ? `?${query}` : ''}`, undefined, { scroll: false });
  }, [router]);
  return [params, setSearchParams];
}
