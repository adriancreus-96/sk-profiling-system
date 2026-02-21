import express from 'express';
import multer from 'multer';
import { 
  getPendingUsers, 
  approveUser, 
  loginAdmin, 
  getAllUsers, 
  updateUser, 
  rejectUser,
  restoreUser,
  permanentDeleteUser,
  createProfileAndApprove,
  resetPrintStatus, 
  markIdAsPrinted,
  getAdminProfile
} from '../controllers/adminController';
import { setup2FA, enable2FA, disable2FA } from '../controllers/twoFactorController';
import { verifyAdminToken } from '../middleware/authMiddleware';
import { 
  adminLoginLimiter, 
  twoFactorSetupLimiter, 
  adminApiLimiter 
} from '../middleware/rateLimiters';

const router = express.Router();

// Multer using memory storage (file goes to buffer, then we upload to Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req: any, file: any, cb: any) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(file.mimetype) && allowed.test(file.originalname.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Apply general rate limiter to all admin routes
router.use(adminApiLimiter);

// ===== AUTHENTICATION ROUTES =====
// Login (with rate limiting)
router.post('/login', adminLoginLimiter, loginAdmin);

// Get admin profile
router.get('/profile', verifyAdminToken, getAdminProfile);

// ===== 2FA ROUTES =====
// Setup 2FA (generate QR code) - requires authentication
router.post('/2fa/setup', verifyAdminToken, setup2FA);

// Enable 2FA (verify and activate) - requires authentication
router.post('/2fa/enable', verifyAdminToken, enable2FA);

// Disable 2FA - requires authentication
router.post('/2fa/disable', verifyAdminToken, disable2FA);

// ===== USER MANAGEMENT ROUTES (PROTECTED) =====
router.post('/approve-and-create-profile', verifyAdminToken, upload.single('profilePicture'), createProfileAndApprove);
router.get('/pending', verifyAdminToken, getPendingUsers);
router.get('/users', verifyAdminToken, getAllUsers);
router.put('/approve/:id', verifyAdminToken, approveUser);
router.put('/update-user/:id', verifyAdminToken, upload.single('profilePicture'), updateUser);
router.put('/reject/:id', verifyAdminToken, rejectUser);
router.put('/restore/:id', verifyAdminToken, restoreUser);
router.delete('/permanent-delete/:id', verifyAdminToken, permanentDeleteUser);

// ID Printing routes
router.post('/users/:userId/mark-printed', verifyAdminToken, markIdAsPrinted);
router.post('/users/:userId/reset-print', verifyAdminToken, resetPrintStatus);

export default router;