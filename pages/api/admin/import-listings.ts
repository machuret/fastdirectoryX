import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]'; 
import prisma from '@/lib/prisma';
import { Prisma, ListingCategory, UserRole } from '@prisma/client'; 
import { Decimal } from '@prisma/client/runtime/library';
import slugify from 'slugify'; 
import { generateUniqueSlug } from '@/lib/utils'; 

interface JsonReviewDetail {
  name?: string; 
  text?: string; 
  stars?: number; 
  publishedAtDate?: string; 
  reviewImageUrls?: string[]; 
  responseFromOwnerText?: string;
  responseFromOwnerDate?: string; 
  reviewUrl?: string; 
  reviewOrigin?: string; 
  // Add any other relevant fields from your JSON review structure
}

interface ApifyListingItem {
  title?: string;
  price?: string;
  categoryName?: string;
  address?: string;
  neighborhood?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  state?: string;
  countryCode?: string;
  phone?: string;
  location?: { lat?: number; lng?: number };
  totalScore?: number;
  permanentlyClosed?: boolean;
  temporarilyClosed?: boolean;
  placeId?: string;
  categories?: string[];
  reviewsCount?: number;
  openingHours?: { day?: string; hours?: string }[]; 
  placesTags?: string[];
  additionalInfo?: any; 
  url?: string;
  imageUrl?: string;
  website?: string;
  description?: string;
  menu?: string;
  reviews?: JsonReviewDetail[]; 
  imageUrls?: string[]; 
}

interface ImportReport {
  totalProcessed: number;
  listingsImported: number; 
  categoriesProcessed: number;
  openingHoursProcessed: number;
  photosImported: number; 
  reviewsImported: number; 
  errors: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // --- BEGIN CASCADE DEBUG LOGS ---
  console.log(`[IMPORT-LISTINGS-API] Handler invoked. Timestamp: ${new Date().toISOString()}`);
  console.log(`[IMPORT-LISTINGS-API] Request Method: ${req.method}`);
  
  console.log('[IMPORT-LISTINGS-API] Attempting to get session...');
  const session = await getServerSession(req, res, authOptions);

  if (session && session.user) {
    console.log('[IMPORT-LISTINGS-API] Session retrieved. User:', JSON.stringify(session.user, null, 2));
  } else if (session) {
    console.log('[IMPORT-LISTINGS-API] Session retrieved, but no session.user object found.');
  } else {
    console.log('[IMPORT-LISTINGS-API] No session found by getServerSession.');
  }
  // --- END CASCADE DEBUG LOGS ---

  if (req.method !== 'POST') {
    console.log(`[IMPORT-LISTINGS-API] Incorrect method (${req.method}). Responding with 405 Method Not Allowed.`);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // --- BEGIN CASCADE DEBUG LOGS (POST block) ---
  console.log('[IMPORT-LISTINGS-API] Method is POST. Proceeding with import.');
  // --- END CASCADE DEBUG LOGS (POST block) ---

  // Restore authentication check
  if (!session || !session.user || session.user.role !== UserRole.ADMIN) { 
    console.log('[IMPORT-LISTINGS-API] Authorization failed. No session, no user, or user is not ADMIN.');
    return res.status(401).json({ message: 'Unauthorized: Admin access required.' });
  }

  // --- BEGIN CASCADE DEBUG LOGS (Auth success block) ---
  console.log('[IMPORT-LISTINGS-API] Authentication successful. User is ADMIN. Proceeding with import logic.');
  // --- END CASCADE DEBUG LOGS (Auth success block) ---

  const { url: jsonUrl } = req.body;
  if (!jsonUrl || typeof jsonUrl !== 'string') {
    console.log('[IMPORT-LISTINGS-API] JSON URL is missing or not a string.');
    return res.status(400).json({ message: 'JSON URL is required' });
  }

  // Use the current authenticated admin's user ID
  const currentAdminUserId = session.user.id; 
  if (!currentAdminUserId) {
    // This should ideally not happen if session.user.id is guaranteed by types
    console.error('[IMPORT-LISTINGS-API] Critical error: Admin User ID not found in session.');
    return res.status(500).json({ message: 'Critical error: Admin User ID not found in session.' });
  }
  console.log(`[IMPORT-LISTINGS-API] Using current admin user ID: ${currentAdminUserId} for import.`);

  const report: ImportReport = {
    totalProcessed: 0,
    listingsImported: 0, 
    categoriesProcessed: 0,
    openingHoursProcessed: 0,
    photosImported: 0, 
    reviewsImported: 0, 
    errors: [],
  };

  console.log(`[IMPORT-LISTINGS-API] Starting fetch from URL: ${jsonUrl}`);
  try {
    const fetchRes = await fetch(jsonUrl);
    if (!fetchRes.ok) {
      let errorBody = '';
      try {
        errorBody = await fetchRes.text();
      } catch {}
      const fetchErrorMsg = `Failed to fetch data from URL: ${fetchRes.status} ${fetchRes.statusText}. Response body: ${errorBody}`;
      console.error(`[IMPORT-LISTINGS-API] Error fetching URL: ${fetchErrorMsg}`);
      throw new Error(fetchErrorMsg);
    }
    const listingsData = (await fetchRes.json()) as ApifyListingItem[];
    console.log(`[IMPORT-LISTINGS-API] Successfully fetched and parsed JSON. Number of items: ${listingsData.length}`);

    if (!Array.isArray(listingsData)) {
        const typeErrorMsg = 'Fetched data is not an array. Please ensure the URL points to a JSON array of listings.';
        console.error(`[IMPORT-LISTINGS-API] Data type error: ${typeErrorMsg}`);
        throw new Error(typeErrorMsg);
    }

    for (const item of listingsData) {
      report.totalProcessed++;
      if (!item.title || item.title.trim() === '') {
        console.log(`[IMPORT-LISTINGS-API] Skipping item due to missing title: ${JSON.stringify(item).substring(0,100)}`);
        report.errors.push(`Skipping item due to missing title: ${JSON.stringify(item).substring(0,100)}`);
        continue;
      }

      // 1. Create a new Business record for this listing
      let newBusiness;
      try {
        newBusiness = await prisma.business.create({
          data: {
            name: item.title, // Use listing title as business name for simplicity
            user_id: parseInt(currentAdminUserId, 10), // Use current admin's ID, ensure it's an integer
            description: item.description || 'Imported business',
          },
        });
        console.log(`[IMPORT-LISTINGS-API] Created new Business ID: ${newBusiness.business_id} for listing: ${item.title}`);
      } catch (e: any) {
        const businessErrorMsg = `Error creating Business for listing '${item.title}': ${e.message}`;
        console.error(`[IMPORT-LISTINGS-API] ${businessErrorMsg}`);
        report.errors.push(businessErrorMsg);
        continue; // Skip to next item if Business creation fails
      }

      const generatedSlug = await generateUniqueSlug(item.title, prisma); 
      console.log(`[IMPORT-LISTINGS-API] Generated slug: ${generatedSlug} for title: ${item.title}`);

      const listingBusinessInput: Prisma.ListingBusinessCreateInput = {
        business: { 
          connect: { 
            business_id: newBusiness.business_id 
          }
        },
        title: item.title, 
        slug: generatedSlug, 
        place_id: item.placeId,
        address: item.address, 
        street: item.street, 
        city: item.city,
        state: item.state, 
        postal_code: item.postalCode,
        country_code: item.countryCode,
        latitude: item.location?.lat ? new Decimal(item.location.lat) : undefined,
        longitude: item.location?.lng ? new Decimal(item.location.lng) : undefined,
        phone: item.phone,
        website: item.website, 
        url: item.url, 
        description: item.description,
        reviews_count: item.reviewsCount || 0,
        price_range: item.price,
        permanently_closed: item.permanentlyClosed || false,
        temporarily_closed: item.temporarilyClosed || false,
        image_url: item.imageUrl, 
        menu_url: item.menu,
        isFeatured: false, 
        category_name: item.categoryName, 
      };

      if (item.imageUrl) {
        report.photosImported++;
      }

      const listingBusinessCategoryInputs: Prisma.ListingBusinessCategoryCreateWithoutBusinessInput[] = [];
      const itemCategories = item.categories || (item.categoryName ? [item.categoryName] : []);
      
      for (const catName of itemCategories) {
        if (catName.trim()) {
          const categorySlug = slugify(catName.trim(), { lower: true, strict: true });
          listingBusinessCategoryInputs.push({
            category: { 
              connectOrCreate: {
                where: { slug: categorySlug }, 
                create: { category_name: catName.trim(), slug: categorySlug }, 
              }
            }
          });
          report.categoriesProcessed++;
        }
      }
      
      if (listingBusinessCategoryInputs.length > 0) {
        listingBusinessInput.categories = {
          create: listingBusinessCategoryInputs
        };
      }

      let listingReviewInputs: Prisma.ListingReviewCreateManyListingBusinessInput[] = [];
      if (item.reviews && Array.isArray(item.reviews)) {
        listingReviewInputs = item.reviews.map((review: any) => ({
          reviewer_name: review.name,
          review_text: review.text,
          rating: review.stars !== undefined ? new Decimal(review.stars) : undefined, 
          published_at_date: review.publishedAtDate ? new Date(review.publishedAtDate) : undefined,
        }));
        report.reviewsImported++;
      }

      const listingDataToBeSaved: Prisma.ListingBusinessCreateInput = {
        ...listingBusinessInput,
        categories: { create: listingBusinessCategoryInputs },
        reviews: listingReviewInputs.length > 0 ? { createMany: { data: listingReviewInputs } } : undefined,
        // ImageUrls will be handled after listing creation to get listing_business_id
      };

      console.log(`[IMPORT-LISTINGS-API] Attempting to upsert ListingBusiness for placeId: ${item.placeId}`);
      const upsertedListing = await prisma.listingBusiness.upsert({
        where: { place_id: item.placeId }, 
        update: listingDataToBeSaved, 
        create: listingDataToBeSaved,
      });
      report.listingsImported++;
      console.log(`[IMPORT-LISTINGS-API] Successfully upserted ListingBusiness ID: ${upsertedListing.listing_business_id} for: ${item.title}`);

      // 2. Handle ListingImageUrls after ListingBusiness is created/upserted
      if (item.imageUrls && Array.isArray(item.imageUrls) && item.imageUrls.length > 0) {
        console.log(`[IMPORT-LISTINGS-API] Found ${item.imageUrls.length} gallery images for listing ID: ${upsertedListing.listing_business_id}`);
        for (const imageUrl of item.imageUrls) {
          if (imageUrl && typeof imageUrl === 'string') {
            try {
              await prisma.listingImageUrl.create({
                data: {
                  listing_business_id: upsertedListing.listing_business_id,
                  url: imageUrl,
                  // description: can be added if your Apify data provides it per image
                }
              });
              report.photosImported++; 
              console.log(`[IMPORT-LISTINGS-API] Added gallery image: ${imageUrl} to listing ID: ${upsertedListing.listing_business_id}`);
            } catch (imgErr: any) {
              const imgErrorMsg = `Error adding gallery image ${imageUrl} for listing ID ${upsertedListing.listing_business_id}: ${imgErr.message}`;
              console.error(`[IMPORT-LISTINGS-API] ${imgErrorMsg}`);
              report.errors.push(imgErrorMsg);
            }
          }
        }
      } else if (item.imageUrl && !item.imageUrls) { 
          // The main item.imageUrl is already part of listingBusinessInput.image_url
          // report.photosImported was incremented earlier if item.imageUrl existed.
          // If item.imageUrls is an empty array, this block won't be hit.
      }

    }

    console.log('[IMPORT-LISTINGS-API] Import process finished. Final report:', JSON.stringify(report, null, 2));
    res.status(200).json({ message: 'Import process completed.', report });
  } catch (error: any) {
    console.error('[IMPORT-LISTINGS-API] Critical error during import process:', error.message, error.stack);
    report.errors.push(`A critical error occurred: ${error.message}`);
    res.status(500).json({ message: `An error occurred: ${error.message}`, report });
  }
}
