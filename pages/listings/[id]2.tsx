import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import Link from 'next/link'; 
import prisma from '@/lib/prisma'; 
import { ListingBusiness } from '@prisma/client'; 
import Head from 'next/head';

// Define a type for the serialized listing for page props
interface SerializedPublicListing extends Omit<ListingBusiness, 'listing_business_id' | 'business_id' | 'latitude' | 'longitude' | 'updatedAt' | 'scraped_at'> {
  listing_business_id: string; 
  business_id: string; 
  latitude?: string | null; 
  longitude?: string | null; 
  updatedAt: string; 
  scraped_at: string | null; 
  image_url: string | null; 
  title: string; 
  description: string | null; 
  category_name: string | null; 
  address: string | null; 
  phone: string | null; 
  website: string | null; 
  price_range: string | null; 
  galleryImages?: SerializedGalleryImage[]; 
  // Any other Date/BigInt/Decimal fields that are serialized should be strings here
  // Note: If you include related data like reviews, they would need their own serialized types too.
}

// Define a type for individual gallery images
interface SerializedGalleryImage {
  url: string;
  description?: string | null;
  // Potentially add image_url_id if needed for keys, but url should be unique enough for display in most cases
}

// Define a type for the props, including the fetched listing
interface ListingPageProps {
  listing: SerializedPublicListing | null;
  error?: string;
  requestedSlug?: string | null; 
}

// Helper to convert Prisma Decimal/Date/BigInt to string for props
const serializeListing = (listing: ListingBusiness & { imageUrls?: { url: string; description?: string | null }[] }): SerializedPublicListing => {
  const serializableListing: any = { ...listing };

  serializableListing.listing_business_id = listing.listing_business_id.toString();
  serializableListing.business_id = listing.business_id.toString();

  if (listing.latitude !== null && listing.latitude !== undefined) {
    serializableListing.latitude = listing.latitude.toString();
  } else {
    serializableListing.latitude = null;
  }
  if (listing.longitude !== null && listing.longitude !== undefined) {
    serializableListing.longitude = listing.longitude.toString();
  } else {
    serializableListing.longitude = null;
  }

  serializableListing.updatedAt = listing.updatedAt.toISOString();
  if (listing.scraped_at instanceof Date) {
    serializableListing.scraped_at = listing.scraped_at.toISOString();
  } else {
    serializableListing.scraped_at = null; 
  }
  
  // Serialize gallery images
  if (listing.imageUrls && Array.isArray(listing.imageUrls)) {
    serializableListing.galleryImages = listing.imageUrls.map(img => ({
      url: img.url,
      description: img.description,
    }));
  }

  // Ensure all fields from SerializedPublicListing are present
  // and correctly typed. This cast assumes the above conversions cover all differences.
  return serializableListing as SerializedPublicListing;
};

export const getServerSideProps: GetServerSideProps<ListingPageProps> = async (context) => {
  const { slug } = context.params || {}; 

  if (!slug || typeof slug !== 'string') {
    return { 
      props: { 
        listing: null, 
        error: 'Listing slug is missing or invalid.', 
        requestedSlug: (typeof slug === 'string' ? slug : null) 
      }
    };
  }

  try {
    const listingData = await prisma.listingBusiness.findUnique({
      where: { slug: slug }, 
      include: {
        imageUrls: { 
          select: {
            url: true,
            description: true,
            image_url_id: true, 
          },
          orderBy: {
            image_url_id: 'asc' 
          }
        }
        // Optionally include other related data like categories, openingHours, reviews as needed
      },
    });

    if (!listingData) {
      return { 
        props: { 
          listing: null, 
          error: 'Listing not found.', 
          requestedSlug: slug 
        }
      }; 
    }
    
    // Serialize Decimal/BigInt/Date fields before passing as props
    const serialized: SerializedPublicListing = serializeListing(listingData);

    return { 
      props: { 
        listing: serialized, 
        requestedSlug: slug 
      }
    };
  } catch (error) {
    console.error('Failed to fetch listing for SSR by slug:', slug, error);
    return { 
      props: { 
        listing: null, 
        error: 'Failed to load listing data.', 
        requestedSlug: slug 
      }
    };
  }
};

const ListingDetailPage: React.FC<ListingPageProps> = ({ listing, error, requestedSlug }) => {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Loading...</div>; 
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Head><title>Error</title></Head>
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p>{error}</p>
        <Link href="/" legacyBehavior>
          <a className="text-blue-500 hover:text-blue-700 mt-4 inline-block">Go to Homepage</a>
        </Link>
      </div>
    );
  }

  if (!listing) {
    return (
        <div className="container mx-auto p-4">
            <Head><title>Listing Not Found</title></Head>
            <h1 className="text-2xl font-bold">Listing Not Found</h1>
            <p>The listing you are looking for does not exist.</p>
            <Link href="/" legacyBehavior>
              <a className="text-blue-500 hover:text-blue-700 mt-4 inline-block">Go to Homepage</a>
            </Link>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Head>
        <title>{listing.title} - Business Listing</title>
        {listing.description && <meta name="description" content={listing.description.substring(0, 160)} />}
        {/* Add other meta tags, OpenGraph, etc. */}
      </Head>

      <article className="bg-white shadow-lg rounded-lg p-6">
        {/* Display the main image if available */}
        {listing.image_url && (
          <div className="mb-4 w-full max-h-96 overflow-hidden rounded-lg">
            <img src={listing.image_url} alt={`Image of ${listing.title}`} className="w-full h-full object-cover" />
          </div>
        )}

        <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
        {listing.category_name && <p className="text-lg text-gray-600 mb-4">Category: {listing.category_name}</p>}
        
        {/* Basic Information Section */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Details</h2>
          {listing.address && <p><strong>Address:</strong> {listing.address}</p>}
          {listing.phone && <p><strong>Phone:</strong> {listing.phone}</p>}
          {listing.website && 
            <p><strong>Website:</strong> <a href={listing.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{listing.website}</a></p>}
          {listing.price_range && <p><strong>Price Range:</strong> {listing.price_range}</p>}
        </section>

        {/* Description Section */}
        {listing.description && (
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-gray-700 whitespace-pre-line">{listing.description}</p>
          </section>
        )}

        {/* Location / Map Placeholder -  You might integrate a map component here */}
        {(listing.latitude && listing.longitude) && (
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Location</h2>
            <p>Latitude: {listing.latitude}, Longitude: {listing.longitude}</p>
            {/* Placeholder for a map component */}
            <div className="w-full h-64 bg-gray-200 my-4 rounded flex items-center justify-center">
              <p className="text-gray-500">Map Placeholder (Lat: {listing.latitude}, Lng: {listing.longitude})</p>
            </div>
          </section>
        )}
        
        {/* Photo Gallery Section */}
        {listing.galleryImages && listing.galleryImages.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Photo Gallery</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {listing.galleryImages.map((image, index) => (
                <div key={image.url || index} className="overflow-hidden rounded-lg shadow-md aspect-w-1 aspect-h-1">
                  <img 
                    src={image.url} 
                    alt={image.description || `${listing.title} - Gallery Image ${index + 1}`} 
                    className="w-full h-full object-cover hover:opacity-75 transition-opacity duration-200"
                  />
                  {image.description && (
                    <p className="mt-1 text-xs text-gray-500 truncate">{image.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

      </article>
    </div>
  );
};

export default ListingDetailPage;
