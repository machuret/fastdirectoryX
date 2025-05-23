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
 * @bodyParam {string} [phone] - New phone number.
 * @bodyParam {string} [website] - New website URL.
 * @bodyParam {string} [address] - New full address.
 * @bodyParam {number | string | null} [latitude] - New latitude. Can be null to unset.
 * @bodyParam {number | string | null} [longitude] - New longitude. Can be null to unset.
 * @bodyParam {string} [category_name] - New category name.
 * @bodyParam {boolean} [isFeatured] - New featured status.
 * @bodyParam {boolean} [temporarily_closed] - New temporarily closed status.
 * @bodyParam {boolean} [permanently_closed] - New permanently closed status.
 * @bodyParam {string} [city] - New city.
 * @bodyParam {string} [state] - New state.
 * @bodyParam {string} [country_code] - New country code.
 * @bodyParam {string} [postal_code] - New postal code.
 * @bodyParam {string} [neighborhood] - New neighborhood.
 * @bodyParam {string} [price_range] - New price range.
 * @bodyParam {string | null} [image_url] - New primary image URL. Can be null to unset.
 * @bodyParam {string | null} [facebook_url] - New Facebook URL. Can be null to unset.
 * @bodyParam {string | null} [instagram_url] - New Instagram URL. Can be null to unset.
 * @bodyParam {string | null} [linkedin_url] - New LinkedIn URL. Can be null to unset.
 * @bodyParam {string | null} [pinterest_url] - New Pinterest URL. Can be null to unset.
 * @bodyParam {string | null} [youtube_url] - New YouTube URL. Can be null to unset.
 * @bodyParam {string | null} [x_com_url] - New X.com (Twitter) URL. Can be null to unset.
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
        description,
        phone,
        website,
        address,
        latitude,
        longitude,
        category_name,
        isFeatured,
        temporarily_closed,
        permanently_closed,
        city,
        state,
        country_code,
        postal_code,
        neighborhood,
        price_range,
        image_url,
        // Social Media URLs
        facebook_url,
        instagram_url,
        linkedin_url,
        pinterest_url,
        youtube_url,
        x_com_url
      } = req.body;

      const updateData: Prisma.ListingBusinessUpdateInput = {};

      // Add fields to updateData only if they are provided in the request body
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (phone !== undefined) updateData.phone = phone;
      if (website !== undefined) updateData.website = website;
      if (address !== undefined) updateData.address = address;
      if (category_name !== undefined) updateData.category_name = category_name;
      if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
      if (temporarily_closed !== undefined) updateData.temporarily_closed = temporarily_closed;
      if (permanently_closed !== undefined) updateData.permanently_closed = permanently_closed;
      if (city !== undefined) updateData.city = city;
      if (state !== undefined) updateData.state = state;
      if (country_code !== undefined) updateData.country_code = country_code;
      if (postal_code !== undefined) updateData.postal_code = postal_code;
      if (neighborhood !== undefined) updateData.neighborhood = neighborhood;
      if (price_range !== undefined) updateData.price_range = price_range;
      if (image_url !== undefined) updateData.image_url = image_url;

      // Social media fields - allow unsetting by passing null
      if (facebook_url !== undefined) updateData.facebook_url = facebook_url;
      if (instagram_url !== undefined) updateData.instagram_url = instagram_url;
      if (linkedin_url !== undefined) updateData.linkedin_url = linkedin_url;
      if (pinterest_url !== undefined) updateData.pinterest_url = pinterest_url;
      if (youtube_url !== undefined) updateData.youtube_url = youtube_url;
      if (x_com_url !== undefined) updateData.x_com_url = x_com_url;

      if (latitude !== undefined) {
        const lat = parseFloat(latitude);
        if (!isNaN(lat)) updateData.latitude = lat;
        else if (latitude === null) updateData.latitude = null; // Allow unsetting
      }
      if (longitude !== undefined) {
        const lon = parseFloat(longitude);
        if (!isNaN(lon)) updateData.longitude = lon;
        else if (longitude === null) updateData.longitude = null; // Allow unsetting
      }

      // If title is being updated, consider regenerating the slug if your logic requires it
      // For simplicity, slug regeneration on update is not included here but can be added.

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
