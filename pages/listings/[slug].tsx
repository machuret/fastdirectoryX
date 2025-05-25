import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import prisma from '@/lib/prisma';
import { ListingBusiness, Prisma, User as PrismaUser } from '@prisma/client';
import Head from 'next/head';
import { ClientReviews } from '@/components/ui/client-reviews';
import {
  FaFacebook, FaInstagram, FaLinkedin, FaPinterest, FaYoutube, FaTwitter, FaGlobe,
  FaStar, FaPhoneAlt, FaDirections, FaExternalLinkAlt
} from 'react-icons/fa';

// Define a type for the raw image data coming from Prisma, including BigInt
interface RawListingImage {
  url: string;
  description?: string | null;
  image_url_id: number; 
}

// Define a type for the raw review data coming from Prisma (ListingReview model)
interface RawListingReviewData { 
  review_id: number;
  reviewer_name?: string | null;
  reviewer_avatar_url?: string | null;
  review_text?: string | null;
  rating?: Prisma.Decimal | null; 
  published_at_date?: Date | null;
  created_at: Date; 
}

// Define a type for the serialized listing for page props
interface SerializedPublicListing extends Omit<ListingBusiness, 
  'listing_business_id' | 
  'business_id' | 
  'user_id' | 
  'latitude' | 
  'longitude' | 
  'updatedAt' | 
  'scraped_at' | 
  'imageUrls' | 
  'createdAt' | 
  'descriptionLastOptimizedAt' |
  'average_rating' | 
  'reviews' | 
  'categories' // Exclude original categories from serialized type
> {
  listing_business_id: string; 
  latitude: string | null; 
  longitude: string | null; 
  updatedAt: string | null; 
  createdAt: string | null; 
  scraped_at: string | null; 
  descriptionLastOptimizedAt: string | null; 
  image_url: string | null;
  title: string;
  description: string | null;
  category_name: string | null;
  category_slug: string | null; // Added category_slug
  address: string | null;
  phone: string | null;
  website: string | null;
  price_range: string | null;
  average_rating: string | null; 
  galleryImages?: SerializedGalleryImage[];
  reviews?: SerializedReview[];
  neighborhood: string | null;
  street: string | null;
  isFeatured: boolean;
  temporarily_closed: boolean;
  permanently_closed: boolean;
  // Social Media Links
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  pinterest_url: string | null;
  youtube_url: string | null;
  x_com_url: string | null;
  faq: { question: string; answer: string; }[] | null; // Made FAQ field non-optional
}

// Define a type for individual gallery images
interface SerializedGalleryImage {
  url: string;
  description?: string | null;
  image_url_id: string; 
}

// Define a type for serialized reviews for the ClientReviews component
interface SerializedReview { 
  id: string; 
  rating: number;
  reviewer: string;
  roleReviewer: string;
  review: string; 
  date: string;
  // reviewer_avatar_url?: string | null; 
}

// Define a type for the props, including the fetched listing
interface ListingPageProps {
  listing: SerializedPublicListing | null;
  otherListings: SerializedListingCard[]; 
  error?: string | null; 
  requestedSlug?: string | null; 
}

// Simple card representation for 'Other Listings'
interface SerializedListingCard {
  listing_business_id: string;
  title: string;
  slug: string | null;
  displayImageUrl: string | null;
  category_name: string | null;
}

// Helper to convert Prisma Decimal/Date/BigInt to string for props
const serializeListing = (
  listing: ListingBusiness & { 
    imageUrls?: RawListingImage[]; 
    reviews?: RawListingReviewData[]; 
    categories?: { category: { category_name: string; slug: string; } | null }[];
  }
): SerializedPublicListing => {
  const serialized: Partial<SerializedPublicListing> = {};

  serialized.listing_business_id = listing.listing_business_id.toString();

  if (listing.latitude !== null && listing.latitude !== undefined) {
    serialized.latitude = listing.latitude.toString();
  } else {
    serialized.latitude = null;
  }
  if (listing.longitude !== null && listing.longitude !== undefined) {
    serialized.longitude = listing.longitude.toString();
  } else {
    serialized.longitude = null;
  }

  serialized.updatedAt = (listing.updatedAt && listing.updatedAt instanceof Date) ? listing.updatedAt.toISOString() : null;
  serialized.createdAt = (listing.createdAt && listing.createdAt instanceof Date) ? listing.createdAt.toISOString() : null;
  serialized.scraped_at = (listing.scraped_at && listing.scraped_at instanceof Date) ? listing.scraped_at.toISOString() : null;
  serialized.descriptionLastOptimizedAt = (listing.descriptionLastOptimizedAt && listing.descriptionLastOptimizedAt instanceof Date) ? listing.descriptionLastOptimizedAt.toISOString() : null;

  const avgRating = (listing as any).average_rating;
  if (avgRating !== null && avgRating !== undefined) {
    serialized.average_rating = avgRating.toString();
  } else {
    serialized.average_rating = null;
  }

  if (listing.imageUrls && Array.isArray(listing.imageUrls)) {
    serialized.galleryImages = listing.imageUrls.map((img: RawListingImage) => ({
      url: img.url,
      description: img.description,
      image_url_id: img.image_url_id.toString()
    }));
  } else {
    serialized.galleryImages = []; 
  }
  delete (serialized as any).imageUrls;

  if (listing.reviews && Array.isArray(listing.reviews)) {
    serialized.reviews = listing.reviews.map((review: RawListingReviewData) => {
      const reviewDate = review.published_at_date || review.created_at;
      let ratingValue = 0;
      if (review.rating !== null && review.rating !== undefined) {
        ratingValue = typeof review.rating === 'number' ? review.rating : parseFloat(review.rating.toString());
      }

      return {
        id: review.review_id.toString(),
        rating: ratingValue,
        reviewer: review.reviewer_name || 'Anonymous',
        roleReviewer: 'Customer', 
        review: review.review_text || '',
        date: reviewDate ? reviewDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        // reviewer_avatar_url: review.reviewer_avatar_url, 
      };
    }).filter(review => review.id); 
  } else {
    serialized.reviews = [];
  }

  serialized.title = (listing as any).title ?? ''; 
  serialized.description = (listing as any).description ?? null;
  serialized.address = (listing as any).address ?? null;
  serialized.phone = (listing as any).phone ?? null;
  serialized.website = (listing as any).website ?? null;
  serialized.price_range = (listing as any).price_range ?? null;
  serialized.image_url = (listing as any).image_url ?? null; 
  serialized.neighborhood = (listing as any).neighborhood ?? null;
  serialized.street = (listing as any).street ?? null;

  serialized.isFeatured = (listing as any).isFeatured ?? false;
  serialized.temporarily_closed = (listing as any).temporarily_closed ?? false;
  serialized.permanently_closed = (listing as any).permanently_closed ?? false;

  // Serialize social media links
  serialized.facebook_url = (listing as any).facebook_url ?? null;
  serialized.instagram_url = (listing as any).instagram_url ?? null;
  serialized.linkedin_url = (listing as any).linkedin_url ?? null;
  serialized.pinterest_url = (listing as any).pinterest_url ?? null;
  serialized.youtube_url = (listing as any).youtube_url ?? null;
  serialized.x_com_url = (listing as any).x_com_url ?? null;

  // Populate category_name and category_slug from the new categories structure
  if (listing.categories && listing.categories.length > 0 && listing.categories[0] && listing.categories[0].category) {
    serialized.category_name = listing.categories[0].category.category_name;
    serialized.category_slug = listing.categories[0].category.slug;
  } else {
    // Fallback to existing category_name if categories structure isn't available or populated
    // This maintains backward compatibility if the include isn't there yet
    serialized.category_name = (listing as any).category_name ?? null;
    serialized.category_slug = null; 
  }

  // Copy FAQ data if it exists
  if (listing.faq && Array.isArray(listing.faq)) {
    serialized.faq = listing.faq as { question: string; answer: string; }[];
  } else {
    serialized.faq = null;
  }

  return serialized as SerializedPublicListing;
};

// Helper to serialize listings for the 'Other Listings' card display
const serializeListingForCard = (
  listing: ListingBusiness & { 
    imageUrls?: { url: string }[], 
    categories?: { category: { category_name: string; slug: string; } }[] 
  }
): SerializedListingCard => {
  let displayImageUrl = listing.image_url || null;
  if (!displayImageUrl && listing.imageUrls && listing.imageUrls.length > 0) {
    displayImageUrl = listing.imageUrls[0]?.url || null;
  }

  const firstCategoryName = listing.categories && listing.categories.length > 0 && listing.categories[0].category
    ? listing.categories[0].category.category_name 
    : listing.category_name;

  return {
    listing_business_id: listing.listing_business_id.toString(),
    title: listing.title,
    slug: listing.slug,
    displayImageUrl: displayImageUrl,
    category_name: firstCategoryName,
  };
};

export const getServerSideProps: GetServerSideProps<ListingPageProps> = async (context) => {
  const { slug } = context.params || {}; 

  if (!slug || typeof slug !== 'string') {
    return { notFound: true };
  }

  try {
    const listingData = await prisma.listingBusiness.findUnique({
      where: { slug: slug }, 
      include: {
        imageUrls: {
          select: {
            image_url_id: true,
            url: true,
            description: true,
          },
          take: 10, // Limit number of images
        },
        reviews: { // This should match your actual ListingReview model relation
          select: {
            review_id: true,
            reviewer_name: true,
            review_text: true,
            rating: true,
            published_at_date: true,
            created_at: true,
          },
          orderBy: { created_at: 'desc' }, 
          take: 10, // Limit reviews shown on page, more can be loaded via API
        },
        categories: { // Relation from ListingBusiness to ListingBusinessCategory (join table)
          include: {    // Use 'include' to fetch ListingBusinessCategory records
            // This ensures we get the full ListingBusinessCategory object, which includes the listingCategory relation
            category: { // This is the relation field on ListingBusinessCategory pointing to ListingCategory
              select: {        // Select specific fields from the related ListingCategory
                category_name: true,
                slug: true
              }
            }
          }
        },
      }
    });

    if (!listingData) {
      return { 
        props: { 
          listing: null, 
          otherListings: [], // Initialize otherListings
          error: 'Listing not found.',
          requestedSlug: slug,
        }, 
        // notFound: true, // Consider using notFound for proper 404 handling
      };
    }

    const serializedMainListing = serializeListing(listingData as any); // Type assertion for Prisma's complex types

    let otherListings: SerializedListingCard[] = [];
    const primaryCategorySlug = serializedMainListing.category_slug;

    if (primaryCategorySlug) {
      const relatedListingsData = await prisma.listingBusiness.findMany({
        where: {
          NOT: {
            slug: slug, // Exclude the current listing
          },
          categories: {
            some: {
              category: {
                slug: primaryCategorySlug,
              },
            },
          },
          permanently_closed: false,
          temporarily_closed: false,
        },
        take: 6, // Number of related listings to show
        orderBy: [
          { isFeatured: 'desc' }, 
          { updatedAt: 'desc' }
        ],
        include: {
          imageUrls: { select: { url: true }, take: 1, orderBy: { image_url_id: 'asc' } },
          categories: { 
            select: { category: { select: { category_name: true, slug: true } } }, 
            take: 1 
          },
        },
      });
      otherListings = relatedListingsData.map(listing => serializeListingForCard(listing as any));
    }

    return {
      props: {
        listing: serializedMainListing,
        otherListings,
        error: null, 
        requestedSlug: slug,
      },
    };
  } catch (error) {
    console.error('Failed to fetch listing for SSR by slug:', slug, error);
    return { 
      props: { 
        listing: null, 
        otherListings: [], // Initialize otherListings
        error: 'Failed to load listing data.',
        requestedSlug: slug,
      }
    };
  }
};

const ListingDetailPage: React.FC<ListingPageProps> = ({ listing, otherListings, error, requestedSlug }) => {
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
    <div className="container mx-auto p-4 font-sans"> 
      <Head>
        <title>{listing.title} - Business Listing</title>
        {listing.description && <meta name="description" content={listing.description.substring(0, 160)} />}
      </Head>

      {/* --- TOP SECTION --- */}
      <section className="mb-8 text-black dark:text-black">
        <h1 className="text-4xl font-bold mb-2 text-black dark:text-black">{listing.title}</h1>
        <div className="flex items-center mb-1">
          {listing.average_rating && parseFloat(listing.average_rating) > 0 && (
            <>
              <FaStar className="text-yellow-400 mr-1" />
              <span className="mr-2 font-semibold text-black dark:text-black">{parseFloat(listing.average_rating).toFixed(1)} stars</span>
            </>
          )}
          {listing.reviews && listing.reviews.length > 0 && (
            <span className="text-sm text-black dark:text-black">({listing.reviews.length} reviews)</span>
          )}
        </div>
        {listing.address && <p className="text-md mb-4 text-black dark:text-black">{listing.address}</p>}

        {listing.galleryImages && listing.galleryImages.length > 0 && (
          <div className="w-full h-[300px] md:h-[400px] lg:h-[500px] relative rounded-lg overflow-hidden shadow-lg mb-8 bg-gray-200"> 
            <Image
              src={listing.galleryImages[0].url}
              alt={`${listing.title} - Hero Image`}
              fill
              sizes="100vw"
              className="object-cover"
              priority 
            />
          </div>
        )}
      </section>

      {/* --- MAIN CONTENT AREA (Two Columns) --- */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Column (70%) */}
        <div className="w-full md:w-7/12 lg:w-8/12 flex flex-col gap-6 text-black dark:text-black">
          <article className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-3 text-black dark:text-black">Description</h2>
            {listing.description ? (
              <p className="whitespace-pre-line text-black dark:text-black">{listing.description}</p>
            ) : (
              <p className="text-black dark:text-black">No description available.</p>
            )}
          </article>

          {/* FAQ Placeholder */}
          <article className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-3 text-black dark:text-black">Frequently Asked Questions</h2>
            {listing.faq && listing.faq.length > 0 ? (
              <div>
                {listing.faq.map((faq, index) => (
                  <div key={index} className="mb-4">
                    <h3 className="text-lg font-bold text-black dark:text-black">{faq.question}</h3>
                    <p className="text-black dark:text-black">{faq.answer}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-black dark:text-black">No FAQs available.</p>
            )}
          </article>

          {/* Photo Gallery Section (Remaining Photos) */}
          {listing.galleryImages && listing.galleryImages.length > 1 && (
            <article className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-3 text-black dark:text-black">Photo Gallery</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {listing.galleryImages.slice(1).map((image, index) => (
                  <div key={image.url || index} className="overflow-hidden rounded-lg shadow aspect-w-16 aspect-h-9 bg-gray-100 relative">
                    <Image 
                      src={image.url} 
                      alt={image.description || `${listing.title} - Gallery Image ${index + 1}`}
                      fill
                      sizes="100vw" // Can be refined, e.g., (max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw
                      className="transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </article>
          )}

          {/* Reviews Section */}
          <article className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-3 text-black dark:text-black">Reviews</h2>
            {listing.reviews && listing.reviews.length > 0 ? (
              <ClientReviews reviews={listing.reviews} />
            ) : (
              <p className="text-black dark:text-black">No reviews yet for this listing.</p>
            )}
          </article>
        </div>

        {/* Right Column (30%) */}
        <aside className="w-full md:w-5/12 lg:w-4/12 flex flex-col gap-6 text-black dark:text-black">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-3 text-black dark:text-black">Business Info</h2>
            {listing.category_name && listing.category_slug ? (
              <p className="mb-1">
                <strong className="text-black dark:text-black">Category: </strong>
                <Link href={`/category/${listing.category_slug}`} legacyBehavior>
                  <a className="text-blue-600 hover:text-blue-800 hover:underline">
                    {listing.category_name}
                  </a>
                </Link>
              </p>
            ) : listing.category_name ? (
              <p className="mb-1"><strong className="text-black dark:text-black">Category:</strong> {listing.category_name}</p>
            ) : null}
            {listing.address && <p className="mb-1"><strong className="text-black dark:text-black">Address:</strong> {listing.address}</p>} 
            {listing.phone && <p className="mb-1"><strong className="text-black dark:text-black">Phone:</strong> {listing.phone}</p>}
            {/* City - Assuming address contains city, or you have a separate city field */}
            {/* <p className="mb-1"><strong className="text-black dark:text-black">City:</strong> {listing.city || 'N/A'}</p> */} 
          </div>

          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-3 text-black dark:text-black">Actions</h2>
            <div className="flex flex-col space-y-3">
              {listing.website && (
                <a href={listing.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-150">
                  <FaExternalLinkAlt className="mr-2" /> Visit Website
                </a>
              )}
              {listing.phone && (
                <a href={`tel:${listing.phone}`} className="flex items-center justify-center py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-150">
                  <FaPhoneAlt className="mr-2" /> Call Business
                </a>
              )}
              {listing.address && (
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.address)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center py-2 px-4 bg-yellow-500 text-black rounded-md hover:bg-yellow-600 transition duration-150">
                  <FaDirections className="mr-2" /> Get Directions
                </a>
              )}
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-3 text-black dark:text-black">Location</h2>
            {(listing.latitude && listing.longitude) ? (
              <div className="w-full h-64 bg-gray-200 my-2 rounded flex items-center justify-center text-gray-500">
                Map Placeholder (Lat: {listing.latitude}, Lng: {listing.longitude})
                {/* TODO: Replace with actual Google Maps Embed */}
              </div>
            ) : (
              <p className="text-black dark:text-black">Location data not available.</p>
            )}
          </div>

          {/* Ownership Claim Section - Moved to sidebar */}
          {listing && listing.listing_business_id && (
            <div className="bg-blue-50 border border-dashed border-blue-400 rounded-lg p-4 text-center">
              <h3 className="text-lg font-semibold text-blue-700 mb-2">Do you own this business?</h3>
              <p className="text-sm text-gray-700 mb-3">
                Claim this listing to update details, respond to reviews, and more.
              </p>
              <Link href={`/claim/${listing.listing_business_id}`} legacyBehavior>
                <a className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition duration-150 ease-in-out">
                  Claim This Business
                </a>
              </Link>
            </div>
          )}
        </aside>
      </div>

      {/* Other Listings Section */}
      {otherListings && otherListings.length > 0 && (
        <section className="mt-16 py-12 bg-gray-100">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-10 text-gray-800">
              Other Listings in {listing.category_name || 'this Category'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {otherListings.map((otherListing) => (
                <Link key={otherListing.listing_business_id} href={`/listings/${otherListing.slug || otherListing.listing_business_id}`} passHref legacyBehavior>
                  <a className="block bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden group">
                    <div className="relative w-full aspect-[16/10]">
                      {otherListing.displayImageUrl ? (
                        <Image 
                          src={otherListing.displayImageUrl} 
                          alt={otherListing.title || 'Listing image'}
                          layout="fill"
                          objectFit="cover"
                          className="transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-sm">No Image</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      {otherListing.category_name && (
                        <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider mb-1">
                          {otherListing.category_name}
                        </p>
                      )}
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-indigo-700 transition-colors">
                        {otherListing.title || 'Unnamed Listing'}
                      </h3>
                      {/* Add more details like address if needed */}
                    </div>
                  </a>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Placeholder for More Businesses Carousel */}
      {/* <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-4 text-black dark:text-black">More Businesses</h2>
        <p className="text-black dark:text-black">Carousel will go here.</p>
      </section> */}
    </div>
  );
};

export default ListingDetailPage;
