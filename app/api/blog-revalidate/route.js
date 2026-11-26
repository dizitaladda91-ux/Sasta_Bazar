import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb_token')?.value;
    if (!token || !process.env.JWT_SECRET) {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload || payload.role !== 'admin') {
      return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    revalidatePath('/blog');
    revalidatePath('/sitemap.xml');
    revalidatePath('/blog/rss.xml');
    if (body.slug) {
      revalidatePath(`/blog/${body.slug}`);
    }
    if (body.categorySlug) {
      revalidatePath(`/blog/category/${body.categorySlug}`);
    }
    return Response.json({ success: true, revalidated: true });
  } catch {
    return Response.json({ success: false, message: 'Revalidation failed' }, { status: 500 });
  }
}
