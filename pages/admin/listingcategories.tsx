import React, { useState, useEffect, FormEvent } from 'react';
import AdminLayout from '@/components/admin/AdminLayout'; // Re-added this import
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Toaster, toast } from 'sonner'; // Assuming you use Sonner for toasts
import type { NextPageWithLayout, MyAppPageProps } from '@/pages/_app'; // Import types from _app
import { AdminHeaderProvider } from '@/components/AdminHeaderContext'; // Import for getLayout
import { iconMap } from '@/components/admin/iconMap'; // For icons in getLayout
import type { LucideIcon } from 'lucide-react'; // For icons in getLayout

interface ListingCategory {
  category_id: number;
  category_name: string;
  slug?: string | null;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  imageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const ListingCategoriesPage: NextPageWithLayout = () => { // Use NextPageWithLayout
  const [categories, setCategories] = useState<ListingCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ListingCategory | null>(null);

  // Form state
  const [categoryName, setCategoryName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/listingcategories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data: ListingCategory[] = await res.json();
      setCategories(data.map(cat => ({
        ...cat,
        createdAt: new Date(cat.createdAt), // Ensure dates are Date objects
        updatedAt: new Date(cat.updatedAt),
      })));
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message || 'Could not fetch categories.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setCategoryName('');
    setSlug('');
    setDescription('');
    setSeoTitle('');
    setSeoDescription('');
    setImageUrl('');
    setEditingCategory(null);
    setShowForm(false);
  };

  const handleEdit = (category: ListingCategory) => {
    setEditingCategory(category);
    setCategoryName(category.category_name);
    setSlug(category.slug || '');
    setDescription(category.description || '');
    setSeoTitle(category.seoTitle || '');
    setSeoDescription(category.seoDescription || '');
    setImageUrl(category.imageUrl || '');
    setShowForm(true);
  };

  const handleDelete = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await fetch(`/api/admin/listingcategories/${categoryId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to delete category' }));
        throw new Error(errorData.message);
      }
      toast.success('Category deleted successfully!');
      fetchCategories(); // Refresh list
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message || 'Could not delete category.');
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      category_name: categoryName,
      slug: slug || undefined, // Send undefined if empty, API will generate
      description,
      seoTitle,
      seoDescription,
      imageUrl,
    };

    const url = editingCategory
      ? `/api/admin/listingcategories/${editingCategory.category_id}`
      : '/api/admin/listingcategories';
    const method = editingCategory ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || `Failed to ${editingCategory ? 'update' : 'create'} category`);
      }
      toast.success(`Category ${editingCategory ? 'updated' : 'created'} successfully!`);
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message);
    }
  };
  
  if (isLoading && categories.length === 0) { // Show loading only on initial load
    // For initial loading, we can't use the full getLayout structure easily here,
    // but AdminLayout itself is fine if it doesn't cause issues before _app.tsx's logic runs.
    // Alternatively, return a simpler loading indicator that AdminLayout from _app will wrap.
    return <p>Loading categories...</p>; 
  }

  return (
    <>
      <Toaster richColors />
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Manage Listing Categories</h2>
        {!showForm && (
          <Button onClick={() => { resetForm(); setShowForm(true); }}>Add New Category</Button>
        )}
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</CardTitle>
            <CardDescription>
              {editingCategory ? 'Update the details for this category.' : 'Fill in the details for the new category.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="categoryName">Category Name <span className="text-red-500">*</span></Label>
                <Input id="categoryName" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="slug">Slug (auto-generated if blank)</Label>
                <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g., my-category-name" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="seoTitle">SEO Title</Label>
                <Input id="seoTitle" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="seoDescription">SEO Description</Label>
                <Textarea id="seoDescription" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input id="imageUrl" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
              </div>
              <div className="flex space-x-4">
                <Button type="submit">{editingCategory ? 'Update Category' : 'Create Category'}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Existing Categories</CardTitle>
            <CardDescription>View, edit, or delete listing categories.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && categories.length > 0 && <p>Refreshing categories...</p>}
            {!isLoading && categories.length === 0 && <p>No categories found. Click "Add New Category" to start.</p>}
            {categories.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categories.map((cat) => (
                      <tr key={cat.category_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cat.category_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cat.slug}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{cat.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(cat)}>Edit</Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(cat.category_id)}>Delete</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};

// Define getLayout for this page
ListingCategoriesPage.getLayout = function getLayout(page: React.ReactElement, pageProps: MyAppPageProps /*, headerMenuItems, footerMenuItems */) { // header/footerMenu not used here
  // Prepare initial base elements for the AdminHeaderProvider
  const pageTitle = pageProps.pageTitle || "Listing Categories"; 
  const pageDescription = pageProps.pageDescription || "Manage all your listing categories"; 
  const pageIconName = pageProps.pageIconName || "LayoutGrid"; 

  const initialBaseElements: { title?: string; description?: string; icon?: React.ReactNode } = {};
  if (pageTitle) initialBaseElements.title = pageTitle;
  if (pageDescription) initialBaseElements.description = pageDescription;
  if (pageIconName && typeof pageIconName === 'string') {
    const IconComponent = iconMap[pageIconName as keyof typeof iconMap] as LucideIcon | undefined;
    if (IconComponent) initialBaseElements.icon = <IconComponent />;
  }

  return (
    <AdminHeaderProvider initialBaseElements={initialBaseElements}>
      <AdminLayout>
        {page}
      </AdminLayout>
    </AdminHeaderProvider>
  );
};

export default ListingCategoriesPage;
