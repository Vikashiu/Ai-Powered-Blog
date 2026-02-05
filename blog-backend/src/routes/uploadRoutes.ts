import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

// 1. Configure Cloudinary with your keys
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Set up the Storage Engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'lumina-blog', // The folder name in your Cloudinary account
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    // Optional: Resize excessively large images automatically
    transformation: [{ width: 1200, crop: "limit" }] 
  } as any
});

const upload = multer({ storage });

// 3. The Endpoint: POST /api/upload
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
     res.status(400).json({ error: 'No file uploaded' });
     return;
  }
  
  // Cloudinary returns the hosted URL in req.file.path
  res.json({ url: req.file.path });
});

export default router;