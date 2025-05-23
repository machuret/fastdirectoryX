import React, { useState, useEffect, useCallback } from 'react';
import { GetServerSideProps, GetServerSidePropsContext } from 'next'; 
import { useRouter } from 'next/router';
import { useSession, getSession } from 'next-auth/react';
import prisma from '@/lib/prisma';
import { AdminSerializedListing, serializeListing, FAQItem } from '../../../../lib/serializeData';
import type { 
  ListingBusiness, 
  ListingImageUrl as PrismaListingImageUrl, 
  ListingCategory as PrismaListingCategory, 
  ListingAttribute as PrismaListingAttributeModel, 
  OpeningHours as PrismaOpeningHours,
  Prisma
} from '@prisma/client';

import AdminLayout from '@/components/admin/AdminLayout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ChevronLeft, Save, Trash2, ImagePlus, PlusCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Label } from '@/components/ui/label';

interface EditListingPageProps {
  listingInitial: AdminSerializedListing | null; 
  error?: string; 
  pageTitle: string;
  allCategories?: { id: string; name: string }[]; 
  allAmenities?: { amenity_id: string; name: string }[]; 
}

interface SelectedAmenityData {
  amenity_id: string;
  name: string;
  value?: string | null; 
  icon_svg?: string | null; 
}

interface SelectedSpecialHourData {
  id: number; 
  date: string; 
  open_time: string | null;
  close_time: string | null;
  description: string | null;
}

interface PreparedListingForSerialization {
  listing_business_id: number;
  title: string;
  slug: string;
  price_range: string | null;
  category_name: string | null;
  address: string | null;
  neighborhood: string | null;
  street: string | null;
  city: string | null;
  postal_code: string | null;
  state: string | null;
  country_code: string | null;
  phone: string | null;
  website: string | null;
  description: string | null;
  isFeatured: boolean;
  business_id: number | null;
  user_id: number | null;
  place_id: string | null;
  imageUrls: Array<Pick<PrismaListingImageUrl, 'image_url_id' | 'url' | 'description'>>;
  categories: Array<Pick<PrismaCategory, 'category_id' | 'category_name'>>;
  amenities: SelectedAmenityData[];
  openingHours: Array<Pick<PrismaOpeningHours, 'id' | 'day_of_week' | 'open_time' | 'close_time'>>;
  specialHours: SelectedSpecialHourData[];
  faq: FAQItem[] | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string; 
  updatedAt: string; 
}

interface PrismaRawListingData extends Omit<ListingBusiness, 
  'listing_business_id' | 
  'business_id' | 
  'user_id' | 
  'latitude' | 
  'longitude' | 
  'faq' | 
  'createdAt' | 
  'updatedAt' | 
  'additional_details' | 
  'imageUrls' | 
  'categories' | 
  'businessAttributes' | 
  'openingHours' | 
  'special_hours' 
> { 
  listing_business_id: number;
  title: string;
  description: string | null;
  slug: string;
  phone_number: string | null;
  email_address: string | null;
  website_url: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  country_code: string | null;
  latitude: Prisma.Decimal | null;
  longitude: Prisma.Decimal | null;
  is_featured: boolean;
  is_published: boolean;
  owner_user_id: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  social_media_links: Prisma.JsonValue | null; 
  additional_details: Prisma.JsonValue | null;

  imageUrls: Array<{ 
    image_url_id: number;
    url: string;
    description: string | null;
  }>;
  categories: Array<{ 
    listing_business_id: number;
    listing_category_id: number;
    category: PrismaCategory; 
  }>;
  businessAttributes: Array<{ 
    value: string | null; 
    listingAttribute: PrismaListingAttributeModel; 
  }>;
  openingHours: Array<PrismaOpeningHours>; 
  faq: Prisma.JsonValue; 

  created_at: Date;
  updated_at: Date;
  published_at: Date | null;
}

// Type aliases for Prisma models to improve readability
type PrismaCategory = PrismaListingCategory; 
type PrismaListingAttribute = PrismaListingAttributeModel; 

const EditListingPage: React.FC<EditListingPageProps> = ({ 
  listingInitial, 
  error, 
  pageTitle, 
  allCategories,
  allAmenities
}) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  // Form field states
  const [title, setTitle] = useState(listingInitial?.title || '');
  const [slug, setSlug] = useState(listingInitial?.slug || '');
  const [description, setDescription] = useState(listingInitial?.description || '');
  const [phoneNumber, setPhoneNumber] = useState(listingInitial?.phone_number || '');
  const [emailAddress, setEmailAddress] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState(listingInitial?.website_url || '');

  // Existing booleans and numbers
  const [isFeatured, setIsFeatured] = useState(listingInitial?.is_featured || false);
  const [isPublished, setIsPublished] = useState(true);
  const [isAdvertisement, setIsAdvertisement] = useState(listingInitial?.is_advertisement || false);
  const [latitude, setLatitude] = useState<number | string>(listingInitial?.latitude ?? '');
  const [longitude, setLongitude] = useState<number | string>(listingInitial?.longitude ?? '');

  // ALL NEW FIELDS STATE
  const [businessId, setBusinessId] = useState<number | string>(listingInitial?.business_id ?? '');
  const [priceRange, setPriceRange] = useState(listingInitial?.price_range || '');
  const [address, setAddress] = useState(listingInitial?.address || '');
  const [neighborhood, setNeighborhood] = useState(listingInitial?.neighborhood || '');
  const [city, setCity] = useState(listingInitial?.city || ''); // Kept, can be part of address or separate
  const [stateProvince, setStateProvince] = useState(listingInitial?.state_province || ''); // Kept
  const [postalCode, setPostalCode] = useState(listingInitial?.postal_code || ''); // Kept
  const [countryCode, setCountryCode] = useState(listingInitial?.country_code || ''); // Kept
  const [googleMapsUrl, setGoogleMapsUrl] = useState(listingInitial?.google_maps_url || '');
  const [menuUrl, setMenuUrl] = useState(listingInitial?.menu_url || '');
  const [reserveTableUrl, setReserveTableUrl] = useState(listingInitial?.reserve_table_url || '');
  const [ownerUserId, setOwnerUserId] = useState(listingInitial?.owner_user_id || ''); // Display only or selector?
  const [metaTitle, setMetaTitle] = useState(listingInitial?.meta_title || '');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [facebookUrl, setFacebookUrl] = useState(listingInitial?.facebook_url || '');
  const [instagramUrl, setInstagramUrl] = useState(listingInitial?.instagram_url || '');
  const [linkedinUrl, setLinkedinUrl] = useState(listingInitial?.linkedin_url || '');
  const [pinterestUrl, setPinterestUrl] = useState(listingInitial?.pinterest_url || '');
  const [youtubeUrl, setYoutubeUrl] = useState(listingInitial?.youtube_url || '');
  const [xComUrl, setXComUrl] = useState(listingInitial?.x_com_url || '');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [descriptionOptimized, setDescriptionOptimized] = useState(listingInitial?.descriptionOptimized || false);
  const [placeId, setPlaceId] = useState(listingInitial?.place_id || '');
  const [temporarilyClosed, setTemporarilyClosed] = useState(listingInitial?.temporarily_closed || false);
  const [permanentlyClosed, setPermanentlyClosed] = useState(listingInitial?.permanently_closed || false);
  const [operationalStatus, setOperationalStatus] = useState(listingInitial?.operational_status || '');
  const [fid, setFid] = useState(listingInitial?.fid || '');
  const [cid, setCid] = useState(listingInitial?.cid || '');
  const [reviewsCount, setReviewsCount] = useState<number | string>(listingInitial?.reviews_count ?? '');
  const [googleFoodUrl, setGoogleFoodUrl] = useState(listingInitial?.google_food_url || '');
  const [searchPageUrl, setSearchPageUrl] = useState(listingInitial?.search_page_url || '');
  const [searchString, setSearchString] = useState(listingInitial?.search_string || '');
  const [language, setLanguage] = useState(listingInitial?.language || '');
  const [rank, setRank] = useState<number | string>(listingInitial?.rank ?? '');
  const [primaryImageUrlExternal, setPrimaryImageUrlExternal] = useState('');
  const [kgmid, setKgmid] = useState(listingInitial?.kgmid || '');
  const [subTitle, setSubTitle] = useState(listingInitial?.sub_title || '');
  const [locatedIn, setLocatedIn] = useState(listingInitial?.located_in || '');
  const [plusCode, setPlusCode] = useState(listingInitial?.plus_code || '');
  const [popularTimesLiveText, setPopularTimesLiveText] = useState(listingInitial?.popular_times_live_text || '');
  const [popularTimesLivePercent, setPopularTimesLivePercent] = useState<number | string>(listingInitial?.popular_times_live_percent ?? '');
  const [faqOptimized, setFaqOptimized] = useState(listingInitial?.faqOptimized || false);

  // Add missing state variables
  const [imagesCount, setImagesCount] = useState<number | string>(listingInitial?.images?.length || 0);
  const [scrapedAt, setScrapedAt] = useState(''); // Was missing, initialize with default
  const [url, setUrl] = useState(''); // Was missing (for Original Source URL), initialize with default

  // State for FAQ items
  const [faqItems, setFaqItems] = useState<FAQItem[]>(listingInitial?.faq || []);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  if (status === 'loading') {
    return <AdminLayout pageTitle="Loading Edit Page..."><p>Loading session...</p></AdminLayout>;
  }

  if (!session || session.user.role !== 'ADMIN') {
    return <AdminLayout pageTitle="Access Denied"><p>Access Denied. You must be an admin to view this page.</p></AdminLayout>;
  }

  if (!listingInitial && !error) {
    // This case might occur if getServerSideProps returns null for listingInitial without an error
    // (e.g. listing not found but handled gracefully by returning null)
    return (
      <AdminLayout pageTitle="Listing Not Found">
        <div className="container mx-auto py-10">
          <Card>
            <CardHeader>
              <CardTitle>Listing Not Found</CardTitle>
              <CardDescription>
                The listing you are trying to edit could not be found.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/admin/listings')}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back to Listings
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  // If there was an error prop from getServerSideProps, but listingInitial might still be there (or not)
  // The useEffect will show a toast for the error. We can decide how to render the page.
  // For now, if there's an error and no listing, show a generic error message.
  // If there's an error but we have some initial data, we might still try to render the form.
  if (error && !listingInitial) {
    return (
      <AdminLayout pageTitle="Error">
        <div className="container mx-auto py-10">
          <Card>
            <CardHeader>
              <CardTitle>Error Loading Listing</CardTitle>
              <CardDescription>
                {error}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/admin/listings')}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back to Listings
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    toast.info('Attempting to save listing...');
    // Implement submission logic here
    console.log('Form submitted with data:', {
      title,
      slug,
      description,
      phoneNumber,
      emailAddress,
      websiteUrl,
      isFeatured,
      isPublished,
      latitude,
      longitude,
      // Add all new state variables here
      business_id: businessId ? parseInt(businessId.toString(), 10) : null,
      price_range: priceRange,
      address,
      neighborhood,
      city,
      state_province: stateProvince,
      postal_code: postalCode,
      country_code: countryCode,
      google_maps_url: googleMapsUrl,
      menu_url: menuUrl,
      reserve_table_url: reserveTableUrl,
      owner_user_id: ownerUserId,
      meta_title: metaTitle,
      meta_description: metaDescription,
      meta_keywords: metaKeywords,
      facebook_url: facebookUrl,
      instagram_url: instagramUrl,
      linkedin_url: linkedinUrl,
      pinterest_url: pinterestUrl,
      youtube_url: youtubeUrl,
      x_com_url: xComUrl,
      additional_details: additionalDetails ? JSON.parse(additionalDetails) : null,
      descriptionOptimized,
      place_id: placeId,
      temporarily_closed: temporarilyClosed,
      permanently_closed: permanentlyClosed,
      operational_status: operationalStatus,
      fid,
      cid,
      reviews_count: reviewsCount ? parseInt(reviewsCount.toString(), 10) : null,
      google_food_url: googleFoodUrl,
      search_page_url: searchPageUrl,
      search_string: searchString,
      language,
      rank: rank ? parseInt(rank.toString(), 10) : null,
      is_advertisement: isAdvertisement,
      primary_image_url_external: primaryImageUrlExternal,
      kgmid,
      sub_title: subTitle,
      located_in: locatedIn,
      plus_code: plusCode,
      popular_times_live_text: popularTimesLiveText,
      popular_times_live_percent: popularTimesLivePercent ? parseInt(popularTimesLivePercent.toString(), 10) : null,
      faqOptimized,
    });

    try {
      if (!listingInitial?.listing_business_id) {
        toast.error('Error: Listing ID is missing. Cannot update.');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/admin/listings/${listingInitial.listing_business_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          slug,
          description,
          phoneNumber: phoneNumber, // Corrected to camelCase
          emailAddress: emailAddress, // Corrected to camelCase
          websiteUrl: websiteUrl, // Corrected to camelCase
          isFeatured: isFeatured,
          isPublished: isPublished,
          latitude: latitude !== '' ? parseFloat(latitude.toString()) : null,
          longitude: longitude !== '' ? parseFloat(longitude.toString()) : null,
          // API expects Prisma field names (mostly camelCase)
          businessId: businessId !== '' ? parseInt(businessId.toString(), 10) : null,
          priceRange: priceRange || null,
          address: address || null,
          neighborhood: neighborhood || null,
          city: city || null,
          stateProvince: stateProvince || null,
          postalCode: postalCode || null,
          countryCode: countryCode || null,
          googleMapsUrl: googleMapsUrl || null,
          menuUrl: menuUrl || null,
          reserveTableUrl: reserveTableUrl || null,
          ownerUserId: ownerUserId || null,
          metaTitle: metaTitle || null,
          metaDescription: metaDescription || null,
          metaKeywords: metaKeywords || null,
          facebookUrl: facebookUrl || null,
          instagramUrl: instagramUrl || null,
          linkedinUrl: linkedinUrl || null,
          pinterestUrl: pinterestUrl || null,
          youtubeUrl: youtubeUrl || null,
          xComUrl: xComUrl || null,
          additionalDetails: additionalDetails ? JSON.parse(additionalDetails) : null,
          descriptionOptimized: descriptionOptimized,
          placeId: placeId || null,
          temporarilyClosed: temporarilyClosed,
          permanentlyClosed: permanentlyClosed,
          operationalStatus: operationalStatus || null,
          fid: fid || null,
          cid: cid || null,
          reviewsCount: reviewsCount !== '' ? parseInt(reviewsCount.toString(), 10) : null,
          googleFoodUrl: googleFoodUrl || null,
          searchPageUrl: searchPageUrl || null,
          searchString: searchString || null,
          language: language || null,
          rank: rank !== '' ? parseInt(rank.toString(), 10) : null,
          isAdvertisement: isAdvertisement,
          primaryImageUrlExternal: primaryImageUrlExternal || null,
          kgmid: kgmid || null,
          subTitle: subTitle || null,
          locatedIn: locatedIn || null,
          plusCode: plusCode || null,
          popularTimesLiveText: popularTimesLiveText || null,
          popularTimesLivePercent: popularTimesLivePercent !== '' ? parseInt(popularTimesLivePercent.toString(), 10) : null,
          faqOptimized: faqOptimized,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update listing');
      }

      toast.success('Listing updated successfully!');
      router.push('/admin/listings'); // Redirect to listings page on success

    } catch (error) {
      console.error('Failed to update listing:', error);
      toast.error((error as Error).message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={() => router.back()}> 
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold">{pageTitle || `Edit Listing: ${listingInitial?.title || '...'}`}</h1>
        <Button form="editListingForm" type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      {/* Main form content */}
      <form id="editListingForm" onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Core Information</CardTitle>
            <CardDescription>Basic details about the business listing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title, Slug, Description */}
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
            </div>

            {/* Contact Info: Phone, Email, Website */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input id="phoneNumber" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="emailAddress">Email Address</Label>
                <Input id="emailAddress" type="email" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="websiteUrl">Website URL</Label>
                <Input id="websiteUrl" type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
              </div>
            </div>

            {/* Address Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address">Full Address (Street, Number)</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="neighborhood">Neighborhood</Label>
                <Input id="neighborhood" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="stateProvince">State/Province</Label>
                <Input id="stateProvince" value={stateProvince} onChange={(e) => setStateProvince(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input id="postalCode" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="countryCode">Country Code (2-letter)</Label>
                <Input id="countryCode" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} maxLength={2} />
              </div>
            </div>

            {/* GeoLocation: Latitude, Longitude, Place ID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input id="latitude" type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input id="longitude" type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="placeId">Google Place ID</Label>
                <Input id="placeId" value={placeId} onChange={(e) => setPlaceId(e.target.value)} />
              </div>
            </div>

            {/* Status & Visibility: Featured, Published, Temporarily Closed, Permanently Closed, Operational Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              <div className="flex items-center space-x-2 pt-6">
                <Switch id="isFeatured" checked={isFeatured} onCheckedChange={setIsFeatured} />
                <Label htmlFor="isFeatured">Featured Listing</Label>
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch id="isPublished" checked={isPublished} onCheckedChange={setIsPublished} />
                <Label htmlFor="isPublished">Published (Visible)</Label>
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch id="temporarilyClosed" checked={temporarilyClosed} onCheckedChange={setTemporarilyClosed} />
                <Label htmlFor="temporarilyClosed">Temporarily Closed</Label>
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch id="permanentlyClosed" checked={permanentlyClosed} onCheckedChange={setPermanentlyClosed} />
                <Label htmlFor="permanentlyClosed">Permanently Closed</Label>
              </div>
              <div>
                <Label htmlFor="operationalStatus">Operational Status</Label>
                <Select value={operationalStatus} onValueChange={setOperationalStatus}>
                  <SelectTrigger id="operationalStatus">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPERATIONAL">Operational</SelectItem>
                    <SelectItem value="CLOSED_TEMPORARILY">Closed Temporarily</SelectItem>
                    <SelectItem value="CLOSED_PERMANENTLY">Closed Permanently</SelectItem>
                    <SelectItem value="">Clear Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEO & Meta Section */}
        <Card>
          <CardHeader>
            <CardTitle>SEO & Meta Information</CardTitle>
            <CardDescription>Optimize for search engines and social sharing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input id="metaTitle" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea id="metaDescription" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={3} />
            </div>
            <div>
              <Label htmlFor="metaKeywords">Meta Keywords (comma-separated)</Label>
              <Input id="metaKeywords" value={metaKeywords} onChange={(e) => setMetaKeywords(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Social Media & Links Section */}
        <Card>
          <CardHeader>
            <CardTitle>Social Media & External Links</CardTitle>
            <CardDescription>Links to social profiles and other relevant pages.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="googleMapsUrl">Google Maps URL</Label>
              <Input id="googleMapsUrl" value={googleMapsUrl} onChange={(e) => setGoogleMapsUrl(e.target.value)} type="url" />
            </div>
            <div>
              <Label htmlFor="menuUrl">Menu URL</Label>
              <Input id="menuUrl" value={menuUrl} onChange={(e) => setMenuUrl(e.target.value)} type="url" />
            </div>
            <div>
              <Label htmlFor="reserveTableUrl">Reserve Table URL</Label>
              <Input id="reserveTableUrl" value={reserveTableUrl} onChange={(e) => setReserveTableUrl(e.target.value)} type="url" />
            </div>
            <div>
              <Label htmlFor="facebookUrl">Facebook URL</Label>
              <Input id="facebookUrl" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} type="url" />
            </div>
            <div>
              <Label htmlFor="instagramUrl">Instagram URL</Label>
              <Input id="instagramUrl" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} type="url" />
            </div>
            <div>
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <Input id="linkedinUrl" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} type="url" />
            </div>
            <div>
              <Label htmlFor="pinterestUrl">Pinterest URL</Label>
              <Input id="pinterestUrl" value={pinterestUrl} onChange={(e) => setPinterestUrl(e.target.value)} type="url" />
            </div>
            <div>
              <Label htmlFor="youtubeUrl">YouTube URL</Label>
              <Input id="youtubeUrl" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} type="url" />
            </div>
            <div>
              <Label htmlFor="xComUrl">X.com (Twitter) URL</Label>
              <Input id="xComUrl" value={xComUrl} onChange={(e) => setXComUrl(e.target.value)} type="url" />
            </div>
          </CardContent>
        </Card>

        {/* Internal & Data Source Section */}
        <Card>
          <CardHeader>
            <CardTitle>Internal & Data Source</CardTitle>
            <CardDescription>IDs, references, and data sourcing information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="businessId">Business ID (Internal)</Label>
                <Input id="businessId" type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value === '' ? '' : parseInt(e.target.value))} />
              </div>
              <div>
                <Label htmlFor="ownerUserId">Owner User ID (Internal)</Label>
                <Input id="ownerUserId" value={ownerUserId} onChange={(e) => setOwnerUserId(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="priceRange">Price Range (e.g., $, $$, $$$)</Label>
                <Input id="priceRange" value={priceRange} onChange={(e) => setPriceRange(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fid">FID (Feature ID)</Label>
                <Input id="fid" value={fid} onChange={(e) => setFid(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="cid">CID (Cluster ID)</Label>
                <Input id="cid" value={cid} onChange={(e) => setCid(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="reviewsCount">Reviews Count</Label>
                <Input id="reviewsCount" type="number" value={reviewsCount} onChange={(e) => setReviewsCount(e.target.value === '' ? '' : parseInt(e.target.value))} />
              </div>
              <div>
                <Label htmlFor="imagesCount">Images Count</Label>
                <Input id="imagesCount" type="number" value={imagesCount} onChange={(e) => setImagesCount(e.target.value === '' ? '' : parseInt(e.target.value))} />
              </div>
              <div>
                <Label htmlFor="scrapedAt">Scraped At (Date)</Label>
                <Input id="scrapedAt" type="datetime-local" value={scrapedAt} onChange={(e) => setScrapedAt(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="googleFoodUrl">Google Food URL</Label>
                <Input id="googleFoodUrl" type="url" value={googleFoodUrl} onChange={(e) => setGoogleFoodUrl(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="url">Original URL (Source)</Label>
                <Input id="url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="language">Language Code (e.g., en, es)</Label>
                <Input id="language" value={language} onChange={(e) => setLanguage(e.target.value)} maxLength={10} />
              </div>
              <div>
                <Label htmlFor="rank">Rank (Internal)</Label>
                <Input id="rank" type="number" value={rank} onChange={(e) => setRank(e.target.value === '' ? '' : parseInt(e.target.value))} placeholder="Internal ranking score" />
              </div>
              <div>
                <Label htmlFor="popularTimesLiveText">Popular Times Live Text</Label>
                <Input id="popularTimesLiveText" value={popularTimesLiveText} onChange={(e) => setPopularTimesLiveText(e.target.value)} placeholder="e.g., Usually not busy" />
              </div>
              <div>
                <Label htmlFor="popularTimesLivePercent">Popular Times Live Percent</Label>
                <Input id="popularTimesLivePercent" type="number" value={popularTimesLivePercent} onChange={(e) => setPopularTimesLivePercent(e.target.value === '' ? '' : parseInt(e.target.value))} placeholder="0-100" />
              </div>
              <div>
                <Label htmlFor="searchPageUrl">Source Search Page URL</Label>
                <Input id="searchPageUrl" type="url" value={searchPageUrl} onChange={(e) => setSearchPageUrl(e.target.value)} placeholder="URL of page where data was found" />
              </div>
              <div>
                <Label htmlFor="searchString">Source Search String</Label>
                <Input id="searchString" value={searchString} onChange={(e) => setSearchString(e.target.value)} placeholder="Search query used" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Optimization Section */}
        <Card>
          <CardHeader>
            <CardTitle>Content Optimization</CardTitle>
            <CardDescription>AI-powered content enhancement status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch id="descriptionOptimized" checked={descriptionOptimized} onCheckedChange={setDescriptionOptimized} />
              <Label htmlFor="descriptionOptimized">Description Optimized (AI)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="faqOptimized" checked={faqOptimized} onCheckedChange={setFaqOptimized} />
              <Label htmlFor="faqOptimized">FAQ Optimized (AI)</Label>
            </div>
          </CardContent>
        </Card>
            
        {/* FAQ Display Section */}
        {faqItems && faqItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>This information is displayed on the listing page.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {faqItems.map((faq, index) => (
                  <div key={index} className="p-3 border rounded-md bg-muted/20">
                    <p className="font-semibold text-sm text-foreground">Q: {faq.question}</p>
                    <p className="text-sm text-muted-foreground mt-1">A: {faq.answer}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Details (JSON) Section */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Details (JSON)</CardTitle>
            <CardDescription>Raw JSON data for advanced configuration.</CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="additionalDetails">Raw JSON Data</Label>
            <Textarea 
              id="additionalDetails" 
              value={additionalDetails} 
              onChange={(e) => setAdditionalDetails(e.target.value)} 
              placeholder='Enter additional JSON data, e.g., { "key": "value" }'
              rows={5}
              spellCheck="false"
            />
            <p className="mt-1 text-xs text-gray-500">Edit with caution. Must be valid JSON.</p>
          </CardContent>
        </Card>

        {/* Placeholder for other sections like Categories, Amenities, Images, Opening Hours, etc. */}
        <Card>
          <CardHeader>
            <CardTitle>Related Data (Under Construction)</CardTitle>
            <CardDescription>Management for categories, amenities, images, hours, etc.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Categories, Amenities, Images, Opening Hours, etc. will go here.</p>
            <p>Categories available: {allCategories?.length || 0}</p>
            <p>Amenities available: {allAmenities?.length || 0}</p>
          </CardContent>
        </Card>

      </form>
    </div>
  );
};

export default EditListingPage;

export const getServerSideProps: GetServerSideProps = async (context: GetServerSidePropsContext) => {
  const session = await getSession(context);
  const paramsId = context.params?.id;
  let id: string;

  if (Array.isArray(paramsId)) {
    id = paramsId[0];
  } else if (paramsId) {
    id = paramsId;
  } else {
    // Handle case where id is undefined (though Next.js usually ensures it for dynamic routes)
    return {
      notFound: true,
    };
  }

  if (isNaN(parseInt(id))) {
    console.error('[getServerSideProps] Invalid ID:', id);
    return {
      props: {
        listingInitial: null,
        error: 'Invalid listing ID format.',
        pageTitle: 'Error: Invalid ID',
        allCategories: (await prisma.listingCategory.findMany()).map(cat => ({ id: cat.category_id.toString(), name: cat.category_name })),
        allAmenities: (await prisma.listingAttribute.findMany()).map(am => ({ amenity_id: am.attribute_id.toString(), name: am.attribute_key, icon_svg: am.icon_url || '' })),
      },
    };
  }

  const listingId = parseInt(id);

  if (!session || session.user?.role !== 'ADMIN') {
    return {
      redirect: {
        destination: `/login?callbackUrl=${encodeURIComponent(context.resolvedUrl)}`,
        permanent: false,
      },
    };
  }

  try {
    const listingInclude = {
      imageUrls: { 
        select: { 
          image_url_id: true, 
          url: true, 
          description: true
        } 
      },
      categories: { include: { category: true } },
      businessAttributes: { 
        select: { 
          value: true, 
          listingAttribute: { 
            select: {
              attribute_id: true,
              attribute_key: true,
              icon_url: true,
            }
          }
        }
      },
      openingHours: true,
      // No 'reviews' include here, assuming it's not directly needed for this form's initial data
      // (e.g., listing not found but handled gracefully by returning null)
    };

    // Fetch all categories and amenities for dropdowns
    const allCategoriesFromDb = await prisma.listingCategory.findMany();
    const allAmenitiesFromDb = await prisma.listingAttribute.findMany(); 

    const listingFromDb = await prisma.listingBusiness.findUnique({
      where: { listing_business_id: listingId },
      include: listingInclude,
    });

    // Ensure listingFromDb is not null before proceeding
    if (!listingFromDb) {
      return {
        props: {
          listingInitial: null,
          error: 'Listing not found.',
          pageTitle: `Error: Listing ID ${id} Not Found`,
          allCategories: (await prisma.listingCategory.findMany()).map(cat => ({ 
            id: cat.category_id.toString(), 
            name: cat.category_name 
          })),
          allAmenities: (await prisma.listingAttribute.findMany()).map(am => ({ 
            amenity_id: am.attribute_id.toString(), 
            name: am.attribute_key 
          })),
        },
      };
    }

    // Prepare mapped categories and amenities for serializeListing and page props
    // These need to be in a scope accessible by the successful return props
    const mappedCategories = allCategoriesFromDb.map(cat => ({ 
      id: cat.category_id.toString(), 
      name: cat.category_name 
    }));
    const mappedAmenities = allAmenitiesFromDb.map(am => ({ 
      amenity_id: am.attribute_id.toString(), 
      name: am.attribute_key,
      icon_svg: am.icon_url || '', // Assuming icon_url can be used for icon_svg if needed by SerializedAmenity
    }));

    let serializedListing: AdminSerializedListing | null = null;
    try {
      serializedListing = serializeListing(listingFromDb, mappedCategories, mappedAmenities);
    } catch (serializationError) {
      console.error('Serialization error:', serializationError);
      // In case of serialization error, we still want to provide allCategories and allAmenities if fetched
      return {
        props: {
          listingInitial: null,
          error: 'Failed to serialize listing data.',
          pageTitle: `Error Editing Listing ID: ${id}`,
          allCategories: mappedCategories, // Use pre-mapped values
          allAmenities: mappedAmenities,   // Use pre-mapped values
        },
      };
    }

    if (!serializedListing) {
      console.error(`[getServerSideProps] Failed to serialize listing ID: ${id}`);
      return { 
        props: { 
          listingInitial: null, 
          error: 'Failed to serialize listing data (post-try).', 
          pageTitle: `Error Editing Listing ID: ${id}`,
          allCategories: mappedCategories,
          allAmenities: mappedAmenities,
        }
      };
    }

    let pageTitle = `Edit Listing: ${serializedListing.title}`;

    return {
      props: {
        listingInitial: serializedListing,
        pageTitle,
        allCategories: mappedCategories, // Use the same mapped version for props
        allAmenities: mappedAmenities,   // Use the same mapped version for props
      },
    };

  } catch (err) {
    console.error(`Error in getServerSideProps for listing ID ${id}:`, err);
    let allCategoriesFromDbForError: { id: string; name: string }[] = [];
    let allAmenitiesFromDbForError: { amenity_id: string; name: string }[] = [];
    try {
      // Ensure mapping is consistent in error path as well
      allCategoriesFromDbForError = (await prisma.listingCategory.findMany()).map(cat => ({ 
        id: cat.category_id.toString(), 
        name: cat.category_name 
      }));
      allAmenitiesFromDbForError = (await prisma.listingAttribute.findMany()).map(am => ({ 
        amenity_id: am.attribute_id.toString(), 
        name: am.attribute_key 
      }));
    } catch (fetchErr) {
      console.error('Failed to fetch categories/amenities during error handling:', fetchErr);
    }

    return { 
      props: { 
        listingInitial: null,
        error: `Failed to load listing data: ${(err as Error).message}`,
        pageTitle: `Error Editing Listing ID: ${id}`,
        allCategories: allCategoriesFromDbForError,
        allAmenities: allAmenitiesFromDbForError,
      }
    };
  }
};
