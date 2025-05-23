import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { Prisma, ListingBusiness, ListingCategory, ListingBusinessCategory } from '@prisma/client';

// Define the structure for the publicly serialized listing
interface PublicSerializedListing {
  business_id: string;
  title: string;
  slug: string;
  category_name?: string | null;
  address?: string | null;
  city?: string | null;
  image_url?: string | null; // A primary image
  // Add other fields you want to expose publicly
  description?: string | null;
  isFeatured?: boolean;
  createdAt?: string | null;
}

// Type for ListingBusiness with its relations for serialization
type ListingBusinessWithRelations = ListingBusiness & {
  categories?: (ListingBusinessCategory & {
    category: ListingCategory;
  })[];
};

// Basic serializer
function serializePublicListing(listing: ListingBusinessWithRelations): PublicSerializedListing {
  const firstCategoryRelation = listing.categories?.[0];
  return {
    business_id: listing.business_id.toString(),
    title: listing.title,
    slug: listing.slug,
    category_name: firstCategoryRelation ? firstCategoryRelation.category.category_name : null,
    address: listing.address,
    city: listing.city,
    image_url: listing.image_url, // Assuming this is a direct field or you'll derive it
    description: listing.description, // Keep it simple for now
    isFeatured: listing.isFeatured,
    createdAt: listing.createdAt?.toISOString() || null,
  };
}

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { is_featured, sort, limit: queryLimit, page: queryPage } = req.query;

    const whereClause: Prisma.ListingBusinessWhereInput = {};
    if (is_featured === 'true') {
      whereClause.isFeatured = true;
    } else if (is_featured === 'false') {
      // Explicitly fetch non-featured if needed, otherwise omit for all
      whereClause.isFeatured = false;
    }
    // Add other potential public filters, e.g., category, location, status (active/published)
    // whereClause.status = 'PUBLISHED'; // Example: only show published listings

    const orderByClause: Prisma.ListingBusinessOrderByWithRelationInput = {};
    if (sort === 'newest') {
      orderByClause.createdAt = 'desc';
    } else if (sort === 'oldest') {
      orderByClause.createdAt = 'asc';
    } else {
      // Default sort if needed, e.g., by title or featured status first then date
      orderByClause.updatedAt = 'desc'; 
    }

    const limit = queryLimit ? parseInt(queryLimit as string, 10) : 10; // Default limit
    const page = queryPage ? parseInt(queryPage as string, 10) : 1;
    const skip = (page - 1) * limit;

    try {
      const listings = await prisma.listingBusiness.findMany({
        where: whereClause,
        orderBy: orderByClause,
        take: limit,
        skip: skip,
        include: {
          categories: { 
            include: {
              category: true 
            }
          }
          // imageUrls: { take: 1, where: { is_primary: true } }, // Example: if you want a primary image
        },
      });

      const totalListings = await prisma.listingBusiness.count({ where: whereClause });

      const serializedListings = listings.map(listing => 
        serializePublicListing(listing as ListingBusinessWithRelations)
      );
      
      res.status(200).json({
        data: serializedListings,
        pagination: {
          total: totalListings,
          limit,
          page,
          totalPages: Math.ceil(totalListings / limit),
        }
      });
    } catch (e) {
      console.error('Error fetching public listings:', e);
      res.status(500).json({ message: 'Error fetching listings', error: (e instanceof Error) ? e.message : 'Unknown error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
