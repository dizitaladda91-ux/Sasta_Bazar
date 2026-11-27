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

  const siteUrl = getSiteUrl();
  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'SASTA BAZAAR - Everyday Luxury Style Journal',
    url: `${siteUrl}/blog`,
    description: 'Ethnic fashion guides, wedding lehenga trends, Eid sharara styling, and kids festive outfits.',
    publisher: {
      '@type': 'Organization',
      name: 'SASTA BAZAAR',
      logo: { '@type': 'ImageObject', url: `${siteUrl}/logo.png` }
    },
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `${siteUrl}/blog/${post.slug}`,
      datePublished: post.publishedAt || post.createdAt,
      author: { '@type': 'Person', name: post.authorName }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
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
    </>
  );
}
