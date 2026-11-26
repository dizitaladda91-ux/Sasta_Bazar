import { getAllBlogCategories, getAllPublishedSlugsForFeed } from '../lib/blog-data';
import { getSiteUrl } from '../lib/blog-seo';

export const revalidate = 300;

const STATIC_STORE_ROUTES = [
  { path: '/', changeFrequency: 'daily', priority: 1.0 },
  { path: '/shop', changeFrequency: 'daily', priority: 0.9 },
  { path: '/blog', changeFrequency: 'daily', priority: 0.9 },
  { path: '/collection/ladies-collection', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/collection/casual-wear', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/collection/lehenga-choli', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/collection/sharara-gharara-suits', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/collection/kids-collection', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/collection/unstitched-suits', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/collection/scarves', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/size-guide', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/faqs', changeFrequency: 'monthly', priority: 0.5 }
];

export default async function sitemap() {
  const siteUrl = getSiteUrl();
  const [posts, categories] = await Promise.all([
    getAllPublishedSlugsForFeed(),
    getAllBlogCategories()
  ]);

  const staticEntries = STATIC_STORE_ROUTES.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority
  }));

  const categoryEntries = categories.map((cat) => ({
    url: `${siteUrl}/blog/category/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7
  }));

  const postEntries = posts
    .filter((p) => !p.noindex)
    .map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt || post.publishedAt),
      changeFrequency: 'weekly',
      priority: 0.8
    }));

  return [...staticEntries, ...categoryEntries, ...postEntries];
}
