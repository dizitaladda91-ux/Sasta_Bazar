import Link from 'next/link';
import Image from 'next/image';
import { notFound, permanentRedirect } from 'next/navigation';
import { Calendar, Clock, RefreshCw, ShoppingBag, User, MessageCircle } from 'lucide-react';
import BlogCard from '../../../components/blog/BlogCard';
import { FaqAccordion, SocialShareBar } from '../../../components/blog/BlogPostInteractive';
import {
  getAllPublishedSlugsForFeed,
  getPublishedPostBySlug,
  getRelatedPosts
} from '../../../lib/blog-data';
import { buildBlogJsonLd, extractTocAndInjectIds, getSiteUrl } from '../../../lib/blog-seo';

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const posts = await getAllPublishedSlugsForFeed();
    return posts.map((post) => ({ slug: post.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const result = await getPublishedPostBySlug(slug);
  if (!result || result.redirectTo) {
    return { title: 'Article Not Found' };
  }

  const { post } = result;
  const siteUrl = getSiteUrl();
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const canonical = post.canonicalUrl || postUrl;
  const metaTitle = post.metaTitle || post.title;
  const metaDescription = post.metaDescription || post.excerpt;
  const ogImg = post.ogImage || post.featuredImage || '/logo.png';
  const resolvedOg = ogImg.startsWith('http') ? ogImg : `${siteUrl}${ogImg.startsWith('/') ? '' : '/'}${ogImg}`;

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: { canonical },
    robots: post.noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: 'article',
      url: postUrl,
      title: metaTitle,
      description: metaDescription,
      publishedTime: post.publishedAt || post.createdAt,
      modifiedTime: post.updatedAt || post.publishedAt,
      authors: [post.authorName],
      images: [{ url: resolvedOg, alt: post.featuredImageAlt || post.title }]
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [resolvedOg]
    }
  };
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const result = await getPublishedPostBySlug(slug);

  if (!result) notFound();
  if (result.redirectTo) {
    permanentRedirect(`/blog/${result.redirectTo}`);
  }

  const { post } = result;
  const siteUrl = getSiteUrl();
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const { html: contentWithIds, toc } = extractTocAndInjectIds(post.contentHtml);
  const relatedPosts = await getRelatedPosts(post.id, post.categorySlug, 3);
  const jsonLdSchemas = buildBlogJsonLd({
    post,
    faqs: post.faqs || [],
    products: post.products || []
  });

  const whatsappBase = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
    ? `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}`
    : 'https://wa.me/';

  return (
    <article className="bg-white">
      {jsonLdSchemas.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {/* Breadcrumbs & Header */}
      <header className="border-b border-sasta-border bg-gradient-to-b from-sasta-yellow-light to-sasta-yellow-cream px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-4xl">
          <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-sasta-muted">
            <Link href="/" className="hover:text-sasta-heading">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/blog" className="hover:text-sasta-heading">Blog</Link>
            {post.categoryName && (
              <>
                <span aria-hidden="true">/</span>
                <Link href={`/blog/category/${post.categorySlug}`} className="hover:text-sasta-heading">
                  {post.categoryName}
                </Link>
              </>
            )}
            <span aria-hidden="true">/</span>
            <span className="truncate font-medium text-sasta-heading max-w-[220px] sm:max-w-none">
              {post.title}
            </span>
          </nav>

          {post.categoryName && (
            <Link
              href={`/blog/category/${post.categorySlug}`}
              className="inline-block rounded-full border border-sasta-border bg-white px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-sasta-gold-dark"
            >
              {post.categoryName}
            </Link>
          )}

          <h1 className="mt-3 text-2xl sm:text-4xl lg:text-[2.6rem] font-bold leading-tight text-sasta-heading">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-3 text-base sm:text-lg leading-relaxed text-sasta-body">
              {post.excerpt}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-sasta-body">
            <span className="inline-flex items-center gap-1.5 font-semibold text-sasta-heading">
              <User className="h-3.5 w-3.5 text-sasta-gold-dark" />
              {post.authorName}
            </span>
            {post.publishedAt && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-sasta-gold-dark" />
                Published <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
              </span>
            )}
            {post.updatedAt && (
              <span className="inline-flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5 text-sasta-gold-dark" />
                Updated <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-sasta-gold-dark" />
              {post.readingTime || 1} min read
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-10">
        {/* Featured Image (LCP-optimized with explicit width/height) */}
        {post.featuredImage && (
          <figure className="mb-8 overflow-hidden rounded-2xl border border-sasta-border bg-sasta-yellow-cream shadow-card">
            <Image
              src={post.featuredImage}
              alt={post.featuredImageAlt || post.title}
              width={post.featuredImageWidth || 1200}
              height={post.featuredImageHeight || 675}
              sizes="(max-width: 896px) 100vw, 896px"
              priority
              className="h-auto w-full object-cover"
            />
          </figure>
        )}

        {/* Auto-generated Table of Contents */}
        {toc.length > 0 && (
          <nav
            aria-label="Table of Contents"
            className="mb-8 rounded-2xl border border-sasta-border bg-sasta-yellow-cream/80 p-5"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-sasta-heading">
              Table of Contents
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {toc.map((item) => (
                <li key={item.id} className={item.level === 3 ? 'pl-4' : ''}>
                  <a
                    href={`#${item.id}`}
                    className="text-sasta-body hover:text-sasta-gold-dark hover:underline transition-colors"
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Main Article Content */}
        <div
          className="blog-prose text-base leading-relaxed text-sasta-body"
          dangerouslySetInnerHTML={{ __html: contentWithIds }}
        />

        {/* Linked Store Products */}
        {post.products && post.products.length > 0 && (
          <section aria-labelledby="shop-look-heading" className="mt-10 rounded-2xl border border-sasta-border bg-sasta-yellow-light/50 p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-sasta-gold-dark">
                  Shop The Look
                </p>
                <h2 id="shop-look-heading" className="text-xl sm:text-2xl font-bold text-sasta-heading">
                  Featured Outfits from Sasta Bazaar
                </h2>
              </div>
              <Link href="/shop" className="hidden sm:inline-block text-xs font-bold uppercase tracking-wider text-sasta-gold-dark hover:underline">
                View All &rarr;
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {post.products.map((product) => {
                const productLink = `${siteUrl}/product/${product.handle}`;
                const waText = encodeURIComponent(`Hi Sasta Bazaar! I want to order: ${product.title} (${productLink})`);
                const waHref = `${whatsappBase}?text=${waText}`;

                return (
                  <div
                    key={product.id}
                    className="flex flex-col sm:flex-row gap-4 rounded-xl border border-sasta-border bg-white p-4 shadow-subtle"
                  >
                    <Link href={`/product/${product.handle}`} className="shrink-0 self-center sm:self-start">
                      <Image
                        src={product.primaryImage || '/product-placeholder.svg'}
                        alt={product.title}
                        width={112}
                        height={140}
                        className="h-32 w-24 rounded-lg object-cover bg-sasta-yellow-cream"
                      />
                    </Link>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-sasta-heading line-clamp-2">
                          <Link href={`/product/${product.handle}`} className="hover:text-sasta-gold-dark">
                            {product.title}
                          </Link>
                        </h3>
                        <div className="mt-1.5 flex items-baseline gap-2">
                          <span className="text-base font-bold text-sasta-heading">
                            {product.currency}{Number(product.price).toFixed(2)}
                          </span>
                          {product.compareAtPrice && product.compareAtPrice > product.price && (
                            <span className="text-xs text-sasta-muted line-through">
                              {product.currency}{Number(product.compareAtPrice).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          href={`/product/${product.handle}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-sasta-gold px-4 py-2 text-xs font-bold text-sasta-heading hover:bg-sasta-gold-hover transition-colors"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                          Shop Now
                        </Link>
                        <a
                          href={waHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          WhatsApp Order
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* FAQ Accordion */}
        <FaqAccordion faqs={post.faqs || []} />

        {/* Tags & Social Share */}
        <div className="mt-8 flex flex-col gap-4 border-t border-b border-sasta-border py-5">
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sasta-heading">Tags:</span>
              {post.tags.map((tag) => (
                <Link
                  key={tag.slug}
                  href={`/blog/tag/${tag.slug}`}
                  className="rounded-md border border-sasta-border bg-sasta-yellow-cream px-2.5 py-1 text-xs text-sasta-body hover:border-sasta-gold"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}
          <SocialShareBar title={post.title} url={postUrl} />
        </div>

        {/* End CTA Banner */}
        <section className="mt-10 rounded-2xl bg-sasta-navy px-6 py-8 text-center text-white sm:px-10 sm:py-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-sasta-gold">
            Everyday Luxury • Up to 50% Off
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white">
            Ready to Upgrade Your Ethnic Wardrobe?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-white/80">
            Explore bridal-inspired lehengas, festive shararas, everyday cotton suits, and kids ethnic outfits at honest prices.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/shop"
              className="rounded-full bg-sasta-gold px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-sasta-heading hover:bg-sasta-gold-hover transition-colors"
            >
              Shop All Collections
            </Link>
            <Link
              href="/collection/lehenga-choli"
              className="rounded-full border border-white/30 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 transition-colors"
            >
              Browse Lehengas
            </Link>
          </div>
        </section>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section aria-labelledby="related-posts-heading" className="mt-12">
            <h2 id="related-posts-heading" className="text-2xl font-bold text-sasta-heading">
              Related Style Guides
            </h2>
            <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-3">
              {relatedPosts.map((rel) => (
                <BlogCard key={rel.slug} post={rel} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
