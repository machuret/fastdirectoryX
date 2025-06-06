import { useEffect, useState } from 'react';
import Link from 'next/link';
import { NextPage } from 'next';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, PlusCircle, Image as ImageIcon, LayoutGrid } from 'lucide-react';
import { Category } from '@prisma/client';
import { toast } from 'sonner'; // Assuming sonner for toasts

/**
 * Extends the Prisma `Category` type to optionally include a nested `parent` category object.
 * This is useful if the API returns parent category details alongside each category.
 */
interface CategoryWithParent extends Category {
  /** Optional parent category details. */
  parent?: Category | null;
}

/**
 * Admin page for managing categories.
 * Displays a list of categories with options to add, edit, and delete them.
 * Fetches category data from the API and handles user interactions for management tasks.
 */
const AdminCategoriesPage: NextPage = () => {
  /** State for the array of categories displayed on the page. */
  const [categories, setCategories] = useState<CategoryWithParent[]>([]);
  /** State to indicate if categories are currently being fetched. */
  const [loading, setLoading] = useState(true);
  /** State for storing and displaying error messages related to fetching or operations. */
  const [error, setError] = useState<string | null>(null);
  /** State to control the visibility of the delete confirmation dialog. */
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  /** State to store the category object that is currently marked for deletion. */
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  /**
   * Fetches categories from the `/api/admin/categories` endpoint.
   * Updates loading, error, and categories states.
   * Displays toast notifications for success or failure.
   */
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/categories');
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
      }
      const data = await response.json();
      // Potentially fetch parent category names here if needed for display, or adjust API
      setCategories(data.categories || []);
    } catch (err: any) {
      setError(err.message);
      toast.error('Error fetching categories', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  /**
   * Handles the click event for the 'Delete' action on a category.
   * Sets the category to be deleted and shows the confirmation dialog.
   * @param {Category} category - The category object to be deleted.
   */
  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteDialog(true);
  };

  /**
   * Confirms and executes the deletion of the category stored in `categoryToDelete`.
   * Sends a DELETE request to `/api/admin/categories/:id`.
   * Displays toast notifications and refreshes the category list on success.
   * Clears deletion state and hides the dialog afterwards.
   */
  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      const response = await fetch(`/api/admin/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete category: ${response.statusText}`);
      }
      toast.success('Category deleted successfully');
      fetchCategories(); // Refresh the list
    } catch (err: any) {
      toast.error('Error deleting category', { description: err.message });
    } finally {
      setShowDeleteDialog(false);
      setCategoryToDelete(null);
    }
  };

  const pageActions = (
    <Link href="/admin/categories/new" passHref>
      <Button>
        <PlusCircle className="mr-2 h-4 w-4" /> Add New Category
      </Button>
    </Link>
  );

  if (loading) {
    return (
      <AdminLayout pageTitle="Categories" pageIcon={LayoutGrid} actionButtons={pageActions}>
        <p>Loading categories...</p>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout pageTitle="Categories" pageIcon={LayoutGrid} actionButtons={pageActions}>
        <p className="text-red-500">Error: {error}</p>
        <Button onClick={fetchCategories} className="mt-4">Retry</Button>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      pageTitle="Manage Categories" 
      pageDescription="Add, edit, or delete product and content categories."
      pageIcon={LayoutGrid} 
      actionButtons={pageActions}
    >
      <div className="bg-white p-6 rounded-lg shadow-subtle">
        {categories.length === 0 ? (
          <p>No categories found. <Link href="/admin/categories/new" className="text-primary hover:underline">Add the first one!</Link></p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    {category.featureImageUrl ? (
                      <img 
                        src={category.featureImageUrl} 
                        alt={category.name} 
                        className="h-12 w-12 object-cover rounded"
                        onError={(e) => (e.currentTarget.style.display = 'none')} // Hide if image fails to load
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.slug}</TableCell>
                  <TableCell className="max-w-xs truncate">{(category as any).description || '-'}</TableCell>
                  <TableCell>{(category as any).status || 'ACTIVE'}</TableCell> {/* Assuming default or add status to model */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/admin/categories/edit/${category.id}`} passHref>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem onClick={() => handleDeleteClick(category)} className="text-red-600">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category
              <strong> {categoryToDelete?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminCategoriesPage;
