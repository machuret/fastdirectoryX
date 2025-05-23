import React, { useState, useEffect } from 'react';
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

const RecentListingsSection: React.FC<RecentListingsSectionProps> = ({ listings, isEnabled, title }) => {
  if (!isEnabled || !listings || listings.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 md:mb-12 text-text-primary font-raleway tracking-tight">
          {title || 'Recently Added Listings'}
        </h2>
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
