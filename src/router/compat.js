import React, { useCallback, useMemo } from 'react';
import NextLink from 'next/link';
import { useRouter as usePagesRouter } from 'next/compat/router';
import {
  usePathname as useAppPathname,
  useRouter as useAppRouter,
  useSearchParams as useAppSearchParams
} from 'next/navigation';

export const Link = React.forwardRef(function Link({ to, href, ...props }, ref) {
  return <NextLink ref={ref} href={href || to || '/'} {...props} />;
});

export function useNavigate() {
  const pagesRouter = usePagesRouter();
  const appRouter = useAppRouter();
  return useCallback((destination, options = {}) => {
    if (pagesRouter) {
      if (typeof destination === 'number') return pagesRouter.back();
      return pagesRouter.push(destination, undefined, { scroll: options.preventScrollReset !== true });
    }
    if (typeof destination === 'number') return appRouter.back();
    return appRouter.push(destination, { scroll: options.preventScrollReset !== true });
  }, [pagesRouter, appRouter]);
}

export function useLocation() {
  const pagesRouter = usePagesRouter();
  const appPathname = useAppPathname();
  const appSearch = useAppSearchParams();

  if (pagesRouter?.asPath != null) {
    const [pathname, search = ''] = pagesRouter.asPath.split('?');
    return { pathname, search: search ? `?${search}` : '' };
  }
  const qs = appSearch?.toString() || '';
  return { pathname: appPathname || '/', search: qs ? `?${qs}` : '' };
}

export function useParams() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  let value = segments[1];
  if (value) {
    try {
      value = decodeURIComponent(value);
    } catch {
      // Leave malformed path segments untouched so the data lookup returns its normal not-found response.
    }
  }
  return { slug: value, handle: value };
}

export function useSearchParams() {
  const pagesRouter = usePagesRouter();
  const appPathname = useAppPathname();
  const appRouter = useAppRouter();
  const appSearch = useAppSearchParams();

  const search = pagesRouter?.asPath != null
    ? (pagesRouter.asPath.split('?')[1]?.split('#')[0] || '')
    : (appSearch?.toString() || '');

  const params = useMemo(() => new URLSearchParams(search), [search]);

  const setSearchParams = useCallback((nextParams) => {
    const query = new URLSearchParams(nextParams).toString();
    if (pagesRouter?.asPath != null) {
      const pathname = pagesRouter.asPath.split(/[?#]/)[0];
      return pagesRouter.push(`${pathname}${query ? `?${query}` : ''}`, undefined, { scroll: false });
    }
    return appRouter.push(`${appPathname || '/'}${query ? `?${query}` : ''}`, { scroll: false });
  }, [pagesRouter, appRouter, appPathname]);

  return [params, setSearchParams];
}
