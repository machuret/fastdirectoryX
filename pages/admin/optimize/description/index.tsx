import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { getSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import prisma from '@/lib/prisma';
import { ListingBusiness, UserRole } from '@prisma/client'; 

// Define a type for the listing data we expect from the API, including new fields
interface ClientListingBusiness extends Omit<ListingBusiness, 'business_id' | 'latitude' | 'longitude' | 'reviews_count' | 'images_count' | 'rank' | 'popular_times_live_percent' | 'createdAt' | 'updatedAt' | 'scraped_at' | 'descriptionLastOptimizedAt' | 'descriptionOptimized'> {
  business_id: string;
  latitude?: string | null;
  longitude?: string | null;
  reviews_count?: number | null;
  images_count?: number | null;
  rank?: number | null;
  popular_times_live_percent?: number | null;
  createdAt: string;
  updatedAt: string;
  scraped_at?: string | null;
  descriptionOptimized: boolean; 
  descriptionLastOptimizedAt?: string | null;
}

interface OptimizationResultItem {
  listingId: string;
  originalDescription?: string | null;
  newDescription?: string;
  status: 'success' | 'error' | 'skipped';
  error?: string;
}

// Helper for client-side date formatting
const ClientSideDateDisplay = ({ dateString }: { dateString?: string | null }) => {
  const [formattedDate, setFormattedDate] = useState('');
  useEffect(() => {
    if (dateString) {
      const dateObj = new Date(dateString);
      if (!isNaN(dateObj.valueOf())) {
        setFormattedDate(dateObj.toLocaleString());
      } else {
        setFormattedDate('Invalid Date');
      }
    } else {
      setFormattedDate('N/A');
    }
  }, [dateString]);
  return <>{formattedDate}</>;
};

export default function OptimizeDescriptionPage({ listings: initialListings, currentUserRole }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [listings, setListings] = useState<ClientListingBusiness[]>(initialListings);
  const [selectedListings, setSelectedListings] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResultItem[]>([]);

  const handleSelectListing = (listingId: string) => {
    setSelectedListings(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(listingId)) {
        newSelected.delete(listingId);
      } else {
        newSelected.add(listingId);
      }
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (selectedListings.size === listings.length) {
      setSelectedListings(new Set());
    } else {
      setSelectedListings(new Set(listings.map(l => l.business_id)));
    }
  };

  const handleOptimize = async () => {
    if (selectedListings.size === 0) {
      console.error('No listings selected: Please select at least one listing to optimize.');
      alert('No listings selected. Please select at least one listing to optimize.');
      return;
    }
    setIsLoading(true);
    setProgressMessage(`Starting optimization for ${selectedListings.size} listings...`);
    setOptimizationResults([]);

    try {
      const response = await fetch('/api/admin/optimize/description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingIds: Array.from(selectedListings) }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Optimization API request failed');
      }
      
      console.log('Optimization Complete:', data.message);
      alert('Optimization Complete: ' + data.message);
      setOptimizationResults(data.results || []);
      
      // Refresh listings data to show updated descriptions and statuses
      // This is a simple refresh, consider more sophisticated state update based on results
      const refreshedListingsResponse = await fetch('/api/admin/listings?basic=true'); // Assuming an endpoint to fetch basic listing data
      if(refreshedListingsResponse.ok) {
        const refreshedListingsData = await refreshedListingsResponse.json();
        const clientListings = (refreshedListingsData.listings || []).map(serializeListingForClient);
        setListings(clientListings);
      }
      setSelectedListings(new Set()); // Clear selection

    } catch (error: any) {
      console.error('Optimization error:', error);
      alert('Optimization Error: ' + error.message);
    } finally {
      setIsLoading(false);
      setProgressMessage('');
    }
  };

  return (
    <AdminLayout title="Optimize Listing Descriptions">
      <div className="mb-4">
        <button 
          onClick={handleOptimize} 
          disabled={isLoading || selectedListings.size === 0}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
        >
          {isLoading ? 'Optimizing...' : `Optimize Selected (${selectedListings.size})`}
        </button>
        {isLoading && progressMessage && <p className="text-sm text-gray-600 mt-2">{progressMessage}</p>}
      </div>

      {optimizationResults.length > 0 && (
        <div className="mb-4 p-4 border rounded bg-gray-50">
          <h2 className="text-lg font-semibold mb-2">Optimization Report:</h2>
          <ul className="list-disc pl-5">
            {optimizationResults.map(res => (
              <li key={res.listingId} className={`text-sm ${res.status === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                Listing ID {res.listingId}: {res.status} {res.error ? `- ${res.error}` : `- New description applied.`}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="w-1/12 px-4 py-2 text-left">
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll}
                  checked={listings.length > 0 && selectedListings.size === listings.length}
                />
              </th>
              <th className="w-3/12 px-4 py-2 text-left">Name</th>
              <th className="w-4/12 px-4 py-2 text-left">Current Description</th>
              <th className="w-2/12 px-4 py-2 text-left">Optimized?</th>
              <th className="w-2/12 px-4 py-2 text-left">Last Optimized</th>
            </tr>
          </thead>
          <tbody>
            {listings.map(listing => (
              <tr key={listing.business_id} className="border-b hover:bg-gray-100">
                <td className="px-4 py-2">
                  <input 
                    type="checkbox" 
                    checked={selectedListings.has(listing.business_id)}
                    onChange={() => handleSelectListing(listing.business_id)}
                  />
                </td>
                <td className="px-4 py-2">{listing.title}</td>
                <td className="px-4 py-2 text-sm truncate max-w-xs" title={listing.description || ''}>{listing.description || 'N/A'}</td>
                <td className="px-4 py-2">
                  {listing.descriptionOptimized ? 
                    <span className='text-green-600 font-semibold'>Yes</span> : 
                    <span className='text-red-600'>No</span>}
                </td>
                <td className="px-4 py-2 text-sm"><ClientSideDateDisplay dateString={listing.descriptionLastOptimizedAt} /></td>
              </tr>
            ))}
            {listings.length === 0 && (
              <tr><td colSpan={5} className="text-center py-4">No listings found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Basic Pagination Placeholder - Implement if needed */}
      {/* <div className="mt-4 flex justify-between items-center">
        <button className="bg-gray-300 p-2 rounded">Previous</button>
        <span>Page X of Y</span>
        <button className="bg-gray-300 p-2 rounded">Next</button>
      </div> */}
    </AdminLayout>
  );
}

// Helper function to serialize Prisma data for client-side, converting BigInt and Date
const serializeListingForClient = (listing: ListingBusiness): ClientListingBusiness => {
  return {
    ...listing,
    business_id: listing.business_id.toString(),
    latitude: listing.latitude?.toString(),
    longitude: listing.longitude?.toString(),
    descriptionOptimized: listing.descriptionOptimized, 
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
    scraped_at: listing.scraped_at?.toISOString(),
    descriptionLastOptimizedAt: listing.descriptionLastOptimizedAt?.toISOString(),
  };
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  // @ts-ignore next-auth types may need adjustment for custom 'role' property
  if (!session || session.user?.role !== UserRole.ADMIN) {
    return {
      redirect: {
        destination: '/login?error=NotAuthorized',
        permanent: false,
      },
    };
  }

  try {
    const listingsFromDb = await prisma.listingBusiness.findMany({
      orderBy: {
        title: 'asc',
      },
    });

    const listings = listingsFromDb.map(serializeListingForClient);

    return {
      props: { 
        listings,
        currentUserRole: session.user?.role 
      },
    };
  } catch (error) {
    console.error("Error fetching listings for optimization page:", error);
    return {
      props: { 
        listings: [],
        currentUserRole: session.user?.role,
        error: "Failed to fetch listings."
      },
    };
  }
};
