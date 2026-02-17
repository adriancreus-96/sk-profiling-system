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
} from '../controllers/adminController';
import { verifyAdminToken } from '../middleware/authMiddleware';

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

// ── PUBLIC ROUTE (no token needed) ──
router.post('/login', loginAdmin);

// ── PROTECTED ROUTES (require valid admin token) ──
router.post('/approve-and-create-profile', verifyAdminToken, upload.single('profilePicture'), createProfileAndApprove);
router.get('/pending', verifyAdminToken, getPendingUsers);
router.get('/users', verifyAdminToken, getAllUsers);
router.put('/approve/:id', verifyAdminToken, approveUser);
router.put('/update-user/:id', verifyAdminToken, upload.single('profilePicture'), updateUser);
router.put('/reject/:id', verifyAdminToken, rejectUser);
router.put('/restore/:id', verifyAdminToken, restoreUser);
router.delete('/permanent-delete/:id', verifyAdminToken, permanentDeleteUser);

// Mark ID as printed (called after user prints the ID)
router.post('/users/:userId/mark-printed', verifyAdminToken, markIdAsPrinted);

// Reset print status (allows re-printing - admin only)
router.post('/users/:userId/reset-print', verifyAdminToken, resetPrintStatus);

export default router;