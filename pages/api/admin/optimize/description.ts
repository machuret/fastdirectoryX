import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '@/lib/prisma';
import OpenAI from 'openai';
import { UserRole, ListingBusiness } from '@prisma/client';

// Initialize OpenAI client
// Ensure OPENAI_API_KEY is in your .env file for local development
// Vercel will pick it up from environment variables in deployment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface OptimizeRequestData {
  listingIds?: string[]; // Specific IDs to optimize
  optimizeAll?: boolean; // Flag to optimize all listings (use with caution for large datasets)
}

interface OptimizationResult {
  listingId: string;
  originalDescription?: string | null;
  newDescription?: string;
  status: 'success' | 'error' | 'skipped';
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const session = await getSession({ req });
  // @ts-ignore next-auth types might need adjustment for custom 'role' property
  if (!session || session.user?.role !== UserRole.ADMIN) {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }

  const { listingIds, optimizeAll }: OptimizeRequestData = req.body;

  if (!listingIds && !optimizeAll) {
    return res.status(400).json({ message: 'Please provide listingIds or set optimizeAll to true.' });
  }
  if (listingIds && !Array.isArray(listingIds)){
    return res.status(400).json({ message: 'listingIds must be an array of strings.' });
  }
  if (listingIds && listingIds.some(id => typeof id !== 'string')){
    return res.status(400).json({ message: 'All elements in listingIds must be strings.' });
  }


  const results: OptimizationResult[] = [];
  // Specify the fields needed for processing to avoid fetching unnecessary data
  type ListingForProcessing = Pick<ListingBusiness, 'business_id' | 'title' | 'description' | 'city' | 'street' | 'neighborhood'>;
  let listingsToProcess: ListingForProcessing[] = [];

  try {
    if (optimizeAll) {
      listingsToProcess = await prisma.listingBusiness.findMany({
        where: { descriptionOptimized: false }, 
        select: { business_id: true, title: true, description: true, city: true, street: true, neighborhood: true },
        // take: 10, // Safety limit for 'optimizeAll' during development
      });
    } else if (listingIds && listingIds.length > 0) {
      const numericListingIds = listingIds.map(id => BigInt(id));
      listingsToProcess = await prisma.listingBusiness.findMany({
        where: { business_id: { in: numericListingIds } },
        select: { business_id: true, title: true, description: true, city: true, street: true, neighborhood: true },
      });
    }

    if (listingsToProcess.length === 0) {
      return res.status(200).json({ message: 'No listings found to optimize based on criteria.', results });
    }

    for (const listing of listingsToProcess) {
      const listingIdString = listing.business_id.toString();
      try {
        let locationContext = [listing.city, listing.street, listing.neighborhood].filter(Boolean).join(', ');
        if (!locationContext && listing.city) locationContext = listing.city;
        if (!locationContext) locationContext = 'the local area';
        
        const prompt = `Optimize the business description for "${listing.title}" located in ${locationContext}. ` +
                       `The current description is: "${listing.description || 'Not provided.'}". ` +
                       `Create a compelling, detailed, and SEO-friendly description of around 150-200 words. ` +
                       `If no description was provided, generate a suitable one based on the business name and location. ` +
                       `Focus on attracting customers and highlight unique selling points if inferable. Do not use the business name or location in the response.`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo', 
          messages: [
            { role: 'system', content: 'You are an expert copywriter tasked with creating engaging and optimized business descriptions.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7, 
          max_tokens: 300, // Increased token limit for potentially longer descriptions
        });

        const newDescription = completion.choices[0]?.message?.content?.trim();

        if (newDescription) {
          await prisma.listingBusiness.update({
            where: { business_id: listing.business_id },
            data: {
              description: newDescription,
              descriptionOptimized: true,
              descriptionLastOptimizedAt: new Date(),
            },
          });
          results.push({
            listingId: listingIdString,
            originalDescription: listing.description,
            newDescription,
            status: 'success',
          });
        } else {
          results.push({
            listingId: listingIdString,
            originalDescription: listing.description,
            status: 'error',
            error: 'OpenAI did not return a description.',
          });
        }
      } catch (error: any) {
        console.error(`Error optimizing listing ${listing.business_id}:`, error);
        results.push({
          listingId: listingIdString,
          originalDescription: listing.description,
          status: 'error',
          error: error.message || 'Unknown error during optimization for this listing.',
        });
      }
    }

    res.status(200).json({ message: 'Optimization process completed.', results });

  } catch (dbError: any) {
    console.error('Database error during optimization process:', dbError);
    // Avoid sending detailed db errors to client in production if possible
    res.status(500).json({ message: 'An error occurred while processing your request.', results });
  }
}
