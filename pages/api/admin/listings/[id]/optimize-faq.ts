import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getSession } from 'next-auth/react';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface FAQItem {
  question: string;
  answer: string;
}

interface OptimizeFAQResponse {
  message?: string;
  faq?: FAQItem[];
  error?: string;
}

export default async function handle(req: NextApiRequest, res: NextApiResponse<OptimizeFAQResponse>) {
  const session = await getSession({ req });

  if (!session || session.user?.role !== 'ADMIN') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const listingIdQuery = req.query.id as string;

  if (req.method === 'POST') {
    try {
      const listingId = parseInt(listingIdQuery, 10);
      if (isNaN(listingId)) {
        return res.status(400).json({ error: 'Invalid Listing ID format.' });
      }

      const business = await prisma.listingBusiness.findUnique({
        where: { listing_business_id: listingId },
        select: {
          title: true,
          description: true,
          category_name: true,
          address: true,
        },
      });

      if (!business) {
        return res.status(404).json({ error: 'Business not found' });
      }

      const businessInfo = `Name: ${business.title}\nDescription: ${business.description || ''}\nCategory: ${business.category_name || ''}\nAddress: ${business.address || ''}`;

      const prompt = `Generate a list of 4 frequently asked questions (FAQs) and their answers for the following business. The business information is: \n\n${businessInfo}\n\nProvide the output as a JSON array of objects, where each object has a "question" and "answer" key. For example: [{ "question": "Generated Question 1?", "answer": "Generated Answer 1." }, ...]

Ensure the questions are relevant to a potential customer and the answers are concise and informative based on the provided business details.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo-0125',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.5,
      });

      const rawResponse = completion.choices[0]?.message?.content;

      if (!rawResponse) {
        return res.status(500).json({ error: 'Failed to get a response from OpenAI.' });
      }

      let faqArray: FAQItem[];
      try {
        const parsedResponse = JSON.parse(rawResponse);
        if (Array.isArray(parsedResponse)) {
          faqArray = parsedResponse;
        } else if (parsedResponse.faq && Array.isArray(parsedResponse.faq)) {
          faqArray = parsedResponse.faq;
        } else {
          const firstArrayKey = Object.keys(parsedResponse).find(key => Array.isArray(parsedResponse[key]));
          if (firstArrayKey) {
            faqArray = parsedResponse[firstArrayKey];
          } else {
            throw new Error('FAQ array not found in the expected structure in OpenAI response.');
          }
        }
        
        if (!faqArray.every(item => typeof item.question === 'string' && typeof item.answer === 'string')) {
          throw new Error('Invalid FAQ item structure received from OpenAI.');
        }

      } catch (parseError: any) {
        console.error('Error parsing OpenAI FAQ response:', parseError, 'Raw response:', rawResponse);
        return res.status(500).json({ error: `Error parsing OpenAI response: ${parseError.message}` });
      }

      if (faqArray.length === 0) {
        return res.status(500).json({ error: 'OpenAI returned an empty FAQ array.' });
      }

      const updatedBusiness = await prisma.listingBusiness.update({
        where: { listing_business_id: listingId },
        data: {
          faq: faqArray,
          faqLastGeneratedAt: new Date(),
        },
      });

      return res.status(200).json({ message: 'FAQ generated successfully', faq: faqArray });

    } catch (error: any) {
      console.error('Error optimizing FAQ:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Business listing not found for update.' });
      }
      return res.status(500).json({ error: `Internal server error: ${error.message}` });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
