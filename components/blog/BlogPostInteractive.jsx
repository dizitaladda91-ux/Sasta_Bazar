'use client';

import { useState } from 'react';
import { Check, ChevronDown, Copy, MessageCircle, Share2 } from 'lucide-react';

export function FaqAccordion({ faqs = [] }) {
  const [openIndex, setOpenIndex] = useState(0);
  if (!faqs.length) return null;

  return (
    <section aria-labelledby="faq-heading" className="mt-10 rounded-2xl border border-sasta-border bg-sasta-yellow-cream/70 p-5 sm:p-7">
      <h2 id="faq-heading" className="text-xl sm:text-2xl font-bold text-sasta-heading">
        Frequently Asked Questions
      </h2>
      <div className="mt-4 divide-y divide-sasta-border">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={faq.id || index} className="py-3.5">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="flex w-full items-center justify-between gap-4 text-left text-sm sm:text-base font-semibold text-sasta-heading hover:text-sasta-gold-dark transition-colors"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-sasta-gold-dark transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <p className="mt-2.5 text-sm leading-relaxed text-sasta-body">
                  {faq.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function SocialShareBar({ title, url }) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable in restricted contexts.
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sasta-heading">
        <Share2 className="h-3.5 w-3.5 text-sasta-gold-dark" />
        Share:
      </span>
      <a
        href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        WhatsApp
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full border border-sasta-border bg-white px-3.5 py-1.5 text-xs font-semibold text-sasta-heading hover:bg-sasta-yellow-light transition-colors"
      >
        X / Twitter
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full border border-sasta-border bg-white px-3.5 py-1.5 text-xs font-semibold text-sasta-heading hover:bg-sasta-yellow-light transition-colors"
      >
        Facebook
      </a>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1 rounded-full border border-sasta-border bg-white px-3.5 py-1.5 text-xs font-semibold text-sasta-heading hover:bg-sasta-yellow-light transition-colors"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
    </div>
  );
}
