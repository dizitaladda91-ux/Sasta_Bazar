import { notFound } from 'next/navigation';
import BlogListingView from '../../../../components/blog/BlogListingView';
import { getAllBlogCategories, getAllBlogTags, getPublishedPosts } from '../../../../lib/blog-data';
import { getSiteUrl } from '../../../../lib/blog-seo';

export const revalidate = 60;

export async function generateMetadata({ params, searchParams }) {
  const { category } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp?.page) || 1);
  const siteUrl = getSiteUrl();
  const categories = await getAllBlogCategories();
  const matched = categories.find((c) => c.slug === category);
  const name = matched?.name || category.replace(/-/g, ' ');
  const baseUrl = `${siteUrl}/blog/category/${category}`;
  const { totalPages } = await getPublishedPosts({ page, limit: 9, categorySlug: category });

  return {
    title: `${name} — Style Guides & Outfit Ideas`,
    description: matched?.description || `Explore ${name} guides, ethnic outfit ideas, and styling tips from Sasta Bazaar.`,
    alternates: { canonical: page > 1 ? `${baseUrl}?page=${page}` : baseUrl },
    pagination: {
      previous: page > 1 ? (page === 2 ? baseUrl : `${baseUrl}?page=${page - 1}`) : undefined,
      next: page < totalPages ? `${baseUrl}?page=${page + 1}` : undefined
    }
  };
}

export default async function BlogCategoryPage({ params, searchParams }) {
  const { category } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp?.page) || 1);

  const [{ posts, totalPages }, categories, tags] = await Promise.all([
    getPublishedPosts({ page, limit: 9, categorySlug: category }),
    getAllBlogCategories(),
    getAllBlogTags()
  ]);

  const currentCategory = categories.find((c) => c.slug === category);
  if (!currentCategory && posts.length === 0) {
    notFound();
  }

  return (
    <BlogListingView
      eyebrow="Blog Category"
      title={currentCategory?.name || category.replace(/-/g, ' ')}
      description={currentCategory?.description || 'Curated ethnic fashion guides and outfit tips.'}
      posts={posts}
      categories={categories}
      tags={tags}
      activeCategorySlug={category}
      page={page}
      totalPages={totalPages}
      basePath={`/blog/category/${category}`}
    />
  );
}
