import { notFound } from 'next/navigation';
import BlogListingView from '../../../../components/blog/BlogListingView';
import { getAllBlogCategories, getAllBlogTags, getPublishedPosts } from '../../../../lib/blog-data';
import { getSiteUrl } from '../../../../lib/blog-seo';

export const revalidate = 60;

export async function generateMetadata({ params, searchParams }) {
  const { tag } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp?.page) || 1);
  const siteUrl = getSiteUrl();
  const baseUrl = `${siteUrl}/blog/tag/${tag}`;
  const { totalPages } = await getPublishedPosts({ page, limit: 9, tagSlug: tag });
  const label = tag.replace(/-/g, ' ');

  return {
    title: `#${label} — Ethnic Fashion Articles`,
    description: `Read articles tagged with ${label} on Sasta Bazaar Style Journal.`,
    alternates: { canonical: page > 1 ? `${baseUrl}?page=${page}` : baseUrl },
    pagination: {
      previous: page > 1 ? (page === 2 ? baseUrl : `${baseUrl}?page=${page - 1}`) : undefined,
      next: page < totalPages ? `${baseUrl}?page=${page + 1}` : undefined
    }
  };
}

export default async function BlogTagPage({ params, searchParams }) {
  const { tag } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp?.page) || 1);

  const [{ posts, totalPages }, categories, tags] = await Promise.all([
    getPublishedPosts({ page, limit: 9, tagSlug: tag }),
    getAllBlogCategories(),
    getAllBlogTags()
  ]);

  const currentTag = tags.find((t) => t.slug === tag);
  if (!currentTag && posts.length === 0) {
    notFound();
  }

  return (
    <BlogListingView
      eyebrow="Topic Tag"
      title={`#${currentTag?.name || tag.replace(/-/g, ' ')}`}
      description="Handpicked style guides and festive outfit inspiration."
      posts={posts}
      categories={categories}
      tags={tags}
      activeTagSlug={tag}
      page={page}
      totalPages={totalPages}
      basePath={`/blog/tag/${tag}`}
    />
  );
}
