import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_CATEGORIES } from '../../data/categories';

export default function MegaMenu({ isOpen, onClose }) {
  const { pathname } = useLocation();

  if (!isOpen) return null;

  return (
    <div
      onMouseLeave={onClose}
      className="absolute left-0 top-full z-50 w-full border-b border-sasta-border bg-white shadow-xl animate-fade-in"
    >
      <div className="mx-auto max-w-7xl px-6 py-3">
        <nav className="w-full max-w-sm" aria-label="Product categories">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-sasta-heading">
            Categories
          </h2>
          <ul className="space-y-1">
            {NAV_CATEGORIES.map((category) => {
              const isActive = category.path === '/shop'
                ? pathname === '/shop'
                : pathname.startsWith(category.path);

              return (
                <li key={category.path}>
                  <Link
                    to={category.path}
                    onClick={onClose}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-sasta-yellow-cream font-semibold text-sasta-heading'
                        : 'text-sasta-body hover:bg-sasta-yellow-cream hover:text-sasta-heading'
                    }`}
                  >
                    {category.name}
                    {isActive && <span className="h-1.5 w-1.5 rounded-full bg-sasta-heading" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
