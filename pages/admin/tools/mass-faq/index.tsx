import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminHeaderProvider, useAdminHeader, HeaderElements } from '@/components/AdminHeaderContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, Loader2, ListChecks } from 'lucide-react';
import type { NextPageWithLayout, MyAppPageProps } from '@/pages/_app';

interface ListingForFaq {
  id: string;
  title: string;
  selected: boolean;
  status?: 'pending' | 'success' | 'error';
  message?: string;
}

const MassFaqGeneratorPageContent: React.FC = () => {
  const [listings, setListings] = useState<ListingForFaq[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { setPageSpecificHeaderElements } = useAdminHeader();

  useEffect(() => {
    setPageSpecificHeaderElements({
      title: 'Mass FAQ Generator',
      description: 'Select listings and generate FAQs in bulk using AI.',
      icon: <ListChecks />,
    });
  }, [setPageSpecificHeaderElements]);

  useEffect(() => {
    const fetchListings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/listings?minimal=true');
        if (!response.ok) {
          throw new Error('Failed to fetch listings');
        }
        const data = await response.json();
        setListings(
          data.map((listing: any) => ({
            id: listing.business_id.toString(),
            title: listing.title,
            selected: false,
          }))
        );
      } catch (error) {
        console.error('Error fetching listings:', error);
        toast.error('Failed to load listings. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchListings();
  }, []);

  const handleSelectListing = (id: string) => {
    setListings((prevListings) =>
      prevListings.map((listing) =>
        listing.id === id ? { ...listing, selected: !listing.selected } : listing
      )
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setListings((prevListings) =>
      prevListings.map((listing) => ({ ...listing, selected: checked }))
    );
  };

  const selectedListingsCount = listings.filter(l => l.selected).length;

  const handleGenerateFaqs = async () => {
    const selectedIds = listings.filter((l) => l.selected).map((l) => l.id);
    if (selectedIds.length === 0) {
      toast.warning('Please select at least one listing to generate FAQs.');
      return;
    }

    setIsGenerating(true);
    toast.info(`Starting FAQ generation for ${selectedIds.length} listings...`);

    setListings(prev => prev.map(l => selectedIds.includes(l.id) ? {...l, status: 'pending', message: undefined} : l));

    for (const id of selectedIds) {
      try {
        const response = await fetch(`/api/admin/listings/${id}/optimize-faq`, {
          method: 'POST',
        });
        
        let statusMessage = 'FAQ generated successfully.';
        if (!response.ok) {
          try {
            const errorData = await response.json();
            statusMessage = errorData?.error || response.statusText || 'Failed to generate FAQ.';
          } catch (e) {
            statusMessage = response.statusText || 'Failed to generate FAQ.';
          }
        }

        setListings(prev => prev.map(l => l.id === id ? {
          ...l, 
          status: response.ok ? 'success' : 'error',
          message: statusMessage
        } : l));

        if (!response.ok) {
          toast.error(`Failed for ${listings.find(l=>l.id === id)?.title || id}: ${statusMessage}`);
        } else {
          toast.success(`FAQ generated for: ${listings.find(l=>l.id === id)?.title || id}`);
        }
      } catch (error: any) {
        console.error(`Error generating FAQ for listing ${id}:`, error);
        toast.error(`An unexpected error occurred for listing: ${listings.find(l=>l.id === id)?.title || id}`);
        setListings(prev => prev.map(l => l.id === id ? {...l, status: 'error', message: error.message || 'Unexpected error'} : l));
      }
    }

    setIsGenerating(false);
    toast.success('FAQ generation process finished for selected listings.');
  };

  const allSelected = listings.length > 0 && listings.every(l => l.selected);
  const someSelected = listings.some(l => l.selected) && !allSelected;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Listings</CardTitle>
          <CardDescription>
            Choose the listings for which you want to generate FAQs. 
            The process will call the optimize-faq endpoint for each selected listing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Loading listings...</p>
            </div>
          ) : listings.length === 0 ? (
            <p className="text-center text-muted-foreground">No listings found or available to process.</p>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={allSelected || (someSelected ? 'indeterminate' : false)}
                        onCheckedChange={(checked) => handleSelectAll(checked === true)}
                        aria-label="Select all listings"
                      />
                    </TableHead>
                    <TableHead>Listing Title</TableHead>
                    <TableHead className="w-[200px] text-center">Generation Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.map((listing) => (
                    <TableRow key={listing.id} data-state={listing.selected ? "selected" : ""}>
                      <TableCell>
                        <Checkbox 
                          checked={listing.selected} 
                          onCheckedChange={() => handleSelectListing(listing.id)} 
                          aria-label={`Select ${listing.title}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{listing.title}</TableCell>
                      <TableCell className="text-center">
                        {listing.status === 'pending' && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground inline-block" />}
                        {listing.status === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500 inline-block" />}
                        {listing.status === 'error' && <AlertTriangle className="h-5 w-5 text-red-500 inline-block" />}
                        {!listing.status && <span className="text-xs text-muted-foreground">Idle</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleGenerateFaqs} 
            disabled={isGenerating || selectedListingsCount === 0}
            className="w-full sm:w-auto"
          >
            {isGenerating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating FAQs...</>
            ) : (
              `Generate FAQs for ${selectedListingsCount} Listing${selectedListingsCount === 1 ? '' : 's'}`
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

const MassFaqGeneratorPage: NextPageWithLayout<MyAppPageProps> = (props) => {
  return <MassFaqGeneratorPageContent />;
};

MassFaqGeneratorPage.getLayout = function getLayout(page: React.ReactElement, pageProps: MyAppPageProps) {
  const initialHeaderElements: HeaderElements = {
    title: pageProps.pageTitle, 
    description: pageProps.pageDescription, 
  };

  return (
    <AdminHeaderProvider initialBaseElements={initialHeaderElements}>
      <AdminLayout pageTitle={pageProps.pageTitle || 'Mass FAQ Generator'}>
        <Head>
          <title>{pageProps.pageTitle || 'Mass FAQ Generator'} - Admin Dashboard</title>
        </Head>
        {page}
      </AdminLayout>
    </AdminHeaderProvider>
  );
};

export default MassFaqGeneratorPage;
