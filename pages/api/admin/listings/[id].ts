import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getSession } from 'next-auth/react';
import { Prisma } from '@prisma/client';
import { serializeAdminListing, SerializedListingBusiness } from './index'; // Import from the index.ts in the same directory

/**
 * API handler for managing individual business listing resources.
 * Supports fetching (GET), updating (PUT), and deleting (DELETE) a specific listing by its ID.
 * Authentication (e.g., admin check) is currently commented out but should be implemented.
 *
 * @param {NextApiRequest} req The Next.js API request object.
 * @param {NextApiResponse} res The Next.js API response object, returning SerializedListingBusiness or an error message.
 *
 * @route GET /api/admin/listings/{id}
 * @description Fetches a specific business listing by its ID.
 * @param {string} req.query.id - The ID of the listing to fetch (must be a number).
 * @returns {Promise<void>} Responds with the serialized listing object or an error message.
 * @successResponse 200 OK - {SerializedListingBusiness} The serialized listing object.
 * @errorResponse 400 Bad Request - If the listing ID is missing or not a valid number.
 * @errorResponse 404 Not Found - If the listing with the specified ID is not found.
 * @errorResponse 500 Internal Server Error - If an error occurs during fetching.
 *
 * @route PUT /api/admin/listings/{id}
 * @description Updates a specific business listing by its ID.
 * @param {string} req.query.id - The ID of the listing to update (must be a number).
 * @bodyParam {string} [title] - New title for the listing.
 * @bodyParam {string} [description] - New description.
 * @bodyParam {string} [phoneNumber] - New phone number.
 * @bodyParam {string} [websiteUrl] - New website URL.
 * @bodyParam {string} [isFeatured] - New featured status.
 * @bodyParam {number | string | null} [latitude] - New latitude. Can be null to unset.
 * @bodyParam {number | string | null} [longitude] - New longitude. Can be null to unset.
 * @bodyParam {string} [businessId] - New business ID.
 * @bodyParam {string} [priceRange] - New price range.
 * @bodyParam {string} [address] - New full address.
 * @bodyParam {string} [neighborhood] - New neighborhood.
 * @bodyParam {string} [city] - New city.
 * @bodyParam {string} [stateProvince] - New state or province.
 * @bodyParam {string} [postalCode] - New postal code.
 * @bodyParam {string} [countryCode] - New country code.
 * @bodyParam {string} [googleMapsUrl] - New Google Maps URL.
 * @bodyParam {string} [menuUrl] - New menu URL.
 * @bodyParam {string} [reserveTableUrl] - New reserve table URL.
 * @bodyParam {string} [ownerUserId] - New owner user ID.
 * @bodyParam {string} [metaTitle] - New meta title.
 * @bodyParam {string | null} [facebookUrl] - New Facebook URL. Can be null to unset.
 * @bodyParam {string | null} [instagramUrl] - New Instagram URL. Can be null to unset.
 * @bodyParam {string | null} [linkedinUrl] - New LinkedIn URL. Can be null to unset.
 * @bodyParam {string | null} [pinterestUrl] - New Pinterest URL. Can be null to unset.
 * @bodyParam {string | null} [youtubeUrl] - New YouTube URL. Can be null to unset.
 * @bodyParam {string | null} [xComUrl] - New X.com (Twitter) URL. Can be null to unset.
 * @bodyParam {string} [descriptionOptimized] - New description optimized.
 * @bodyParam {string} [placeId] - New place ID.
 * @bodyParam {boolean} [temporarilyClosed] - New temporarily closed status.
 * @bodyParam {boolean} [permanentlyClosed] - New permanently closed status.
 * @bodyParam {string} [operationalStatus] - New operational status.
 * @bodyParam {string} [fid] - New fid.
 * @bodyParam {string} [cid] - New cid.
 * @bodyParam {number | string | null} [reviewsCount] - New reviews count. Can be null to unset.
 * @bodyParam {string} [googleFoodUrl] - New Google Food URL.
 * @bodyParam {string} [searchPageUrl] - New search page URL.
 * @bodyParam {string} [searchString] - New search string.
 * @bodyParam {string} [language] - New language.
 * @bodyParam {number | string | null} [rank] - New rank. Can be null to unset.
 * @bodyParam {string} [kgmid] - New kgmid.
 * @bodyParam {string} [subTitle] - New sub title.
 * @bodyParam {string} [locatedIn] - New located in.
 * @bodyParam {string} [plusCode] - New plus code.
 * @bodyParam {string} [popularTimesLiveText] - New popular times live text.
 * @bodyParam {number | string | null} [popularTimesLivePercent] - New popular times live percent. Can be null to unset.
 * @bodyParam {string} [faqOptimized] - New FAQ optimized.
 * @bodyParam {boolean} [isAdvertisement] - New advertisement status.
 * @returns {Promise<void>} Responds with the updated and serialized listing object or an error message.
 * @successResponse 200 OK - {SerializedListingBusiness} The updated and serialized listing object.
 * @errorResponse 400 Bad Request - If the listing ID is missing or not a valid number.
 * @errorResponse 404 Not Found - If the listing to update is not found (Prisma P2025).
 * @errorResponse 500 Internal Server Error - If an error occurs during update.
 *
 * @route DELETE /api/admin/listings/{id}
 * @description Deletes a specific business listing by its ID.
 * @param {string} req.query.id - The ID of the listing to delete (must be a number).
 * @returns {Promise<void>} Responds with no content on success or an error message.
 * @successResponse 204 No Content - Successfully deleted the listing.
 * @errorResponse 400 Bad Request - If the listing ID is missing or not a valid number.
 * @errorResponse 404 Not Found - If the listing to delete is not found (Prisma P2025).
 * @errorResponse 500 Internal Server Error - If an error occurs during deletion.
 */
export default async function handleListingItem(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  const listingIdString = req.query.id as string;

  // Optional: Add admin check if required
  // if (!session || !session.user.isAdmin) {
  //   return res.status(401).json({ message: 'Unauthorized' });
  // }

  if (!listingIdString) {
    return res.status(400).json({ message: 'Listing ID is required' });
  }

  const listingId = parseInt(listingIdString, 10);
  if (isNaN(listingId)) {
    return res.status(400).json({ message: 'Invalid Listing ID format' });
  }

  if (req.method === 'GET') {
    try {
      const listing = await prisma.listingBusiness.findUnique({
        where: { listing_business_id: listingId },
        // Include relations if needed for serialization or direct response
        // include: { reviews: true, imageUrls: true, _count: { select: { reviews: true, imageUrls: true } } }
      });

      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }
      // Use the existing serializer from listings/index.ts
      const serializedListing = serializeAdminListing(listing as any); // Cast as any to match serializer input
      res.status(200).json(serializedListing);
    } catch (error: any) {
      console.error(`Failed to fetch listing ${listingId}:`, error);
      res.status(500).json({ message: `Failed to fetch listing ${listingId}`, error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const {
        title,
        slug, // Slug update logic might be complex; for now, we'll assume it's handled or not updated here
        description,
        phoneNumber,
        websiteUrl,
        isFeatured,
        latitude,
        longitude,
        businessId, // New (maps to business_id)
        priceRange, // New (maps to price_range)
        address,
        neighborhood,
        city,
        stateProvince, // New (maps to state_province)
        postalCode, // New (maps to postal_code)
        countryCode, // New (maps to country_code)
        googleMapsUrl, // New (maps to google_maps_url)
        menuUrl, // New (maps to menu_url)
        reserveTableUrl, // New (maps to reserve_table_url)
        ownerUserId, // New (maps to owner_user_id)
        metaTitle, // New (maps to meta_title)
        facebookUrl,
        instagramUrl,
        linkedinUrl,
        pinterestUrl,
        youtubeUrl,
        xComUrl,
        descriptionOptimized, // New
        placeId, // New (maps to place_id)
        temporarilyClosed, // Was temporarily_closed
        permanentlyClosed, // Was permanently_closed
        operationalStatus, // New (maps to operational_status)
        fid, // New
        cid, // New
        reviewsCount, // New (maps to reviews_count)
        googleFoodUrl, // New (maps to google_food_url)
        searchPageUrl, // New (maps to search_page_url)
        searchString, // New (maps to search_string)
        language, // New
        rank, // New
        kgmid, // New
        subTitle, // New (maps to sub_title)
        locatedIn, // New (maps to located_in)
        plusCode, // New (maps to plus_code)
        popularTimesLiveText, // New (maps to popular_times_live_text)
        popularTimesLivePercent, // New (maps to popular_times_live_percent)
        faqOptimized, // New
        isAdvertisement, // Re-added: Reverting schema change
      } = req.body;

      const updateData: Prisma.ListingBusinessUpdateInput = {};

      // Map to Prisma field names (snake_case or camelCase as per Prisma schema)
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (phoneNumber !== undefined) updateData.phone = phoneNumber; // Prisma: phone
      if (websiteUrl !== undefined) updateData.website = websiteUrl; // Prisma: website
      if (isFeatured !== undefined) updateData.isFeatured = isFeatured; // Prisma: isFeatured (camelCase)
      
      if (latitude !== undefined) {
        const lat = parseFloat(latitude as string); // Frontend sends number or string
        if (!isNaN(lat)) updateData.latitude = lat;
        else if (latitude === null) updateData.latitude = null;
      }
      if (longitude !== undefined) {
        const lon = parseFloat(longitude as string);
        if (!isNaN(lon)) updateData.longitude = lon;
        else if (longitude === null) updateData.longitude = null;
      }

      if (businessId !== undefined) { // maps to business_id (Int?)
        const bId = parseInt(businessId as string, 10);
        if (!isNaN(bId)) updateData.business = { connect: { business_id: bId } }; // Prisma: business_id
      }
      if (priceRange !== undefined) updateData.price_range = priceRange; // Prisma: price_range
      if (address !== undefined) updateData.address = address;
      if (neighborhood !== undefined) updateData.neighborhood = neighborhood;
      if (city !== undefined) updateData.city = city;
      if (stateProvince !== undefined) updateData.state = stateProvince; // Prisma: state
      if (postalCode !== undefined) updateData.postal_code = postalCode; // Prisma: postal_code
      if (countryCode !== undefined) updateData.country_code = countryCode; // Prisma: country_code
      if (googleMapsUrl !== undefined) updateData.url = googleMapsUrl; // Prisma: url (used for google_maps_url)
      if (menuUrl !== undefined) updateData.menu_url = menuUrl; // Prisma: menu_url
      if (reserveTableUrl !== undefined) updateData.reserve_table_url = reserveTableUrl; // Prisma: reserve_table_url
      if (ownerUserId !== undefined) {
        if (ownerUserId === null || ownerUserId === '') { // Check for empty string too if it can come from form
          updateData.user = { disconnect: true };
        } else {
          const oId = parseInt(ownerUserId as string, 10);
          if (!isNaN(oId)) updateData.user = { connect: { user_id: oId } }; // Prisma: user_id
        }
      }
      if (metaTitle !== undefined) updateData.metaTitle = metaTitle; // Prisma: metaTitle (camelCase)
      
      // Social media fields (Prisma names are snake_case)
      if (facebookUrl !== undefined) updateData.facebook_url = facebookUrl;
      if (instagramUrl !== undefined) updateData.instagram_url = instagramUrl;
      if (linkedinUrl !== undefined) updateData.linkedin_url = linkedinUrl;
      if (pinterestUrl !== undefined) updateData.pinterest_url = pinterestUrl;
      if (youtubeUrl !== undefined) updateData.youtube_url = youtubeUrl;
      if (xComUrl !== undefined) updateData.x_com_url = xComUrl;

      if (descriptionOptimized !== undefined) updateData.descriptionOptimized = descriptionOptimized;
      if (placeId !== undefined) updateData.place_id = placeId; // Prisma: place_id
      if (temporarilyClosed !== undefined) updateData.temporarily_closed = temporarilyClosed; // Prisma: temporarily_closed
      if (permanentlyClosed !== undefined) updateData.permanently_closed = permanentlyClosed; // Prisma: permanently_closed
      if (operationalStatus !== undefined) updateData.operational_status = operationalStatus; // Prisma: operational_status
      if (fid !== undefined) updateData.fid = fid;
      if (cid !== undefined) updateData.cid = cid;
      
      if (reviewsCount !== undefined) { // Prisma: reviews_count (Int?)
        const rCount = parseInt(reviewsCount as string, 10);
        if (!isNaN(rCount)) updateData.reviews_count = rCount;
        else if (reviewsCount === null) updateData.reviews_count = null;
      }
      if (googleFoodUrl !== undefined) updateData.google_food_url = googleFoodUrl; // Prisma: google_food_url
      if (searchPageUrl !== undefined) updateData.search_page_url = searchPageUrl; // Prisma: search_page_url
      if (searchString !== undefined) updateData.search_string = searchString; // Prisma: search_string
      if (language !== undefined) updateData.language = language;
      
      if (rank !== undefined) { // Prisma: rank (Int?)
        const rnk = parseInt(rank as string, 10);
        if (!isNaN(rnk)) updateData.rank = rnk;
        else if (rank === null) updateData.rank = null;
      }
      if (kgmid !== undefined) updateData.kgmid = kgmid;
      if (subTitle !== undefined) updateData.sub_title = subTitle; // Prisma: sub_title
      if (locatedIn !== undefined) updateData.located_in = locatedIn; // Prisma: located_in
      if (plusCode !== undefined) updateData.plus_code = plusCode; // Prisma: plus_code
      if (popularTimesLiveText !== undefined) updateData.popular_times_live_text = popularTimesLiveText; // Prisma: popular_times_live_text
      
      if (popularTimesLivePercent !== undefined) { // Prisma: popular_times_live_percent (Int?)
        const ptPercent = parseInt(popularTimesLivePercent as string, 10);
        if (!isNaN(ptPercent)) updateData.popular_times_live_percent = ptPercent;
        else if (popularTimesLivePercent === null) updateData.popular_times_live_percent = null;
      }
      if (faqOptimized !== undefined) updateData.faqOptimized = faqOptimized;
      if (isAdvertisement !== undefined) updateData.is_advertisement = isAdvertisement; // Reverted to snake_case

      // Remove old direct field assignments if they are now handled by the comprehensive mapping above
      // e.g. updateData.phone, updateData.website, updateData.category_name, updateData.image_url etc.
      // The old code had: if (phone !== undefined) updateData.phone = phone; -> now handled by phoneNumber -> phone_number

      const updatedListing = await prisma.listingBusiness.update({
        where: { listing_business_id: listingId },
        data: updateData,
      });

      const serializedUpdatedListing = serializeAdminListing(updatedListing as any);
      res.status(200).json(serializedUpdatedListing);
    } catch (error: any) {
      console.error(`Failed to update listing ${listingId}:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return res.status(404).json({ message: 'Listing not found for update.' });
      }
      res.status(500).json({ message: `Failed to update listing ${listingId}`, error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.listingBusiness.delete({
        where: { listing_business_id: listingId },
      });
      res.status(204).end(); // No content
    } catch (error: any) {
      console.error(`Failed to delete listing ${listingId}:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return res.status(404).json({ message: 'Listing not found for deletion.' });
      }
      res.status(500).json({ message: `Failed to delete listing ${listingId}`, error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
