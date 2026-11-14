import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import heroImages from '../../data/heroImages.json';
import { useStorefrontContent } from '../../hooks/useStorefrontContent';

export default function HeroBanner() {
  const { content: copy } = useStorefrontContent('home_copy');
  const [activeImage, setActiveImage] = useState(0);
  const eyebrowParts = copy?.hero?.eyebrow?.split('•').map((part) => part.trim()).filter(Boolean) || [];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % heroImages.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="overflow-hidden bg-[#fff7dc]">
      <div className="relative isolate mx-auto flex h-[min(47.5vw,912px)] min-h-[440px] max-h-[912px] max-w-[1920px] items-center justify-center px-7 py-10 text-center sm:px-12">
        <img
          src={heroImages[activeImage]}
          alt={`Sasta Bazaar collection banner ${activeImage + 1}`}
          className="absolute inset-0 h-full w-full object-cover object-center brightness-[0.85]"
          fetchPriority="high"
        />
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/10 via-black/25 to-black/45" />
        <div className="relative z-20 max-w-5xl">
          <p className="mx-auto mb-4 inline-flex max-w-full items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#ffe28a] drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] sm:mb-6 sm:gap-3 sm:text-base sm:tracking-[0.18em]">
            <Sparkles aria-hidden="true" className="h-4 w-4 shrink-0 text-[#f0c969] sm:h-5 sm:w-5" />
            {eyebrowParts.length > 1 ? (
              <>
                <span>{eyebrowParts[0]}</span>
                <span aria-hidden="true" className="text-[#f0c969]">•</span>
                <span className="text-[13px] font-black sm:text-xl">{eyebrowParts.slice(1).join(' • ')}</span>
              </>
            ) : (
              <span className="text-[13px] font-black sm:text-xl">{copy?.hero?.eyebrow}</span>
            )}
          </p>
          <h1 className="font-serif text-3xl font-normal leading-tight text-white drop-shadow-[0_3px_14px_rgba(0,0,0,0.8)] sm:text-5xl lg:text-7xl">
            {copy?.hero?.title}
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-xs leading-6 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] sm:mt-6 sm:text-base sm:leading-7 lg:text-lg">
            {copy?.hero?.description}
          </p>
          <div className="pointer-events-auto mt-6 flex flex-col justify-center gap-3 sm:mt-9 sm:flex-row sm:gap-5">
            <Link
              to="/shop"
              className="inline-flex min-h-12 items-center justify-center bg-[#a4ed00] px-8 text-xs font-bold uppercase tracking-wider text-[#17200b] transition-colors hover:bg-[#b5ff16] sm:min-h-14 sm:px-9 sm:text-sm"
            >
              {copy?.hero?.primaryCta}
            </Link>
            <Link
              to="/collection/lehenga-choli"
              className="inline-flex min-h-12 items-center justify-center border border-white bg-black/15 px-8 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-white hover:text-[#302719] sm:min-h-14 sm:px-9 sm:text-sm"
            >
              {copy?.hero?.secondaryCta}
            </Link>
          </div>
          <div className="mt-7 flex justify-center gap-2" aria-label="Choose a banner">
            {heroImages.map((image, index) => (
              <button
                key={image}
                type="button"
                aria-label={`Show banner ${index + 1}`}
                aria-pressed={activeImage === index}
                onClick={() => setActiveImage(index)}
                className={`h-2.5 rounded-full transition-all ${
                  activeImage === index ? 'w-7 bg-white' : 'w-2.5 bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
