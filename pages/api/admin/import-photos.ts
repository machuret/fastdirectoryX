// /pages/api/admin/import-photos.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, UserRole } from '@prisma/client';
import axios from 'axios';
import { uploadToAzureBlob } from '../../../lib/azure-blob-storage'; 
import { Buffer } from 'buffer';
import { randomUUID } from 'crypto'; 
import { ApifyClient } from 'apify-client';
import { getSession } from 'next-auth/react'; 

const prisma = new PrismaClient();

// Initialize ApifyClient
const apifyClient = new ApifyClient({
  token: process.env.APIFY_KEY, 
});

const GOOGLE_IMAGES_ACTOR_ID = 'tnudF2IxzORPhg4r8'; 

async function getGoogleImageUrlsFromApify(
  queries: string[],
  maxResultsPerQuery: number = 10, 
  businessId?: number
): Promise<{ originalUrl: string; altText?: string; businessId?: number }[]> {
  console.log(`Fetching image URLs from Apify for queries: ${queries.join(', ')}`);

  if (!process.env.APIFY_KEY) {
    console.error('APIFY_KEY is not set in environment variables.');
    return [
      { originalUrl: 'https://example.com/placeholder_due_to_missing_key.jpg', altText: 'Placeholder - APIFY_KEY missing', businessId },
    ];
  }

  const input = {
    queries: queries,
    maxResultsPerQuery: maxResultsPerQuery,
  };

  try {
    const run = await apifyClient.actor(GOOGLE_IMAGES_ACTOR_ID).call(input);
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

    return items.map((item: any) => ({
      originalUrl: item.imageUrl,
      altText: item.title,
      businessId: businessId, 
    }));
  } catch (error) {
    console.error('Error fetching images from Apify:', error);
    return []; 
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  if (!session || session.user?.role !== UserRole.ADMIN) {
    return res.status(403).json({ message: 'Access Denied. Admin role required.' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { 
      queries,
      maxResultsPerQuery,
      businessId 
    } = req.body;

    if (!queries || !Array.isArray(queries) || queries.length === 0 || !queries.every(q => typeof q === 'string')) {
      return res.status(400).json({ message: 'Invalid or missing "queries". Must be a non-empty array of strings.' });
    }
    if (typeof maxResultsPerQuery !== 'number' || maxResultsPerQuery <= 0) {
      return res.status(400).json({ message: 'Invalid or missing "maxResultsPerQuery". Must be a positive number.' });
    }
    if (businessId !== undefined && typeof businessId !== 'number') {
      return res.status(400).json({ message: 'Invalid "businessId". Must be a number if provided.' });
    }

    const imageInfos = await getGoogleImageUrlsFromApify(queries, maxResultsPerQuery, businessId);

    if (!imageInfos || imageInfos.length === 0) {
      return res.status(400).json({ message: 'No image URLs provided by Apify or source.' });
    }

    const importResults = [];

    for (const imageInfo of imageInfos) {
      const { originalUrl, altText, businessId: imgBusinessId } = imageInfo; 
      let newPhotoData = null;
      let errorDetail = null;
      let status: 'success' | 'failed' = 'failed';

      try {
        const imageResponse = await axios.get(originalUrl, {
          responseType: 'arraybuffer', 
        });
        const imageBuffer = Buffer.from(imageResponse.data);
        const contentType = imageResponse.headers['content-type'] || 'application/octet-stream';
        
        const extension = contentType.split('/')[1] || 'jpg'; 
        const uniqueFileName = `photos/${imgBusinessId || 'general'}/${randomUUID()}.${extension}`;

        const azureBlobUrl = await uploadToAzureBlob(
          imageBuffer,
          uniqueFileName,
          contentType
        );

        newPhotoData = await prisma.photo.create({
          data: {
            url: azureBlobUrl,
            altText: altText,
            sourceUrl: originalUrl,
            mimeType: contentType,
            businessId: imgBusinessId, 
          },
        });
        status = 'success';
      } catch (error: any) {
        console.error(`Failed to process image ${originalUrl}:`, error);
        errorDetail = error.message || 'Unknown error during import.';
        status = 'failed';
      }
      
      importResults.push({
        sourceUrl: originalUrl,
        newUrl: newPhotoData?.url,
        photoId: newPhotoData?.id,
        status: status,
        error: errorDetail,
      });
    }

    res.status(200).json({ 
      message: `Import process completed. Processed ${imageInfos.length} images.`,
      results: importResults 
    });

  } catch (error: any) {
    console.error('General error in import-photos handler:', error);
    res.status(500).json({ message: 'Failed to import photos due to a server error.', error: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
