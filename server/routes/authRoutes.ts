import express from 'express';
import multer from 'multer';
import { 
  registerUser, 
  loginUser, 
  forgotPassword, 
  resetPassword,
  sendVerificationCode,
  verifyCode
} from '../controllers/authController';

const router = express.Router();

// Configure multer for memory storage (Cloudinary upload)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Email Verification Routes
router.post('/send-verification-code', sendVerificationCode);
router.post('/verify-code', verifyCode);

// Authentication Routes
router.post('/register', upload.single('profilePicture'), registerUser);
router.post('/login', loginUser);

// Password Reset Routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;