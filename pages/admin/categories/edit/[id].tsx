import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Edit3, UploadCloud, XCircle, Image as ImageIcon, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Category } from '@prisma/client';
import { toast } from 'sonner';
import Link from 'next/link';

/**
 * Defines the structure for the category edit form data.
 */
interface EditCategoryFormState {
  /** The name of the category. */
  name: string;
  /** The URL-friendly slug for the category. */
  slug: string;
  /** A detailed description of the category. */
  description: string;
  /** URL of the category's featured image. */
  featureImageUrl: string;
  /** ID of the parent category, if any. Stored as string for select input. */
  parentId: string; 
  /** SEO meta title for the category page. */
  metaTitle: string;
  /** SEO meta description for the category page. */
  metaDescription: string;
  /** SEO meta keywords for the category page. */
  metaKeywords: string;
  /** The status of the category (e.g., 'ACTIVE', 'INACTIVE'). */
  status: string;
}

/**
 * Page component for editing an existing category.
 * Fetches category data based on the ID from the URL query.
 * Provides a form to modify category details, including name, slug, description,
 * parent category, feature image, and SEO meta tags.
 */
const EditCategoryPage: NextPage = () => {
  const router = useRouter();
  const { id: categoryId } = router.query;

  /** State object holding all form data for the category being edited. */
  const [formData, setFormData] = useState<EditCategoryFormState>({
    name: '',
    slug: '',
    description: '',
    featureImageUrl: '',
    parentId: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    status: 'ACTIVE',
  });
  /** State for storing all existing categories, used for parent category selection. */
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  /** State to indicate if the form is currently being submitted. */
  const [isSubmitting, setIsSubmitting] = useState(false);
  /** State to indicate if the initial category data is currently being loaded. */
  const [isLoading, setIsLoading] = useState(true);
  /** State for the selected feature image file (if a new one is chosen). */
  const [imageFile, setImageFile] = useState<File | null>(null);
  /** State for the URL preview of the selected or existing feature image. */
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  /** State for storing image upload error messages. */
  const [uploadError, setUploadError] = useState<string | null>(null);
  /** State to indicate if an image upload is currently in progress. */
  const [isUploading, setIsUploading] = useState(false);
  /** State to store the initial feature image URL loaded with the category, for potential revert on upload error. */
  const [initialFeatureImageUrl, setInitialFeatureImageUrl] = useState<string | null>(null);

  useEffect(() => {
    /**
     * Fetches all existing categories to populate the parent category dropdown.
     */
    const fetchParentCategories = async () => {
      try {
        const res = await fetch('/api/admin/categories');
        if (!res.ok) throw new Error('Failed to fetch parent categories');
        const data = await res.json();
        setAllCategories(data.categories || []);
      } catch (error) {
        console.error('Error fetching parent categories:', error);
        toast.error('Could not load parent categories.');
      }
    };
    fetchParentCategories();
  }, []);

  useEffect(() => {
    if (categoryId) {
      setIsLoading(true);
      /**
       * Fetches the data for the category being edited from the API.
       * Populates the form and image preview states with the fetched data.
       */
      const fetchCategoryData = async () => {
        try {
          const res = await fetch(`/api/admin/categories/${categoryId}`);
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to fetch category data');
          }
          const data = await res.json();
          const category: Category = data.category;
          setFormData({
            name: category.name || '',
            slug: category.slug || '',
            description: (category as any).description || '', 
            featureImageUrl: category.featureImageUrl || '',
            parentId: (category as any).parentId?.toString() || '',
            metaTitle: (category as any).metaTitle || '',
            metaDescription: (category as any).metaDescription || '',
            metaKeywords: (category as any).metaKeywords || '',
            status: (category as any).status || 'ACTIVE',
          });
          if (category.featureImageUrl) {
            setImagePreview(category.featureImageUrl);
            setInitialFeatureImageUrl(category.featureImageUrl);
          }
        } catch (error: any) {
          toast.error('Error loading category data', { description: error.message });
          router.push('/admin/categories'); // Redirect if category not found or error
        } finally {
          setIsLoading(false);
        }
      };
      fetchCategoryData();
    }
  }, [categoryId, router]);

  /**
   * Handles changes to text input and textarea fields in the form.
   * Updates the corresponding field in `formData`.
   * @param {ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e - The change event.
   */
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Handles changes to select input fields (e.g., parent category, status).
   * @param {keyof EditCategoryFormState} name - The name of the form field to update.
   * @param {string} value - The new value for the field.
   */
  const handleSelectChange = (name: keyof EditCategoryFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Handles the file selection for replacing the feature image.
   * Validates file size, sets image preview, and initiates upload of the new image.
   * @param {ChangeEvent<HTMLInputElement>} e - The file input change event.
   */
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setUploadError('File is too large. Maximum size is 5MB.');
        setImageFile(null);
        setImagePreview(formData.featureImageUrl || null); // Revert to original if new upload fails size check
        e.target.value = '';
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setUploadError(null);
      handleImageUpload(file); // Auto-upload new file
    }
  };

  /**
   * Uploads the selected image file to the server.
   * Updates `formData.featureImageUrl` on success. On failure, may revert to `initialFeatureImageUrl`.
   * @param {File | null} fileToUpload - The file to upload. Defaults to `imageFile` state.
   */
  const handleImageUpload = async (fileToUpload: File | null = imageFile) => {
    if (!fileToUpload) return;
    setIsUploading(true);
    setUploadError(null);
    const uploadFormData = new FormData();
    uploadFormData.append('file', fileToUpload);

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadFormData,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }
      setFormData((prev) => ({ ...prev, featureImageUrl: result.filePath }));
      toast.success('Image uploaded successfully!');
    } catch (error: any) {
      setUploadError(error.message || 'An unknown error occurred during upload.');
      toast.error('Image upload failed', { description: error.message });
      // Revert to initial image on failure if one existed, or clear if not
      setFormData((prev) => ({ ...prev, featureImageUrl: initialFeatureImageUrl || '' }));
      setImagePreview(initialFeatureImageUrl || null);
      setImageFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Removes the currently selected/uploaded feature image from the form.
   * Clears the image file, preview, and the `featureImageUrl` in `formData`.
   * Also clears `initialFeatureImageUrl` to prevent unintended reverts.
   * Resets the file input field.
   */
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, featureImageUrl: '' }));
    setInitialFeatureImageUrl(null); // Ensure it doesn't revert on next error
    const fileInput = document.getElementById('featureImage') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    toast.info('Image removed.');
  };

  /**
   * Handles the form submission to update the existing category.
   * Validates required fields, sends a PUT request to the API, and handles the response.
   * Navigates to the category list page on success.
   * @param {FormEvent<HTMLFormElement>} e - The form submission event.
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      toast.error('Name and Slug are required.');
      return;
    }
    setIsSubmitting(true);

    const dataToSubmit = {
      ...formData,
      parentId: formData.parentId ? parseInt(formData.parentId, 10) : null,
    };

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update category');
      }
      toast.success('Category updated successfully!');
      router.push('/admin/categories');
    } catch (error: any) {
      toast.error('Error updating category', { description: error.message });
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <AdminLayout pageTitle="Edit Category"><p>Loading category data...</p></AdminLayout>;
  }

  return (
    <AdminLayout pageTitle="Edit Category" pageIcon={Edit3} pageDescription={`Editing: ${formData.name}`}>
      <div className="mb-4">
        <Link href="/admin/categories" passHref>
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Categories</Button>
        </Link>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Details</CardTitle>
                <CardDescription>Update the information for this category.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input id="slug" name="slug" value={formData.slug} onChange={handleInputChange} required />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={4} />
                </div>
                <div>
                  <Label htmlFor="parentId">Parent Category</Label>
                  <Select name="parentId" onValueChange={(value) => handleSelectChange('parentId', value)} value={formData.parentId || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a parent category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {allCategories
                        .filter(cat => cat.id.toString() !== categoryId) // Prevent self-parenting
                        .map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" onValueChange={(value) => handleSelectChange('status', value)} value={formData.status}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO Meta Tags</CardTitle>
                <CardDescription>Optimize for search engines (optional).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input id="metaTitle" name="metaTitle" value={formData.metaTitle} onChange={handleInputChange} />
                </div>
                <div>
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea id="metaDescription" name="metaDescription" value={formData.metaDescription} onChange={handleInputChange} rows={3} />
                </div>
                <div>
                  <Label htmlFor="metaKeywords">Meta Keywords (comma-separated)</Label>
                  <Input id="metaKeywords" name="metaKeywords" value={formData.metaKeywords} onChange={handleInputChange} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Feature Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input id="featureImage" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleFileChange} className="hidden" />
                <Button type="button" variant="outline" onClick={() => document.getElementById('featureImage')?.click()} disabled={isUploading}>
                  <UploadCloud className="mr-2 h-4 w-4" /> {imagePreview ? 'Change Image' : 'Upload Image'}
                </Button>
                
                {isUploading && <p className="text-sm text-muted-foreground flex items-center"><UploadCloud className="animate-pulse mr-2 h-4 w-4"/> Uploading...</p>}
                {uploadError && <p className="text-sm text-red-500 flex items-center"><AlertCircle className="mr-2 h-4 w-4"/> {uploadError}</p>}
                
                {imagePreview && (
                  <div className="mt-4 relative group">
                    <img src={imagePreview} alt="Preview" className="rounded-md max-h-60 w-full object-cover" />
                    {!isUploading && formData.featureImageUrl && (
                       <div className="absolute top-2 right-2 bg-green-500 text-white p-1 px-2 rounded-full text-xs flex items-center">
                         <CheckCircle size={14} className="mr-1"/> Uploaded
                       </div>
                    )}
                    {!isUploading && (
                      <Button 
                        type="button" 
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={removeImage}
                      >
                        <XCircle size={18}/>
                      </Button>
                    )}
                  </div>
                )}
                {!imagePreview && !isUploading && (
                    <div className="mt-2 flex items-center justify-center h-40 border-2 border-dashed border-gray-300 rounded-md">
                        <div className="text-center">
                            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-500">No image selected</p>
                        </div>
                    </div>
                )}
                {formData.featureImageUrl && <Input type="hidden" name="featureImageUrl" value={formData.featureImageUrl} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Update</CardTitle>
              </CardHeader>
              <CardContent>
                <Button type="submit" className="w-full" disabled={isSubmitting || isUploading}>
                  {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
};

export default EditCategoryPage;
