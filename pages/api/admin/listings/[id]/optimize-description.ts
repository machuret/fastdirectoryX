import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma'; // Assuming your prisma client is at lib/prisma
import { OpenAI } from 'openai'; // You'll need to install and configure this

// Configure OpenAI client with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const { id: idString } = req.query; // Renamed to idString for clarity

  if (!idString || typeof idString !== 'string') {
    return res.status(400).json({ message: 'Listing Business ID is required.' });
  }

  // Convert string ID to number for Prisma query
  let listingBusinessId: number;
  try {
    listingBusinessId = parseInt(idString, 10);
    if (isNaN(listingBusinessId)) {
      // Handle cases where parseInt results in NaN (e.g., non-numeric string)
      throw new Error('ID is not a valid number.');
    }
  } catch (error) {
    return res.status(400).json({ message: 'Invalid Listing Business ID format. Must be a number.' });
  }

  try {
    const business = await prisma.listingBusiness.findUnique({
      where: { listing_business_id: listingBusinessId }, 
      select: { 
        description: true, 
        title: true, 
        address: true, 
        city: true, 
        neighborhood: true, 
        category_name: true 
      },
    });

    if (!business) {
      return res.status(404).json({ message: 'Listing Business not found.' });
    }

    let prompt: string;
    let actionTaken: 'generated' | 'optimized';

    if (!business.description || business.description.trim() === '') {
      actionTaken = 'generated';
      // Construct location string, preferring more specific details
      let locationInfo = business.address || business.neighborhood || business.city || 'its area';
      if (business.city && business.address && !business.address.includes(business.city)) {
        locationInfo = `${business.address}, ${business.city}`;
      }

      prompt = `You are an expert copywriter. Generate an engaging, clear, concise, and SEO-friendly business description for a business named "${business.title}". 
It is in the category of "${business.category_name || 'general business'}" and located around ${locationInfo}. 
Highlight its potential key services or unique selling points based on its name and category. Keep the tone professional and inviting. Provide only the description text.`;
      console.log(`Generating new description for listing business ID: ${listingBusinessId} as description is empty.`);
    } else {
      actionTaken = 'optimized';
      prompt = `You are an expert copywriter. Optimize the following business description to be more engaging, clear, concise, and SEO-friendly. Highlight key services or unique selling points. Keep the tone professional and inviting. Original description: "${business.description}"`;
      console.log(`Optimizing existing description for listing business ID: ${listingBusinessId}`);
    }

    console.log(`Prompt sent to OpenAI: ${prompt}`);

    let newOrOptimizedDescription: string | undefined | null = null;
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", 
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300, 
        temperature: 0.7, 
      });
      newOrOptimizedDescription = completion.choices[0]?.message?.content?.trim();
    } catch (openaiError) {
      console.error('Error calling OpenAI API:', openaiError);
      return res.status(500).json({ message: `Failed to ${actionTaken} description via OpenAI.` });
    }

    if (!newOrOptimizedDescription) {
        return res.status(500).json({ message: `OpenAI did not return a ${actionTaken} description.` });
    }

    const updatedBusiness = await prisma.listingBusiness.update({
      where: { listing_business_id: listingBusinessId }, 
      data: { 
        description: newOrOptimizedDescription,
        descriptionOptimized: true,
        descriptionLastOptimizedAt: new Date(),
      },
    });

    return res.status(200).json({ 
      message: actionTaken === 'generated' ? 'Description generated successfully.' : 'Description optimized successfully.', 
      originalDescription: business.description, // Original description (could be null/empty if generated)
      optimizedDescription: updatedBusiness.description, 
      descriptionOptimized: updatedBusiness.descriptionOptimized, 
    });

  } catch (error) {
    console.error('Error optimizing description:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(500).json({ message: 'Internal Server Error while optimizing description', error: errorMessage });
  }
}
