import BlogListingView from '../../components/blog/BlogListingView';
import { getAllBlogCategories, getAllBlogTags, getPublishedPosts } from '../../lib/blog-data';
import { getSiteUrl } from '../../lib/blog-seo';

export const revalidate = 60;

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp?.page) || 1);
  const siteUrl = getSiteUrl();
  const { totalPages } = await getPublishedPosts({ page, limit: 9 });
  const canonical = page > 1 ? `${siteUrl}/blog?page=${page}` : `${siteUrl}/blog`;

  return {
    title: page > 1 ? `Ethnic Fashion Blog - Page ${page}` : 'Ethnic Fashion Blog & Style Guides',
    description:
      'Wedding lehenga trends, Eid sharara styling, kids festive outfits, and hijab fashion guides from Sasta Bazaar.',
    alternates: {
      canonical,
      types: { 'application/rss+xml': `${siteUrl}/blog/rss.xml` }
    },
    pagination: {
      previous: page > 1 ? (page === 2 ? `${siteUrl}/blog` : `${siteUrl}/blog?page=${page - 1}`) : undefined,
      next: page < totalPages ? `${siteUrl}/blog?page=${page + 1}` : undefined
    }
  };
}

export default async function BlogIndexPage({ searchParams }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp?.page) || 1);
  const searchQuery = String(sp?.q || '').trim();

  const [{ posts, totalPages }, categories, tags] = await Promise.all([
    getPublishedPosts({ page, limit: 9, search: searchQuery }),
    getAllBlogCategories(),
    getAllBlogTags()
  ]);

  return (
    <BlogListingView
      title="Everyday Luxury Style Journal"
      description="Honest styling guides, festive outfit ideas, and fabric care tips in Hinglish & English for ladies and kids ethnic wear."
      posts={posts}
      categories={categories}
      tags={tags}
      page={page}
      totalPages={totalPages}
      basePath="/blog"
      searchQuery={searchQuery}
    />
  );
}
