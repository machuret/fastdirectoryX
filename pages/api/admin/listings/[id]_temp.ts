import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getSession } from 'next-auth/react';
import { ListingBusiness, ListingReview } from '@prisma/client'; // Import ListingBusiness and ListingReview types

// Define a type for the serialized review
interface SerializedReview {
  review_id: string;
  listing_business_id: string;
  reviewer_name?: string | null;
  reviewer_id?: string | null;
  reviewer_avatar_url?: string | null;
  review_text?: string | null;
  rating?: string | null; 
  published_at_date?: string | null; 
  response_from_owner_text?: string | null;
  response_from_owner_date?: string | null;
  review_link?: string | null;
  review_source?: string | null;
}

// Define a type for serialized gallery images
interface SerializedListingImageUrl {
  image_url_id: string;
  url: string;
  description?: string | null;
  is_cover_image: boolean;
}

// Define a type for the serialized listing with reviews
interface SerializedListingBusiness extends Omit<ListingBusiness, 'business_id' | 'createdAt' | 'updatedAt' | 'scraped_at' | 'latitude' | 'longitude'> {
  business_id: string;
  updatedAt: string; // Assuming updatedAt is always present
  scraped_at?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  image_url?: string | null;
  reviews?: SerializedReview[];
  imageUrls?: SerializedListingImageUrl[]; // Added for gallery images
}

// Interface for gallery image items received from the admin form
interface GalleryImageFormInput {
  id?: string; // image_url_id (BigInt as string) for existing, undefined for new
  url: string;
  description: string;
  // is_cover_image is not expected from client for gallery, defaults to false or handled by main image_url
}

// Utility function to convert BigInt and Date fields in a listing object (and its reviews/imageUrls) to strings
function serializeAdminListing(
  listingWithRelations: (ListingBusiness & { 
    reviews?: ListingReview[],
    imageUrls?: { image_url_id: bigint, url: string, description?: string | null, is_cover_image: boolean, listing_business_id: bigint }[] // Type from Prisma schema for ListingImageUrl
  }) | null
): SerializedListingBusiness | null {
  if (!listingWithRelations) {
    return null;
  }

  const { reviews: rawReviews, imageUrls: rawImageUrls, ...listingData } = listingWithRelations;

  let processedReviews: SerializedReview[] | undefined = undefined;
  if (rawReviews) {
    processedReviews = rawReviews.map((review: ListingReview): SerializedReview => {
      const { review_id, listing_business_id, published_at_date, rating, ...restOfReview } = review;
      return {
        ...restOfReview,
        review_id: review_id.toString(),
        listing_business_id: listing_business_id.toString(),
        rating: rating?.toString() ?? null,
        published_at_date: published_at_date instanceof Date ? published_at_date.toISOString() : null,
      } as SerializedReview; 
    });
  }

  let processedImageUrls: SerializedListingImageUrl[] | undefined = undefined;
  if (rawImageUrls) {
    processedImageUrls = rawImageUrls.map(img => ({
      ...img,
      image_url_id: img.image_url_id.toString(),
      // listing_business_id is not typically needed in the serialized output for the client here
    }));
  }

  // Now construct the main listing object, including the processed reviews
  const serializedBase: Omit<SerializedListingBusiness, 'reviews' | 'imageUrls'> = {
    // Spread the original listing data, then override specific fields
    ...(listingData as Omit<ListingBusiness, 'business_id' | 'updatedAt' | 'scraped_at' | 'latitude' | 'longitude'>),
    business_id: listingData.business_id.toString(),
    updatedAt: listingData.updatedAt.toISOString(), // Assuming listingData.updatedAt is Date
    scraped_at: listingData.scraped_at instanceof Date ? listingData.scraped_at.toISOString() : null,
    latitude: listingData.latitude?.toString() ?? null,
    longitude: listingData.longitude?.toString() ?? null,
  };

  const finalSerializedListing: SerializedListingBusiness = {
    ...(serializedBase as SerializedListingBusiness), // Cast needed if Omit makes it too narrow initially
    image_url: listingData.image_url,
    reviews: processedReviews,
    imageUrls: processedImageUrls,
  };
  
  return finalSerializedListing;
}

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  const { id } = req.query;

  // if (!session || !session.user.isAdmin) { // Example admin check
  //   return res.status(401).json({ message: 'Unauthorized' });
  // }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Listing ID is required and must be a string.' });
  }

  // Convert string ID to bigint for Prisma query, assuming it's a numeric ID
  let listingIdBigInt: bigint;
  try {
    listingIdBigInt = BigInt(id);
  } catch (error) {
    return res.status(400).json({ message: 'Invalid Listing ID format. Must be a number.' });
  }

  if (req.method === 'GET') {
    try {
      const listingData = await prisma.listingBusiness.findUnique({
        where: { business_id: listingIdBigInt },
        include: {
          reviews: { 
            orderBy: {
              published_at_date: 'desc' 
            }
          },
          imageUrls: { // Include related gallery images
            orderBy: {
              image_url_id: 'asc' // Default order by ID if no specific order field
            }
          } 
        },
      });
      if (!listingData) {
        return res.status(404).json({ message: 'Listing not found' });
      }
      res.status(200).json(serializeAdminListing(listingData as any)); // Cast to any to satisfy the new type for serializeAdminListing
    } catch (error: any) {
      console.error(`Failed to fetch listing ${id}:`, error);
      res.status(500).json({ message: `Failed to fetch listing ${id}`, error: error.message });
    }
  } else if (req.method === 'PUT') {
    const {
      title,
      price_range,
      category_name,
      address,
      neighborhood,
      street,
      city,
      postal_code,
      state,
      country_code,
      phone,
      description,
      website,
      latitude,
      longitude,
      place_id,
      image_url,
      galleryImages // Expect galleryImages from the request body
    } = req.body as ListingBusiness & { galleryImages?: GalleryImageFormInput[] };

    // Basic validation for latitude and longitude if provided
    const lat = latitude !== undefined && latitude !== null && (latitude as unknown as string) !== '' ? parseFloat(latitude as unknown as string) : undefined;
    const lon = longitude !== undefined && longitude !== null && (longitude as unknown as string) !== '' ? parseFloat(longitude as unknown as string) : undefined;

    if (latitude !== undefined && latitude !== null && (latitude as unknown as string) !== '' && isNaN(lat as number)) {
        return res.status(400).json({ message: 'Invalid latitude format.' });
    }
    if (longitude !== undefined && longitude !== null && (longitude as unknown as string) !== '' && isNaN(lon as number)) {
        return res.status(400).json({ message: 'Invalid longitude format.' });
    }

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    try {
      const updatedListing = await prisma.$transaction(async (tx) => {
        // 1. Update main ListingBusiness details
        const updatedBusiness = await tx.listingBusiness.update({
          where: { business_id: listingIdBigInt },
          data: {
            title,
            price_range,
            category_name,
            address,
            neighborhood,
            street,
            city,
            postal_code,
            state,
            country_code,
            phone,
            description,
            website,
            latitude: lat,
            longitude: lon,
            place_id: place_id as string | undefined,
            image_url: image_url as string | undefined,
          },
        });

        // 2. Process Gallery Images
        if (galleryImages && Array.isArray(galleryImages)) {
          const existingImageUrls = await tx.listingImageUrl.findMany({
            where: { listing_business_id: listingIdBigInt },
          });

          const submittedImageIds = galleryImages.map(img => img.id).filter(id => id !== undefined) as string[];
          const existingImageIds = existingImageUrls.map(img => img.image_url_id.toString());

          // Images to delete: in existingImageUrls but not in submittedImageIds (for those that had an ID)
          const imagesToDelete = existingImageUrls.filter(
            img => !submittedImageIds.includes(img.image_url_id.toString())
          );
          for (const imgToDelete of imagesToDelete) {
            await tx.listingImageUrl.delete({
              where: { image_url_id: imgToDelete.image_url_id },
            });
          }

          // Images to update or create
          for (const submittedImage of galleryImages) {
            if (submittedImage.id && existingImageIds.includes(submittedImage.id)) {
              // Update existing image
              const existingImage = existingImageUrls.find(img => img.image_url_id.toString() === submittedImage.id);
              if (existingImage && (existingImage.url !== submittedImage.url || existingImage.description !== submittedImage.description)) {
                await tx.listingImageUrl.update({
                  where: { image_url_id: BigInt(submittedImage.id) },
                  data: {
                    url: submittedImage.url,
                    description: submittedImage.description,
                  },
                });
              }
            } else if (submittedImage.url) { // Create new image (ensure URL is present)
              await tx.listingImageUrl.create({
                data: {
                  listing_business_id: listingIdBigInt,
                  url: submittedImage.url,
                  description: submittedImage.description,
                  is_cover_image: false, // Cover image is handled by ListingBusiness.image_url
                },
              });
            }
          }
        }
        return updatedBusiness;
      }); // End of transaction

       // Fetch the updated listing with all relations for the response
       const finalUpdatedListingWithRelations = await prisma.listingBusiness.findUnique({
        where: { business_id: listingIdBigInt },
        include: {
          reviews: { orderBy: { published_at_date: 'desc' } },
          imageUrls: { orderBy: { image_url_id: 'asc' } }
        }
      });

      res.status(200).json(serializeAdminListing(finalUpdatedListingWithRelations as any));
    } catch (error: any) {
      console.error(`Failed to update listing ${id}:`, error);
      if (error.code === 'P2002' && error.meta?.target?.includes('place_id')) {
        return res.status(409).json({ message: 'Another listing with this Place ID already exists (database constraint).' });
      }
      if (error.code === 'P2002') { // Catch other unique constraint violations
        return res.status(409).json({ message: 'A unique constraint violation occurred while updating.', details: error.meta?.target });
      }
      if (error.code === 'P2025') { // Prisma error for record not found during update
        return res.status(404).json({ message: `Listing with ID ${id} not found for update.` });
      }
      res.status(500).json({ message: `Failed to update listing ${id}`, error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.listingBusiness.delete({
        where: { business_id: listingIdBigInt },
      });
      res.status(204).end(); // No content to send back
    } catch (error: any) {
      console.error(`Failed to delete listing ${id}:`, error);
      if (error.code === 'P2025') { // Prisma error for record not found during delete
        return res.status(404).json({ message: `Listing with ID ${id} not found for deletion.` });
      }
      res.status(500).json({ message: `Failed to delete listing ${id}`, error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
