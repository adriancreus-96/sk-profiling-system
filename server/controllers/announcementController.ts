import { Request, Response } from 'express';
import Announcement from '../models/Announcement';

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

const formatDisplayDate = (isoDate: string): string =>
  new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

// ─────────────────────────────────────────────
//  1. GET ALL ACTIVE ANNOUNCEMENTS (public — used by HomePage)
//     Active = not expired and not permanent-but-deleted
// ─────────────────────────────────────────────
export const getActiveAnnouncements = async (req: Request, res: Response) => {
  try {
    const now = new Date();

    const announcements = await Announcement.find({
      $or: [
        { isPermanent: true },                        // permanent = always active
        { expiresAt: { $gt: now } },                  // timed but not yet expired
        { expiresAt: null, isPermanent: false },       // no expiry set (edge case safety)
      ],
    }).sort({ createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    console.error('Error fetching active announcements:', error);
    res.status(500).json({ message: 'Server error fetching announcements' });
  }
};

// ─────────────────────────────────────────────
//  2. GET ALL ANNOUNCEMENTS (admin — includes expired)
// ─────────────────────────────────────────────
export const getAllAnnouncements = async (req: Request, res: Response) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    console.error('Error fetching all announcements:', error);
    res.status(500).json({ message: 'Server error fetching announcements' });
  }
};

// ─────────────────────────────────────────────
//  3. CREATE ANNOUNCEMENT (admin only)
// ─────────────────────────────────────────────
export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const { title, description, eventDate, isPermanent, expiresAt } = req.body;

    // ── Validation ──
    if (!title?.trim() || !description?.trim() || !eventDate) {
      return res.status(400).json({ message: 'Title, description, and event date are required.' });
    }

    const isPerm = isPermanent === true || isPermanent === 'true';

    if (!isPerm && !expiresAt) {
      return res.status(400).json({ message: 'Expiry date is required for non-permanent announcements.' });
    }

    if (!isPerm && expiresAt && new Date(expiresAt) <= new Date(eventDate)) {
      return res.status(400).json({ message: 'Expiry date must be after the event date.' });
    }

    const announcement = new Announcement({
      title: title.trim(),
      description: description.trim(),
      date: formatDisplayDate(eventDate),
      isPermanent: isPerm,
      expiresAt: isPerm ? null : new Date(expiresAt),
    });

    const saved = await announcement.save();

    res.status(201).json({
      message: 'Announcement created successfully!',
      announcement: saved,
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: 'Server error creating announcement' });
  }
};

// ─────────────────────────────────────────────
//  4. UPDATE ANNOUNCEMENT (admin only)
//     Supports toggling isPermanent, editing text, changing expiry
// ─────────────────────────────────────────────
export const updateAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, eventDate, isPermanent, expiresAt } = req.body;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    const isPerm =
      isPermanent !== undefined
        ? isPermanent === true || isPermanent === 'true'
        : announcement.isPermanent;

    // Apply only provided fields
    if (title?.trim())       announcement.title       = title.trim();
    if (description?.trim()) announcement.description = description.trim();
    if (eventDate)           announcement.date        = formatDisplayDate(eventDate);

    announcement.isPermanent = isPerm;
    announcement.expiresAt   = isPerm ? undefined : expiresAt ? new Date(expiresAt) : announcement.expiresAt;

    const updated = await announcement.save();
    res.json({ message: 'Announcement updated successfully!', announcement: updated });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ message: 'Server error updating announcement' });
  }
};

// ─────────────────────────────────────────────
//  5. TOGGLE PERMANENT (admin — pin/unpin shortcut)
// ─────────────────────────────────────────────
export const togglePermanent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    announcement.isPermanent = !announcement.isPermanent;

    // If un-pinning and there was no expiresAt, clear it so admin can set a new one
    if (!announcement.isPermanent && !announcement.expiresAt) {
      // Leave expiresAt as null; admin should update via updateAnnouncement
    }

    const updated = await announcement.save();
    res.json({
      message: `Announcement ${updated.isPermanent ? 'pinned' : 'unpinned'} successfully!`,
      announcement: updated,
    });
  } catch (error) {
    console.error('Error toggling permanent:', error);
    res.status(500).json({ message: 'Server error toggling announcement' });
  }
};

// ─────────────────────────────────────────────
//  6. DELETE ANNOUNCEMENT (admin only)
// ─────────────────────────────────────────────
export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await Announcement.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.json({ message: 'Announcement deleted successfully', deletedId: id });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ message: 'Server error deleting announcement' });
  }
};