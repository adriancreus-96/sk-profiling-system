import express from 'express';
import multer from 'multer';
import { 
  createEvent,
  getAllEventsAdmin,
  getEventByIdAdmin,
  updateEvent,
  deleteEvent,
  publishEvent,
  getPublishedEvents,
  getEventById,
  registerForEvent,
  unregisterFromEvent,
  markAttendance,
  getMyEvents,
  getUserEventAttendance  // ← ADD THIS IMPORT
} from '../controllers/eventController';
import { verifyAdminToken, verifyUserToken } from '../middleware/authMiddleware';

const router = express.Router();

// Optional authentication middleware
const optionalUserAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'fallback_secret_key';
    const decoded = jwt.verify(token, secret) as any;
    req.user = { id: decoded.id, role: decoded.role || 'user' };
    next();
  } catch (error) {
    next();
  }
};

// ============================================
// MULTER — memory storage
// ============================================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// ============================================
// ADMIN ROUTES (Protected)
// ============================================

// Create new event
router.post('/', verifyAdminToken, upload.single('posterImage'), createEvent);

// Get all events (admin view)
router.get('/admin/all', verifyAdminToken, getAllEventsAdmin);

// Get single event details (admin view)
router.get('/admin/:id', verifyAdminToken, getEventByIdAdmin);

// Update event
router.put('/admin/:id', verifyAdminToken, upload.single('posterImage'), updateEvent);

// Delete event
router.delete('/admin/:id', verifyAdminToken, deleteEvent);

// Publish event
router.put('/admin/:id/publish', verifyAdminToken, publishEvent);

// Mark attendance (QR scan)
router.post('/attendance', verifyAdminToken, markAttendance);

// ============================================
// USER ROUTES
// ============================================

// Get all published events
router.get('/', optionalUserAuth, getPublishedEvents);

// Get user's registered events
router.get('/user/my-events', verifyUserToken, getMyEvents);

// Get user's event attendance history (admin viewing a specific user)
// ← ADD THIS ROUTE
router.get('/user/:userId/attendance', verifyAdminToken, getUserEventAttendance);

// Get single event details
router.get('/:id', getEventById);

// Register for event
router.post('/:id/register', verifyUserToken, registerForEvent);

// Unregister from event
router.post('/:id/unregister', verifyUserToken, unregisterFromEvent);

export default router;