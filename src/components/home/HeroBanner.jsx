import React from 'react';
import { Link } from 'react-router-dom';
import heroImages from '../../data/heroImages.json';
import { useStorefrontContent } from '../../hooks/useStorefrontContent';

export default function HeroBanner() {
  const { content: copy } = useStorefrontContent('home_copy');

  return (
    <section className="overflow-hidden bg-[#fff7dc]">
      <div className="mx-auto flex h-[min(47.5vw,912px)] min-h-[440px] max-h-[912px] max-w-[1920px] items-end gap-1.5 px-[5.5%] pt-5 sm:gap-2 md:gap-3 lg:gap-4">
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
                className="h-full w-full object-cover object-top"
              />
            </div>
          );
        })}
      </div>

      <div className="mx-auto max-w-5xl px-5 py-12 text-center sm:px-8 sm:py-16">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-[#9b702b] sm:text-sm">
          {copy?.hero?.eyebrow}
        </p>
        <h1 className="font-serif text-3xl font-normal leading-tight text-[#26221c] sm:text-5xl lg:text-6xl">
          {copy?.hero?.title}
        </h1>
        <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-[#575148] sm:text-lg sm:leading-8">
          {copy?.hero?.description}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:gap-5">
          <Link
            to="/shop"
            className="inline-flex min-h-14 items-center justify-center bg-[#a4ed00] px-9 text-sm font-bold uppercase tracking-wider text-[#17200b] transition-colors hover:bg-[#b5ff16]"
          >
            {copy?.hero?.primaryCta}
          </Link>
          <Link
            to="/collection/lehenga-choli"
            className="inline-flex min-h-14 items-center justify-center border border-[#6f5c3d] px-9 text-sm font-bold uppercase tracking-wider text-[#302719] transition-colors hover:bg-[#302719] hover:text-white"
          >
            {copy?.hero?.secondaryCta}
          </Link>
        </div>
      </div>
    </section>
  );
}
