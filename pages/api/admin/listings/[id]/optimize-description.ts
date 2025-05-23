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
      where: { listing_business_id: listingBusinessId }, // Use listing_business_id and the parsed number
      select: { description: true },
    });

    if (!business) {
      return res.status(404).json({ message: 'Listing Business not found.' });
    }

    if (!business.description || business.description.trim() === '') {
      return res.status(400).json({ message: 'Listing Business description is empty, nothing to optimize.' });
    }

    // --- Placeholder for OpenAI API call ---
    console.log(`Optimizing description for listing business ID: ${listingBusinessId}`);
    console.log(`Original description: ${business.description}`);

    // Example prompt structure (you'll need to refine this)
    const prompt = `You are an expert copywriter. Optimize the following business description to be more engaging, clear, concise, and SEO-friendly. Highlight key services or unique selling points. Keep the tone professional and inviting. Original description: "${business.description}"`;

    let optimizedDescription: string | undefined | null = null;
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Or your preferred model like gpt-4
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300, // Adjust as needed, descriptions can be longer
        temperature: 0.7, // Adjust for creativity vs. factuality
      });
      optimizedDescription = completion.choices[0]?.message?.content?.trim();
    } catch (openaiError) {
      console.error('Error calling OpenAI API:', openaiError);
      return res.status(500).json({ message: 'Failed to optimize description via OpenAI.' });
    }
    // --- End of Placeholder ---

    if (!optimizedDescription) {
        return res.status(500).json({ message: 'OpenAI did not return an optimized description.' });
    }

    const updatedBusiness = await prisma.listingBusiness.update({
      where: { listing_business_id: listingBusinessId }, // Use listing_business_id and the parsed number
      data: { 
        description: optimizedDescription,
        descriptionOptimized: true,
        descriptionLastOptimizedAt: new Date(),
      },
    });

    return res.status(200).json({ 
      message: 'Description optimized successfully.', 
      originalDescription: business.description, // Original description fetched before optimization
      optimizedDescription: updatedBusiness.description, // The newly saved optimized description
      descriptionOptimized: updatedBusiness.descriptionOptimized, // Send back the new status
    });

  } catch (error) {
    console.error('Error optimizing description:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(500).json({ message: 'Internal Server Error while optimizing description', error: errorMessage });
  }
}
