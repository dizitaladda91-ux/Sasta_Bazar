import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const articles = [
  {
    category: 'Style Guide',
    title: 'Choosing an outfit for every occasion',
    description: 'For everyday wear, look for breathable fabrics and a comfortable fit. For celebrations, embroidery and a coordinated dupatta can add a little extra detail without sacrificing comfort.',
    link: '/collection/casual-wear',
    linkText: 'Explore everyday suits'
  },
  {
    category: 'Occasion Wear',
    title: 'A simple way to style a sharara',
    description: 'Let a statement sharara do the work: keep accessories balanced, choose a comfortable heel, and use the dupatta to finish the look. A coordinated set makes getting ready for a celebration simple.',
    link: '/collection/sharara-gharara-suits',
    linkText: 'Explore sharara sets'
  },
  {
    category: 'Fabric & Care',
    title: 'Finding your everyday hijab',
    description: 'Think about softness, stretch, and how you like to drape your scarf. A versatile colour and an easy-care fabric can make a favourite hijab work across many outfits.',
    link: '/collection/scarves',
    linkText: 'Explore scarves & hijabs'
  }
];

export default function ArticlesPage() {
  useEffect(() => {
    document.title = 'Our Articles | SASTA BAZAAR';
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-[#111827] px-4 py-14 text-center text-white sm:py-20">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#e8c77a]">Sasta Bazaar Journal</p>
        <h1 className="font-serif text-3xl font-bold sm:text-5xl">Our Articles</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
          Style notes, outfit ideas, and simple guides for choosing and caring for your favourites.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {articles.map((article) => (
            <article key={article.title} className="flex flex-col rounded-xl border border-sasta-border bg-white p-6 shadow-sm sm:p-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sasta-gold-dark">{article.category}</p>
              <h2 className="mt-4 font-serif text-xl font-bold text-sasta-heading">{article.title}</h2>
              <p className="mt-3 flex-1 text-sm leading-6 text-sasta-body">{article.description}</p>
              <Link to={article.link} className="mt-6 inline-flex w-fit items-center text-xs font-bold uppercase tracking-wider text-sasta-heading transition-colors hover:text-sasta-gold-dark">
                {article.linkText} <span aria-hidden="true" className="ml-2">&rarr;</span>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
