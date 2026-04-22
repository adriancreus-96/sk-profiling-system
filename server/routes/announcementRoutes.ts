import express from 'express';
import {
  getActiveAnnouncements,
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  togglePermanent,
  deleteAnnouncement,
} from '../controllers/announcementController';
import { verifyAdminToken } from '../middleware/authMiddleware';
import { adminApiLimiter } from '../middleware/rateLimiters';

const router = express.Router();

// Apply general rate limiter to all announcement routes
router.use(adminApiLimiter);

// ─────────────────────────────────────────────
//  PUBLIC — used by the youth-facing HomePage
// ─────────────────────────────────────────────

// GET /api/announcements/active
// Returns only non-expired announcements (no auth required)
router.get('/active', getActiveAnnouncements);

// ─────────────────────────────────────────────
//  ADMIN — protected routes
// ─────────────────────────────────────────────

// GET /api/announcements
// Returns ALL announcements including expired (admin view)
router.get('/', verifyAdminToken, getAllAnnouncements);

// POST /api/announcements
// Create a new announcement
router.post('/', verifyAdminToken, createAnnouncement);

// PUT /api/announcements/:id
// Edit title, description, date, isPermanent, expiresAt
router.put('/:id', verifyAdminToken, updateAnnouncement);

// PATCH /api/announcements/:id/toggle-permanent
// Quick pin/unpin toggle
router.patch('/:id/toggle-permanent', verifyAdminToken, togglePermanent);

// DELETE /api/announcements/:id
// Permanently remove an announcement
router.delete('/:id', verifyAdminToken, deleteAnnouncement);

export default router;