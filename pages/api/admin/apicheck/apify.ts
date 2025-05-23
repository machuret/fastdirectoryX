import type { NextApiRequest, NextApiResponse } from 'next';
import { ApifyClient } from 'apify-client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const apifyToken = process.env.APIFY_API_TOKEN;

  if (!apifyToken) {
    console.error('Apify API token is not configured.');
    return res.status(500).json({ message: 'Apify API token (APIFY_API_TOKEN) not configured on the server.' });
  }

  const apifyClient = new ApifyClient({ token: apifyToken });

  try {
    // A simple call to get user info to verify API key and connectivity
    // This is a basic call and should be low-cost.
    const user = await apifyClient.user().get();
    if (user && user.id) {
      return res.status(200).json({ message: `Apify API connection successful. Token is valid and service is reachable. User ID: ${user.id}` });
    } else {
      throw new Error('Received unexpected response from Apify while fetching user.');
    }
  } catch (error: any) {
    console.error('Apify API check failed:', error);
    let errorMessage = 'Failed to connect to Apify API.';
    if (error.message) {
        errorMessage = `Apify API Error: ${error.message}`;
    }
    // The apify-client might not structure errors like OpenAI client with response/request fields directly
    // So we primarily rely on error.message
    return res.status(500).json({ message: errorMessage });
  }
}
