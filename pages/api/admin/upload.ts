import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]'; // Adjust path as needed

// Disable Next.js body parsing for this route, as multer will handle it
/**
 * Next.js API route configuration.
 * `bodyParser` is disabled because `multer` handles the request body parsing for file uploads.
 */
export const config = {
  api: {
    bodyParser: false,
  },
};

// Ensure the upload directory exists
/**
 * The absolute path to the directory where general uploaded files will be stored.
 * Defaults to `public/uploads/general`.
 */
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'general');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer for file storage
/**
 * Multer disk storage configuration.
 * - `destination`: Specifies the directory where files will be stored (`UPLOAD_DIR`).
 * - `filename`: Generates a unique filename using UUIDv4 and preserves the original file extension.
 */
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
/**
 * Multer file filter to allow only common image file types.
 * Accepted types: jpeg, jpg, png, gif, webp.
 *
 * @param {any} req The Express request object.
 * @param {Express.Multer.File} file The file being uploaded.
 * @param {multer.FileFilterCallback} cb The callback to signal acceptance or rejection of the file.
 */
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Error: File upload only supports the following filetypes - ' + allowedTypes));
};

/**
 * Multer instance configured with storage options, file size limits, and file filter.
 * - `storage`: Uses the `storage` configuration defined above.
 * - `limits`: Sets a file size limit of 5MB.
 * - `fileFilter`: Uses the `fileFilter` defined above to restrict file types.
 */
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: fileFilter,
});

// Promisify multer middleware
/**
 * Utility function to run Express-style middleware (like multer) in a Promise-based flow
 * compatible with Next.js API routes.
 *
 * @param {NextApiRequest} req The Next.js API request object.
 * @param {NextApiResponse} res The Next.js API response object.
 * @param {any} fn The middleware function to run.
 * @returns {Promise<any>} A promise that resolves if the middleware succeeds, or rejects if it errors.
 */
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

/**
 * API handler for general file uploads.
 * Requires ADMIN privileges.
 * Accepts a single file via a form field named 'file'.
 * Stores the file in `public/uploads/general` and returns its public URL.
 *
 * @param {NextApiRequest} req The Next.js API request object (multipart/form-data expected).
 * @param {NextApiResponse} res The Next.js API response object.
 *
 * @route POST /api/admin/upload
 * @description Uploads a single file (typically an image) to a general-purpose upload directory.
 * @header Content-Type multipart/form-data
 * @formDataParam {File} file - The file to upload. Max 5MB. Allowed types: jpeg, jpg, png, gif, webp.
 * @returns {Promise<void>} Responds with the public URL of the uploaded file or an error message.
 * @successResponse 200 OK - { message: string, filePath: string } Success message and the public path to the file.
 * @errorResponse 400 Bad Request - If no file is uploaded, file is too large, or file type is unsupported.
 * @errorResponse 403 Forbidden - If the user is not an ADMIN.
 * @errorResponse 500 Internal Server Error - If an unexpected error occurs during upload.
 */
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
