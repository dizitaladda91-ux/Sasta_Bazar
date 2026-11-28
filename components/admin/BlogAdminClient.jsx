'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Code2, Copy, Edit3, ExternalLink, Globe, LogOut, Package, Plus, RefreshCw, Search, Trash2, Upload
} from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import Pagination from '../../src/components/common/Pagination';
import { getSiteUrl, slugify } from '../../lib/blog-seo';

const PRODUCT_CATEGORY_OPTIONS = [
  { label: 'Casual Everyday Wear Suits', category: 'Ladies Collection', subcategory: 'Casual Everyday Wear Suits', collectionSlug: 'casual-wear' },
  { label: 'Salwar Kameez / Suit Sets', category: 'Ladies Collection', subcategory: 'Salwar Kameez / Suit Sets', collectionSlug: 'salwar-kameez-suit-sets' },
  { label: 'Dresses', category: 'Ladies Collection', subcategory: 'Dresses', collectionSlug: 'dresses' },
  { label: 'Lehenga Choli', category: 'Ladies Collection', subcategory: 'Lehenga Choli', collectionSlug: 'lehenga-choli' },
  { label: 'Sharara & Gharara Suits', category: 'Ladies Collection', subcategory: 'Sharara & Gharara Suits', collectionSlug: 'sharara-gharara-suits' },
  { label: 'Kids Collection — All', category: 'Kids Collection', subcategory: 'Kids Ethnic Wear', collectionSlug: 'kids-collection' },
  { label: 'Kids Collection — Sharara', category: 'Kids Collection', subcategory: 'Kids Sharara', collectionSlug: 'kids-collection' },
  { label: 'Kids Collection — Salwar Suit', category: 'Kids Collection', subcategory: 'Kids Salwar Suit', collectionSlug: 'kids-collection' },
  { label: 'Kids Collection — Dresses', category: 'Kids Collection', subcategory: 'Kids Dresses', collectionSlug: 'kids-collection' },
  { label: 'Kids Collection — Lehnga', category: 'Kids Collection', subcategory: 'Kids Lehnga', collectionSlug: 'kids-collection' },
  { label: 'Unstitched Suits', category: 'Unstitched Suits', subcategory: 'Unstitched Suits', collectionSlug: 'unstitched-suits' },
  { label: "Women's Hijab — Double Stitched", category: 'Scarves', subcategory: 'Double Stitched', collectionSlug: 'scarves' },
  { label: "Women's Hijab — Linen", category: 'Scarves', subcategory: 'Linen', collectionSlug: 'scarves' },
  { label: "Women's Hijab — Jersey", category: 'Scarves', subcategory: 'Jersey', collectionSlug: 'scarves' },
  { label: "Women's Hijab — Cotton Silk", category: 'Scarves', subcategory: 'Cotton Silk', collectionSlug: 'scarves' },
  { label: 'Scarves & Hijabs (All)', category: 'Scarves', subcategory: 'Premium Jersey Hijabs', collectionSlug: 'scarves' }
];

const EMPTY_FORM = {
  id: null,
  title: '',
  slug: '',
  excerpt: '',
  contentHtml: '',
  featuredImage: '',
  featuredImageAlt: '',
  categoryId: '',
  authorName: 'Sasta Bazaar Editorial',
  status: 'draft',
  publishedAt: '',
  updatedAt: '',
  focusKeyword: '',
  metaTitle: '',
  metaDescription: '',
  canonicalUrl: '',
  ogImage: '',
  noindex: false,
  schemaType: 'BlogPosting',
  customSchema: '',
  tagsInput: '',
  faqs: [],
  productIds: []
};

async function apiJson(path, options = {}) {
  const res = await fetch(path, { credentials: 'include', ...options });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

function toLocalInputValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function BlogAdminClient() {
  const [authState, setAuthState] = useState({ loading: true, user: null });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [twoFaChallenge, setTwoFaChallenge] = useState('');
  const [twoFaCode, setTwoFaCode] = useState('');
  const [loginError, setLoginError] = useState('');

  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [storeProducts, setStoreProducts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearch, setProductSearch] = useState('');

  const [mode, setMode] = useState('list'); // 'list' | 'editor' | 'products'
  const [form, setForm] = useState(EMPTY_FORM);
  const [slugLocked, setSlugLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [postsPage, setPostsPage] = useState(1);
  const [productsPage, setProductsPage] = useState(1);

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const loadDashboard = useCallback(async () => {
    const [blogRes, prodRes] = await Promise.all([
      apiJson(`/api/admin/blog/posts?status=${encodeURIComponent(statusFilter)}&search=${encodeURIComponent(searchTerm)}`),
      apiJson('/api/products?limit=250').catch(() => ({ products: [] }))
    ]);
    setPosts(blogRes.posts || []);
    setCategories(blogRes.categories || []);
    setStoreProducts(prodRes.products || []);
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    apiJson('/api/auth/me')
      .then((res) => {
        if (res.user?.role === 'admin') {
          setAuthState({ loading: false, user: res.user });
        } else {
          setAuthState({ loading: false, user: null });
        }
      })
      .catch(() => setAuthState({ loading: false, user: null }));
  }, []);

  useEffect(() => {
    if (authState.user?.role === 'admin') {
      loadDashboard().catch((err) => notify(err.message));
    }
  }, [authState.user, loadDashboard]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = twoFaChallenge
        ? await apiJson('/api/auth/2fa/verify-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ challengeToken: twoFaChallenge, code: twoFaCode })
          })
        : await apiJson('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginForm)
          });

      if (res.requires2fa && res.challengeToken) {
        setTwoFaChallenge(res.challengeToken);
        setTwoFaCode('');
        return;
      }
      if (res.user?.role !== 'admin') {
        setLoginError('Administrator access is required.');
        return;
      }
      setTwoFaChallenge('');
      setAuthState({ loading: false, user: res.user });
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleLogout = async () => {
    await apiJson('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setAuthState({ loading: false, user: null });
  };

  const uploadImageFile = async (file) => {
    const dataBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const res = await apiJson('/api/admin/blog/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        mimeType: file.type || 'image/jpeg',
        dataBase64
      })
    });
    return res.url;
  };

  const handleFeaturedUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const url = await uploadImageFile(file);
      setForm((prev) => ({ ...prev, featuredImage: url, ogImage: prev.ogImage || url }));
      notify('Featured image uploaded.');
    } catch (err) {
      notify(err.message);
    }
  };

  const openNewPost = () => {
    setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id ? String(categories[0].id) : '' });
    setSlugLocked(false);
    setMode('editor');
  };

  const openEditPost = async (id) => {
    try {
      const { post } = await apiJson(`/api/admin/blog/posts/${id}`);
      setForm({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        contentHtml: post.contentHtml,
        featuredImage: post.featuredImage,
        featuredImageAlt: post.featuredImageAlt,
        categoryId: post.categoryId ? String(post.categoryId) : '',
        authorName: post.authorName,
        status: post.status,
        publishedAt: toLocalInputValue(post.publishedAt),
        updatedAt: post.updatedAt,
        focusKeyword: post.focusKeyword,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        canonicalUrl: post.canonicalUrl,
        ogImage: post.ogImage,
        noindex: Boolean(post.noindex),
        schemaType: post.schemaType || 'BlogPosting',
        customSchema: post.customSchema || '',
        tagsInput: (post.tags || []).join(', '),
        faqs: post.faqs || [],
        productIds: post.productIds || []
      });
      setSlugLocked(true);
      setMode('editor');
    } catch (err) {
      notify(err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        slug: form.slug || slugify(form.title),
        excerpt: form.excerpt,
        contentHtml: form.contentHtml,
        featuredImage: form.featuredImage,
        featuredImageAlt: form.featuredImageAlt,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        authorName: form.authorName,
        status: form.status,
        publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
        focusKeyword: form.focusKeyword,
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
        canonicalUrl: form.canonicalUrl,
        ogImage: form.ogImage,
        noindex: form.noindex,
        schemaType: form.schemaType || 'BlogPosting',
        customSchema: form.customSchema || '',
        tags: form.tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
        faqs: form.faqs.filter((f) => f.question.trim() && f.answer.trim()),
        productIds: form.productIds
      };

      let saved;
      if (form.id) {
        saved = await apiJson(`/api/admin/blog/posts/${form.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        notify(saved.redirectedFrom ? `Updated! 301 redirect created from /blog/${saved.redirectedFrom}` : 'Post updated!');
      } else {
        saved = await apiJson('/api/admin/blog/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        notify('Post created!');
      }

      await fetch('/api/blog-revalidate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: saved.slug })
      }).catch(() => {});

      await loadDashboard();
      setMode('list');
    } catch (err) {
      notify(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this blog post permanently?')) return;
    try {
      await apiJson(`/api/admin/blog/posts/${id}`, { method: 'DELETE' });
      await fetch('/api/blog-revalidate', { method: 'POST', credentials: 'include' }).catch(() => {});
      notify('Post deleted.');
      loadDashboard();
    } catch (err) {
      notify(err.message);
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await apiJson(`/api/admin/blog/posts/${id}/duplicate`, { method: 'POST' });
      notify('Post duplicated as draft.');
      loadDashboard();
    } catch (err) {
      notify(err.message);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const res = await apiJson('/api/admin/blog/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() })
      });
      setCategories((prev) => [...prev, res.category]);
      setForm((prev) => ({ ...prev, categoryId: String(res.category.id) }));
      setNewCategoryName('');
      notify(`Category "${res.category.name}" added.`);
    } catch (err) {
      notify(err.message);
    }
  };

  const filteredAllProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return storeProducts.filter((p) => !q || p.title.toLowerCase().includes(q) || p.handle.toLowerCase().includes(q));
  }, [storeProducts, productSearch]);

  const filteredProducts = useMemo(() => filteredAllProducts.slice(0, 30), [filteredAllProducts]);

  const ADMIN_POSTS_PER_PAGE = 10;
  const postsTotalPages = Math.max(1, Math.ceil(posts.length / ADMIN_POSTS_PER_PAGE));
  const paginatedPosts = useMemo(() => {
    const start = (postsPage - 1) * ADMIN_POSTS_PER_PAGE;
    return posts.slice(start, start + ADMIN_POSTS_PER_PAGE);
  }, [posts, postsPage]);

  const ADMIN_PRODUCTS_PER_PAGE = 20;
  const productsTotalPages = Math.max(1, Math.ceil(filteredAllProducts.length / ADMIN_PRODUCTS_PER_PAGE));
  const paginatedStoreProducts = useMemo(() => {
    const start = (productsPage - 1) * ADMIN_PRODUCTS_PER_PAGE;
    return filteredAllProducts.slice(start, start + ADMIN_PRODUCTS_PER_PAGE);
  }, [filteredAllProducts, productsPage]);

  useEffect(() => { setPostsPage(1); }, [statusFilter, searchTerm]);
  useEffect(() => { setProductsPage(1); }, [productSearch]);

  const customSchemaStatus = useMemo(() => {
    const raw = (form.customSchema || '').trim();
    if (!raw) return { valid: true, message: 'Optional: auto-generates BlogPosting + FAQPage + Product + BreadcrumbList.' };
    try {
      JSON.parse(raw);
      return { valid: true, message: 'Valid JSON-LD schema ready to inject.' };
    } catch (err) {
      return { valid: false, message: `Invalid JSON: ${err.message}` };
    }
  }, [form.customSchema]);

  const openProductEditor = (product) => {
    const initialImages = Array.isArray(product.images) && product.images.length
      ? product.images.filter(Boolean)
      : product.primaryImage
        ? [product.primaryImage, ...(product.hoverImage && product.hoverImage !== product.primaryImage ? [product.hoverImage] : [])]
        : [];
    setEditingProduct({
      id: product.id,
      title: product.title || '',
      price: String(product.price ?? ''),
      compareAtPrice: product.compareAtPrice != null ? String(product.compareAtPrice) : '',
      stock: String(product.stock ?? 0),
      originalStock: String(product.stock ?? 0),
      collectionSlug: product.collectionSlug || 'casual-wear',
      category: product.category || 'Ladies Collection',
      subcategory: product.subcategory || 'Casual Everyday Wear Suits',
      images: initialImages,
      newImageUrl: '',
      sizesInput: Array.isArray(product.sizes) ? product.sizes.join(', ') : '',
      colorsInput: Array.isArray(product.colors) ? product.colors.join(', ') : '',
      isNewArrival: Boolean(product.isNewArrival),
      isBestSeller: Boolean(product.isBestSeller),
      isActive: product.isActive !== false,
      description: product.description || ''
    });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSavingProduct(true);
    try {
      const cleanedImages = (editingProduct.images || []).map((u) => u.trim()).filter(Boolean);
      const parsedSizes = editingProduct.sizesInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const parsedColors = editingProduct.colorsInput
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      const payload = {
        title: editingProduct.title.trim(),
        price: Number(editingProduct.price),
        compareAtPrice: editingProduct.compareAtPrice ? Number(editingProduct.compareAtPrice) : null,
        category: editingProduct.category.trim() || 'Ladies Collection',
        subcategory: editingProduct.subcategory.trim() || 'Uncategorized',
        collectionSlug: editingProduct.collectionSlug,
        ...(editingProduct.stock !== editingProduct.originalStock ? { stock: Number(editingProduct.stock) } : {}),
        images: cleanedImages,
        sizes: parsedSizes,
        colors: parsedColors,
        isNewArrival: Boolean(editingProduct.isNewArrival),
        isBestSeller: Boolean(editingProduct.isBestSeller),
        isActive: Boolean(editingProduct.isActive),
        description: editingProduct.description
      };
      await apiJson(`/api/admin/products/${encodeURIComponent(editingProduct.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      await loadDashboard();
      setEditingProduct(null);
      notify('Product updated successfully!');
    } catch (err) {
      notify(err.message);
    } finally {
      setSavingProduct(false);
    }
  };

  const handleRefreshSitemap = async () => {
    try {
      await fetch('/api/blog-revalidate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: form.slug || slugify(form.title) })
      });
      notify('Sitemap & blog cache refreshed!');
    } catch {
      notify('Could not refresh sitemap.');
    }
  };

  if (authState.loading) {
    return <div className="min-h-screen grid place-items-center bg-sasta-yellow-cream text-sm text-sasta-muted">Checking admin session…</div>;
  }

  if (!authState.user) {
    return (
      <div className="min-h-screen grid place-items-center bg-sasta-yellow-cream px-4">
        <form onSubmit={handleLogin} className="w-full max-w-md rounded-2xl border border-sasta-border bg-white p-7 shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sasta-gold-dark">Sasta Bazaar Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-sasta-heading">Blog Portal Sign In</h1>
          <p className="mt-1 text-xs text-sasta-body">Sign in with your administrator account to manage blog posts.</p>

          {loginError && (
            <div className="mt-4 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
              {loginError}
            </div>
          )}

          <div className="mt-5 space-y-4">
            {twoFaChallenge ? (
              <div>
                <label className="block text-xs font-semibold text-sasta-heading mb-1">2FA Authenticator / Backup Code</label>
                <input
                  type="text"
                  required
                  value={twoFaCode}
                  onChange={(e) => setTwoFaCode(e.target.value)}
                  placeholder="123456"
                  className="w-full rounded-lg border border-sasta-border px-3 py-2 text-sm tracking-widest focus:border-sasta-gold focus:outline-none"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-sasta-heading mb-1">Admin ID / Email</label>
                  <input
                    type="text"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full rounded-lg border border-sasta-border px-3 py-2 text-sm focus:border-sasta-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-sasta-heading mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                    className="w-full rounded-lg border border-sasta-border px-3 py-2 text-sm focus:border-sasta-gold focus:outline-none"
                  />
                </div>
              </>
            )}
            <button
              type="submit"
              className="w-full rounded-full bg-sasta-gold py-2.5 text-xs font-bold uppercase tracking-wider text-sasta-heading hover:bg-sasta-gold-hover"
            >
              {twoFaChallenge ? 'Verify 2FA Code' : 'Sign In to Blog Admin'}
            </button>
            {twoFaChallenge && (
              <button
                type="button"
                onClick={() => { setTwoFaChallenge(''); setTwoFaCode(''); setLoginError(''); }}
                className="w-full text-xs text-sasta-muted hover:text-sasta-heading"
              >
                &larr; Back to Email &amp; Password
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sasta-yellow-cream/60 pb-16">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 rounded-full bg-sasta-navy px-5 py-2.5 text-xs font-semibold text-white shadow-xl border border-sasta-gold/40">
          {toast}
        </div>
      )}

      {/* Top Bar */}
      <header className="border-b border-sasta-border bg-white px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sasta-gold-dark">SASTA BAZAAR CMS</p>
            <h1 className="text-xl sm:text-2xl font-bold text-sasta-heading">SEO Blog Portal</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMode('list')}
              className={`rounded-full px-3.5 py-2 text-xs font-semibold ${
                mode === 'list' || mode === 'editor'
                  ? 'bg-sasta-navy text-white'
                  : 'border border-sasta-border text-sasta-heading hover:bg-sasta-yellow-light'
              }`}
            >
              Blog Posts
            </button>
            <button
              type="button"
              onClick={() => setMode('products')}
              className={`inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-xs font-semibold ${
                mode === 'products'
                  ? 'bg-sasta-navy text-white'
                  : 'border border-sasta-border text-sasta-heading hover:bg-sasta-yellow-light'
              }`}
            >
              <Package className="h-3.5 w-3.5" /> Store Products
            </button>
            <Link href="/sitemap.xml" target="_blank" className="inline-flex items-center gap-1 rounded-full border border-sasta-border px-3.5 py-2 text-xs font-semibold text-sasta-heading hover:bg-sasta-yellow-light">
              <Globe className="h-3.5 w-3.5" /> sitemap.xml
            </Link>
            <Link href="/blog" target="_blank" className="inline-flex items-center gap-1 rounded-full border border-sasta-border px-3.5 py-2 text-xs font-semibold text-sasta-heading hover:bg-sasta-yellow-light">
              <ExternalLink className="h-3.5 w-3.5" /> View Blog
            </Link>
            {mode !== 'editor' ? (
              <button
                type="button"
                onClick={openNewPost}
                className="inline-flex items-center gap-1.5 rounded-full bg-sasta-gold px-4 py-2 text-xs font-bold uppercase tracking-wider text-sasta-heading hover:bg-sasta-gold-hover"
              >
                <Plus className="h-4 w-4" /> New Post
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode('list')}
                className="rounded-full border border-sasta-border px-4 py-2 text-xs font-semibold text-sasta-heading hover:bg-sasta-yellow-light"
              >
                &larr; Back to Posts
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1 rounded-full border border-sasta-border px-3 py-2 text-xs text-sasta-muted hover:text-sasta-heading"
            >
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        {mode === 'products' ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-2xl border border-sasta-border bg-white p-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sasta-muted" />
                <input
                  type="search"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search store products by name or handle..."
                  className="w-full rounded-lg border border-sasta-border pl-9 pr-3 py-2 text-sm focus:border-sasta-gold focus:outline-none"
                />
              </div>
              <span className="text-xs text-sasta-muted">Showing {filteredProducts.length} of {storeProducts.length} products</span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-sasta-border bg-white shadow-subtle divide-y divide-sasta-border">
              {paginatedStoreProducts.map((product) => (
                <div key={product.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-sasta-yellow-cream/40">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={product.primaryImage || '/product-placeholder.svg'}
                      alt={product.title}
                      className="h-14 w-12 rounded-lg object-cover border border-sasta-border bg-sasta-yellow-cream shrink-0"
                    />
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold text-sasta-heading truncate">{product.title}</h2>
                      <p className="text-xs text-sasta-muted">
                        £{Number(product.price).toFixed(2)} • Stock: {product.stock ?? 0} • <span className="font-semibold text-sasta-gold-dark">{product.subcategory || product.category}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/product/${product.handle}`}
                      target="_blank"
                      className="rounded-lg border border-sasta-border px-3 py-1.5 text-xs font-semibold text-sasta-heading hover:bg-sasta-yellow-light"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => openProductEditor(product)}
                      className="inline-flex items-center gap-1 rounded-lg bg-sasta-gold px-3.5 py-1.5 text-xs font-bold text-sasta-heading hover:bg-sasta-gold-hover"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Edit Product
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={productsPage} totalPages={productsTotalPages} onPageChange={setProductsPage} />
          </div>
        ) : mode === 'list' ? (
          <div className="space-y-5">
            {/* Search & Status Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-2xl border border-sasta-border bg-white p-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sasta-muted" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search posts by title, slug, or keyword..."
                  className="w-full rounded-lg border border-sasta-border pl-9 pr-3 py-2 text-sm focus:border-sasta-gold focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {['all', 'published', 'draft', 'scheduled'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize ${
                      statusFilter === st
                        ? 'bg-sasta-navy text-white'
                        : 'border border-sasta-border bg-sasta-yellow-cream text-sasta-heading'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Posts Table / Cards */}
            <div className="overflow-hidden rounded-2xl border border-sasta-border bg-white shadow-subtle">
              {posts.length === 0 ? (
                <div className="p-10 text-center text-sm text-sasta-muted">
                  No blog posts found. Click &ldquo;New Post&rdquo; to create your first SEO article.
                </div>
              ) : (
                <div className="divide-y divide-sasta-border">
                  {paginatedPosts.map((post) => (
                    <div key={post.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 hover:bg-sasta-yellow-cream/40">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            post.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800'
                              : post.status === 'scheduled'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-neutral-100 text-neutral-700'
                          }`}>
                            {post.status}
                          </span>
                          <span className="rounded-full bg-sasta-yellow-light px-2.5 py-0.5 text-[10px] font-bold text-sasta-heading">
                            SEO: {post.seoScore}/100
                          </span>
                          <span className="text-[11px] text-sasta-muted">{post.wordCount} words</span>
                          {post.categoryName && (
                            <span className="text-[11px] font-medium text-sasta-gold-dark">{post.categoryName}</span>
                          )}
                        </div>
                        <h2 className="text-base font-bold text-sasta-heading truncate">{post.title}</h2>
                        <p className="text-xs text-sasta-muted truncate">/blog/{post.slug}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 rounded-lg border border-sasta-border px-3 py-1.5 text-xs font-semibold text-sasta-heading hover:bg-sasta-yellow-light"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> View
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEditPost(post.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-sasta-gold px-3 py-1.5 text-xs font-bold text-sasta-heading hover:bg-sasta-gold-hover"
                        >
                          <Edit3 className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(post.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-sasta-border px-3 py-1.5 text-xs font-semibold text-sasta-heading hover:bg-sasta-yellow-light"
                        >
                          <Copy className="h-3.5 w-3.5" /> Duplicate
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(post.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Pagination page={postsPage} totalPages={postsTotalPages} onPageChange={setPostsPage} />
          </div>
        ) : (
          <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main Column */}
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-2xl border border-sasta-border bg-white p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-sasta-heading mb-1">
                    Post Title (H1) *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        title: val,
                        slug: slugLocked ? prev.slug : slugify(val)
                      }));
                    }}
                    placeholder="e.g. Wedding Season ke liye Top 10 Lehenga Designs"
                    className="w-full rounded-lg border border-sasta-border px-3.5 py-2.5 text-base font-semibold text-sasta-heading focus:border-sasta-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-sasta-heading mb-1">
                    URL Slug (301 redirect auto-created if changed)
                  </label>
                  <div className="flex items-center rounded-lg border border-sasta-border overflow-hidden">
                    <span className="bg-sasta-yellow-cream px-3 py-2 text-xs text-sasta-muted border-r border-sasta-border">/blog/</span>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) => {
                        setSlugLocked(true);
                        setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }));
                      }}
                      className="flex-1 px-3 py-2 text-sm text-sasta-heading focus:outline-none"
                    />
                  </div>
                </div>

                {/* Auto-generated Sitemap & Blog Link Preview */}
                <div className="rounded-xl border border-sasta-border bg-sasta-yellow-cream/70 p-3.5 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-sasta-heading flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-sasta-gold-dark" />
                      Auto Sitemap &amp; Live Blog Link
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const url = `${getSiteUrl()}/blog/${form.slug || slugify(form.title)}`;
                          navigator.clipboard?.writeText(url);
                          notify('Blog URL copied!');
                        }}
                        className="inline-flex items-center gap-1 rounded border border-sasta-border bg-white px-2.5 py-1 text-[11px] font-semibold hover:bg-sasta-yellow-light"
                      >
                        <Copy className="h-3 w-3" /> Copy Link
                      </button>
                      <button
                        type="button"
                        onClick={handleRefreshSitemap}
                        className="inline-flex items-center gap-1 rounded border border-sasta-border bg-white px-2.5 py-1 text-[11px] font-semibold hover:bg-sasta-yellow-light"
                      >
                        <RefreshCw className="h-3 w-3" /> Update Sitemap
                      </button>
                    </div>
                  </div>
                  <p className="font-mono text-[11px] text-sasta-navy break-all">
                    {getSiteUrl()}/blog/{form.slug || slugify(form.title) || 'your-post-slug'}
                  </p>
                  {!form.noindex ? (
                    <pre className="overflow-x-auto rounded bg-white p-2 font-mono text-[10px] text-sasta-body border border-sasta-border/70">
{`<url>\n  <loc>${getSiteUrl()}/blog/${form.slug || slugify(form.title) || 'your-post-slug'}</loc>\n  <changefreq>weekly</changefreq>\n  <priority>0.8</priority>\n</url>`}
                    </pre>
                  ) : (
                    <p className="text-[11px] text-amber-700 font-semibold">noindex is enabled — excluded from sitemap.xml</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-sasta-heading mb-1">
                    Article Content (H2/H3, Lists, Tables, Links, Images)
                  </label>
                  <RichTextEditor
                    value={form.contentHtml}
                    onChange={(html) => setForm((prev) => ({ ...prev, contentHtml: html }))}
                    onUploadImage={uploadImageFile}
                  />
                </div>
              </div>

              {/* SEO Box */}
              <div className="rounded-2xl border border-sasta-border bg-white p-5 space-y-4">
                <h2 className="text-base font-bold text-sasta-heading">SEO &amp; Social Metadata</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-sasta-heading mb-1">Focus Keyword</label>
                    <input
                      type="text"
                      value={form.focusKeyword}
                      onChange={(e) => setForm((p) => ({ ...p, focusKeyword: e.target.value }))}
                      placeholder="e.g. Top 10 Lehenga Designs"
                      className="w-full rounded-lg border border-sasta-border px-3 py-2 text-sm focus:border-sasta-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-sasta-heading mb-1">Canonical URL (optional)</label>
                    <input
                      type="url"
                      value={form.canonicalUrl}
                      onChange={(e) => setForm((p) => ({ ...p, canonicalUrl: e.target.value }))}
                      placeholder="Leave blank for default self-canonical"
                      className="w-full rounded-lg border border-sasta-border px-3 py-2 text-sm focus:border-sasta-gold focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label className="font-semibold text-sasta-heading">Meta Title</label>
                    <span className={form.metaTitle.length > 60 ? 'text-rose-600 font-bold' : 'text-sasta-muted'}>
                      {form.metaTitle.length}/60 chars
                    </span>
                  </div>
                  <input
                    type="text"
                    value={form.metaTitle}
                    onChange={(e) => setForm((p) => ({ ...p, metaTitle: e.target.value }))}
                    placeholder="SEO title for Google search results"
                    className="w-full rounded-lg border border-sasta-border px-3 py-2 text-sm focus:border-sasta-gold focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label className="font-semibold text-sasta-heading">Meta Description</label>
                    <span className={form.metaDescription.length > 160 ? 'text-rose-600 font-bold' : 'text-sasta-muted'}>
                      {form.metaDescription.length}/160 chars
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={form.metaDescription}
                    onChange={(e) => setForm((p) => ({ ...p, metaDescription: e.target.value }))}
                    placeholder="Compelling 120-160 character description with focus keyword"
                    className="w-full rounded-lg border border-sasta-border px-3 py-2 text-sm focus:border-sasta-gold focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-xs font-semibold text-sasta-heading mb-1">OG Image URL</label>
                    <input
                      type="text"
                      value={form.ogImage}
                      onChange={(e) => setForm((p) => ({ ...p, ogImage: e.target.value }))}
                      placeholder="Defaults to featured image"
                      className="w-full rounded-lg border border-sasta-border px-3 py-2 text-sm focus:border-sasta-gold focus:outline-none"
                    />
                  </div>
                  <label className="flex items-center gap-2.5 pt-4 text-xs font-semibold text-sasta-heading cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.noindex}
                      onChange={(e) => setForm((p) => ({ ...p, noindex: e.target.checked }))}
                      className="h-4 w-4 accent-sasta-gold"
                    />
                    noindex (hide this post from Google &amp; sitemap)
                  </label>
                </div>

                {/* Schema / JSON-LD Builder */}
                <div className="border-t border-sasta-border pt-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-sasta-heading flex items-center gap-1.5">
                      <Code2 className="h-4 w-4 text-sasta-gold-dark" />
                      Schema Markup (JSON-LD)
                    </label>
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({
                        ...p,
                        customSchema: JSON.stringify({
                          '@context': 'https://schema.org',
                          '@type': 'HowTo',
                          name: p.title || 'Ethnic Outfit Styling Guide',
                          step: [
                            { '@type': 'HowToStep', name: 'Choose Fabric', text: 'Pick breathable silk, georgette, or cotton.' },
                            { '@type': 'HowToStep', name: 'Match Accessories', text: 'Pair with statement earrings and jersey hijab.' }
                          ]
                        }, null, 2)
                      }))}
                      className="rounded-full border border-sasta-border bg-sasta-yellow-cream px-3 py-1 text-[11px] font-semibold text-sasta-heading hover:bg-sasta-yellow-light"
                    >
                      + Insert Sample HowTo Schema
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-sasta-heading mb-1">
                      Custom JSON-LD Schema (optional)
                    </label>
                    <textarea
                      rows={5}
                      value={form.customSchema}
                      onChange={(e) => setForm((p) => ({ ...p, customSchema: e.target.value }))}
                      placeholder='{"@context":"https://schema.org","@type":"HowTo",...}'
                      className="w-full rounded-lg border border-sasta-border px-3 py-2 font-mono text-xs focus:border-sasta-gold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Related Products Picker */}
              <div className="rounded-2xl border border-sasta-border bg-white p-5 space-y-3">
                <h2 className="text-base font-bold text-sasta-heading">
                  Related Store Products ({form.productIds.length} selected)
                </h2>
                <input
                  type="search"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search store products by name..."
                  className="w-full rounded-lg border border-sasta-border px-3 py-2 text-sm focus:border-sasta-gold focus:outline-none"
                />
                <div className="max-h-60 overflow-y-auto divide-y divide-sasta-border rounded-xl border border-sasta-border">
                  {filteredProducts.map((product) => {
                    const pid = Number(product.id);
                    const checked = form.productIds.includes(pid);
                    return (
                      <div key={pid} className="flex items-center gap-3 p-2.5 text-xs hover:bg-sasta-yellow-cream">
                        <label className="flex flex-1 items-center gap-3 cursor-pointer min-w-0">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => setForm((p) => ({
                              ...p,
                              productIds: checked ? p.productIds.filter((x) => x !== pid) : [...p.productIds, pid]
                            }))}
                            className="h-4 w-4 accent-sasta-gold"
                          />
                          <span className="flex-1 font-medium text-sasta-heading truncate">{product.title}</span>
                          <span className="font-bold text-sasta-gold-dark">£{Number(product.price).toFixed(2)}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => openProductEditor(product)}
                          className="shrink-0 rounded border border-sasta-border bg-white px-2.5 py-1 text-[11px] font-semibold text-sasta-heading hover:bg-sasta-yellow-light"
                        >
                          Edit
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="space-y-6">
              {/* Publish Box */}
              <div className="rounded-2xl border border-sasta-border bg-white p-5 space-y-4">
                <h2 className="text-base font-bold text-sasta-heading">Publish Settings</h2>
                <div>
                  <label className="block text-xs font-semibold text-sasta-heading mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                    className="w-full rounded-lg border border-sasta-border px-3 py-2 text-sm bg-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-sasta-heading mb-1">Publish Date</label>
                  <input
                    type="datetime-local"
                    value={form.publishedAt}
                    onChange={(e) => setForm((p) => ({ ...p, publishedAt: e.target.value }))}
                    className="w-full rounded-lg border border-sasta-border px-3 py-2 text-sm"
                  />
                </div>

                {form.updatedAt && (
                  <p className="text-[11px] text-sasta-muted">
                    Last updated: {new Date(form.updatedAt).toLocaleString('en-GB')}
                  </p>
                )}

                <div>
                  <label className="block text-xs font-semibold text-sasta-heading mb-1">Author Name</label>
                  <input
                    type="text"
                    value={form.authorName}
                    onChange={(e) => setForm((p) => ({ ...p, authorName: e.target.value }))}
                    className="w-full rounded-lg border border-sasta-border px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-sasta-heading mb-1">Category</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
                    className="w-full rounded-lg border border-sasta-border px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <div className="mt-2 flex gap-1.5">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="New category..."
                      className="flex-1 rounded-lg border border-sasta-border px-2.5 py-1.5 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="rounded-lg border border-sasta-border px-2.5 py-1.5 text-xs font-semibold hover:bg-sasta-yellow-light"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-sasta-heading mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={form.tagsInput}
                    onChange={(e) => setForm((p) => ({ ...p, tagsInput: e.target.value }))}
                    placeholder="Lehenga Choli, Wedding Wear, Eid"
                    className="w-full rounded-lg border border-sasta-border px-3 py-2 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-full bg-sasta-gold py-3 text-xs font-bold uppercase tracking-wider text-sasta-heading hover:bg-sasta-gold-hover disabled:opacity-60"
                >
                  {saving ? 'Saving…' : form.id ? 'Update Post' : 'Save Post'}
                </button>
              </div>

              {/* Featured Image Box */}
              <div className="rounded-2xl border border-sasta-border bg-white p-5 space-y-3">
                <h2 className="text-base font-bold text-sasta-heading">Featured Image</h2>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-sasta-gold-dark bg-sasta-yellow-cream px-4 py-3 text-xs font-semibold text-sasta-heading hover:bg-sasta-yellow-light">
                  <Upload className="h-4 w-4" />
                  Upload Image (WebP/PNG/JPG)
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={handleFeaturedUpload} className="hidden" />
                </label>
                <input
                  type="text"
                  value={form.featuredImage}
                  onChange={(e) => setForm((p) => ({ ...p, featuredImage: e.target.value }))}
                  placeholder="Or paste image URL (/hero-collection-1.png)"
                  className="w-full rounded-lg border border-sasta-border px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  value={form.featuredImageAlt}
                  onChange={(e) => setForm((p) => ({ ...p, featuredImageAlt: e.target.value }))}
                  placeholder="Image Alt Text (important for SEO)"
                  className="w-full rounded-lg border border-sasta-border px-3 py-2 text-xs"
                />
                {form.featuredImage && (
                  <img
                    src={form.featuredImage}
                    alt={form.featuredImageAlt || 'Preview'}
                    className="h-36 w-full rounded-lg object-cover border border-sasta-border"
                  />
                )}
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Full Store Product Edit Modal */}
      {editingProduct && (() => {
        const numPrice = Number(editingProduct.price) || 0;
        const numCompare = Number(editingProduct.compareAtPrice) || 0;
        const previewDiscount = numCompare > numPrice && numCompare > 0
          ? Math.round(((numCompare - numPrice) / numCompare) * 100)
          : 0;
        const selectedCategoryOptionValue = `${editingProduct.collectionSlug}::${editingProduct.subcategory}`;
        const matchedOption = PRODUCT_CATEGORY_OPTIONS.find(
          (c) => `${c.collectionSlug}::${c.subcategory}` === selectedCategoryOptionValue
        ) || PRODUCT_CATEGORY_OPTIONS.find((c) => c.collectionSlug === editingProduct.collectionSlug);
        const previewPrimary = editingProduct.images?.[0] || '/hero-collection-1.png';

        return (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-3 sm:p-5 overflow-y-auto">
            <form
              onSubmit={handleSaveProduct}
              className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border border-sasta-border bg-white p-5 sm:p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-sasta-border pb-3 sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-lg font-bold text-sasta-heading">Edit Store Product</h2>
                  <p className="text-[11px] text-sasta-muted">Update every detail shown on product cards and product pages.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="rounded-full border border-sasta-border px-3 py-1 text-xs font-semibold text-sasta-muted hover:text-sasta-heading"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Columns: All Editable Fields */}
                <div className="lg:col-span-2 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-sasta-heading mb-1">Product Title *</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.title}
                      onChange={(e) => setEditingProduct((p) => ({ ...p, title: e.target.value }))}
                      className="w-full rounded-lg border border-sasta-border px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-sasta-heading mb-1">Category / Collection *</label>
                      <select
                        value={matchedOption ? `${matchedOption.collectionSlug}::${matchedOption.subcategory}` : ''}
                        onChange={(e) => {
                          const opt = PRODUCT_CATEGORY_OPTIONS.find(
                            (c) => `${c.collectionSlug}::${c.subcategory}` === e.target.value
                          );
                          if (!opt) return;
                          setEditingProduct((p) => ({
                            ...p,
                            collectionSlug: opt.collectionSlug,
                            category: opt.category,
                            subcategory: opt.subcategory
                          }));
                        }}
                        className="w-full rounded-lg border border-sasta-border bg-white px-3 py-2 text-sm"
                      >
                        {PRODUCT_CATEGORY_OPTIONS.map((opt) => (
                          <option
                            key={`${opt.collectionSlug}::${opt.subcategory}`}
                            value={`${opt.collectionSlug}::${opt.subcategory}`}
                          >
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-sasta-heading mb-1">Card Label (Subcategory) *</label>
                      <input
                        type="text"
                        required
                        value={editingProduct.subcategory}
                        onChange={(e) => setEditingProduct((p) => ({ ...p, subcategory: e.target.value }))}
                        placeholder="e.g. Double Stitched, Kids Sharara"
                        className="w-full rounded-lg border border-sasta-border px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-sasta-heading mb-1">Price (£) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={editingProduct.price}
                        onChange={(e) => setEditingProduct((p) => ({ ...p, price: e.target.value }))}
                        className="w-full rounded-lg border border-sasta-border px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-sasta-heading mb-1">
                        Compare (£) {previewDiscount > 0 && <span className="text-sasta-gold-dark font-bold">({previewDiscount}% OFF)</span>}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editingProduct.compareAtPrice}
                        onChange={(e) => setEditingProduct((p) => ({ ...p, compareAtPrice: e.target.value }))}
                        placeholder="Original price"
                        className="w-full rounded-lg border border-sasta-border px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-sasta-heading mb-1">Stock</label>
                      <input
                        type="number"
                        min="0"
                        value={editingProduct.stock}
                        onChange={(e) => setEditingProduct((p) => ({ ...p, stock: e.target.value }))}
                        className="w-full rounded-lg border border-sasta-border px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  {/* Card Badges & Visibility */}
                  <div className="rounded-xl border border-sasta-border bg-sasta-yellow-cream/40 p-3 flex flex-wrap gap-4">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-sasta-heading cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingProduct.isNewArrival}
                        onChange={(e) => setEditingProduct((p) => ({ ...p, isNewArrival: e.target.checked }))}
                        className="rounded border-sasta-border"
                      />
                      <span>New Arrival Badge (NEW)</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-sasta-heading cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingProduct.isBestSeller}
                        onChange={(e) => setEditingProduct((p) => ({ ...p, isBestSeller: e.target.checked }))}
                        className="rounded border-sasta-border"
                      />
                      <span>Best Seller</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-sasta-heading cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingProduct.isActive}
                        onChange={(e) => setEditingProduct((p) => ({ ...p, isActive: e.target.checked }))}
                        className="rounded border-sasta-border"
                      />
                      <span>Active (Visible on Store)</span>
                    </label>
                  </div>

                  {/* Sizes & Colors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-sasta-heading mb-1">Sizes (comma separated)</label>
                      <input
                        type="text"
                        value={editingProduct.sizesInput}
                        onChange={(e) => setEditingProduct((p) => ({ ...p, sizesInput: e.target.value }))}
                        placeholder="S, M, L, XL, XXL"
                        className="w-full rounded-lg border border-sasta-border px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-sasta-heading mb-1">Colors (comma separated)</label>
                      <input
                        type="text"
                        value={editingProduct.colorsInput}
                        onChange={(e) => setEditingProduct((p) => ({ ...p, colorsInput: e.target.value }))}
                        placeholder="Black, Beige, Emerald"
                        className="w-full rounded-lg border border-sasta-border px-3 py-2 text-xs"
                      />
                    </div>
                  </div>

                  {/* Product Images (Primary, Hover & Gallery) */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-sasta-heading">
                      Product Images (1st = Primary, 2nd = Hover Image)
                    </label>
                    {editingProduct.images?.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                        {editingProduct.images.map((imgUrl, idx) => (
                          <div key={`${imgUrl}-${idx}`} className="relative rounded-lg border border-sasta-border bg-neutral-50 p-1.5 space-y-1">
                            <img
                              src={imgUrl}
                              alt={`Product ${idx + 1}`}
                              className="h-24 w-full rounded object-cover"
                            />
                            <div className="flex items-center justify-between gap-1 text-[10px]">
                              <span className="font-bold text-sasta-gold-dark truncate">
                                {idx === 0 ? 'Primary' : idx === 1 ? 'Hover' : `#${idx + 1}`}
                              </span>
                              <div className="flex items-center gap-1">
                                {idx > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setEditingProduct((p) => {
                                      const next = [...p.images];
                                      const [picked] = next.splice(idx, 1);
                                      next.unshift(picked);
                                      return { ...p, images: next };
                                    })}
                                    className="rounded bg-sasta-yellow-cream px-1.5 py-0.5 font-semibold text-sasta-heading hover:bg-sasta-gold"
                                    title="Make Primary"
                                  >
                                    1st
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setEditingProduct((p) => ({
                                    ...p,
                                    images: p.images.filter((_, i) => i !== idx)
                                  }))}
                                  className="rounded bg-rose-50 px-1.5 py-0.5 font-bold text-rose-600 hover:bg-rose-100"
                                  title="Remove Image"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="text"
                        value={editingProduct.newImageUrl}
                        onChange={(e) => setEditingProduct((p) => ({ ...p, newImageUrl: e.target.value }))}
                        placeholder="Paste image URL and click Add..."
                        className="flex-1 min-w-[180px] rounded-lg border border-sasta-border px-3 py-2 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const url = (editingProduct.newImageUrl || '').trim();
                          if (!url) return;
                          setEditingProduct((p) => ({
                            ...p,
                            images: [...(p.images || []), url],
                            newImageUrl: ''
                          }));
                        }}
                        className="rounded-lg border border-sasta-border bg-white px-3 py-2 text-xs font-semibold hover:bg-sasta-yellow-cream"
                      >
                        Add URL
                      </button>
                      <label className="cursor-pointer rounded-lg border border-sasta-border bg-sasta-yellow-cream px-3 py-2 text-xs font-semibold hover:bg-sasta-yellow-light">
                        Upload Image
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            e.target.value = '';
                            if (!file) return;
                            try {
                              const url = await uploadImageFile(file);
                              setEditingProduct((p) => ({ ...p, images: [...(p.images || []), url] }));
                              notify('Product image uploaded!');
                            } catch (err) {
                              notify(err.message);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-sasta-heading mb-1">Description</label>
                    <textarea
                      rows={5}
                      value={editingProduct.description}
                      onChange={(e) => setEditingProduct((p) => ({ ...p, description: e.target.value }))}
                      className="w-full rounded-lg border border-sasta-border px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                {/* Right Column: Live Card Preview */}
                <div className="lg:col-span-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sasta-gold-dark mb-2">
                    Live Card Preview
                  </p>
                  <div className="rounded-md border border-sasta-border/80 bg-white overflow-hidden shadow-sm">
                    <div className="relative aspect-[2/3] w-full bg-neutral-100">
                      <img src={previewPrimary} alt={editingProduct.title} className="h-full w-full object-cover" />
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                        {previewDiscount > 0 && (
                          <span className="bg-sasta-gold text-sasta-heading text-[10px] font-bold px-2 py-0.5 uppercase rounded">
                            {previewDiscount}% OFF
                          </span>
                        )}
                        {editingProduct.isNewArrival && Number(editingProduct.stock) > 0 && (
                          <span className="bg-sasta-yellow-cream text-sasta-heading border border-sasta-border text-[9px] font-bold px-1.5 py-0.5 uppercase rounded">
                            New
                          </span>
                        )}
                      </div>
                      {Number(editingProduct.stock) <= 0 && (
                        <div className="absolute inset-x-2 bottom-2 bg-neutral-800/90 text-white text-xs font-semibold text-center py-2 rounded">
                          Out of Stock
                        </div>
                      )}
                    </div>
                    <div className="p-3 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-sasta-muted block">
                        {editingProduct.subcategory || editingProduct.category}
                      </span>
                      <p className="text-xs font-medium text-sasta-heading line-clamp-2">
                        {editingProduct.title || 'Product Title'}
                      </p>
                      <div className="pt-1.5 border-t border-sasta-border/40 flex items-baseline gap-2">
                        <span className="font-bold text-sm text-sasta-heading">
                          £{numPrice.toFixed(2)}
                        </span>
                        {numCompare > numPrice && (
                          <span className="text-xs text-sasta-muted line-through">
                            £{numCompare.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-sasta-border pt-3 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setEditingProduct(null)} className="rounded-full border border-sasta-border px-4 py-2 text-xs font-semibold">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="rounded-full bg-sasta-gold px-5 py-2 text-xs font-bold uppercase tracking-wider text-sasta-heading hover:bg-sasta-gold-hover disabled:opacity-60"
                >
                  {savingProduct ? 'Saving…' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        );
      })()}
    </div>
  );
}
