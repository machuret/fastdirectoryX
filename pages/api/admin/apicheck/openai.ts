import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key is not configured.');
    return res.status(500).json({ message: 'OpenAI API key not configured on the server.' });
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // A simple, low-cost call to verify API key and connectivity
    await openai.models.list(); 
    return res.status(200).json({ message: 'OpenAI API connection successful. Key is valid and service is reachable.' });
  } catch (error: any) {
    console.error('OpenAI API check failed:', error);
    let errorMessage = 'Failed to connect to OpenAI API.';
    if (error.response) {
      // Error from OpenAI API itself (e.g. auth error)
      errorMessage = `OpenAI API Error: ${error.response.status} - ${error.response.data?.error?.message || error.message}`;
    } else if (error.request) {
      // Request was made but no response received
      errorMessage = 'No response received from OpenAI API. Check network connectivity.';
    } else {
      // Other errors
      errorMessage = `Error during OpenAI API check: ${error.message}`;
    }
    return res.status(500).json({ message: errorMessage });
  }
}
