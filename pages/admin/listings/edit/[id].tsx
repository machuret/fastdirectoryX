import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Store, ArrowLeft, Save, Loader2, AlertTriangle, ImagePlus, Trash2, PlusCircle, Wand2, CheckCircle2
} from 'lucide-react';

// Define types for the serialized data expected from the API
/**
 * Represents a single FAQ item with a question and an answer.
 */
interface FAQItem {
  /** The question part of the FAQ. */
  question: string;
  /** The answer part of the FAQ. */
  answer: string;
}

/**
 * Represents a serialized review as returned by the admin API for a listing.
 * Note: Review ratings and dates are represented as strings due to potential serialization of Decimal/DateTime.
 */
interface AdminSerializedReview {
  /** Unique identifier for the review. */
  review_id: string;
  /** Name of the reviewer. */
  reviewer_name?: string | null;
  /** Text content of the review. */
  review_text?: string | null;
  /** Rating given in the review (serialized as string). */
  rating?: string | null; 
  /** Date when the review was published (serialized as string). */
  published_at_date?: string | null; 
}

/**
 * Represents a serialized image URL associated with a listing, as returned by the admin API.
 */
interface SerializedAdminListingImageUrl {
  /** Unique identifier for the image URL record. */
  image_url_id: string;
  /** The actual URL of the image. */
  url: string;
  /** Optional description for the image. */
  description?: string | null;
  /** Flag indicating if this is the primary cover image for the listing. */
  is_cover_image: boolean;
}

/**
 * Represents the detailed structure of a business listing as fetched from the admin API.
 * Contains various fields including basic info, contact, location, images, reviews, and FAQs.
 * Timestamps and numerical values like latitude/longitude might be serialized as strings.
 */
interface AdminSerializedListing {
  /** Unique identifier for the business listing. */
  business_id: string;
  /** The title or name of the business. */
  title: string;
  /** Price range (e.g., "$", "$$"). */
  price_range?: string | null;
  /** Primary category name. */
  category_name?: string | null;
  /** Full address string. */
  address?: string | null;
  /** Neighborhood. */
  neighborhood?: string | null;
  /** Street address. */
  street?: string | null;
  /** City. */
  city?: string | null;
  /** Postal or ZIP code. */
  postal_code?: string | null;
  /** State or province. */
  state?: string | null;
  /** Two-letter country code. */
  country_code?: string | null;
  /** Primary phone number. */
  phone?: string | null;
  /** Detailed description of the business. */
  description?: string | null;
  /** Official website URL. */
  website?: string | null;
  /** Geographical latitude (serialized as string). */
  latitude?: string | null; 
  /** Geographical longitude (serialized as string). */
  longitude?: string | null; 
  /** Google Places ID or similar identifier. */
  place_id?: string | null;
  /** URL of the main image for the listing. */
  image_url?: string | null; 
  /** Array of gallery images associated with the listing. */
  imageUrls?: SerializedAdminListingImageUrl[]; 
  /** Timestamp of the last update (serialized as string). */
  updatedAt: string; 
  /** Timestamp of when the listing was last scraped (serialized as string). */
  scraped_at?: string | null; 
  /** Array of reviews for the listing. */
  reviews?: AdminSerializedReview[];
  /** Array of FAQ items for the listing. */
  faq?: FAQItem[] | null; 
  /** URL to the business's Facebook page. */
  facebook_url?: string | null;
  /** URL to the business's Instagram profile. */
  instagram_url?: string | null;
  /** URL to the business's LinkedIn page. */
  linkedin_url?: string | null;
  /** URL to the business's Pinterest page. */
  pinterest_url?: string | null;
  /** URL to the business's YouTube channel. */
  youtube_url?: string | null;
  /** URL to the business's X (formerly Twitter) profile. */
  x_com_url?: string | null;
}

/**
 * Defines the structure for the form data used to edit an existing business listing.
 * Mirrors many fields from `AdminSerializedListing` but is adapted for form input state.
 */
interface ListingFormData {
  title: string;
  price_range?: string;
  category_name?: string;
  address?: string;
  neighborhood?: string;
  street?: string;
  city?: string;
  postal_code?: string;
  state?: string;
  country_code?: string;
  phone?: string;
  description?: string;
  website?: string;
  latitude?: string;
  longitude?: string;
  place_id?: string;
  image_url?: string; 
  /** Array of gallery images being edited or added in the form. */
  galleryImages: GalleryImageFormItem[]; 
  /** Array of FAQ items being edited or added in the form. */
  faq?: FAQItem[]; 
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  pinterest_url?: string;
  youtube_url?: string;
  x_com_url?: string;
}

/**
 * Represents a single gallery image item within the listing edit form.
 */
interface GalleryImageFormItem {
  /** Optional ID of an existing image (if editing). */
  id?: string; 
  /** URL of the gallery image. */
  url: string;
  /** Description for the gallery image. */
  description: string;
}

/**
 * Page component for editing an existing business listing.
 * Fetches listing data by ID, populates a form, allows modification of various fields
 * including gallery images and FAQs, and handles submission to update the listing.
 * Also includes functionality to generate FAQs using an API endpoint.
 */
const EditListingPage = () => {
  const router = useRouter();
  const { id } = router.query; 

  /** State for the originally fetched listing data. */
  const [listing, setListing] = useState<AdminSerializedListing | null>(null);
  /** State for the form data being edited by the user. */
  const [formData, setFormData] = useState<ListingFormData>({
    title: '',
    price_range: '', category_name: '', address: '', neighborhood: '', street: '',
    city: '', postal_code: '', state: '', country_code: '', phone: '',
    description: '', website: '', latitude: '', longitude: '', place_id: '',
    image_url: '', 
    galleryImages: [], 
    faq: [], 
    facebook_url: '',
    instagram_url: '',
    linkedin_url: '',
    pinterest_url: '',
    youtube_url: '',
    x_com_url: '',
  });
  /** State indicating if the listing data is currently being fetched. */
  const [isLoading, setIsLoading] = useState(true);
  /** State indicating if the form is currently being submitted. */
  const [isSubmitting, setIsSubmitting] = useState(false);
  /** State for storing and displaying error messages related to data fetching or submission. */
  const [error, setError] = useState<string | null>(null);
  /** State for displaying a success message after a successful form submission. */
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // State for FAQ Generation (will be handled later)
  /** State indicating if FAQs are currently being generated via API. */
  const [isGeneratingFaq, setIsGeneratingFaq] = useState(false);
  /** State for displaying messages related to FAQ generation (success or error). */
  const [faqGenerationMessage, setFaqGenerationMessage] = useState<string | null>(null);
  /** State holding the current list of FAQs, potentially updated by generation. */
  const [currentFaq, setCurrentFaq] = useState<FAQItem[]>([]);

  /**
   * Effect hook to fetch listing data when the component mounts or the `id` parameter changes.
   * Fetches from `/api/admin/listings/:id` and populates `listing` and `formData` states.
   * Handles loading and error states during the fetch operation.
   */
  useEffect(() => {
    if (id && typeof id === 'string') { 
      setIsLoading(true);
      setError(null);
      setSubmitSuccess(null);
      fetch(`/api/admin/listings/${id}`)
        .then(res => {
          if (!res.ok) {
            return res.json().then(errData => { 
              throw new Error(errData.message || 'Failed to fetch listing details'); 
            });
          }
          return res.json();
        })
        .then((data: AdminSerializedListing) => {
          setListing(data); 
          setFormData({
            title: data.title || '',
            price_range: data.price_range || '',
            category_name: data.category_name || '',
            address: data.address || '',
            neighborhood: data.neighborhood || '',
            street: data.street || '',
            city: data.city || '',
            postal_code: data.postal_code || '',
            state: data.state || '',
            country_code: data.country_code || '',
            phone: data.phone || '',
            description: data.description || '',
            website: data.website || '',
            latitude: data.latitude?.toString() || '', 
            longitude: data.longitude?.toString() || '', 
            place_id: data.place_id || '',
            image_url: data.image_url || '', 
            galleryImages: data.imageUrls?.map(img => ({
              id: img.image_url_id,
              url: img.url,
              description: img.description || '',
            })) || [],
            faq: data.faq || [], 
            facebook_url: data.facebook_url || '',
            instagram_url: data.instagram_url || '',
            linkedin_url: data.linkedin_url || '',
            pinterest_url: data.pinterest_url || '',
            youtube_url: data.youtube_url || '',
            x_com_url: data.x_com_url || '',
          });
          setCurrentFaq(data.faq || []); 
          setIsLoading(false);
        })
        .catch(err => {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('An unknown error occurred while fetching listing details.');
          }
          setIsLoading(false);
          console.error(err);
        });
    }
  }, [id]);

  /**
   * Handles changes to input fields within the form.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e - The change event.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null); // Clear error on change
    setSubmitSuccess(null); // Clear success message on change
  };

  /**
   * Handles the submission of the edited listing form.
   * Performs client-side validation (title, numeric latitude/longitude).
   * Sends a PUT request to `/api/admin/listings/:id` with the form data.
   * On success, displays a success message and refetches listing data.
   * On failure, displays an error message.
   * @param {FormEvent} e - The form submission event.
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSubmitSuccess(null);

    // Basic validation (can be expanded)
    if (!formData.title) {
      setError('Title is required.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/listings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update listing');
      }

      const updatedListing = await response.json();
      setListing(updatedListing.listing); // Assuming API returns { listing: ... }
      setFormData(prev => ({ // Re-populate form with potentially transformed/validated data from API
        ...prev, // Keep galleryImages and faq as they are managed separately for now
        title: updatedListing.listing.title || '',
        price_range: updatedListing.listing.price_range || '',
        category_name: updatedListing.listing.category_name || '',
        address: updatedListing.listing.address || '',
        neighborhood: updatedListing.listing.neighborhood || '',
        street: updatedListing.listing.street || '',
        city: updatedListing.listing.city || '',
        postal_code: updatedListing.listing.postal_code || '',
        state: updatedListing.listing.state || '',
        country_code: updatedListing.listing.country_code || '',
        phone: updatedListing.listing.phone || '',
        description: updatedListing.listing.description || '',
        website: updatedListing.listing.website || '',
        latitude: updatedListing.listing.latitude?.toString() || '',
        longitude: updatedListing.listing.longitude?.toString() || '',
        place_id: updatedListing.listing.place_id || '',
        image_url: updatedListing.listing.image_url || '',
        facebook_url: updatedListing.listing.facebook_url || '',
        instagram_url: updatedListing.listing.instagram_url || '',
        linkedin_url: updatedListing.listing.linkedin_url || '',
        pinterest_url: updatedListing.listing.pinterest_url || '',
        youtube_url: updatedListing.listing.youtube_url || '',
        x_com_url: updatedListing.listing.x_com_url || '',
      }));
      setSubmitSuccess('Listing updated successfully!');
      // router.push('/admin/listings'); // Optionally redirect
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Gallery Image Handlers (to be refactored with Shadcn UI later) --- 
  /**
   * Handles changes to input fields within a specific gallery image item.
   * @param {number} index - The index of the gallery image item in the `formData.galleryImages` array.
   * @param {keyof Omit<GalleryImageFormItem, 'id'>} field - The field being updated (e.g., 'url', 'description').
   * @param {string} value - The new value for the field.
   */
  const handleGalleryImageChange = (index: number, field: keyof Omit<GalleryImageFormItem, 'id'>, value: string) => {
    setFormData(prev => ({
      ...prev,
      galleryImages: prev.galleryImages.map((img, i) => 
        i === index ? { ...img, [field]: value } : img
      ),
    }));
  };

  /**
   * Adds a new, empty gallery image field to the form.
   */
  const addGalleryImageField = () => {
    setFormData(prev => ({
      ...prev,
      galleryImages: [...prev.galleryImages, { url: '', description: '' }],
    }));
  };

  /**
   * Removes a gallery image field from the form at the specified index.
   * @param {number} index - The index of the gallery image item to remove.
   */
  const removeGalleryImageField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index),
    }));
  };

  // --- FAQ Handlers (to be refactored with Shadcn UI later) ---
  /**
   * Handles changes to input fields (question or answer) within a specific FAQ item.
   * @param {number} index - The index of the FAQ item in the `formData.faq` array.
   * @param {keyof FAQItem} field - The field being updated (e.g., 'question', 'answer').
   * @param {string} value - The new value for the field.
   */
  const handleFaqChange = (index: number, field: keyof FAQItem, value: string) => {
    const updatedFaq = [...currentFaq];
    updatedFaq[index] = { ...updatedFaq[index], [field]: value };
    setCurrentFaq(updatedFaq);
    setFormData(prev => ({ ...prev, faq: updatedFaq }));
  };

  /**
   * Adds a new, empty FAQ field (question and answer) to the form.
   */
  const addFaqItem = () => {
    const newFaq = [...currentFaq, { question: '', answer: '' }];
    setCurrentFaq(newFaq);
    setFormData(prev => ({ ...prev, faq: newFaq }));
  };

  /**
   * Removes an FAQ field from the form at the specified index.
   * @param {number} index - The index of the FAQ item to remove.
   */
  const removeFaqItem = (index: number) => {
    const updatedFaq = currentFaq.filter((_, i) => i !== index);
    setCurrentFaq(updatedFaq);
    setFormData(prev => ({ ...prev, faq: updatedFaq }));
  };

  /**
   * Handles the generation of FAQs for the current listing using an API call.
   * Sends a POST request to `/api/admin/listings/generate-faq`.
   * Updates `currentFaq` and `formData.faq` with the generated FAQs on success.
   * Manages loading states and displays feedback messages.
   */
  const generateFaq = async () => {
    // ... (FAQ generation logic - to be reviewed/refactored later)
    if (!listing?.description) {
        setFaqGenerationMessage('Listing description is empty. Cannot generate FAQ.');
        return;
    }
    setIsGeneratingFaq(true);
    setFaqGenerationMessage('Generating FAQ based on description...');
    try {
        const response = await fetch('/api/admin/listings/generate-faq', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: listing.description, existingFaq: currentFaq }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to generate FAQ');
        }
        const data = await response.json();
        setCurrentFaq(data.faq || []);
        setFormData(prev => ({ ...prev, faq: data.faq || [] }));
        setFaqGenerationMessage('FAQ generated successfully!');
    } catch (error: any) {
        setFaqGenerationMessage(`Error generating FAQ: ${error.message}`);
    } finally {
        setIsGeneratingFaq(false);
    }
  };

  const pageTitle = listing ? `Edit: ${listing.title}` : 'Edit Listing';

  const actionButtons = (
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="icon" onClick={() => router.push('/admin/listings')} disabled={isSubmitting}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Button type="submit" form="edit-listing-form" disabled={isSubmitting || isLoading} className="min-w-[120px]">
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Save Changes
      </Button>
    </div>
  );

  if (isLoading && !listing) { // Show full page loader only on initial load without data
    return (
      <AdminLayout pageTitle="Loading Listing..." actionButtons={actionButtons}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!listing && !isLoading) { // If loading finished and no listing found (e.g. invalid ID)
    return (
      <AdminLayout pageTitle="Error" actionButtons={actionButtons}>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-destructive">Listing Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || 'The listing you are trying to edit could not be found. It may have been deleted or the ID is incorrect.'}</p>
            <Button onClick={() => router.push('/admin/listings')} className="mt-4">Back to Listings</Button>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle={pageTitle} pageDescription={`Editing details for ${listing?.title || 'the listing'}`} pageIcon={Store} actionButtons={actionButtons}>
      <Head>
        <title>{pageTitle} - Admin</title>
      </Head>

      <form id="edit-listing-form" onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="mb-4 p-3 border border-destructive/30 bg-destructive/10 text-destructive rounded-md flex items-center text-sm">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}
        {submitSuccess && (
          <div className="mb-4 p-3 border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400 rounded-md flex items-center text-sm">
            <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0" />
            {submitSuccess}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Listing Information</CardTitle>
            <CardDescription>Basic details about the business listing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                <Input id="title" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., The Cozy Cafe" required disabled={isSubmitting} />
              </div>
              <div>
                <Label htmlFor="category_name">Category</Label>
                <Input id="category_name" name="category_name" value={formData.category_name || ''} onChange={handleChange} placeholder="e.g., Restaurant, Cafe" disabled={isSubmitting} />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={formData.description || ''} onChange={handleChange} placeholder="A short description of the business..." rows={5} disabled={isSubmitting} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="price_range">Price Range</Label>
                <Input id="price_range" name="price_range" value={formData.price_range || ''} onChange={handleChange} placeholder="e.g., $, $$, $$$ " disabled={isSubmitting} />
              </div>
               <div>
                <Label htmlFor="image_url">Main Image URL</Label>
                <Input id="image_url" name="image_url" value={formData.image_url || ''} onChange={handleChange} placeholder="https://example.com/image.jpg" disabled={isSubmitting} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact & Address</CardTitle>
            <CardDescription>How customers can reach and find the business.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="e.g., (555) 123-4567" disabled={isSubmitting} />
              </div>
              <div>
                <Label htmlFor="website">Website URL</Label>
                <Input id="website" name="website" type="url" value={formData.website || ''} onChange={handleChange} placeholder="https://www.example.com" disabled={isSubmitting} />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Full Address (Street, City, etc.)</Label>
              <Input id="address" name="address" value={formData.address || ''} onChange={handleChange} placeholder="e.g., 123 Main St, Anytown, USA" disabled={isSubmitting} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="street">Street</Label>
                <Input id="street" name="street" value={formData.street || ''} onChange={handleChange} placeholder="e.g., 123 Main St" disabled={isSubmitting} />
              </div>
              <div>
                <Label htmlFor="neighborhood">Neighborhood</Label>
                <Input id="neighborhood" name="neighborhood" value={formData.neighborhood || ''} onChange={handleChange} placeholder="e.g., Downtown" disabled={isSubmitting} />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" value={formData.city || ''} onChange={handleChange} placeholder="e.g., Anytown" disabled={isSubmitting} />
              </div>
              <div>
                <Label htmlFor="state">State / Province</Label>
                <Input id="state" name="state" value={formData.state || ''} onChange={handleChange} placeholder="e.g., CA" disabled={isSubmitting} />
              </div>
              <div>
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input id="postal_code" name="postal_code" value={formData.postal_code || ''} onChange={handleChange} placeholder="e.g., 90210" disabled={isSubmitting} />
              </div>
              <div>
                <Label htmlFor="country_code">Country Code</Label>
                <Input id="country_code" name="country_code" value={formData.country_code || ''} onChange={handleChange} placeholder="e.g., US" disabled={isSubmitting} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location Details</CardTitle>
            <CardDescription>Geographical information for mapping.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input id="latitude" name="latitude" type="number" step="any" value={formData.latitude || ''} onChange={handleChange} placeholder="e.g., 34.0522" disabled={isSubmitting} />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input id="longitude" name="longitude" type="number" step="any" value={formData.longitude || ''} onChange={handleChange} placeholder="e.g., -118.2437" disabled={isSubmitting} />
              </div>
            </div>
            <div>
              <Label htmlFor="place_id">Place ID (e.g., Google Place ID)</Label>
              <Input id="place_id" name="place_id" value={formData.place_id || ''} onChange={handleChange} placeholder="Google Place ID" disabled={isSubmitting} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Social Media Links (Optional)</CardTitle>
            <CardDescription>Links to social media profiles.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <Label htmlFor="facebook_url">Facebook URL</Label>
              <Input id="facebook_url" name="facebook_url" type="url" value={formData.facebook_url || ''} onChange={handleChange} placeholder="https://facebook.com/yourpage" disabled={isSubmitting} />
            </div>
            <div>
              <Label htmlFor="instagram_url">Instagram URL</Label>
              <Input id="instagram_url" name="instagram_url" type="url" value={formData.instagram_url || ''} onChange={handleChange} placeholder="https://instagram.com/yourprofile" disabled={isSubmitting} />
            </div>
            <div>
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input id="linkedin_url" name="linkedin_url" type="url" value={formData.linkedin_url || ''} onChange={handleChange} placeholder="https://linkedin.com/company/yourcompany" disabled={isSubmitting} />
            </div>
            <div>
              <Label htmlFor="pinterest_url">Pinterest URL</Label>
              <Input id="pinterest_url" name="pinterest_url" type="url" value={formData.pinterest_url || ''} onChange={handleChange} placeholder="https://pinterest.com/yourprofile" disabled={isSubmitting} />
            </div>
            <div>
              <Label htmlFor="youtube_url">YouTube URL</Label>
              <Input id="youtube_url" name="youtube_url" type="url" value={formData.youtube_url || ''} onChange={handleChange} placeholder="https://youtube.com/yourchannel" disabled={isSubmitting} />
            </div>
            <div>
              <Label htmlFor="x_com_url">X.com (Twitter) URL</Label>
              <Input id="x_com_url" name="x_com_url" type="url" value={formData.x_com_url || ''} onChange={handleChange} placeholder="https://x.com/yourprofile" disabled={isSubmitting} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gallery Images</CardTitle>
            <CardDescription>Manage additional images for the listing. URLs must be publicly accessible.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.galleryImages.map((image, index) => (
              <div key={image.id || `new-${index}`} className="p-4 border rounded-md space-y-3 bg-muted/20">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-x-4 gap-y-2 items-start">
                  <div className="sm:col-span-6">
                    <Label htmlFor={`galleryImageUrl-${index}`}>Image URL <span className="text-destructive">*</span></Label>
                    <Input
                      type="url"
                      id={`galleryImageUrl-${index}`}
                      name={`galleryImageUrl-${index}`}
                      value={image.url}
                      onChange={(e) => handleGalleryImageChange(index, 'url', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      required
                      disabled={isSubmitting}
                      className="mt-1"
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <Label htmlFor={`galleryImageDesc-${index}`}>Description (Optional)</Label>
                    <Input
                      type="text"
                      id={`galleryImageDesc-${index}`}
                      name={`galleryImageDesc-${index}`}
                      value={image.description}
                      onChange={(e) => handleGalleryImageChange(index, 'description', e.target.value)}
                      placeholder="Brief description of the image"
                      disabled={isSubmitting}
                      className="mt-1"
                    />
                  </div>
                  <div className="sm:col-span-1 flex items-end pt-1 sm:pt-0 h-full">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeGalleryImageField(index)}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto mt-5 sm:mt-0"
                      aria-label="Remove image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {image.url && (
                  <div className="mt-2 w-full max-w-[150px]">
                    <img src={image.url} alt={image.description || `Gallery image ${index + 1}`} className="rounded-md object-contain border bg-white p-1" onError={(e) => e.currentTarget.style.display='none'} />
                  </div>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addGalleryImageField}
              disabled={isSubmitting}
              className="mt-2"
            >
              <ImagePlus className="mr-2 h-4 w-4" /> Add Image
            </Button>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions (FAQ)</CardTitle>
            <CardDescription>Manage or generate FAQs for the listing. Clear and concise Q&As can improve user engagement.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {currentFaq.map((item, index) => (
                <div key={`faq-${index}`} className="p-4 border rounded-md space-y-3 bg-muted/20">
                  <div>
                    <Label htmlFor={`faq-question-${index}`}>Question {index + 1}</Label>
                    <Input
                      id={`faq-question-${index}`}
                      value={item.question}
                      onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                      placeholder="Enter question"
                      disabled={isSubmitting || isGeneratingFaq}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`faq-answer-${index}`}>Answer {index + 1}</Label>
                    <Textarea
                      id={`faq-answer-${index}`}
                      value={item.answer}
                      onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                      placeholder="Enter answer"
                      rows={3}
                      disabled={isSubmitting || isGeneratingFaq}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeFaqItem(index)}
                    disabled={isSubmitting || isGeneratingFaq}
                    className="mt-1"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove FAQ Item
                  </Button>
                </div>
              ))}
            </div>

            {currentFaq.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No FAQs added yet. You can add them manually or try generating them with AI.</p>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={addFaqItem}
                disabled={isSubmitting || isGeneratingFaq}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add FAQ Item
              </Button>
              <Button
                type="button"
                onClick={generateFaq}
                disabled={isGeneratingFaq || isSubmitting || !listing?.description}
                variant="outline"
              >
                {isGeneratingFaq ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                {isGeneratingFaq ? 'Generating...' : 'Generate FAQ with AI'}
              </Button>
            </div>
            {faqGenerationMessage && (
              <p className={`text-sm mt-2 p-2 rounded-md ${faqGenerationMessage.toLowerCase().includes('error') ? 'bg-destructive/10 text-destructive border border-destructive/30' : 'bg-green-500/10 text-green-700 border border-green-500/30'}`}>
                {faqGenerationMessage}
              </p>
            )}
             {!listing?.description && (
                <p className="text-xs text-muted-foreground mt-1">
                    Note: AI FAQ generation requires a listing description.
                </p>
            )}
          </CardContent>
        </Card>

        {/* Placeholder for Reviews - To be refactored/designed */}
        {listing?.reviews && listing.reviews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Reviews</CardTitle>
              <CardDescription>Customer reviews for this listing.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Review display will be refactored here.</p>
              {/* Review display logic will be placed and styled here */}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end space-x-2 mt-8 pb-8">
          <Button variant="outline" onClick={() => router.push('/admin/listings')} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="edit-listing-form" disabled={isSubmitting || isLoading} className="min-w-[120px]">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
};

export default EditListingPage;
