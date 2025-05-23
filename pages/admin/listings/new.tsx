import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAdminHeader } from '@/components/AdminHeaderContext';
import type { GetServerSideProps } from 'next';
import {
  Store, Save, ArrowLeft, Loader2, AlertTriangle,
  Building, Phone, Globe, MapPin, Tag, DollarSign, Info, Link2, Users, PlusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Head from 'next/head';

// Define an interface for the form data to match ListingBusiness fields
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
  // Social Media Links
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  pinterest_url?: string;
  youtube_url?: string;
  x_com_url?: string;
}

const NewListingPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<ListingFormData>({
    title: '',
    price_range: '',
    category_name: '',
    address: '',
    neighborhood: '',
    street: '',
    city: '',
    postal_code: '',
    state: '',
    country_code: '',
    phone: '',
    description: '',
    website: '',
    latitude: '',
    longitude: '',
    place_id: '',
    facebook_url: '',
    instagram_url: '',
    linkedin_url: '',
    pinterest_url: '',
    youtube_url: '',
    x_com_url: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setPageSpecificHeaderElements } = useAdminHeader();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!formData.title.trim()) {
      setError('Title is required.');
      setIsSubmitting(false);
      return;
    }

    if (formData.latitude && isNaN(parseFloat(formData.latitude))) {
        setError('Latitude must be a valid number.');
        setIsSubmitting(false);
        return;
    }
    if (formData.longitude && isNaN(parseFloat(formData.longitude))) {
        setError('Longitude must be a valid number.');
        setIsSubmitting(false);
        return;
    }

    try {
      const response = await fetch('/api/admin/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
          longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred during listing creation.'}));
        throw new Error(errorData.message || `Failed to create listing: ${response.statusText}`);
      }

      // router.push('/admin/listings'); // Redirect handled by button click if successful
      // For now, let's assume success and potentially show a success message or clear form
      // A better UX would be to redirect via router.push after a success message or directly.
      // For this refactor, we'll keep the redirect but it might be part of the button's onClick logic if we want to show a message first.
      alert('Listing created successfully!'); // Placeholder for better success feedback
      router.push('/admin/listings');

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while creating the listing.');
      }
      console.error(err);
    }
    setIsSubmitting(false);
  };

  // Define actionButtons for the header
  const pageActionButtons = (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => router.push('/admin/listings')} disabled={isSubmitting}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Listings
      </Button>
      <Button type="submit" form="new-listing-form" disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Create Listing
      </Button>
    </div>
  );

  // Set header elements using context
  useEffect(() => {
    setPageSpecificHeaderElements({
      actionButtons: pageActionButtons,
    });
    // Clear action buttons on component unmount or if dependencies change
    return () => setPageSpecificHeaderElements({ actionButtons: undefined }); 
  }, [setPageSpecificHeaderElements, router, isSubmitting]); // Dependencies for pageActionButtons

  return (
    <>
      <Head>
        <title>Add New Listing - Admin</title> {/* Keep Head for browser tab title */}
      </Head>

      <form id="new-listing-form" onSubmit={handleSubmit}>
        <Card className="shadow-elevation mb-6">
          <CardHeader>
            <CardTitle>Listing Information</CardTitle>
            <CardDescription>Provide the core details for the new listing.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title*</Label>
              <Input id="title" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Joe's Pizza Place" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category_name">Main Category</Label>
              <Input id="category_name" name="category_name" value={formData.category_name} onChange={handleChange} placeholder="e.g., Restaurant, Cafe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_range">Price Range</Label>
              <Input id="price_range" name="price_range" value={formData.price_range} onChange={handleChange} placeholder="e.g., $, $$, $$$" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Tell us about this business..." rows={5} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elevation mb-6">
          <CardHeader>
            <CardTitle>Contact & Address</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="(555) 123-4567" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website URL</Label>
              <Input id="website" name="website" type="url" value={formData.website} onChange={handleChange} placeholder="https://example.com" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="address">Full Address</Label>
              <Input id="address" name="address" value={formData.address} onChange={handleChange} placeholder="123 Main St, Anytown, USA" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="street">Street</Label>
              <Input id="street" name="street" value={formData.street} onChange={handleChange} placeholder="123 Main St" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" value={formData.city} onChange={handleChange} placeholder="Anytown" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <Input id="state" name="state" value={formData.state} onChange={handleChange} placeholder="CA" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input id="postal_code" name="postal_code" value={formData.postal_code} onChange={handleChange} placeholder="90210" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country_code">Country Code</Label>
              <Input id="country_code" name="country_code" value={formData.country_code} onChange={handleChange} placeholder="US" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Neighborhood</Label>
              <Input id="neighborhood" name="neighborhood" value={formData.neighborhood} onChange={handleChange} placeholder="e.g., Downtown, Midtown" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elevation mb-6">
          <CardHeader>
            <CardTitle>Location Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input id="latitude" name="latitude" type="number" step="any" value={formData.latitude} onChange={handleChange} placeholder="e.g., 34.0522" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input id="longitude" name="longitude" type="number" step="any" value={formData.longitude} onChange={handleChange} placeholder="e.g., -118.2437" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="place_id">Google Place ID (Optional)</Label>
              <Input id="place_id" name="place_id" value={formData.place_id} onChange={handleChange} placeholder="Must be unique if provided" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elevation mb-6">
          <CardHeader>
            <CardTitle>Social Media Links (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="facebook_url">Facebook URL</Label>
              <Input id="facebook_url" name="facebook_url" type="url" value={formData.facebook_url} onChange={handleChange} placeholder="https://facebook.com/yourpage" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram_url">Instagram URL</Label>
              <Input id="instagram_url" name="instagram_url" type="url" value={formData.instagram_url} onChange={handleChange} placeholder="https://instagram.com/yourprofile" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input id="linkedin_url" name="linkedin_url" type="url" value={formData.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/company/yourcompany" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pinterest_url">Pinterest URL</Label>
              <Input id="pinterest_url" name="pinterest_url" type="url" value={formData.pinterest_url} onChange={handleChange} placeholder="https://pinterest.com/yourprofile" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="youtube_url">YouTube URL</Label>
              <Input id="youtube_url" name="youtube_url" type="url" value={formData.youtube_url} onChange={handleChange} placeholder="https://youtube.com/yourchannel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="x_com_url">X.com (Twitter) URL</Label>
              <Input id="x_com_url" name="x_com_url" type="url" value={formData.x_com_url} onChange={handleChange} placeholder="https://x.com/yourprofile" />
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md flex items-center">
            <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </form>
    </>
  );
};

// ADDED getServerSideProps
export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {
      pageTitle: 'Add New Listing',
      pageDescription: 'Fill in the details to create a new business listing.',
      pageIconName: 'PlusCircle', // Use PlusCircle for 'add new'
    },
  };
};

export default NewListingPage;
