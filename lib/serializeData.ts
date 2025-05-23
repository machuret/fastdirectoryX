import { Prisma } from '@prisma/client';

// Interface for FAQ items
export interface FAQItem {
  question: string;
  answer: string;
}

// Interfaces for serialized related entities
export interface SerializedImage {
  image_url_id: string;
  url: string;
  alt_text: string | null;
}

export interface SerializedCategory {
  id: string;
  name: string;
}

export interface SerializedAmenity {
  amenity_id: string;
  name: string;
  value?: string | null;
  icon_svg?: string | null;
}

export interface SerializedOpeningHour {
  opening_hours_id: string;
  day_of_week: string;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

// Main interface for the serialized listing data passed to the admin edit page
export interface AdminSerializedListing {
  listing_business_id: string;
  business_id: number | null;
  title: string;
  description: string | null;
  slug: string;
  price_range: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  country_code: string | null;
  phone_number: string | null;
  website_url: string | null;
  google_maps_url: string | null;
  menu_url: string | null;
  reserve_table_url: string | null;
  latitude: number | null;
  longitude: number | null;
  plus_code: string | null;
  // Status & Visibility
  is_featured: boolean | null;
  is_advertisement: boolean | null;
  temporarily_closed: boolean | null;
  permanently_closed: boolean | null;
  operational_status: string | null;
  // SEO & Meta
  meta_title: string | null;
  // Social Media Links
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  pinterest_url: string | null;
  youtube_url: string | null;
  x_com_url: string | null;
  // External Platform IDs
  place_id: string | null;
  fid: string | null;
  cid: string | null;
  kgmid: string | null;
  google_food_url: string | null;
  // Operational Details & Stats
  reviews_count: number | null;
  language: string | null;
  rank: number | null;
  popular_times_live_text: string | null;
  popular_times_live_percent: number | null;
  search_page_url: string | null;
  search_string: string | null;
  // Content Optimization
  descriptionOptimized: boolean | null;
  faqOptimized: boolean | null;
  // Relational Data
  images: SerializedImage[];
  categories: SerializedCategory[];
  amenities: SerializedAmenity[];
  openingHours: SerializedOpeningHour[];
  faq: FAQItem[] | null;
  // Timestamps
  created_at: string | null;
  updated_at: string | null;
  // Fields that were in AdminSerializedListing but not directly on ListingBusiness or handled differently
  owner_user_id: string | null;
  sub_title: string | null;
  located_in: string | null;
}

// Prisma's GetPayload type helps ensure 'listing' has the expected relations
const listingWithRelationsPayload = Prisma.validator<Prisma.ListingBusinessDefaultArgs>()({
  include: {
    imageUrls: {
      select: {
        image_url_id: true,
        url: true,
        description: true,
      }
    },
    categories: {
      include: {
        category: {
          select: {
            category_id: true,
            category_name: true,
            slug: true,
          }
        }
      }
    },
    businessAttributes: {
      select: {
        value: true,
        listingAttribute: {
          select: {
            attribute_id: true,
            attribute_key: true,
            icon_url: true,
          }
        }
      }
    },
    openingHours: true,
    // reviews relation can be added here if needed for serialization
  }
});

export type ListingWithRelations = Prisma.ListingBusinessGetPayload<typeof listingWithRelationsPayload>;

// Function to serialize listing data, converting Prisma types (Decimal, Date, BigInt if any) to JSON-friendly strings
export function serializeListing(
  listing: ListingWithRelations,
  allCategories?: SerializedCategory[], 
  allAmenities?: SerializedAmenity[]    
): AdminSerializedListing {
  // Ensure 'listing' is not null or undefined before proceeding
  if (!listing) {
    throw new Error("Listing data cannot be null or undefined in serializeListing.");
  }

  let parsedFaqs: FAQItem[] | null = null;
  if (listing.faq) {
    if (typeof listing.faq === 'string') {
      try {
        parsedFaqs = JSON.parse(listing.faq) as FAQItem[];
      } catch (error) {
        console.error('Failed to parse FAQ JSON string:', error);
        parsedFaqs = null; 
      }
    } else if (Array.isArray(listing.faq)) {
      // Assuming Prisma.JsonValue could be pre-parsed array by some layers
      // Add a type assertion to unknown first for safety if direct cast is problematic
      parsedFaqs = listing.faq as unknown as FAQItem[]; 
    } else if (typeof listing.faq === 'object' && listing.faq !== null) {
        if (Array.isArray(listing.faq)) { 
            parsedFaqs = listing.faq as unknown as FAQItem[];
        } else {
            console.warn('FAQ data is an object but not an array:', listing.faq);
            parsedFaqs = null;
        }
    }
  }

  const serializedImages = listing.imageUrls?.map(img => ({
    image_url_id: img.image_url_id.toString(),
    url: img.url,
    alt_text: img.description,
  })) ?? [];

  const serializedCategories = listing.categories?.map(lc => ({
    id: lc.category.category_id.toString(),
    name: lc.category.category_name,
  })) ?? [];

  const serializedAmenities = listing.businessAttributes?.map(la => {
    if (!la || !la.listingAttribute) {
      return { amenity_id: '', name: '' }; 
    }
    return {
      amenity_id: la.listingAttribute.attribute_id.toString(), 
      name: la.listingAttribute.attribute_key,
      value: la.value, 
      icon_svg: la.listingAttribute.icon_url,
    };
  }) ?? [];

  const serializedOpeningHours: SerializedOpeningHour[] = listing.openingHours?.map(oh => ({
    opening_hours_id: oh.id.toString(), 
    day_of_week: oh.day_of_week,
    open_time: oh.open_time, 
    close_time: oh.close_time, 
    is_closed: oh.open_time === null && oh.close_time === null, 
  })) ?? [];

  return {
    listing_business_id: listing.listing_business_id.toString(),
    business_id: listing.business_id ?? null, 
    title: listing.title,
    description: listing.description ?? null,
    slug: listing.slug,
    price_range: listing.price_range ?? null,
    address: listing.address ?? null,
    neighborhood: listing.neighborhood ?? null,
    city: listing.city ?? null,
    state_province: listing.state ?? null, 
    postal_code: listing.postal_code ?? null,
    country_code: listing.country_code ?? null,
    phone_number: listing.phone ?? null, 
    website_url: listing.website ?? null, 
    google_maps_url: listing.url ?? null, 
    menu_url: listing.menu_url ?? null,
    reserve_table_url: listing.reserve_table_url ?? null,
    latitude: listing.latitude ? parseFloat(listing.latitude.toString()) : null,
    longitude: listing.longitude ? parseFloat(listing.longitude.toString()) : null,
    plus_code: listing.plus_code ?? null,
    // Status & Visibility
    is_featured: listing.isFeatured ?? false,
    is_advertisement: (listing as any).is_advertisement ?? false,
    temporarily_closed: listing.temporarily_closed ?? false,
    permanently_closed: listing.permanently_closed ?? false,
    operational_status: listing.operational_status ?? null,
    // SEO & Meta
    meta_title: listing.metaTitle ?? null,
    // Social Media Links
    facebook_url: listing.facebook_url ?? null, 
    instagram_url: listing.instagram_url ?? null,
    linkedin_url: listing.linkedin_url ?? null,
    pinterest_url: listing.pinterest_url ?? null,
    youtube_url: listing.youtube_url ?? null,
    x_com_url: listing.x_com_url ?? null,
    // External Platform IDs
    place_id: listing.place_id ?? null,
    fid: listing.fid ?? null,
    cid: listing.cid ?? null,
    kgmid: listing.kgmid ?? null,
    google_food_url: listing.google_food_url ?? null,
    // Operational Details & Stats
    reviews_count: listing.reviews_count ?? null,
    language: listing.language ?? null,
    rank: listing.rank ?? null,
    popular_times_live_text: listing.popular_times_live_text ?? null,
    popular_times_live_percent: listing.popular_times_live_percent ?? null,
    search_page_url: listing.search_page_url ?? null,
    search_string: listing.search_string ?? null,
    // Content Optimization
    descriptionOptimized: listing.descriptionOptimized ?? false,
    faqOptimized: listing.faqOptimized ?? false,
    // Relational Data
    images: serializedImages,
    categories: serializedCategories,
    amenities: serializedAmenities,
    openingHours: serializedOpeningHours,
    faq: parsedFaqs, 
    // Timestamps
    created_at: listing.createdAt.toISOString(),
    updated_at: listing.updatedAt.toISOString(),
    // Fields that were in AdminSerializedListing but not directly on ListingBusiness or handled differently
    owner_user_id: listing.user_id?.toString() ?? null, 
    sub_title: listing.sub_title ?? null,
    located_in: listing.located_in ?? null,
  };
}
