import Head from 'next/head';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client'; 
import { ListingBusiness } from '@prisma/client'; 
import { useRouter } from 'next/router'; 
import React, { useState, useEffect } from 'react'; 

const LISTINGS_PER_PAGE = 12;

// Interface for the data each listing card will use
interface ListingCardData {
  business_id: string;
  slug: string | null;
  title: string | null;
  image_url: string | null;
  category_name?: string | null; 
}

// Interface for the props passed to the page component
interface ListingsPageProps {
  listings: ListingCardData[];
  currentPage: number;
  totalPages: number;
  searchQuery?: string; 
  error?: string;
}

// Helper to serialize data
const serializeListingCardData = (listing: any): ListingCardData => {
  const firstCategory = listing.categories?.[0]?.category;
  return {
    business_id: listing.business_id.toString(), 
    slug: listing.slug,
    title: listing.title,
    image_url: listing.image_url,
    category_name: firstCategory?.category_name || null,
  };
};

export const getServerSideProps: GetServerSideProps<ListingsPageProps> = async (context) => {
  const page = parseInt(context.query.page as string) || 1;
  const searchQuery = context.query.q as string || ''; 
  const take = LISTINGS_PER_PAGE;
  const skip = (page - 1) * take;

  const whereClause = searchQuery
    ? {
        OR: [
          { title: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } },
          {
            categories: {
              some: {
                category: {
                  category_name: { contains: searchQuery, mode: Prisma.QueryMode.insensitive },
                },
              },
            },
          },
        ],
      }
    : {
    }; 

  try {
    const [listingsData, totalListings] = await prisma.$transaction([
      prisma.listingBusiness.findMany({
        skip,
        take,
        where: whereClause, 
        select: {
          business_id: true,
          slug: true,
          title: true,
          image_url: true,
          updatedAt: true, 
          categories: { 
            select: {
              category: { 
                select: {
                  category_name: true,
                },
              },
            },
            take: 1, 
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      }),
      prisma.listingBusiness.count({
        where: whereClause, 
      }),
    ]);

    const serializedListings = listingsData.map(serializeListingCardData);
    const totalPages = Math.ceil(totalListings / take);

    return {
      props: {
        listings: serializedListings,
        currentPage: page,
        totalPages,
        searchQuery, 
      },
    };
  } catch (error) {
    console.error('Failed to fetch listings for /listings page:', error);
    return {
      props: {
        listings: [],
        currentPage: 1,
        totalPages: 0,
        searchQuery,
        error: 'Failed to load listings. Please try again later.',
      },
    };
  }
};

const ListingsPage: React.FC<ListingsPageProps> = ({ listings, currentPage, totalPages, searchQuery, error }) => {
  const router = useRouter();
  const [currentSearchTerm, setCurrentSearchTerm] = useState(searchQuery || '');

  useEffect(() => {
    setCurrentSearchTerm(router.query.q as string || '');
  }, [router.query.q]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/listings?q=${encodeURIComponent(currentSearchTerm)}`);
  };

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center">
        <Head><title>Error Loading Listings</title></Head>
        <p className="text-red-500 text-xl">{error}</p>
        <Link href="/" legacyBehavior>
          <a className="text-blue-500 hover:underline mt-4 inline-block">Go to Homepage</a>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Head>
        <title>All Listings - Page {currentPage}</title>
        <meta name="description" content={`Browse all business listings, page ${currentPage} of ${totalPages}.`} />
      </Head>

      <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">Business Listings</h1>
      
      <form onSubmit={handleSearch} className="mb-8 max-w-xl mx-auto">
        <div className="flex items-center border border-gray-300 rounded-md shadow-sm">
          <input 
            type="text"
            value={currentSearchTerm}
            onChange={(e) => setCurrentSearchTerm(e.target.value)}
            placeholder="Search listings by name or category..."
            className="flex-grow p-3 border-none focus:ring-0 rounded-l-md"
          />
          <button 
            type="submit"
            className="bg-primary text-primary-foreground px-6 py-3 rounded-r-md hover:bg-primary/90 transition-colors"
          >
            Search
          </button>
        </div>
        {searchQuery && (
          <div className="mt-2 text-center">
            <p className="text-sm text-gray-600">Showing results for: "{searchQuery}"</p>
            <button 
              onClick={() => {
                setCurrentSearchTerm('');
                router.push('/listings');
              }}
              className="text-xs text-blue-500 hover:underline"
            >
              Clear search
            </button>
          </div>
        )}
      </form>

      {listings.length === 0 ? (
        searchQuery 
          ? <p className="text-center text-gray-600 text-xl">No listings found for "{searchQuery}".</p>
          : <p className="text-center text-gray-600 text-xl">No listings found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {listings.map((listing) => (
            <div key={listing.business_id} className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105">
              <Link href={`/listings/${listing.slug}`} legacyBehavior>
                <a className="block">
                  <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                    {listing.image_url ? (
                      <img 
                        src={listing.image_url} 
                        alt={`Image of ${listing.title}`}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x225.png?text=No+Image'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-300">
                        <span className="text-gray-500">No Image Available</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h2 className="text-xl font-semibold text-gray-800 truncate" title={listing.title ?? undefined}>{listing.title || 'Untitled Listing'}</h2>
                    {listing.category_name && (
                      <p className="text-sm text-gray-600 mt-1 truncate">{listing.category_name}</p>
                    )}
                  </div>
                </a>
              </Link>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-12 flex items-center justify-center space-x-4" aria-label="Pagination">
          <Link href={`/listings?page=${currentPage - 1}${searchQuery ? '&q=' + encodeURIComponent(searchQuery) : ''}`} legacyBehavior>
            <a 
              className={`px-4 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 ${
                currentPage <= 1 ? 'text-gray-400 bg-gray-100 cursor-not-allowed pointer-events-none' : 'text-gray-700 bg-white'
              }`}
              aria-disabled={currentPage <= 1}
            >
              Previous
            </a>
          </Link>
          
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>

          <Link href={`/listings?page=${currentPage + 1}${searchQuery ? '&q=' + encodeURIComponent(searchQuery) : ''}`} legacyBehavior>
            <a 
              className={`px-4 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 ${
                currentPage >= totalPages ? 'text-gray-400 bg-gray-100 cursor-not-allowed pointer-events-none' : 'text-gray-700 bg-white'
              }`}
              aria-disabled={currentPage >= totalPages}
            >
              Next
            </a>
          </Link>
        </nav>
      )}
    </div>
  );
};

export default ListingsPage;
