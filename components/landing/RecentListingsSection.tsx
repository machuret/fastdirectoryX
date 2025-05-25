import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CalendarDays } from 'lucide-react';

interface SerializedListing {
  business_id: string;
  title?: string | null;
  slug?: string | null;
  address?: string | null;
  updatedAt: string; 
  displayImageUrl?: string | null;
  category_name?: string | null;
}

interface RecentListingsSectionProps {
  listings: SerializedListing[];
  isEnabled: boolean;
  title?: string | null;
  currentSortKey: 'latest' | 'featured' | 'alphabetical';
  onSortKeyChange: Dispatch<SetStateAction<'latest' | 'featured' | 'alphabetical'>>;
}

interface ClientFormattedDateProps {
  isoDateString: string;
}

const ClientFormattedDate: React.FC<ClientFormattedDateProps> = ({ isoDateString }) => {
  const [formattedDate, setFormattedDate] = useState<string>('');

  useEffect(() => {
    setFormattedDate(new Date(isoDateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }));
  }, [isoDateString]);

  if (!formattedDate) {
    return null; 
  }

  return <>{formattedDate}</>;
};

const RecentListingsSection: React.FC<RecentListingsSectionProps> = ({ 
  listings, 
  isEnabled, 
  title, 
  currentSortKey, 
  onSortKeyChange 
}) => {
  if (!isEnabled || !listings) { 
    return null;
  }

  const sortOptions: { key: 'latest' | 'featured' | 'alphabetical'; label: string }[] = [
    { key: 'latest', label: 'Latest' },
    { key: 'featured', label: 'Featured' },
    { key: 'alphabetical', label: 'A-Z' },
  ];

  return (
    <section className="py-12 md:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 md:mb-8 text-text-primary font-raleway tracking-tight">
          {title || 'Explore Our Listings'}
        </h2>
        <div className="flex justify-center mb-8 md:mb-10 space-x-2 sm:space-x-4">
          {sortOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => onSortKeyChange(option.key)}
              className={`px-4 py-2 sm:px-6 sm:py-2.5 rounded-md font-medium text-sm sm:text-base transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 font-raleway
                ${currentSortKey === option.key 
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {listings.length === 0 && currentSortKey === 'featured' && (
          <p className="text-center text-muted-foreground font-raleway">No featured listings available at the moment. Check back soon!</p>
        )}
        {listings.length === 0 && currentSortKey !== 'featured' && (
          <p className="text-center text-muted-foreground font-raleway">No listings match the current filter. Try a different option!</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {listings.map((listing) => (
            <Card key={listing.business_id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card text-card-foreground rounded-xl">
              <CardHeader className="p-0">
                {listing.displayImageUrl ? (
                  <div className="relative w-full aspect-[16/9]">
                    <Image 
                      src={listing.displayImageUrl} 
                      alt={listing.title || 'Listing image'}
                      fill
                      sizes="100vw" 
                      className="object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-[16/9] bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground text-sm">No Image</span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-5 flex-grow">
                {listing.category_name && (
                  <Badge variant="secondary" className="mb-2 font-raleway">{listing.category_name}</Badge>
                )}
                <CardTitle className="text-xl font-semibold mb-2 text-text-primary font-raleway tracking-tight leading-tight">
                  {listing.title || 'Unnamed Listing'}
                </CardTitle>
                <p className="text-sm text-text-secondary font-raleway mb-3 line-clamp-2">
                  {listing.address || 'Address not available'}
                </p>
                <div className="flex items-center text-xs text-text-tertiary font-raleway mt-auto pt-2">
                  <CalendarDays className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                  <span>Last updated: <ClientFormattedDate isoDateString={listing.updatedAt} /></span>
                </div>
              </CardContent>
              <CardFooter className="p-5 pt-0">
                <Link href={`/listings/${listing.slug || listing.business_id}`} legacyBehavior>
                  <a className="inline-flex items-center text-primary hover:text-primary/90 font-medium font-raleway group">
                    View Details 
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentListingsSection;
