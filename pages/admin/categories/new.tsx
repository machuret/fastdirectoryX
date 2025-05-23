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
import { PlusCircle, UploadCloud, XCircle, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { Category } from '@prisma/client';
import { toast } from 'sonner';

/**
 * Defines the structure for the new category form data.
 */
interface NewCategoryFormState {
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
 * Page component for creating a new category.
 * Provides a form for entering category details, including name, slug, description,
 * parent category, feature image, and SEO meta tags.
 */
const NewCategoryPage: NextPage = () => {
  const router = useRouter();
  /** State object holding all form data for the new category. */
  const [formData, setFormData] = useState<NewCategoryFormState>({
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
  /** State for the selected feature image file. */
  const [imageFile, setImageFile] = useState<File | null>(null);
  /** State for the URL preview of the selected feature image. */
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  /** State for storing image upload error messages. */
  const [uploadError, setUploadError] = useState<string | null>(null);
  /** State to indicate if an image upload is currently in progress. */
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Fetch all categories for parent selection
    /**
     * Fetches all existing categories to populate the parent category dropdown.
     */
    const fetchParentCategories = async () => {
      try {
        const res = await fetch('/api/admin/categories');
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data = await res.json();
        setAllCategories(data.categories || []);
      } catch (error) {
        console.error('Error fetching parent categories:', error);
        toast.error('Could not load parent categories.');
      }
    };
    fetchParentCategories();
  }, []);

  /**
   * Handles changes to text input and textarea fields in the form.
   * Updates the corresponding field in `formData`.
   * If the name is changed and slug is empty, it auto-generates a slug.
   * @param {ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e - The change event.
   */
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'name' && !formData.slug) && { slug: generateSlug(value) }
    }));
  };

  /**
   * Handles changes to select input fields (e.g., parent category, status).
   * @param {keyof NewCategoryFormState} name - The name of the form field to update.
   * @param {string} value - The new value for the field.
   */
  const handleSelectChange = (name: keyof NewCategoryFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Generates a URL-friendly slug from a given string.
   * Converts to lowercase, replaces spaces with hyphens, and removes non-alphanumeric characters.
   * @param {string} name - The string to slugify.
   * @returns {string} The generated slug.
   */
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^฀-๿\w-]+/g, '') // Remove all non-word chars except Thai characters
      .replace(/--+/g, '-'); // Replace multiple - with single -
  };

  /**
   * Handles the file selection for the feature image.
   * Validates file size, sets image preview, and initiates upload.
   * @param {ChangeEvent<HTMLInputElement>} e - The file input change event.
   */
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setUploadError('File is too large. Maximum size is 5MB.');
        setImageFile(null);
        setImagePreview(null);
        e.target.value = ''; // Reset file input
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setUploadError(null);
      // Automatically upload
      handleImageUpload(file);
    }
  };

  /**
   * Uploads the selected image file to the server.
   * Updates `formData.featureImageUrl` on success or sets an error message on failure.
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
      // Clear image if upload fails to prevent submitting a non-existent URL
      setFormData((prev) => ({ ...prev, featureImageUrl: '' }));
      setImagePreview(null);
      setImageFile(null);
      // It's good practice to also clear the file input visually if possible, though tricky
    } finally {
      setIsUploading(false);
    }
  };
  
  /**
   * Removes the currently selected/uploaded feature image from the form.
   * Clears the image file, preview, and the `featureImageUrl` in `formData`.
   * Resets the file input field.
   */
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, featureImageUrl: '' }));
    const fileInput = document.getElementById('featureImage') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    toast.info('Image removed.');
  };

  /**
   * Handles the form submission to create a new category.
   * Validates required fields, sends a POST request to the API, and handles the response.
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
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create category');
      }
      toast.success('Category created successfully!');
      router.push('/admin/categories');
    } catch (error: any) {
      toast.error('Error creating category', { description: error.message });
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout pageTitle="Add New Category" pageIcon={PlusCircle}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Details</CardTitle>
                <CardDescription>Enter the main information for your new category.</CardDescription>
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
                  <Select name="parentId" onValueChange={(value) => handleSelectChange('parentId', value)} value={formData.parentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a parent category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {allCategories.map((cat) => (
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
                <Button type="button" variant="outline" onClick={() => document.getElementById('featureImage')?.click()} disabled={isUploading || !!imagePreview}>
                  <UploadCloud className="mr-2 h-4 w-4" /> {imagePreview ? 'Change Image' : 'Upload Image'}
                </Button>
                
                {isUploading && <p className="text-sm text-muted-foreground flex items-center"><UploadCloud className="animate-pulse mr-2 h-4 w-4"/> Uploading...</p>}
                {uploadError && <p className="text-sm text-red-500 flex items-center"><AlertCircle className="mr-2 h-4 w-4"/> {uploadError}</p>}
                
                {imagePreview && (
                  <div className="mt-4 relative group">
                    <img src={imagePreview} alt="Preview" className="rounded-md max-h-60 w-full object-cover" />
                    {!isUploading && formData.featureImageUrl && (
                       <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full text-xs flex items-center">
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
                <CardTitle>Publish</CardTitle>
              </CardHeader>
              <CardContent>
                <Button type="submit" className="w-full" disabled={isSubmitting || isUploading}>
                  {isSubmitting ? 'Saving...' : 'Save Category'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
};

export default NewCategoryPage;
