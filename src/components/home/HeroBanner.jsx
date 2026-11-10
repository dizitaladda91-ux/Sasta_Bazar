import React from 'react';
import { Link } from 'react-router-dom';
import heroImages from '../../data/heroImages.json';
import { useStorefrontContent } from '../../hooks/useStorefrontContent';

export default function HeroBanner() {
  const { content: copy } = useStorefrontContent('home_copy');

  return (
    <section className="overflow-hidden bg-[#fff7dc]">
      <div className="relative isolate mx-auto flex h-[min(47.5vw,912px)] min-h-[440px] max-h-[912px] max-w-[1920px] items-end gap-1.5 px-[5.5%] pt-5 sm:gap-2 md:gap-3 lg:gap-4">
        {heroImages.map((image, index) => {
          const isSideImage = index === 0 || index === heroImages.length - 1;
          const isCenterImage = index === 2;

          return (
            <div
              key={image}
              className={`relative min-w-0 flex-1 overflow-hidden border-[3px] border-[#b88837] bg-[#eee7d9] sm:border-4 lg:border-[6px] ${
                index === 1 || index === 3 ? 'hidden md:block' : ''
              } ${isSideImage ? 'h-[76%]' : isCenterImage ? 'h-full' : 'h-[88%]'}`}
              style={{ borderRadius: '50% 50% 0 0' }}
            >
              <img
                src={image}
                alt="Sasta Bazaar festive collection"
                loading={index < 2 ? 'eager' : 'lazy'}
                className="h-full w-full object-cover object-top brightness-[0.68]"
              />
            </div>
          );
        })}

        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/10 via-black/20 to-black/35" />
        <div className="absolute inset-0 z-20 flex items-center justify-center px-7 py-10 text-center sm:px-12">
          <div className="max-w-5xl">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[#f0c969] drop-shadow sm:mb-6 sm:text-sm">
              {copy?.hero?.eyebrow}
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
          </div>
        </div>
      </div>
    </section>
  );
}
