import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]'; // Adjust path as needed

// Disable Next.js body parsing for this route, as multer will handle it
export const config = {
  api: {
    bodyParser: false,
  },
};

// Ensure the upload directory exists
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'general');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${extension}`);
  },
});

// File filter to accept only common image types
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Error: File upload only supports the following filetypes - ' + allowedTypes));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: fileFilter,
});

// Promisify multer middleware
const runMiddleware = (req: NextApiRequest, res: NextApiResponse, fn: any) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden: Admin access required.' });
  }

  if (req.method === 'POST') {
    try {
      await runMiddleware(req, res, upload.single('file')); // 'file' is the name of the form field

      // Type assertion because multer adds `file` to the request object
      const uploadedFile = (req as NextApiRequest & { file?: Express.Multer.File }).file;

      if (!uploadedFile) {
        return res.status(400).json({ message: 'No file uploaded.' });
      }

      // Construct the public URL of the uploaded file
      const fileUrl = `/uploads/general/${uploadedFile.filename}`;
      return res.status(200).json({ message: 'File uploaded successfully', filePath: fileUrl });

    } catch (error: any) {
      console.error('Upload error:', error);
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File is too large. Maximum size is 5MB.' });
      }
      if (error.message.startsWith('Error: File upload only supports')) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: `Upload failed: ${error.message}` });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
