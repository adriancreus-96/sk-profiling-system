import dotenv from 'dotenv';
dotenv.config();

import { Request, Response } from 'express';
import Event from '../models/Event';
import User from '../models/User';
import { Readable } from 'stream';

const cloudinary = require('cloudinary').v2;

// ============================================
// CLOUDINARY HELPER
// ============================================

const uploadToCloudinary = (buffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'sk-event-posters',
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 675, crop: 'fill' }, // 16:9 ratio for event posters
          { quality: 'auto' },
        ],
      },
      (error: any, result: any) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
};

// ============================================
// ADMIN CONTROLLERS
// ============================================

// 1. CREATE EVENT (Admin Only)
export const createEvent = async (req: Request, res: Response) => {
  try {
    const {
      title, description, eventDate, startTime, endTime,
      location, venue, category, pointsReward, maxCapacity, status
    } = req.body;

    const adminId = (req as any).admin?.id || (req as any).user?.id;
    if (!adminId) {
      return res.status(401).json({ message: 'Admin authentication required' });
    }

    // Upload poster to Cloudinary if provided
    let posterImage: string | null = null;
    if (req.file) {
      try {
        console.log('📤 Uploading event poster to Cloudinary...');
        posterImage = await uploadToCloudinary(req.file.buffer);
        console.log('✅ Event poster uploaded:', posterImage);
      } catch (uploadError: any) {
        console.error('Failed to upload event poster:', uploadError);
        return res.status(500).json({ message: 'Failed to upload event poster.' });
      }
    }

    const event = new Event({
      title, description,
      eventDate: new Date(eventDate),
      startTime, endTime,
      location, venue, category,
      posterImage,
      pointsReward: pointsReward || 10,
      maxCapacity: maxCapacity || undefined,
      status: status || 'Draft',
      createdBy: adminId,
      registered: [],
      attendees: []
    });

    await event.save();

    res.status(201).json({
      message: 'Event created successfully',
      eventId: event.eventId,
      event
    });
  } catch (error: any) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Failed to create event', error: error.message });
  }
};

// 2. GET ALL EVENTS (Admin View - includes drafts)
export const getAllEventsAdmin = async (req: Request, res: Response) => {
  try {
    const events = await Event.find()
      .populate('createdBy', 'username')
      .sort({ eventDate: -1 });

    const eventsWithCounts = events.map(event => ({
      ...event.toObject(),
      registeredCount: event.registered.length,
      attendeesCount: event.attendees.length
    }));

    res.json(eventsWithCounts);
  } catch (error: any) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Failed to fetch events', error: error.message });
  }
};


export const getEventByIdAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id)
      .populate('createdBy', 'username')
      .populate({
        path: 'registered',
        select: '-passwordHash'  // Only exclude password
      })
      .populate({
        path: 'attendees',
        select: '-passwordHash'  // Only exclude password
      })
      .lean();  // Convert to plain JavaScript object

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error: any) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Failed to fetch event', error: error.message });
  }
};

// 4. UPDATE EVENT (Admin Only)
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const {
      title, description, eventDate, startTime, endTime,
      location, venue, category, pointsReward, maxCapacity, status
    } = req.body;

    // Update text fields if provided
    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (eventDate !== undefined) event.eventDate = new Date(eventDate);
    if (startTime !== undefined) event.startTime = startTime;
    if (endTime !== undefined) event.endTime = endTime;
    if (location !== undefined) event.location = location;
    if (venue !== undefined) event.venue = venue;
    if (category !== undefined) event.category = category;
    if (pointsReward !== undefined) event.pointsReward = pointsReward;
    if (maxCapacity !== undefined) event.maxCapacity = maxCapacity || undefined;
    if (status !== undefined) event.status = status;

    // Upload new poster to Cloudinary if provided
    if (req.file) {
      try {
        console.log('📤 Uploading updated event poster to Cloudinary...');
        event.posterImage = await uploadToCloudinary(req.file.buffer);
        console.log('✅ Event poster updated:', event.posterImage);
      } catch (uploadError: any) {
        console.error('Failed to upload event poster:', uploadError);
        return res.status(500).json({ message: 'Failed to upload event poster.' });
      }
    }
    // If no req.file → posterImage is untouched (keeps current Cloudinary URL)

    await event.save();

    res.json({ message: 'Event updated successfully', event });
  } catch (error: any) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Failed to update event', error: error.message });
  }
};

// 5. DELETE EVENT (Admin Only)
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const event = await Event.findByIdAndDelete(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully', deletedEvent: event });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Failed to delete event', error: error.message });
  }
};

// 6. PUBLISH EVENT (Change status from Draft to Published)
export const publishEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const event = await Event.findByIdAndUpdate(
      id,
      { status: 'Published' },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event published successfully', event });
  } catch (error: any) {
    console.error('Error publishing event:', error);
    res.status(500).json({ message: 'Failed to publish event', error: error.message });
  }
};

// ============================================
// USER CONTROLLERS
// ============================================

// 7. GET PUBLISHED EVENTS (User View - only published events)
export const getPublishedEvents = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const userId = (req as any).user?.id;

    const events = await Event.find({
      status: 'Published',
      eventDate: { $gte: now }
    })
    .sort({ eventDate: 1 })
    .select('-createdBy');

    const formattedEvents = events.map(event => ({
      id: event._id,
      eventId: event.eventId,
      title: event.title,
      date: event.eventDate.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      }),
      time: event.startTime,
      location: event.location,
      venue: event.venue,
      image: event.posterImage, // Now a full Cloudinary URL
      registered: event.registered.length,
      maxCapacity: event.maxCapacity || null,
      description: event.description,
      category: event.category,
      pointsReward: event.pointsReward,
      qrCode: event.qrCode,
      isRegistered: userId ? event.registered.some(id => id.toString() === userId) : false
    }));

    res.json(formattedEvents);
  } catch (error: any) {
    console.error('Error fetching published events:', error);
    res.status(500).json({ message: 'Failed to fetch events', error: error.message });
  }
};

// 8. GET SINGLE EVENT DETAILS (User View)
export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id).select('-createdBy -attendees');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.status !== 'Published') {
      return res.status(403).json({ message: 'Event not available' });
    }

    const formattedEvent = {
      id: event._id,
      eventId: event.eventId,
      title: event.title,
      date: event.eventDate.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      }),
      time: `${event.startTime} - ${event.endTime}`,
      location: event.location,
      venue: event.venue,
      image: event.posterImage,
      registered: event.registered.length,
      maxCapacity: event.maxCapacity || null,
      description: event.description,
      category: event.category,
      pointsReward: event.pointsReward
    };

    res.json(formattedEvent);
  } catch (error: any) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Failed to fetch event', error: error.message });
  }
};

// 9. REGISTER FOR EVENT (User)
export const registerForEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.status !== 'Published') {
      return res.status(403).json({ message: 'Event not available for registration' });
    }

    if (event.registered.includes(userId)) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    if (event.maxCapacity && event.registered.length >= event.maxCapacity) {
      return res.status(400).json({ message: 'Event is at full capacity' });
    }

    event.registered.push(userId);
    await event.save();

    const user = await User.findById(userId);
    if (user) {
      if (!user.eventRegistrations) user.eventRegistrations = [];
      if (!user.eventRegistrations.includes(event._id)) {
        user.eventRegistrations.push(event._id);
        await user.save();
      }
    }

    res.json({
      message: 'Successfully registered for event',
      event: { id: event._id, title: event.title, eventId: event.eventId }
    });
  } catch (error: any) {
    console.error('Error registering for event:', error);
    res.status(500).json({ message: 'Failed to register for event', error: error.message });
  }
};

// 10. UNREGISTER FROM EVENT (User)
export const unregisterFromEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!event.registered.includes(userId)) {
      return res.status(400).json({ message: 'Not registered for this event' });
    }

    event.registered = event.registered.filter(
      (regUserId) => regUserId.toString() !== userId.toString()
    );
    await event.save();

    const user = await User.findById(userId);
    if (user && user.eventRegistrations) {
      user.eventRegistrations = user.eventRegistrations.filter(
        (eventId) => eventId.toString() !== event._id.toString()
      );
      await user.save();
    }

    res.json({ message: 'Successfully unregistered from event' });
  } catch (error: any) {
    console.error('Error unregistering from event:', error);
    res.status(500).json({ message: 'Failed to unregister from event', error: error.message });
  }
};

// 11. MARK ATTENDANCE (QR Code Scan)
// REPLACE your existing markAttendance function in eventController.ts with this:

// 11. MARK ATTENDANCE (QR Code Scan) - Updated to use SK ID
export const markAttendance = async (req: Request, res: Response) => {
  try {
    const { eventId, skIdNumber } = req.body;

    if (!eventId || !skIdNumber) {
      return res.status(400).json({ message: 'Event ID and SK ID are required' });
    }

    const event = await Event.findOne({ eventId });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Find user by SK ID
    const user = await User.findOne({ skIdNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found with this SK ID' });
    }

    const userId = user._id;

    // Check if attendance already recorded (FIRST - before any modifications)
    if (event.attendees.includes(userId)) {
      return res.status(400).json({ 
        message: 'Attendance already recorded for this user',
        userName: `${user.firstName} ${user.lastName}`,
        skIdNumber: user.skIdNumber,
        alreadyRecorded: true
      });
    }

    // Determine if user was pre-registered
    const wasPreRegistered = event.registered.includes(userId);
    let pointsToAward = event.pointsReward;
    let registrationStatus = '';

    if (!wasPreRegistered) {
      // Auto-register the user if not already registered
      event.registered.push(userId);
      
      // Halve the points for walk-ins
      pointsToAward = Math.floor(event.pointsReward / 2);
      registrationStatus = ' (walk-in - half points)';
      
      // Update user's registration list
      if (!user.eventRegistrations) user.eventRegistrations = [];
      if (!user.eventRegistrations.includes(event._id)) {
        user.eventRegistrations.push(event._id);
      }
    }

    // Mark attendance
    event.attendees.push(userId);
    await event.save();

    // Update user's participation and points
    if (!user.eventParticipations) user.eventParticipations = [];
    if (!user.eventParticipations.includes(event._id)) {
      user.eventParticipations.push(event._id);
    }

    user.points = (user.points || 0) + pointsToAward;
    await user.save();

    res.json({
      message: `Attendance marked successfully${registrationStatus}`,
      pointsAwarded: pointsToAward,
      totalPoints: user.points,
      wasPreRegistered,
      user: { 
        name: `${user.firstName} ${user.lastName}`, 
        skIdNumber: user.skIdNumber 
      }
    });
  } catch (error: any) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Failed to mark attendance', error: error.message });
  }
};
// 12. GET USER'S REGISTERED EVENTS
export const getMyEvents = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const events = await Event.find({ registered: userId, status: 'Published' })
      .sort({ eventDate: 1 })
      .select('-createdBy');

    const formattedEvents = events.map(event => ({
      id: event._id,
      eventId: event.eventId,
      title: event.title,
      date: event.eventDate.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      }),
      time: event.startTime,
      location: event.location,
      image: event.posterImage,
      hasAttended: event.attendees.includes(userId),
      pointsEarned: event.attendees.includes(userId) ? event.pointsReward : 0
    }));

    res.json(formattedEvents);
  } catch (error: any) {
    console.error('Error fetching user events:', error);
    res.status(500).json({ message: 'Failed to fetch your events', error: error.message });
  }
};

export const getUserEventAttendance = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Find all events where this user is registered or has attended
    const events = await Event.find({
      $or: [
        { registered: userId },
        { attendees: userId }
      ]
    })
    .sort({ eventDate: -1 })
    .select('eventId title eventDate location category pointsReward registered attendees');

    // Map to simplified format with attendance status
    const attendance = events.map(event => {
      const hasAttended = event.attendees.some(
        (attendeeId) => attendeeId.toString() === userId
      );
      
      const registration = event.registered.find(
        (regId) => regId.toString() === userId
      );

      return {
        eventId: event.eventId,
        title: event.title,
        eventDate: event.eventDate,
        location: event.location,
        category: event.category,
        pointsReward: event.pointsReward,
        attended: hasAttended,
        registeredAt: registration ? event.createdAt : new Date() // Fallback to event creation date
      };
    });

    res.json(attendance);
  } catch (error: any) {
    console.error('Error fetching user event attendance:', error);
    res.status(500).json({ message: 'Failed to fetch attendance history', error: error.message });
  }
};