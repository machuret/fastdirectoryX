import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma'; // Assuming prisma client is setup at lib/prisma
import { getSession } from 'next-auth/react'; // For authentication
import { ListingBusiness, ListingReview, Prisma } from '@prisma/client'; // Import ListingBusiness type & ListingReview, and Prisma namespace
import { generateUniqueSlug } from '@/lib/utils'; // Import the slug utility

export interface SerializedListingBusiness extends Omit<ListingBusiness, 
  'business_id' | 
  'latitude' | 
  'longitude' | 
  'updatedAt' | 
  'createdAt' | 
  'scraped_at' | 
  'descriptionLastOptimizedAt' | 
  'isFeatured' | 
  'temporarily_closed' | 
  'permanently_closed' | 
  'reviews_count' | 
  'images_count' | 
  'descriptionOptimized' | 
  'faqLastGeneratedAt'
> {
  business_id: string;
  slug: string;
  updatedAt: string | null;
  createdAt: string | null;
  latitude: string | null;
  longitude: string | null;
  scraped_at: string | null;
  descriptionLastOptimizedAt: string | null;
  faqLastGeneratedAt: string | null;
  reviews_count: number | null; // from _count or manual aggregation if not using _count
  images_count: number | null;  // from _count or manual aggregation if not using _count
  descriptionOptimized: boolean | null;
  // Retain other fields from ListingBusiness that are directly serializable
  [key: string]: any; // To allow other properties from ListingBusiness
}

// Type for items from the initial prisma.listingBusiness.findMany query
interface SelectedListingData {
  business_id: number;
  title: string;
  slug: string;
  phone: string | null;
  address: string | null;
  website: string | null;
  descriptionOptimized: boolean;
  descriptionLastOptimizedAt: Date | null;
  faqLastGeneratedAt: Date | null;
  category_name: string | null;
  neighborhood: string | null;
  street: string | null;
  city: string | null;
  postal_code: string | null;
  state: string | null;
  country_code: string | null; 
  latitude: Prisma.Decimal | null;
  longitude: Prisma.Decimal | null;
  price_range: string | null;
  reviews_count: number | null; 
  permanently_closed: boolean | null;
  temporarily_closed: boolean | null;
  isFeatured: boolean;
  image_url: string | null;
  updatedAt: Date;
  createdAt: Date;
  scraped_at: Date | null;
}

// Utility function to serialize ListingBusiness data
export function serializeAdminListing(
  listingWithRelations: (ListingBusiness & { 
    reviews?: ListingReview[],
    imageUrls?: { image_url_id: bigint, url: string, description?: string | null, is_cover_image: boolean, listing_business_id: bigint }[]
    _count?: { reviews?: number, imageUrls?: number } // For Prisma's _count relation
  }) | null
): SerializedListingBusiness | null {
  if (!listingWithRelations) return null;

  const { 
    business_id,
    latitude,
    longitude,
    updatedAt,
    createdAt,
    scraped_at,
    descriptionLastOptimizedAt,
    faqLastGeneratedAt,
    reviews,
    imageUrls,
    _count,
    // Omit other non-serializable or specifically handled fields if necessary
    ...restOfListing // Spread the rest of the properties
  } = listingWithRelations;

  // Determine counts
  const reviews_count = _count?.reviews ?? reviews?.length ?? 0;
  const images_count = _count?.imageUrls ?? imageUrls?.length ?? 0;

  return {
    ...restOfListing, // Spread serializable properties first
    business_id: business_id.toString(),
    latitude: latitude?.toString() || null,
    longitude: longitude?.toString() || null,
    updatedAt: (updatedAt && updatedAt instanceof Date) ? updatedAt.toISOString() : null,
    createdAt: createdAt?.toISOString() || null,
    scraped_at: scraped_at?.toISOString() || null,
    descriptionLastOptimizedAt: descriptionLastOptimizedAt?.toISOString() || null,
    faqLastGeneratedAt: faqLastGeneratedAt?.toISOString() || null,
    reviews_count,
    images_count,
    descriptionOptimized: listingWithRelations.descriptionOptimized ?? false, // Default to false if null
  };
}

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  // For now, let's assume anyone can access, or add your own auth check
  // if (!session || !session.user.isAdmin) { // Example admin check
  //   return res.status(401).json({ message: 'Unauthorized' });
  // }

  if (req.method === 'GET') {
    const { minimal } = req.query;

    if (minimal === 'true') {
      try {
        const listings = await prisma.listingBusiness.findMany({
          orderBy: {
            title: 'asc',
          },
          select: {
            business_id: true,
            title: true,
          },
        });
        // Ensure business_id is a string for consistency with the Mass FAQ page's expectations
        const minimalListings = listings.map(l => ({ 
          ...l, 
          business_id: l.business_id.toString() 
        }));
        return res.status(200).json(minimalListings); // Return simplified list directly
      } catch (error: any) {
        console.error('Failed to fetch minimal listings:', error);
        return res.status(500).json({ message: 'Failed to fetch minimal listings', error: error.message });
      }
    }

    try {
      const listingsData = await prisma.listingBusiness.findMany({
        orderBy: {
          title: 'asc',
        },
        select: {
          business_id: true,
          title: true,
          slug: true,
          phone: true,
          address: true,
          website: true,
          descriptionOptimized: true,
          descriptionLastOptimizedAt: true,
          faqLastGeneratedAt: true,
          // Include _count for relations if you prefer this over manual length checks in serializeAdminListing
          // _count: {
          //   select: { reviews: true, imageUrls: true },
          // },
          // Or include the full relations if you need more data from them (will be heavier)
          // reviews: { select: { review_id: true } }, // Example: only select review_id to count
          // imageUrls: { select: { image_url_id: true } }, // Example: only select image_url_id to count
          
          // Include all scalar fields (example, adjust to your needs)
          category_name: true,
          neighborhood: true,
          street: true,
          city: true,
          state: true,
          postal_code: true,
          country_code: true,            
          latitude: true,
          longitude: true,
          price_range: true,
          reviews_count: true,  
          permanently_closed: true,
          temporarily_closed: true,
          isFeatured: true,
          image_url: true,
          updatedAt: true,
          createdAt: true,
          scraped_at: true,
          // Do NOT select the 'faq' field itself here unless you want to send all FAQ data to the list view
          // We only need 'faqLastGeneratedAt' for the list view.
        }
      });

      // Manually fetch counts if not using _count in the above Prisma query
      const listingsWithManualCounts = await Promise.all(listingsData.map(async (listing: SelectedListingData) => {
        const reviewsCount = await prisma.listingReview.count({ where: { listing_business_id: listing.business_id } });
        const imagesCount = await prisma.listingImageUrl.count({ where: { listing_business_id: listing.business_id } });
        return {
          ...listing, // Spread existing fields from SelectedListingData
          // Add the _count object for serializeAdminListing to use
          _count: {
            reviews: reviewsCount,
            imageUrls: imagesCount,
          },
        };
      }));

      const serializedListings = listingsWithManualCounts.map(listing => serializeAdminListing(listing as any)).filter(Boolean) as SerializedListingBusiness[];

      res.status(200).json(serializedListings);
    } catch (error: any) { // Added type for error
      console.error('Failed to fetch listings:', error);
      res.status(500).json({ message: 'Failed to fetch listings', error: error.message });
    }
  } else if (req.method === 'POST') {
    // Create a new listing
    try {
      const {
        title,
        price_range,
        category_name, // Consider if this should be from a relation or free text
        address,
        neighborhood,
        street,
        city,
        postal_code,
        state,
        country_code,
        phone,
        // Add other direct fields from ListingBusiness model here
        // For simplicity, we're starting with a few. More can be added.
        description,
        website,
        latitude,
        longitude,
        place_id,
        facebook_url,
        instagram_url,
        linkedin_url,
        pinterest_url,
        youtube_url,
        x_com_url
      } = req.body;

      if (!title) {
        return res.status(400).json({ message: 'Title is required' });
      }

      // Generate a unique slug for the listing
      // prisma instance is passed to the utility function
      const slug = await generateUniqueSlug(title as string, prisma);

      // Basic validation for latitude and longitude if provided
      const lat = latitude !== undefined && latitude !== null && latitude !== '' ? parseFloat(latitude as string) : undefined;
      const lon = longitude !== undefined && longitude !== null && longitude !== '' ? parseFloat(longitude as string) : undefined;

      if (latitude !== undefined && latitude !== null && latitude !== '' && isNaN(lat as number)) {
        return res.status(400).json({ message: 'Invalid latitude format.' });
      }
      if (longitude !== undefined && longitude !== null && longitude !== '' && isNaN(lon as number)) {
        return res.status(400).json({ message: 'Invalid longitude format.' });
      }

      // Prepare data for Prisma, including optional social media fields
      const listingData: Prisma.ListingBusinessCreateInput = {
        title,
        slug,
        description,
        phone,
        website,
        address,
        category_name,
        city,
        state,
        country_code,
        postal_code,
        neighborhood,
        price_range,
        latitude: lat,
        longitude: lon,
        place_id: place_id as string | undefined, // Ensure correct type
        // Add social media URLs if they are provided
        ...(facebook_url && { facebook_url }),
        ...(instagram_url && { instagram_url }),
        ...(linkedin_url && { linkedin_url }),
        ...(pinterest_url && { pinterest_url }),
        ...(youtube_url && { youtube_url }),
        ...(x_com_url && { x_com_url }),
      };

      // Check if a listing with the same place_id already exists (if place_id is provided and meant to be unique)
      if (place_id) {
        const existingByPlaceId = await prisma.listingBusiness.findUnique({
          where: { place_id: place_id as string }, // Assuming place_id is a string from body
        });
        if (existingByPlaceId) {
          return res.status(409).json({ message: 'A listing with this Place ID already exists.' });
        }
      }

      const newListing = await prisma.listingBusiness.create({
        data: listingData,
      });

      // Serialize the newly created listing before sending it back
      const serializedNewListing = serializeAdminListing(newListing as any); // Cast as any for now

      res.status(201).json(serializedNewListing);
    } catch (error: any) {
      console.error('Failed to create listing:', error);
      if (error.code === 'P2002' && error.meta?.target?.includes('place_id')) {
        return res.status(409).json({ message: 'A listing with this Place ID already exists (database constraint).' });
      }
      if (error.code === 'P2002' && error.meta?.target?.includes('slug')) { // Check for slug unique constraint
        return res.status(409).json({ message: 'A listing with this slug already exists. This might happen if the title is very similar to an existing one.', details: error.meta?.target });
      }
      if (error.code === 'P2002') { // Catch other unique constraint violations
        return res.status(409).json({ message: 'A unique constraint violation occurred.', details: error.meta?.target });
      }
      res.status(500).json({ message: 'Failed to create listing', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
