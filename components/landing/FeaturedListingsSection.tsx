import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface SerializedListing {
  business_id: string;
  title?: string | null;
  slug?: string | null;
  address?: string | null;
  displayImageUrl?: string | null;
  // Add other relevant fields from your serialized listing type
  // For example, category name if you want to display it
  category_name?: string | null;
  category_slug?: string | null; // Added to receive the slug for the primary category
}

interface FeaturedListingsSectionProps {
  listings: SerializedListing[];
  isEnabled: boolean;
  title?: string | null;
}

const FeaturedListingsSection: React.FC<FeaturedListingsSectionProps> = ({ listings, isEnabled, title }) => {
  if (!isEnabled || !listings || listings.length === 0) {
    return null;
  }

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 md:mb-12 text-text-primary font-raleway tracking-tight">{title || 'Featured Listings'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {listings.map((listing) => (
            <div key={listing.business_id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card text-card-foreground rounded-xl">
              {listing.displayImageUrl ? (
                <div className="relative w-full aspect-[16/9]">
                  <Image 
                    src={listing.displayImageUrl} 
                    alt={listing.title || 'Listing image'}
                    fill
                    sizes="100vw" // Default for fill, can be refined e.g. (max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw
                    className="object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
              ) : (
                <div className="w-full aspect-[16/9] bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">No Image</span>
                </div>
              )}
              <div className="p-5 flex-grow">
                {listing.category_name && listing.category_slug && (
                  <div className="mb-2 font-raleway text-sm text-gray-600 hover:text-primary transition-colors">
                    <Link href={`/category/${listing.category_slug}`} legacyBehavior>
                      <a>{listing.category_name}</a>
                    </Link>
                  </div>
                )}
                {listing.category_name && !listing.category_slug && ( // Fallback if slug is somehow missing
                  <div className="mb-2 font-raleway text-sm text-gray-600">{listing.category_name}</div>
                )}
                <div className="text-xl font-semibold mb-2">
                  {listing.title || 'Unnamed Listing'}
                </div>
                <p className="text-sm mb-3">
                  {listing.address || 'Address not available'}
                </p>
                {/* Add more listing details here as needed */}
              </div>
              <div className="p-5 pt-0">
                <Link href={`/listings/${listing.slug || listing.business_id}`} legacyBehavior>
                  <a className="text-blue-600 hover:underline mt-4 inline-block">View Details &rarr;</a>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedListingsSection;
