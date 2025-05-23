import AdminLayout from '@/components/admin/AdminLayout';
import { useState, useEffect } from 'react'; 
import { ListingBusiness } from '@prisma/client';
import { AdminHeaderProvider, useAdminHeader } from '@/components/AdminHeaderContext'; 
import { Star, Loader2, AlertCircle, CheckCircle } from 'lucide-react'; 
import { Button } from '@/components/ui/button'; 
import { Checkbox } from '@/components/ui/checkbox'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; 
import type { NextPageWithLayout, MyAppPageProps } from '@/pages/_app'; 

interface AdminListingItem extends Omit<ListingBusiness, 'business_id' | 'isFeatured' | 'title'> { 
  business_id: string; 
  title: string;
  isFeatured: boolean;
}

const AdminFeaturedPageContent = () => { 
  const { setPageSpecificHeaderElements } = useAdminHeader();

  useEffect(() => {
    setPageSpecificHeaderElements({
      title: 'Manage Featured Listings',
      icon: <Star />,
      description: 'Select which listings appear in featured sections of your site.',
    });
  }, [setPageSpecificHeaderElements]);

  const [listings, setListings] = useState<AdminListingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [selectedListings, setSelectedListings] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchListings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/admin/listings'); 
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch listings');
        }
        const data: AdminListingItem[] = await response.json();
        setListings(data);
        
        const initialSelections: Record<string, boolean> = {};
        data.forEach(listing => {
          initialSelections[listing.business_id] = listing.isFeatured;
        });
        setSelectedListings(initialSelections);

      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, []);

  const handleToggleFeatured = (listingId: string, currentIsFeatured: boolean) => {
    setSelectedListings(prev => ({
      ...prev,
      [listingId]: !currentIsFeatured,
    }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setError(null);
    setSubmitMessage(null);
    let successCount = 0;
    let errorCount = 0;
    const operations = [];

    for (const listing of listings) {
      const listingIdStr = listing.business_id;
      const newIsFeaturedState = selectedListings[listingIdStr];
      // Only make an API call if the selected state is different from the original isFeatured state
      if (newIsFeaturedState !== undefined && newIsFeaturedState !== listing.isFeatured) {
        operations.push(
          fetch(`/api/admin/listings/${listing.business_id}`, { 
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isFeatured: newIsFeaturedState }), 
            credentials: 'include', 
          })
          .then(async res => {
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({ message: 'Failed to update feature status' }));
              throw new Error(errorData.message || `Error updating ${listing.title}`);
            }
            successCount++;
            // Optionally, update the local listing.isFeatured state here if not re-fetching all
            // For simplicity, we are re-fetching all below.
            return res.json(); 
          })
          .catch(err => {
            console.error(`Failed to update ${listing.title}:`, err);
            errorCount++;
            throw err; 
          })
        );
      }
    }

    if (operations.length === 0) {
      setSubmitMessage('No changes to save.');
      setIsSubmitting(false);
      return;
    }

    try {
      const results = await Promise.allSettled(operations);
      
      results.forEach(result => {
        if (result.status === 'rejected') {
        }
      });

      if (errorCount > 0) {
        setError(`${errorCount} ${errorCount === 1 ? 'operation' : 'operations'} failed. ${successCount} succeeded.`);
      } else {
        setSubmitMessage(`${successCount} ${successCount === 1 ? 'listing' : 'listings'} updated successfully!`);
      }

      const freshResponse = await fetch('/api/admin/listings');
      if (!freshResponse.ok) throw new Error('Failed to refresh listings after save.');
      const freshData: AdminListingItem[] = await freshResponse.json();
      setListings(freshData);
      const newSelections: Record<string, boolean> = {};
      freshData.forEach(listing => {
        newSelections[listing.business_id] = listing.isFeatured;
      });
      setSelectedListings(newSelections);

    } catch (err) {
      const finalErrorMessage = err instanceof Error ? err.message : 'An unknown error occurred during the save process.';
      setError(finalErrorMessage);
      console.error('Final save/refresh error:', finalErrorMessage);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        setSubmitMessage(null);
        setError(null);
      }, 7000);
    }
  };

  if (isLoading) return <div className="p-4 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading listings...</div>;
  if (error && !isSubmitting && listings.length === 0) return <div className="p-4 text-red-500 bg-red-100 rounded-md"><AlertCircle className="inline mr-2" />Error: {error}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Listings to Feature</CardTitle>
        <CardDescription>
          Toggle the checkbox next to a listing to mark it as featured. Click 'Save Changes' to apply.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && !isSubmitting && (
          <div className="mb-4 p-3 rounded-md bg-red-100 text-red-700 border border-red-300 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        {submitMessage && (
          <div className={`mb-4 p-3 rounded-md flex items-center ${error ? 'bg-red-100 border-red-300 text-red-700' : 'bg-green-100 border-green-300 text-green-700'}`}>
            {error ? <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" /> : <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />}
            <p>{submitMessage}</p>
          </div>
        )}

        {listings.length === 0 && !isLoading && (
          <p className="text-center text-muted-foreground py-8">No listings found. You might need to create some first or check the API.</p>
        )}

        {listings.length > 0 && (
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="space-y-3 mb-6">
              {listings.map(listing => {
                const listingIdStr = listing.business_id;
                const isChecked = selectedListings[listingIdStr] === undefined 
                                  ? listing.isFeatured 
                                  : selectedListings[listingIdStr];
                return (
                  <div key={listingIdStr} className="flex items-center justify-between p-3 border rounded-md bg-card hover:bg-muted/50 transition-colors">
                    <label htmlFor={`featured-${listingIdStr}`} className="text-sm font-medium text-card-foreground cursor-pointer flex-grow mr-4">
                      {listing.title}
                    </label>
                    <Checkbox 
                      id={`featured-${listingIdStr}`}
                      checked={isChecked}
                      onCheckedChange={() => handleToggleFeatured(listing.business_id, isChecked)}
                      aria-label={`Feature ${listing.title}`}
                    />
                  </div>
                );
              })}
            </div>
            <Button 
              type="submit" 
              disabled={isSubmitting || isLoading}
              size="lg"
            >
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Changes'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

const FeaturedAdminPage: NextPageWithLayout<MyAppPageProps> = (props) => {
  return <AdminFeaturedPageContent />;
};

FeaturedAdminPage.getLayout = function getLayout(page: React.ReactElement, pageProps: MyAppPageProps) {
  const initialBaseElements = {
    title: pageProps.pageTitle || 'Manage Featured Listings',
    description: pageProps.pageDescription || 'Select which listings appear in featured sections of your site.',
    icon: pageProps.pageIconName ? <Star className="h-5 w-5" /> : <Star className="h-5 w-5" />, 
    actionButtons: pageProps.actionButtons,
  };

  return (
    <AdminHeaderProvider initialBaseElements={initialBaseElements}>
      <AdminLayout
        pageTitle={initialBaseElements.title} 
      >
        {page} 
      </AdminLayout>
    </AdminHeaderProvider>
  );
};

export default FeaturedAdminPage;
