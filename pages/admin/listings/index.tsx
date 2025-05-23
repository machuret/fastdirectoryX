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
/**
 * Represents the structure of a business listing for client-side display and interaction.
 * This interface is derived from `PrismaListingBusiness` but omits complex types (like Decimal, DateTime, Json),
 * Prisma-specific relation fields, and transforms `listing_business_id` (Int) to `business_id` (string).
 * It includes fields directly used in the listing table/cards and for client-side operations.
 */
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
  /** Transformed unique identifier for the business listing (from `listing_business_id`). */
  business_id: string; // Transformed from listing_business_id
  /** The title or name of the business listing. */
  title: string;
  /** The URL slug for the business listing. */
  slug: string; 
  /** The phone number of the business. */
  phone: string | null;
  /** The address of the business. */
  address: string | null;
  /** The website URL of the business. */
  website: string | null;
  /** The description of the business. */
  description: string | null;
  /** Flag indicating if the description has been AI-optimized. */
  descriptionOptimized: boolean; 
  /** The count of reviews for the business. */
  reviews_count: number | null;
  /** The count of images for the business. */
  images_count: number | null;
  // Add other string/number/boolean fields from PrismaListingBusiness if they are directly used and their types match
  /** The price range of the business (e.g., $, $$, $$$). */
  price_range: string | null;
  /** The primary category name of the business. */
  category_name: string | null;
  /** The neighborhood where the business is located. */
  neighborhood: string | null;
  /** The street address of the business. */
  street: string | null;
  /** The city where the business is located. */
  city: string | null;
  /** The postal code of the business. */
  postal_code: string | null;
  /** The state or region of the business. */
  state: string | null;
  /** The country code of the business. */
  country_code: string | null;
  /** The Google Place ID or similar identifier. */
  place_id: string | null;
  /** The meta title for SEO purposes. */
  metaTitle: string | null;
  /** Flag indicating if the listing is marked as featured. */
  isFeatured: boolean; 
  /** Flag indicating if the business is temporarily closed. */
  temporarily_closed: boolean | null;
  /** Flag indicating if the business is permanently closed. */
  permanently_closed: boolean | null;
  /** The current operational status of the business (e.g., OPERATIONAL, CLOSED_TEMPORARILY). */
  operational_status: string | null;
  // ... any other simple fields returned by the API and used by the list
}

/**
 * Interface for the expected response from the description optimization API endpoint.
 */
interface OptimizeResponse {
  /** A message indicating the outcome of the optimization. */
  message: string;
  /** The original description before optimization. */
  originalDescription: string;
  /** The new, optimized description. */
  optimizedDescription: string;
  /** Optional flag indicating if the description was successfully marked as optimized. */
  descriptionOptimized?: boolean; 
}

/**
 * Content component for the Business Listings admin page.
 * Handles fetching, displaying, and managing business listings, including operations like
 * deletion, description optimization (single and mass), and featuring.
 * Uses `useAdminHeader` to dynamically set the page header.
 */
const ListingsAdminPageContent = () => {
  const { setPageSpecificHeaderElements } = useAdminHeader();

  const [listings, setListings] = useState<ClientListingBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]); 
  const [optimizingId, setOptimizingId] = useState<string | null>(null);
  const [isMassOptimizing, setIsMassOptimizing] = useState(false);
  const [optimizeMessage, setOptimizeMessage] = useState<string | null>(null);
  const [selectAll, setSelectAll] = useState(false);

  const handleMassOptimizeDescriptions = async () => {
    if (selectedIds.length === 0) {
      setOptimizeMessage('No listings selected for optimization.');
      return;
    }

    setIsMassOptimizing(true);
    setOptimizeMessage('Starting mass optimization...');
    setError(null);

    try {
      const response = await fetch('/api/admin/listings/mass-optimize-descriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to mass optimize descriptions: ${response.statusText}`);
      }

      setOptimizeMessage(result.message || `Successfully processed ${result.successCount} listings, ${result.failureCount} failed.`);
      // Refresh listings to show updated status
      fetchListings(); 
      setSelectedIds([]); // Clear selection after operation
      setSelectAll(false);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during mass optimization.';
      setError(errorMessage);
      setOptimizeMessage(null); // Clear optimization message on error
      console.error('Mass optimization error:', err);
    } finally {
      setIsMassOptimizing(false);
    }
  };

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/listings');
      if (!response.ok) {
        throw new Error(`Failed to fetch listings: ${response.statusText}`);
      }
      const data: ClientListingBusiness[] = await response.json(); 
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
    setPageSpecificHeaderElements({
      title: 'Business Listings',
      icon: <List />,
      description: 'Manage all business listings in the system.',
      actionButtons: (
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleMassOptimizeDescriptions}
            disabled={selectedIds.length === 0 || isMassOptimizing}
            variant="outline"
          >
            {isMassOptimizing ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Optimizing...</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" /> Mass Optimize ({selectedIds.length})</>
            )}
          </Button>
          <Link href="/admin/listings/new" passHref legacyBehavior>
            <Button asChild>
              <a><Plus className="mr-2 h-4 w-4" /> New Listing</a>
            </Button>
          </Link>
        </div>
      )
    });
  }, [setPageSpecificHeaderElements, selectedIds, isMassOptimizing]);

  /**
   * Fetches business listings from the API (`/api/admin/listings`).
   * Updates loading, error, and listings states.
   * Resets selected IDs upon fetching new data.
   */
  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  /**
   * Handles the deletion of a single business listing.
   * Prompts for confirmation, sends a DELETE request to `/api/admin/listings/:id`,
   * and refetches listings on success or displays an error.
   * @param {string} id - The `business_id` of the listing to delete.
   */
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

  /**
   * Handles the AI-powered optimization of a single listing's description.
   * Sends a POST request to `/api/admin/listings/:businessId/optimize-description`.
   * Updates the local listing state with the optimized description and status.
   * Manages loading indicators and feedback messages.
   * @param {string} businessId - The `business_id` of the listing to optimize.
   */
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

  /**
   * Handles mass optimization of descriptions for all selected listings.
   * Iterates through `selectedIds` and calls `handleOptimizeDescription` for each.
   * Provides progress feedback and a summary of results.
   */
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

  /**
   * Handles the selection of a single listing for batch operations.
   * Toggles the selection state of the listing and updates the 'select all' checkbox state.
   * @param {string} id - The `business_id` of the listing to select or deselect.
   */
  const handleSelectRow = (id: string) => {
    setSelectedIds(prevSelectedIds => 
      prevSelectedIds.includes(id) 
        ? prevSelectedIds.filter(sid => sid !== id)
        : [...prevSelectedIds, id]
    );
    setSelectAll(false); // If individual row is toggled, selectAll cannot be true unless all are now selected
  };

  /**
   * Handles the selection of all listings for batch operations.
   * Toggles the selection state of all listings and updates the 'select all' checkbox state.
   */
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

  const renderStatusMessages = () => (
    <>
      {error && (
        <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive border border-destructive/30 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" /> {error}
        </div>
      )}
      {optimizeMessage && !error && (
        <div className="mb-4 p-3 rounded-md bg-blue-500/10 text-blue-700 border border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/40 flex items-center">
          <Info className="h-5 w-5 mr-2" /> {optimizeMessage}
        </div>
      )}
    </>
  );

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
      {renderStatusMessages()}
    </>
  );
};

/**
 * Page component for the Business Listings admin page.
 * Wraps the `ListingsAdminPageContent` component with the admin layout.
 */
const ListingsAdminPage: NextPageWithLayout<MyAppPageProps> = (props) => {
  // Props from getServerSideProps (if any) or _app.tsx can be accessed here
  // For this page, ListingsAdminPageContent handles its own data fetching client-side.
  return <ListingsAdminPageContent />;
};

/**
 * Defines a per-page layout for the Listings Admin Page.
 * Wraps the page content with `AdminHeaderProvider` and `AdminLayout`.
 * This pattern allows for page-specific layout configurations while maintaining a consistent admin shell.
 * @param {React.ReactElement} page - The page component itself.
 * @param {MyAppPageProps} pageProps - The props passed to the page component.
 * @returns {JSX.Element} The page component wrapped with the admin layout and header provider.
 */
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
