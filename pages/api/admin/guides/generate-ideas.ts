import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { UserRole } from '@prisma/client';
import OpenAI from 'openai';

// Ensure your OPENAI_API_KEY is set in your .env file
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface IdeasResponse {
  ideas?: string[];
  message?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<IdeasResponse>
) {
  const session = await getServerSession(req, res, authOptions);

  // @ts-ignore session.user.role is a custom field
  if (!session || session.user?.role !== UserRole.ADMIN) {
    return res.status(403).json({ message: 'Forbidden: Access denied.' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const { niche } = req.body;

  if (!niche || typeof niche !== 'string') {
    return res.status(400).json({ message: 'Niche is required and must be a string.' });
  }

  try {
    console.log(`Generating ideas for niche: ${niche}`);
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Or your preferred model, e.g., gpt-4
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates unique article ideas. Format the response as a numbered list, providing only the ideas themselves, each on a new line, without the numbering.',
        },
        {
          role: 'user',
          content: `Give me 10 unique article ideas about ${niche}.`,
        },
      ],
      temperature: 0.7, // Adjust for creativity
      max_tokens: 200, // Adjust as needed
      n: 1, // Number of completions to generate
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      console.error('OpenAI response content is null or undefined.');
      return res.status(500).json({ error: 'Failed to generate ideas: No content from OpenAI' });
    }

    // Parse the ideas from the numbered list format
    // Assuming OpenAI returns something like: "1. Idea one\n2. Idea two\n..."
    // Or if we instruct it to not use numbers: "Idea one\nIdea two\n..."
    const ideas = content
      .trim()
      .split('\n')
      .map(idea => idea.replace(/^\d+\.?\s*/, '').trim()) // Remove numbering and trim whitespace
      .filter(idea => idea.length > 0);

    if (ideas.length === 0) {
        console.warn('OpenAI generated an empty list of ideas or parsing failed for niche:', niche, 'Raw content:', content);
        return res.status(500).json({ error: 'Failed to parse ideas from OpenAI response or no ideas were generated.' });
    }

    console.log(`Generated ${ideas.length} ideas for niche: ${niche}`);
    return res.status(200).json({ ideas });

  } catch (error: any) {
    console.error('Error generating ideas from OpenAI:', error);
    let errorMessage = 'Failed to generate ideas.';
    if (error.response) {
      console.error('OpenAI API Error Response:', error.response.data);
      errorMessage = `OpenAI API Error: ${error.response.data?.error?.message || error.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return res.status(500).json({ error: errorMessage });
  }
}
