import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface RequestBody {
  ids?: string[];
}

interface OptimizationResult {
  id: string;
  status: 'success' | 'skipped' | 'error';
  message: string;
  originalDescription?: string | null;
  optimizedDescription?: string | null;
}

async function optimizeSingleDescription(listingBusinessIdNum: number): Promise<OptimizationResult> {
  const listingBusinessId = listingBusinessIdNum.toString(); // For consistent result ID
  try {
    const business = await prisma.listingBusiness.findUnique({
      where: { listing_business_id: listingBusinessIdNum },
      select: { description: true, title: true },
    });

    if (!business) {
      return { id: listingBusinessId, status: 'error', message: 'Listing Business not found.' };
    }

    if (!business.description || business.description.trim() === '') {
      return { id: listingBusinessId, status: 'skipped', message: 'Description is empty, nothing to optimize.' };
    }

    const prompt = `You are an expert copywriter. Optimize the following business description for "${business.title || 'this business'}" to be more engaging, clear, concise, and SEO-friendly. Highlight key services or unique selling points. Keep the tone professional and inviting. Original description: "${business.description}"`;

    let newOptimizedDescription: string | undefined | null = null;
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 350, 
        temperature: 0.7,
      });
      newOptimizedDescription = completion.choices[0]?.message?.content?.trim();
    } catch (openaiError) {
      console.error(`OpenAI API error for listing ${listingBusinessIdNum}:`, openaiError);
      return { id: listingBusinessId, status: 'error', message: 'OpenAI API call failed.' };
    }

    if (!newOptimizedDescription) {
      return { id: listingBusinessId, status: 'error', message: 'OpenAI did not return an optimized description.' };
    }

    await prisma.listingBusiness.update({
      where: { listing_business_id: listingBusinessIdNum },
      data: {
        description: newOptimizedDescription,
        descriptionOptimized: true,
        descriptionLastOptimizedAt: new Date(),
      },
    });

    return {
      id: listingBusinessId,
      status: 'success',
      message: 'Description optimized successfully.',
      originalDescription: business.description,
      optimizedDescription: newOptimizedDescription,
    };

  } catch (error) {
    console.error(`Error optimizing description for listing ${listingBusinessIdNum}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { id: listingBusinessId, status: 'error', message: `Internal error: ${errorMessage}` };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const { ids } = req.body as RequestBody;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'An array of listing IDs is required.' });
  }

  const results: OptimizationResult[] = [];
  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const idStr of ids) {
    let listingBusinessIdNum: number;
    try {
      listingBusinessIdNum = parseInt(idStr, 10);
      if (isNaN(listingBusinessIdNum)) {
        results.push({ id: idStr, status: 'error', message: 'Invalid ID format.' });
        errorCount++;
        continue;
      }
    } catch (e) {
      results.push({ id: idStr, status: 'error', message: 'Invalid ID format.' });
      errorCount++;
      continue;
    }
    
    const result = await optimizeSingleDescription(listingBusinessIdNum);
    results.push(result);
    if (result.status === 'success') successCount++;
    else if (result.status === 'skipped') skippedCount++;
    else errorCount++;
  }

  const summaryMessage = `Mass optimization process completed. Successful: ${successCount}, Skipped: ${skippedCount}, Errors: ${errorCount}.`;
  
  if (errorCount > 0 && successCount === 0 && skippedCount === 0) {
    // If all failed, return a more general error status
    return res.status(500).json({
      message: summaryMessage,
      successCount,
      skippedCount,
      errorCount,
      details: results,
    });
  }

  return res.status(200).json({
    message: summaryMessage,
    successCount,
    skippedCount,
    errorCount,
    details: results,
  });
}
