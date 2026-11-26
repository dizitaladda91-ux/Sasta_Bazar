import BlogAdminClient from '../../../components/admin/BlogAdminClient';

export const metadata = {
  title: 'Blog Admin Portal',
  robots: { index: false, follow: false }
};

export default function AdminBlogPage() {
  return <BlogAdminClient />;
}
