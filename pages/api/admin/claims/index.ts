import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getSession } from 'next-auth/react';
import { UserRole, ClaimStatus } from '@prisma/client'; // Assuming UserRole enum exists

// Helper function to serialize claim data (handles Date objects)
const serializeClaim = (claim: any) => ({
  ...claim,
  requested_at: claim.requested_at.toISOString(),
  reviewed_at: claim.reviewed_at ? claim.reviewed_at.toISOString() : null,
  // Ensure nested objects like user and listingBusiness are also serializable if needed
  // For now, we'll assume the frontend can handle the nested structure or we select specific fields.
  user: {
    user_id: claim.user.user_id,
    name: claim.user.name,
    email: claim.user.email,
  },
  listingBusiness: {
    listing_business_id: claim.listingBusiness.listing_business_id,
    title: claim.listingBusiness.title,
    slug: claim.listingBusiness.slug,
  }
});

export default async function handleAdminClaims(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session || !session.user || session.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ message: 'Forbidden. Administrator access required.' });
  }

  if (req.method === 'GET') {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      let whereClause: any = {};
      if (status && typeof status === 'string' && Object.values(ClaimStatus).includes(status as ClaimStatus)) {
        whereClause.status = status as ClaimStatus;
      }

      const claims = await prisma.ownershipClaim.findMany({
        where: whereClause,
        include: {
          user: { // User who made the claim
            select: {
              user_id: true,
              name: true,
              email: true,
            }
          },
          listingBusiness: { // Listing being claimed
            select: {
              listing_business_id: true,
              title: true,
              slug: true,
            }
          }
        },
        orderBy: {
          requested_at: 'desc',
        },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      });

      const totalClaims = await prisma.ownershipClaim.count({
        where: whereClause,
      });
      
      const serializedClaims = claims.map(serializeClaim);

      return res.status(200).json({
        claims: serializedClaims,
        totalPages: Math.ceil(totalClaims / limitNum),
        currentPage: pageNum,
        totalClaims: totalClaims,
      });

    } catch (error: any) {
      console.error('Failed to retrieve claims:', error);
      return res.status(500).json({ message: 'Failed to retrieve claims.', error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { claim_id, status: newStatus, admin_notes } = req.body;

      if (!claim_id || !newStatus) {
        return res.status(400).json({ message: 'Missing required fields: claim_id and status are required.' });
      }

      const claimIdNum = parseInt(claim_id as string, 10);
      if (isNaN(claimIdNum)) {
        return res.status(400).json({ message: 'Invalid claim_id format.' });
      }

      if (newStatus !== ClaimStatus.APPROVED && newStatus !== ClaimStatus.REJECTED) {
        return res.status(400).json({ message: 'Invalid status. Must be APPROVED or REJECTED.' });
      }

      const claimToUpdate = await prisma.ownershipClaim.findUnique({
        where: { claim_id: claimIdNum },
        include: {
          listingBusiness: true, // To get listing_business_id
          user: true, // To get user_id of claimant
        }
      });

      if (!claimToUpdate) {
        return res.status(404).json({ message: 'Claim not found.' });
      }

      if (claimToUpdate.status !== ClaimStatus.PENDING) {
        return res.status(400).json({ message: `Claim has already been ${claimToUpdate.status.toLowerCase()}.` });
      }

      let updatedClaim;

      if (newStatus === ClaimStatus.APPROVED) {
        if (!claimToUpdate.user_id || !claimToUpdate.listing_business_id) {
            return res.status(500).json({ message: 'Claim data is incomplete for approval (missing user or listing ID).' });
        }
        // Transaction to update claim and listing ownership
        updatedClaim = await prisma.$transaction(async (tx) => {
          const approvedClaim = await tx.ownershipClaim.update({
            where: { claim_id: claimIdNum },
            data: {
              status: ClaimStatus.APPROVED,
              reviewed_at: new Date(),
              admin_notes: admin_notes as string | undefined,
            },
          });

          await tx.listingBusiness.update({
            where: { listing_business_id: claimToUpdate.listing_business_id },
            data: {
              user_id: claimToUpdate.user_id, // Assign listing to the claimant
            },
          });
          return approvedClaim;
        });
        // After transaction, re-fetch the claim with its relations to return the full object
        const fullApprovedClaim = await prisma.ownershipClaim.findUnique({
            where: { claim_id: updatedClaim.claim_id }, // Use claim_id from the result of the update
            include: { user: true, listingBusiness: true }
        });
        return res.status(200).json({ message: 'Claim approved and listing ownership updated.', claim: fullApprovedClaim ? serializeClaim(fullApprovedClaim) : null });

      } else { // REJECTED
        updatedClaim = await prisma.ownershipClaim.update({
          where: { claim_id: claimIdNum },
          data: {
            status: ClaimStatus.REJECTED,
            reviewed_at: new Date(),
            admin_notes: admin_notes as string | undefined,
          },
        });
        // Need to re-fetch with includes for serializeClaim if we want to return full object
        const fullUpdatedClaim = await prisma.ownershipClaim.findUnique({
            where: { claim_id: claimIdNum },
            include: { user: true, listingBusiness: true }
        });
        return res.status(200).json({ message: 'Claim rejected.', claim: fullUpdatedClaim ? serializeClaim(fullUpdatedClaim) : null });
      }

    } catch (error: any) {
      console.error('Failed to update claim:', error);
      if (error instanceof prisma.PrismaClientKnownRequestError) {
        // Handle specific Prisma errors if needed
      }
      return res.status(500).json({ message: 'Failed to update claim.', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
