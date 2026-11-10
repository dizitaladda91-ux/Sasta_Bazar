import React from 'react';
import { Link } from 'react-router-dom';
import { getProductImageSet } from '../../data/imageCatalog';
import { useStorefrontContent } from '../../hooks/useStorefrontContent';

const HERO_IMAGE = getProductImageSet('sb53-red-and-gold-cotton-suit-with-dark-gold-print-sequence-work-neck-patch-amp-red-designer-dupatta').primaryImage;

export default function HeroBanner() {
  const { content: copy } = useStorefrontContent('home_copy');

  return (
    <section className="relative isolate min-h-[620px] overflow-hidden bg-[#65584e] md:min-h-[700px] lg:min-h-[calc(100vh-164px)]">
      <img src={HERO_IMAGE} alt="" aria-hidden="true" className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
      <div className="absolute inset-0 -z-10 bg-[#211a17]/55" />

      <div className="absolute inset-4 border border-[#d6b767]/70 md:inset-10" />
      <div className="mx-auto flex min-h-[620px] max-w-5xl flex-col items-center justify-center px-8 py-20 text-center text-white md:min-h-[700px] md:px-16 lg:min-h-[calc(100vh-164px)]">
        <p className="mb-6 text-xs font-bold uppercase tracking-[0.22em] text-[#e1bd65] sm:text-sm">
          {copy?.hero?.eyebrow}
        </p>

        <h1 className="max-w-4xl font-serif text-4xl font-normal leading-[1.12] tracking-normal text-white sm:text-6xl lg:text-7xl">
          {copy?.hero?.title}
        </h1>

        <p className="mt-7 max-w-3xl text-sm leading-7 text-white/90 sm:text-lg sm:leading-8">
          {copy?.hero?.description}
        </p>

        <div className="mt-10 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row sm:gap-5">
          <Link
            to="/shop"
            className="inline-flex min-h-14 items-center justify-center bg-[#a4ed00] px-9 text-sm font-bold uppercase tracking-wider text-[#17200b] transition-colors hover:bg-[#b5ff16]"
          >
            {copy?.hero?.primaryCta}
          </Link>
          <Link
            to="/collection/lehenga-choli"
            className="inline-flex min-h-14 items-center justify-center border border-white/90 bg-black/10 px-9 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-white hover:text-[#211a17]"
          >
            {copy?.hero?.secondaryCta}
          </Link>
        </div>
      </div>
    </section>
  );
}
