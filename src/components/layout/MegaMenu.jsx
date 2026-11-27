import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import {
  KIDS_MENU_CATEGORIES,
  KIDS_MENU_GROUPS,
  MEGA_MENU_CATEGORIES,
  WOMENS_MENU_GROUPS
} from '../../data/categories';

const FALLBACK_IMAGE = '/hero-collection-1.png';

export default function MegaMenu({
  activeMenu, // 'womens' | 'kids' | null
  pathname,
  onClose,
  onMouseEnter,
  onMouseLeave
}) {
  const isKids = activeMenu === 'kids';
  const groups = isKids ? KIDS_MENU_GROUPS : WOMENS_MENU_GROUPS;
  const categories = isKids
    ? KIDS_MENU_CATEGORIES
    : MEGA_MENU_CATEGORIES.filter((item) => item.group !== 'FOR KIDS');

  const [activeCategory, setActiveCategory] = useState(categories[0]);

  useEffect(() => {
    if (activeMenu) {
      const matched = categories.find(
        (item) => pathname === item.path || (item.path !== '/shop' && pathname.startsWith(item.path))
      );
      setActiveCategory(matched || categories[0]);
    }
  }, [activeMenu, pathname]);

  if (!activeMenu) return null;

  let itemCounter = 0;

  return (
    <>
      {/* Dark backdrop so hero text behind does not bleed through */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-x-0 bottom-0 top-[76px] sm:top-[84px] z-30 bg-[rgba(0,0,0,0.35)] transition-opacity duration-300"
      />

      {/* Two-part Glassmorphic Luxury Mega Menu */}
      <div
        id={isKids ? 'kids-collection-menu' : 'womens-collection-menu'}
        role="region"
        aria-label={isKids ? "Kids Collection Mega Menu" : "Women's Collection Mega Menu"}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="animate-mega-menu fixed left-1/2 top-[76px] sm:top-[84px] z-40 w-[min(94vw,1060px)] max-h-[calc(100vh-100px)] overflow-y-auto rounded-2xl border border-[#B8862B]/30 bg-[rgba(255,252,245,0.95)] p-6 shadow-[0_24px_60px_rgba(48,39,25,0.18)] backdrop-blur-md"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Grouped Category Links */}
          <nav
            aria-label={isKids ? 'Kids categories' : "Women's categories"}
            className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5"
          >
            {groups.map((groupName) => {
              const items = categories.filter((cat) => cat.group === groupName);
              if (!items.length) return null;

              return (
                <div key={groupName} className="space-y-1.5">
                  <p className="px-2.5 pb-1 font-serif text-[11px] font-bold uppercase tracking-[0.2em] text-[#B8862B]">
                    {groupName}
                  </p>
                  <ul className="space-y-1">
                    {items.map((item) => {
                      const idx = itemCounter;
                      itemCounter += 1;
                      const isCurrent =
                        pathname === item.path ||
                        (item.path !== '/shop' && pathname.startsWith(item.path));
                      const isPreviewing = activeCategory?.slug === item.slug;

                      return (
                        <li
                          key={item.slug}
                          style={{ animationDelay: `${idx * 30}ms` }}
                          className="animate-mega-item"
                        >
                          <Link
                            to={item.path}
                            onClick={onClose}
                            onMouseEnter={() => setActiveCategory(item)}
                            onFocus={() => setActiveCategory(item)}
                            aria-current={isCurrent ? 'page' : undefined}
                            className={`group flex items-center gap-3 rounded-xl px-2.5 py-2 transition-all duration-200 hover:translate-x-1 hover:bg-[#F6ECD9]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862B]/60 ${
                              isCurrent || isPreviewing ? 'bg-[#F6ECD9]/60' : ''
                            }`}
                          >
                            <img
                              src={item.image || FALLBACK_IMAGE}
                              alt=""
                              loading="lazy"
                              className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-[#B8862B]/30 bg-[#F6ECD9]"
                            />
                            <span className="min-w-0 flex-1 flex items-center gap-2">
                              <span className={`truncate text-xs font-medium transition-colors ${
                                isCurrent ? 'font-semibold text-[#B8862B]' : 'text-[#2B2318] group-hover:text-[#1F1F1F]'
                              }`}>
                                {item.name}
                              </span>
                              {item.badge && (
                                <span className="shrink-0 rounded-full border border-[#B8862B]/35 bg-[#F6ECD9] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#B8862B]">
                                  {item.badge}
                                </span>
                              )}
                            </span>
                            <ArrowRight
                              aria-hidden="true"
                              className="h-3.5 w-3.5 shrink-0 text-[#9A8B74] transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[#B8862B]"
                            />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>

          {/* Right: Featured Preview Panel */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="relative flex-1 min-h-[280px] overflow-hidden rounded-xl border border-[#B8862B]/25 bg-[#F6ECD9]">
              <img
                key={activeCategory?.slug}
                src={activeCategory?.image || FALLBACK_IMAGE}
                alt={activeCategory?.name || 'Sasta Bazaar Featured Collection'}
                className="h-full w-full object-cover transition-opacity duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#F2C94C]">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  Everyday Luxury
                </p>
                <h3 className="mt-1 font-serif text-xl font-semibold leading-snug text-white">
                  {activeCategory?.featuredTitle || 'Festive Edit — Up to 50% Off'}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-white/85 line-clamp-2">
                  {activeCategory?.featuredSubtitle}
                </p>
                <Link
                  to={activeCategory?.path || '/shop'}
                  onClick={onClose}
                  className="mt-3.5 inline-flex items-center gap-2 rounded-full bg-[#B8862B] px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[#9C6F20]"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
