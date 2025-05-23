import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getSession } from 'next-auth/react';
import { ClaimStatus } from '@prisma/client';

export default async function handleSubmitClaim(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getSession({ req });

  // Check for session and user email (assuming email is the key to find the user_id)
  if (!session || !session.user || !session.user.email) {
    return res.status(401).json({ message: 'Unauthorized. Please log in to submit a claim.' });
  }

  const { 
    listing_business_id,
    claimant_name,
    company_name,
    claimant_email,
    claimant_phone,
    message 
  } = req.body;

  // Basic validation
  if (!listing_business_id || !claimant_name || !claimant_email || !message) {
    return res.status(400).json({ message: 'Missing required fields: listing ID, name, email, and message are required.' });
  }

  const listingId = parseInt(listing_business_id as string, 10);
  if (isNaN(listingId)) {
    return res.status(400).json({ message: 'Invalid Listing ID format.' });
  }

  try {
    // Fetch the user from DB using email from session to get their integer user_id
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { user_id: true },
    });

    if (!user || typeof user.user_id !== 'number') {
      return res.status(401).json({ message: 'User not found or invalid user data in session.' });
    }
    const userIdFromDb = user.user_id;

    // Check if the listing exists
    const listing = await prisma.listingBusiness.findUnique({
      where: { listing_business_id: listingId },
    });

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    // Optional: Check if this user has already submitted a pending/approved claim for this listing
    const existingClaim = await prisma.ownershipClaim.findFirst({
      where: {
        listing_business_id: listingId,
        user_id: userIdFromDb, // Use user_id from DB
        status: {
          in: [ClaimStatus.PENDING, ClaimStatus.APPROVED]
        }
      }
    });

    if (existingClaim) {
      if (existingClaim.status === ClaimStatus.PENDING) {
        return res.status(409).json({ message: 'You already have a pending claim for this listing.' });
      }
      if (existingClaim.status === ClaimStatus.APPROVED) {
        return res.status(409).json({ message: 'You already own this listing.' });
      }
    }

    const newClaim = await prisma.ownershipClaim.create({
      data: {
        listing_business_id: listingId,
        user_id: userIdFromDb, // Use user_id from DB
        claimant_name: claimant_name as string,
        company_name: company_name as string | undefined,
        claimant_email: claimant_email as string,
        claimant_phone: claimant_phone as string | undefined,
        message: message as string,
        status: ClaimStatus.PENDING, // Default status
      },
    });

    return res.status(201).json({ message: 'Claim submitted successfully. You will be notified once it has been reviewed.', claimId: newClaim.claim_id });

  } catch (error: any) {
    console.error('Failed to submit claim:', error);
    // Check for specific Prisma errors if necessary, e.g., foreign key constraint
    if (error.code === 'P2003') { // Foreign key constraint failed
        if (error.meta?.field_name?.includes('listing_business_id')) {
            return res.status(400).json({ message: 'Invalid listing ID provided.' });
        }
    }
    return res.status(500).json({ message: 'Failed to submit claim.', error: error.message });
  }
}
