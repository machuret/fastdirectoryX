import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { UserRole } from '@prisma/client';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ArticleResponse {
  article?: string;
  message?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ArticleResponse>
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

  const { topicIdea, niche } = req.body;

  if (!topicIdea || typeof topicIdea !== 'string') {
    return res.status(400).json({ message: 'Topic idea is required and must be a string.' });
  }
  if (niche && typeof niche !== 'string') {
    return res.status(400).json({ message: 'Niche must be a string if provided.' });
  }

  const systemPrompt = niche
    ? `Pretend you are an expert in ${niche}.`
    : 'You are an expert writer.';
  
  const userPrompt = `You are going to write a 1000-word article about "${topicIdea}". Showcase your expertise in this topic. Be as comprehensive as possible. Ensure the information is factual and avoid making things up. You can write more than 1000 words if required to create the best possible article. Structure the article with appropriate headings and paragraphs for readability.`;

  try {
    console.log(`Generating article for topic: ${topicIdea}, niche: ${niche || 'N/A'}`);
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Consider gpt-4 for higher quality if budget allows
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500, // Increased for a ~1000 word article (1 token ~ 0.75 words)
    });

    const article = completion.choices[0]?.message?.content;

    if (!article) {
      console.error('OpenAI article response content is null or undefined.');
      return res.status(500).json({ error: 'Failed to generate article: No content from OpenAI' });
    }
    
    console.log(`Successfully generated article for topic: ${topicIdea}`);
    return res.status(200).json({ article });

  } catch (error: any) {
    console.error('Error generating article from OpenAI:', error);
    let errorMessage = 'Failed to generate article.';
    if (error.response) {
      console.error('OpenAI API Error Response:', error.response.data);
      errorMessage = `OpenAI API Error: ${error.response.data?.error?.message || error.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return res.status(500).json({ error: errorMessage });
  }
}
