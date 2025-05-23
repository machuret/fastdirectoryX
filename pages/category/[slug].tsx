import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import prisma from '@/lib/prisma';
import { ListingBusiness, ListingCategory, ListingBusinessCategory, ListingImageUrl } from '@prisma/client';
import Layout from '@/components/Layout'; 
import type { NextPageWithLayout, MyAppPageProps } from '@/pages/_app'; 

// Simplified SerializedListing for this page - adjust as needed
interface SerializedListingCard {
  business_id: string;
  title: string;
  slug: string | null;
  address: string | null;
  displayImageUrl: string | null;
  category_name: string | null; // Primary category name
}

interface CategoryPageProps {
  category: {
    category_id: number;
    category_name: string;
    slug: string;
    description?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
  } | null;
  listings: SerializedListingCard[];
  error?: string;
}

const serializeListingForCategoryPage = (
  listing: ListingBusiness & { 
    imageUrls?: ListingImageUrl[], 
    categories: (ListingBusinessCategory & { category: ListingCategory })[] 
  }
): SerializedListingCard => {
  let displayImageUrl = listing.image_url || null;
  if (!displayImageUrl && listing.imageUrls && listing.imageUrls.length > 0) {
    displayImageUrl = listing.imageUrls[0]?.url || null;
  }

  const firstCategoryName = listing.categories && listing.categories.length > 0 
    ? listing.categories[0].category.category_name 
    : listing.category_name; // Fallback to the direct field if available

  return {
    business_id: listing.business_id.toString(),
    title: listing.title,
    slug: listing.slug,
    address: listing.address,
    displayImageUrl: displayImageUrl,
    category_name: firstCategoryName,
  };
};

const CategoryPage: NextPageWithLayout<CategoryPageProps> = ({ category, listings, error }) => {
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-500">Error</h1>
        <p>{error}</p>
        <Link href="/" legacyBehavior><a>Go back home</a></Link>
      </div>
    );
  }

  if (!category) {
    return (
      <>
        <Head>
          <title>Category Not Found</title>
        </Head>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Category Not Found</h1>
          <p className="mb-8">The category you are looking for does not exist.</p>
          <Link href="/listings" legacyBehavior>
            <a className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              Browse All Listings
            </a>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{category.seoTitle || `${category.category_name} Listings`} | Your Site Name</title>
        <meta name="description" content={category.seoDescription || `Find the best ${category.category_name} in your area.`} />
      </Head>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-2 text-center font-raleway tracking-tight text-text-primary">{category.category_name}</h1>
        {category.description && <p className="text-lg text-text-secondary text-center mb-10">{category.description}</p>}

        {listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {listings.map((listing) => (
              <div key={listing.business_id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card text-card-foreground rounded-xl">
                {listing.displayImageUrl ? (
                  <div className="relative w-full aspect-[16/9]">
                    <Image 
                      src={listing.displayImageUrl} 
                      alt={listing.title || 'Listing image'}
                      layout="fill"
                      objectFit="cover"
                      className="transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-[16/9] bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground text-sm">No Image</span>
                  </div>
                )}
                <div className="p-5 flex-grow">
                  {listing.category_name && (
                     <div className="mb-2 font-raleway text-sm text-gray-600">{listing.category_name}</div>
                  )}
                  <h3 className="text-xl font-semibold mb-2 hover:text-primary transition-colors">
                    <Link href={`/listings/${listing.slug || listing.business_id}`} legacyBehavior>
                      <a>{listing.title || 'Unnamed Listing'}</a>
                    </Link>
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {listing.address || 'Address not available'}
                  </p>
                </div>
                <div className="p-5 pt-0 border-t border-border mt-auto">
                  <Link href={`/listings/${listing.slug || listing.business_id}`} legacyBehavior>
                    <a className="text-primary hover:underline mt-4 inline-block font-semibold">View Details &rarr;</a>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-xl text-muted-foreground py-10">No listings found in this category yet.</p>
        )}
      </div>
    </>
  );
};

CategoryPage.getLayout = function getLayout(page: React.ReactElement, pageProps: MyAppPageProps, headerMenuItems, footerMenuItems) {
  return (
    <Layout headerMenuItems={headerMenuItems} footerMenuItems={footerMenuItems}>
      {page}
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params || {};

  if (typeof slug !== 'string') {
    return { notFound: true };
  }

  try {
    const category = await prisma.listingCategory.findUnique({
      where: { slug },
      select: {
        category_id: true,
        category_name: true,
        slug: true,
        description: true,
        seoTitle: true,
        seoDescription: true,
      }
    });

    if (!category) {
      return { notFound: true };
    }

    const listingsData = await prisma.listingBusiness.findMany({
      where: {
        categories: {
          some: {
            category: {
              slug: slug,
            },
          },
        },
        permanently_closed: false,
        temporarily_closed: false,
      },
      include: {
        imageUrls: { orderBy: [{ image_url_id: 'asc' }], take: 1 }, // For displayImageUrl
        categories: { // To get the primary category name for the card
          include: {
            category: {
              select: { category_name: true, slug: true }
            }
          }
        }
      },
      orderBy: {
        isFeatured: 'desc', // Optional: show featured first
        // Add other sorting criteria if needed, e.g., reviews_count: 'desc'
      },
      take: 50, // Add pagination later if needed
    });

    const listings = listingsData.map(listing => 
      serializeListingForCategoryPage(listing as any) // Cast as any to satisfy complex type, ensure data matches
    );

    return {
      props: {
        category,
        listings,
      },
    };
  } catch (e) {
    console.error(`Error fetching category page for slug ${slug}:`, e);
    return {
      props: {
        category: null,
        listings: [],
        error: 'Could not load category information.',
      },
    };
  }
};

export default CategoryPage;