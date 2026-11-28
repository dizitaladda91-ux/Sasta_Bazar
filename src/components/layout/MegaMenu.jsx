import React from 'react';
import { Link } from 'react-router-dom';
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

      {/* Compact Glassmorphic Luxury Mega Menu */}
      <div
        id={isKids ? 'kids-collection-menu' : 'womens-collection-menu'}
        role="region"
        aria-label={isKids ? "Kids Collection Mega Menu" : "Women's Collection Mega Menu"}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`animate-mega-menu fixed left-1/2 top-[76px] sm:top-[84px] z-40 ${
          isKids ? 'w-[min(92vw,560px)]' : 'w-[min(94vw,680px)]'
        } max-h-[calc(100vh-100px)] overflow-y-auto rounded-2xl border border-[#B8862B]/30 bg-[rgba(255,252,245,0.95)] p-6 shadow-[0_24px_60px_rgba(48,39,25,0.18)] backdrop-blur-md`}
      >
        <nav
          aria-label={isKids ? 'Kids categories' : "Women's categories"}
          className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5"
        >
          {groups.map((groupName) => {
            const items = categories.filter((cat) => cat.group === groupName);
            if (!items.length) return null;

            return (
              <div key={groupName} className="space-y-1.5">
                <p className="px-2.5 pb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#B8862B]">
                  {groupName}
                </p>
                <ul className="space-y-1">
                  {items.map((item) => {
                    const idx = itemCounter;
                    itemCounter += 1;
                    const isCurrent =
                      pathname === item.path ||
                      (item.path !== '/shop' && pathname.startsWith(item.path));

                    return (
                      <li
                        key={item.slug}
                        style={{ animationDelay: `${idx * 30}ms` }}
                        className="animate-mega-item"
                      >
                        <Link
                          to={item.path}
                          onClick={onClose}
                          aria-current={isCurrent ? 'page' : undefined}
                          className={`group flex items-center gap-3 rounded-xl px-2.5 py-2 transition-all duration-200 hover:translate-x-1 hover:bg-[#F6ECD9]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862B]/60 ${
                            isCurrent ? 'bg-[#F6ECD9]/60' : ''
                          }`}
                        >
                          <img
                            src={item.image || FALLBACK_IMAGE}
                            alt=""
                            loading="lazy"
                            className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-[#B8862B]/30 bg-[#F6ECD9]"
                          />
                          <span
                            className={`truncate text-xs font-medium transition-colors ${
                              isCurrent ? 'font-semibold text-[#B8862B]' : 'text-[#2B2318] group-hover:text-[#1F1F1F]'
                            }`}
                          >
                            {item.name}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </div>
    </>
  );
}
