// c:\alpha\pages\api\csp-report.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // The body of the request will contain the CSP violation report
    // For now, we'll just log it to the console.
    // In a production environment, you'd want to send this to a logging service.
    console.warn('CSP Violation Report:', JSON.stringify(req.body, null, 2));
    
    // Browsers expect a 204 No Content response for CSP reports
    res.status(204).end();
  } else {
    // Only POST method is allowed for this endpoint
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
