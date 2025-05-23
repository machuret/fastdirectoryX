import { GetServerSideProps, NextPage } from 'next';
import prisma from '@/lib/prisma';
import { ListingBusiness } from '@prisma/client';
import Link from 'next/link';
import Layout from '@/components/Layout';
import Head from 'next/head';

// Define a type for the props, including serialized listings
// Remember to handle BigInt, Date, Decimal serialization as per memory c7edf72a-34bc-4f99-8c8d-8c9ddfc911d2
interface SerializedListingBusiness {
  listing_business_id: string; // BigInts become strings
  title: string;
  slug: string;
  description: string | null;
  // Add other fields you want to display, ensuring they are serializable
  // For example, if you have a main image or category:
  // mainImageUrl?: string | null;
  // category_name?: string | null;
  createdAt: string; // Dates become strings
  updatedAt: string; // Dates become strings
}

interface FeaturedPageProps {
  featuredListings: SerializedListingBusiness[];
}

// Basic serialization - expand as needed based on what you display
// This should align with the serialization practices mentioned in your memories.
const serializePublicListing = (listing: ListingBusiness): SerializedListingBusiness => {
  return {
    listing_business_id: listing.listing_business_id.toString(),
    title: listing.title,
    slug: listing.slug,
    description: listing.description,
    // mainImageUrl: listing.imageUrls?.[0]?.url || null, // Example if you have imageUrls relation
    // category_name: listing.category_name,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
  };
};

export const getServerSideProps: GetServerSideProps<FeaturedPageProps> = async (context) => {
  try {
    const rawFeaturedListings = await prisma.listingBusiness.findMany({
      where: { 
        isFeatured: true,
        // Add other conditions if necessary, e.g., status: 'PUBLISHED'
      },
      orderBy: {
        // Optional: order by date, title, etc.
        updatedAt: 'desc',
      },
      // Include relations if needed for display, e.g., main image
      // include: { imageUrls: { take: 1, where: { isPrimary: true } } }
    });

    const featuredListings = rawFeaturedListings.map(serializePublicListing);

    return {
      props: { featuredListings },
    };
  } catch (error) {
    console.error('Error fetching featured listings:', error);
    // Return empty or handle error state appropriately
    return { props: { featuredListings: [] } }; 
  }
};

const FeaturedPage: NextPage<FeaturedPageProps> = ({ featuredListings }) => {
  return (
    <Layout>
      <Head>
        <title>Featured Businesses - My Site</title>
        {/* You can add other meta tags here too */}
      </Head>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-12 text-gray-800">Featured Businesses</h1>
        
        {featuredListings.length === 0 ? (
          <p className="text-center text-gray-600 text-xl">No featured businesses at the moment. Check back soon!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredListings.map((listing) => (
              <div key={listing.listing_business_id} className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 ease-in-out">
                {/* Basic Card Structure - Customize as needed */}
                {/* Example: if you add mainImageUrl to serialization
                {listing.mainImageUrl && (
                  <img src={listing.mainImageUrl} alt={listing.title} className="w-full h-48 object-cover" />
                )}
                */}
                <div className="p-6">
                  <h2 className="text-2xl font-semibold mb-2 text-gray-700">{listing.title}</h2>
                  {listing.description && (
                    <p className="text-gray-600 mb-4 truncate">{listing.description}</p>
                  )}
                  <Link href={`/listings/${listing.slug}`} legacyBehavior>
                    <a className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200">
                      View Details
                    </a>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FeaturedPage;
