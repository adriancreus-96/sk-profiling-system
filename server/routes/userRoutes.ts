import express from 'express';
import multer from 'multer';
import { getUserProfile, updateUserProfile } from '../controllers/userController';
import { verifyUserToken } from '../middleware/authMiddleware';

const router = express.Router();

// Configure multer for profile picture uploads
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Route: GET /api/user/profile
// Get complete user profile data
router.get('/profile', verifyUserToken, getUserProfile);

// Route: PUT /api/user/update-profile
// Protected - requires valid user JWT token
// Accepts optional profile picture upload
router.put('/update-profile', verifyUserToken, upload.single('profilePicture'), updateUserProfile);

export default router;