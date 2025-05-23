import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { ListingBusiness as PrismaListingBusiness } from '@prisma/client'; 
import type { GetServerSideProps } from 'next';
import {
  List, Plus, FileEdit, Trash2, Sparkles, Zap, CheckCircle2, XCircle, Loader2, AlertTriangle, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox'; // User needs to ensure this component is added via Shadcn CLI
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout'; 
import { useAdminHeader, AdminHeaderProvider } from '@/components/AdminHeaderContext'; 
import type { NextPageWithLayout, MyAppPageProps } from '@/pages/_app'; // Import shared types

// Define a client-side version of ListingBusiness
interface ClientListingBusiness extends Omit<PrismaListingBusiness, 
  'listing_business_id' | // PK: Int, transformed to business_id: string
  'business_id' |         // FK: Int, to Business model, not directly used in this list view's primary data structure
  'user_id' |             // FK: Int?
  'latitude' |            // Type: Decimal?
  'longitude' |           // Type: Decimal?
  'createdAt' |           // Type: DateTime
  'updatedAt' |           // Type: DateTime
  'descriptionLastOptimizedAt' | // Type: DateTime?
  'faq' |                 // Type: Json?
  'faqLastGeneratedAt' |  // Type: DateTime?
  'scraped_at' |          // Type: DateTime?
  // Omit all relation fields as they are not simple types for the list
  'categories' | 'peopleAlsoSearch' | 'businessReviewTags' | 'businessAttributes' |
  'reviewsDistribution' | 'businessOrderLinks' | 'businessOpeningHours' | 
  'listingImages' | 'listingReviews' | 'listingVideos' | 'listingPosts' | 
  'owner' | 'business'
  // Omit other fields not directly used or transformed if they cause type issues
> {
  business_id: string; // Transformed from listing_business_id
  title: string;
  slug: string; 
  phone: string | null;
  address: string | null;
  website: string | null;
  description: string | null;
  descriptionOptimized: boolean; 
  reviews_count: number | null;
  images_count: number | null;
  // Add other string/number/boolean fields from PrismaListingBusiness if they are directly used and their types match
  price_range: string | null;
  category_name: string | null;
  neighborhood: string | null;
  street: string | null;
  city: string | null;
  postal_code: string | null;
  state: string | null;
  country_code: string | null;
  place_id: string | null;
  metaTitle: string | null;
  isFeatured: boolean; 
  temporarily_closed: boolean | null;
  permanently_closed: boolean | null;
  operational_status: string | null;
  // ... any other simple fields returned by the API and used by the list
}

interface OptimizeResponse {
  message: string;
  originalDescription: string;
  optimizedDescription: string;
  descriptionOptimized?: boolean; 
}

const ListingsAdminPageContent = () => {
  const { setPageSpecificHeaderElements } = useAdminHeader();

  useEffect(() => {
    setPageSpecificHeaderElements({
      title: 'Business Listings',
      icon: <List />,
      description: 'Manage all business listings in the system.',
      actionButtons: (
        <Link href="/admin/listings/new" passHref legacyBehavior>
          <Button asChild>
            <a><Plus className="mr-2 h-4 w-4" /> New Listing</a>
          </Button>
        </Link>
      )
    });
  }, [setPageSpecificHeaderElements]);

  const [listings, setListings] = useState<ClientListingBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]); 
  const [optimizingId, setOptimizingId] = useState<string | null>(null);
  const [isMassOptimizing, setIsMassOptimizing] = useState(false);
  const [optimizeMessage, setOptimizeMessage] = useState<string | null>(null);
  const [selectAll, setSelectAll] = useState(false);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/listings');
      if (!response.ok) {
        throw new Error(`Failed to fetch listings: ${response.statusText}`);
      }
      const data: ClientListingBusiness[] = await response.json(); // API returns business_id as string
      setListings(data);
      setSelectedIds([]); 
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while fetching listings.');
      }
      console.error(err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleDelete = async (id: string) => { 
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        const response = await fetch(`/api/admin/listings/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(`Failed to delete listing: ${errorData.message || response.statusText}`);
        }
        fetchListings(); 
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
          alert(`Error deleting listing: ${err.message}`);
        } else {
          setError('An unknown error occurred while deleting the listing.');
          alert('An unknown error occurred while deleting the listing.');
        }
        console.error(err);
      }
    }
  };

  const handleOptimizeDescription = async (businessId: string) => {
    setOptimizingId(businessId);
    setOptimizeMessage(`Optimizing description for ${businessId}...`);
    setError(null); // Clear previous general errors
    try {
      const response = await fetch(`/api/admin/listings/${businessId}/optimize-description`, {
        method: 'POST',
      });
      const result: OptimizeResponse | { message: string } = await response.json();

      if (!response.ok) {
        throw new Error((result as { message: string }).message || `Failed to optimize: ${response.statusText}`);
      }
      
      const successResult = result as OptimizeResponse;
      setOptimizeMessage(successResult.message || 'Optimization successful!');
      
      // Update the specific listing's description and optimization status in the local state
      setListings(prevListings =>
        prevListings.map(listing =>
          listing.business_id === businessId
            ? { 
                ...listing, 
                description: successResult.optimizedDescription, 
                descriptionOptimized: successResult.descriptionOptimized ?? true 
              }
            : listing
        )
      );

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown optimization error occurred';
      setError(errorMessage); // Set general error for optimization specific issues
      setOptimizeMessage(null); // Clear optimization specific message on error
    } finally {
      setOptimizingId(null);
      // Optionally clear the success/error message after a few seconds
      setTimeout(() => {
        setOptimizeMessage(null);
        // setError(null); // Optionally clear general error too if it was set by optimization
      }, 7000); // Increased timeout for better readability
    }
  };

  const handleMassOptimize = async () => {
    if (selectedIds.length === 0) {
      alert('Please select listings to optimize.');
      return;
    }
    setIsMassOptimizing(true);
    setOptimizeMessage(`Optimizing ${selectedIds.length} descriptions...`);
    setError(null);
    let successCount = 0;
    let errorCount = 0;

    for (const id of selectedIds) {
      try {
        // Re-use single optimization logic which updates state internally
        const response = await fetch(`/api/admin/listings/${id}/optimize-description`, {
          method: 'POST',
        });
        const result: OptimizeResponse | { message: string } = await response.json();
        if (!response.ok) {
          console.error(`Failed to optimize ${id}:`, (result as { message: string }).message || `Status ${response.statusText}`);
          errorCount++;
        } else {
          const successResult = result as OptimizeResponse;
          // Update listing in local state (critical for UI refresh)
          setListings(prevListings =>
            prevListings.map(listing =>
              listing.business_id === id
                ? { 
                    ...listing, 
                    description: successResult.optimizedDescription, 
                    descriptionOptimized: successResult.descriptionOptimized ?? true 
                  }
                : listing
            )
          );
          successCount++;
        }
      } catch (err) {
        console.error(`Error during mass optimization for ${id}:`, err);
        errorCount++;
      }
    }
    setIsMassOptimizing(false);
    setOptimizeMessage(`Mass optimization complete. Successful: ${successCount}, Failed: ${errorCount}.`);
    setSelectedIds([]); // Clear selection after operation
    // Optionally clear message after a few seconds
    setTimeout(() => setOptimizeMessage(null), 7000);
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prevSelectedIds => 
      prevSelectedIds.includes(id) 
        ? prevSelectedIds.filter(sid => sid !== id)
        : [...prevSelectedIds, id]
    );
    setSelectAll(false); // If individual row is toggled, selectAll cannot be true unless all are now selected
  };

  const handleSelectAllRows = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(listings.map(l => l.business_id));
    }
    setSelectAll(!selectAll);
  };

  useEffect(() => {
    if (listings.length > 0 && selectedIds.length === listings.length) {
      setSelectAll(true);
    } else if (selectedIds.length === 0) { // Ensure selectAll is false if no items are selected
      setSelectAll(false);
    }
    // If some but not all are selected, selectAll should also be false, which is handled by the individual select logic.
  }, [selectedIds, listings]);

  const actionButtons = (
    <div className="flex gap-2">
      <Button 
        onClick={handleMassOptimize}
        disabled={selectedIds.length === 0 || isMassOptimizing || loading}
        variant="outline"
      >
        {isMassOptimizing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Zap className="mr-2 h-4 w-4" />
        )}
        Optimize Selected ({selectedIds.length})
      </Button>
      <Link href="/admin/listings/new" passHref legacyBehavior>
        <Button asChild>
          <a><Plus className="mr-2 h-4 w-4" /> Create New Listing</a>
        </Button>
      </Link>
    </div>
  );

  if (loading) return <div className="flex items-center justify-center h-full text-gray-900"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading listings...</span></div>;
  if (error) return <div className="text-red-600 bg-red-100 border border-red-400 p-4 rounded-md"><AlertTriangle className="inline h-5 w-5 mr-2" />Error: {error}</div>;

  return (
    <>
      <Card className="text-gray-900 shadow-lg">
        <CardHeader>
          <CardTitle>All Listings ({listings.length})</CardTitle>
          <CardDescription>
            Select listings to perform bulk actions or manage them individually.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {listings.length === 0 && !loading && !error && (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No listings found.</p>
              <Button asChild className="mt-4">
                <Link href="/admin/listings/new"><Plus className="mr-2 h-4 w-4" />Create First Listing</Link>
              </Button>
            </div>
          )}

          {listings.length > 0 && (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      <Checkbox 
                        id="selectAllRows"
                        checked={selectAll || (listings.length > 0 && selectedIds.length === listings.length)}
                        onCheckedChange={handleSelectAllRows}
                        aria-label="Select all rows"
                      />
                    </th>
                    {['ID', 'Title', 'Phone', 'Address', 'Website', 'Description', 'Optimized?', 'Actions'].map(header => (
                      <th key={header} className="px-4 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-border">
                  {listings.map((listing) => (
                    <tr key={listing.business_id} className={`hover:bg-muted/10 transition-colors ${selectedIds.includes(listing.business_id) ? 'bg-primary/5' : ''}`}>
                      <td className="px-4 py-3 text-gray-900">
                        <Checkbox 
                          id={`select-${listing.business_id}`}
                          checked={selectedIds.includes(listing.business_id)}
                          onCheckedChange={() => handleSelectRow(listing.business_id)}
                          aria-labelledby={`label-title-${listing.business_id}`}
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{listing.business_id}</td>
                      <td id={`label-title-${listing.business_id}`} className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Link href={`/admin/listings/edit/${listing.business_id}`} legacyBehavior>
                          <a className="hover:text-primary hover:underline">{listing.title}</a>
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{listing.phone || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate" title={listing.address || ''}>{listing.address || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {listing.website ? (
                          <a href={listing.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline truncate max-w-[150px] inline-block">
                            {listing.website}
                          </a>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-sm">
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="truncate block cursor-default">
                                {listing.description ? listing.description.substring(0, 60) + (listing.description.length > 60 ? '...' : '') : '-'}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-md bg-background border border-border shadow-md text-foreground p-2 rounded-md text-xs">
                              <p>{listing.description || 'No description'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900">
                        <TooltipProvider delayDuration={100}>
                          {listing.descriptionOptimized && (
                            <Tooltip>
                              <TooltipTrigger asChild><div className="flex justify-center"><CheckCircle2 className="h-5 w-5 text-green-500" /></div></TooltipTrigger>
                              <TooltipContent side="top"><p>Optimized</p></TooltipContent>
                            </Tooltip>
                          )}
                          {!listing.descriptionOptimized && (
                            <Tooltip>
                              <TooltipTrigger asChild><div className="flex justify-center"><XCircle className="h-5 w-5 text-red-500" /></div></TooltipTrigger>
                              <TooltipContent side="top"><p>Not Optimized</p></TooltipContent>
                            </Tooltip>
                          )}
                        </TooltipProvider>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-1 text-center text-gray-900">
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={`/admin/listings/edit/${listing.business_id}`}><FileEdit className="h-4 w-4" /></Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top"><p>Edit</p></TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleOptimizeDescription(listing.business_id)}
                                disabled={optimizingId === listing.business_id || isMassOptimizing}
                                className="hover:text-primary"
                              >
                                {optimizingId === listing.business_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top"><p>Optimize Description</p></TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDelete(listing.business_id)}
                                disabled={isMassOptimizing} // Maybe also disable if optimizing this specific one?
                                className="hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top"><p>Delete</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

const ListingsAdminPage: NextPageWithLayout<MyAppPageProps> = (props) => {
  // Props from getServerSideProps (if any) or _app.tsx can be accessed here
  // For this page, ListingsAdminPageContent handles its own data fetching client-side.
  return <ListingsAdminPageContent />;
};

// Assign the getLayout function to the page component
ListingsAdminPage.getLayout = function getLayout(page: React.ReactElement, pageProps: MyAppPageProps) {
  const initialBaseElements = {
    title: pageProps.pageTitle || 'Business Listings',
    description: pageProps.pageDescription || 'Manage all business listings in the system.',
    icon: pageProps.pageIconName ? <List /> : <List />, // Assuming List icon for now
    actionButtons: pageProps.actionButtons || (
      <Link href="/admin/listings/new" passHref legacyBehavior>
        <Button asChild>
          <a><Plus className="mr-2 h-4 w-4" /> New Listing</a>
        </Button>
      </Link>
    ),
  };

  return (
    <AdminHeaderProvider initialBaseElements={initialBaseElements}>
      <AdminLayout
        pageTitle={initialBaseElements.title}
        // Pass other elements if AdminLayout uses them directly
      >
        {page}
      </AdminLayout>
    </AdminHeaderProvider>
  );
};

// getServerSideProps remains unchanged if it exists and is needed
// For this example, we assume it's not strictly necessary for the layout fix
// or that it primarily fetches data for ListingsAdminPageContent.
/*
export const getServerSideProps: GetServerSideProps = async (context) => {
  // ... your existing getServerSideProps logic ...
  return {
    props: {
      // initialListings: serializedListings, // Example
      // pageTitle: 'Business Listings', // Can be passed to getLayout
    },
  };
};
*/

export default ListingsAdminPage;
