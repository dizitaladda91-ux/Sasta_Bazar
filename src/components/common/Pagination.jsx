import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i += 1) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  const goTo = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    onPageChange(nextPage);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        className="inline-flex items-center gap-1 rounded-full border border-sasta-border bg-white px-3.5 py-2 text-xs font-semibold text-sasta-heading hover:bg-sasta-yellow-light disabled:opacity-40"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Prev
      </button>

      {getPages().map((item, idx) =>
        item === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-xs text-sasta-muted">…</span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => goTo(item)}
            aria-current={item === page ? 'page' : undefined}
            className={`min-w-[36px] rounded-full px-3 py-2 text-xs font-bold transition-colors ${
              item === page
                ? 'bg-sasta-gold text-sasta-heading shadow-xs'
                : 'border border-sasta-border bg-white text-sasta-body hover:bg-sasta-yellow-light'
            }`}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex items-center gap-1 rounded-full border border-sasta-border bg-white px-3.5 py-2 text-xs font-semibold text-sasta-heading hover:bg-sasta-yellow-light disabled:opacity-40"
      >
        Next
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </nav>
  );
}
