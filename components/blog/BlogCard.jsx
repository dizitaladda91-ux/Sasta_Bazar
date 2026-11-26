import Link from 'next/link';
import Image from 'next/image';

export default function BlogCard({ post }) {
  const dateStr = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-sasta-border bg-white shadow-card transition-transform duration-200 hover:-translate-y-0.5">
      <Link href={`/blog/${post.slug}`} className="relative block aspect-[16/9] w-full overflow-hidden bg-sasta-yellow-cream">
        <Image
          src={post.featuredImage || '/hero-collection-1.png'}
          alt={post.featuredImageAlt || post.title}
          width={post.featuredImageWidth || 1200}
          height={post.featuredImageHeight || 675}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {post.categoryName && (
          <span className="absolute left-3 top-3 rounded-full bg-sasta-yellow-light/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sasta-heading border border-sasta-border">
            {post.categoryName}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center gap-2 text-[11px] text-sasta-muted">
          {dateStr && <time dateTime={post.publishedAt}>{dateStr}</time>}
          <span>•</span>
          <span>{post.readingTime || 1} min read</span>
        </div>

        <h2 className="mt-2.5 text-lg font-bold leading-snug text-sasta-heading group-hover:text-sasta-gold-dark transition-colors">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h2>

        <p className="mt-2.5 flex-1 text-sm leading-relaxed text-sasta-body line-clamp-3">
          {post.excerpt}
        </p>

        <div className="mt-4 pt-4 border-t border-sasta-border/60 flex items-center justify-between text-xs">
          <span className="font-medium text-sasta-heading">{post.authorName}</span>
          <Link
            href={`/blog/${post.slug}`}
            className="font-bold uppercase tracking-wider text-sasta-gold-dark hover:text-sasta-heading transition-colors"
          >
            Read Guide &rarr;
          </Link>
        </div>
      </div>
    </article>
  );
}
