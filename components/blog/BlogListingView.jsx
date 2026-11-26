import Link from 'next/link';
import BlogCard from './BlogCard';

export default function BlogListingView({
  title,
  eyebrow = 'Sasta Bazaar Style Journal',
  description,
  posts,
  categories = [],
  tags = [],
  activeCategorySlug = '',
  activeTagSlug = '',
  page = 1,
  totalPages = 1,
  basePath = '/blog',
  searchQuery = ''
}) {
  const buildPageHref = (targetPage) => {
    const params = new URLSearchParams();
    if (targetPage > 1) params.set('page', String(targetPage));
    if (searchQuery) params.set('q', searchQuery);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div>
      {/* Hero Header */}
      <section className="border-b border-sasta-border bg-gradient-to-b from-sasta-yellow-light to-sasta-yellow-cream px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-sasta-gold-dark">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-bold text-sasta-heading">
            {title}
          </h1>
          {description && (
            <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-sasta-body">
              {description}
            </p>
          )}

          {/* Search form */}
          <form action={basePath} method="GET" className="mx-auto mt-6 flex max-w-md gap-2">
            <input
              type="search"
              name="q"
              defaultValue={searchQuery}
              placeholder="Search lehenga, sharara, eid, kids..."
              aria-label="Search blog posts"
              className="flex-1 rounded-full border border-sasta-border bg-white px-4 py-2.5 text-sm text-sasta-heading placeholder-sasta-muted focus:border-sasta-gold focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-sasta-navy px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-sasta-navy-light transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="mb-8 flex flex-wrap items-center gap-2">
            <Link
              href="/blog"
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                !activeCategorySlug && !activeTagSlug
                  ? 'border-sasta-gold bg-sasta-gold text-sasta-heading'
                  : 'border-sasta-border bg-white text-sasta-body hover:bg-sasta-yellow-light'
              }`}
            >
              All Guides
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/blog/category/${cat.slug}`}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                  activeCategorySlug === cat.slug
                    ? 'border-sasta-gold bg-sasta-gold text-sasta-heading'
                    : 'border-sasta-border bg-white text-sasta-body hover:bg-sasta-yellow-light'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-sasta-border bg-sasta-yellow-cream p-10 text-center">
            <p className="text-base font-semibold text-sasta-heading">No articles found.</p>
            <p className="mt-1 text-sm text-sasta-body">Try another search term or browse all categories.</p>
            <Link
              href="/blog"
              className="mt-4 inline-block rounded-full bg-sasta-gold px-5 py-2 text-xs font-bold uppercase tracking-wider text-sasta-heading"
            >
              View All Posts
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav aria-label="Blog pagination" className="mt-10 flex items-center justify-center gap-2">
            {page > 1 && (
              <Link
                href={buildPageHref(page - 1)}
                rel="prev"
                className="rounded-full border border-sasta-border bg-white px-4 py-2 text-xs font-semibold text-sasta-heading hover:bg-sasta-yellow-light"
              >
                &larr; Previous
              </Link>
            )}
            <span className="px-3 text-xs font-medium text-sasta-muted">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={buildPageHref(page + 1)}
                rel="next"
                className="rounded-full border border-sasta-border bg-white px-4 py-2 text-xs font-semibold text-sasta-heading hover:bg-sasta-yellow-light"
              >
                Next &rarr;
              </Link>
            )}
          </nav>
        )}

        {/* Popular Tags */}
        {tags.length > 0 && (
          <div className="mt-12 border-t border-sasta-border pt-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-sasta-heading">Popular Topics</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.slice(0, 16).map((tag) => (
                <Link
                  key={tag.slug}
                  href={`/blog/tag/${tag.slug}`}
                  className={`rounded-md border px-3 py-1 text-xs transition-colors ${
                    activeTagSlug === tag.slug
                      ? 'border-sasta-gold bg-sasta-yellow-light font-semibold text-sasta-heading'
                      : 'border-sasta-border bg-white text-sasta-body hover:border-sasta-gold'
                  }`}
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
