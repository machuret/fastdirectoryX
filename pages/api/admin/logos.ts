import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import formidable, { Part, File } from 'formidable'; // For parsing multipart/form-data
import fs from 'fs/promises'; // For saving files locally (temporary)
import path from 'path'; // For constructing file paths

// Disable Next.js body parser for this route as formidable handles it
export const config = {
  api: {
    bodyParser: false,
  },
};

// Placeholder for where files will be stored locally
const UPLOAD_DIR = path.join(process.cwd(), '/public/uploads/logos');

// Ensure upload directory exists
const ensureUploadDirExists = async () => {
  try {
    await fs.access(UPLOAD_DIR);
  } catch (error) {
    // If directory doesn't exist, create it
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  // @ts-ignore // User role might not be on default session type
  if (!session || session.user?.role !== UserRole.ADMIN) {
    return res.status(403).json({ message: 'Access Denied.' });
  }

  await ensureUploadDirExists(); // Make sure the upload directory exists

  if (req.method === 'POST') {
    const form = formidable({
      uploadDir: UPLOAD_DIR,
      keepExtensions: true,
      filename: (name: string, ext: string, part: Part, form: any) => { // Using 'any' for form temporarily if PersistentForm/VolatileForm are complex to import/use directly
        // Create a unique filename, e.g., purpose-timestamp.ext
        const purposeField = form.fields.purpose;
        const purpose = Array.isArray(purposeField) ? purposeField[0] : purposeField || 'logo';
        return `${purpose}-${Date.now()}${ext}`;
      }
    });

    let uploadedFileRef: File | null = null;

    try {
      const [fields, filesFromFormidable] = await form.parse(req);
      
      const purpose = Array.isArray(fields.purpose) ? fields.purpose[0] : fields.purpose;
      const altText = Array.isArray(fields.altText) ? fields.altText[0] : fields.altText;
      const targetUrl = Array.isArray(fields.targetUrl) ? fields.targetUrl[0] : fields.targetUrl;
      const logoFile = filesFromFormidable.logoFile;

      if (!purpose) {
        return res.status(400).json({ message: 'Logo purpose is required.' });
      }

      if (!logoFile || (Array.isArray(logoFile) && logoFile.length === 0)) {
        return res.status(400).json({ message: 'Logo file is required.' });
      }

      uploadedFileRef = Array.isArray(logoFile) ? logoFile[0] : logoFile;
      const imageUrl = `/uploads/logos/${uploadedFileRef.newFilename}`; // Relative path for serving

      // Save logo information to database using Prisma
      const newLogo = await prisma.siteLogo.upsert({
        where: { purpose }, // Assumes 'purpose' is unique as defined in schema
        update: {
          imageUrl,
          altText: altText || null,
          targetUrl: targetUrl || null,
        },
        create: {
          purpose,
          imageUrl,
          altText: altText || null,
          targetUrl: targetUrl || null,
        },
      });

      return res.status(201).json(newLogo);

    } catch (error: any) {
      console.error('Logo upload error:', error);
      // Attempt to cleanup orphaned file
      if (uploadedFileRef && uploadedFileRef.filepath) {
        try {
          await fs.unlink(uploadedFileRef.filepath); // Delete the orphaned file
          console.log('Cleaned up orphaned file:', uploadedFileRef.filepath);
        } catch (cleanupError) {
          console.error('Failed to cleanup orphaned file:', cleanupError);
        }
      }
      return res.status(500).json({ message: error.message || 'Failed to process logo upload.' });
    }
  } else if (req.method === 'GET') {
    try {
      const logos = await prisma.siteLogo.findMany({
        orderBy: {
          createdAt: 'asc', // Or 'purpose' or any other field
        }
      });
      return res.status(200).json(logos);
    } catch (error) {
      console.error('Failed to fetch logos:', error);
      return res.status(500).json({ message: 'Failed to fetch logos.' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
