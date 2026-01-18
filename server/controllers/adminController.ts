import { Request, Response } from 'express';
import User from '../models/User';
import { v4 as uuidv4 } from 'uuid'; 
import bcrypt from 'bcrypt';
import Admin from '../models/Admin';
import jwt from 'jsonwebtoken';

// 1. GET ALL PENDING USERS
export const getPendingUsers = async (req: Request, res: Response) => {
  try {
    // Find all users where status is 'Pending'
    // .select('-passwordHash') means "don't send the password back to the frontend"
    const users = await User.find({ status: 'Pending' }).select('-passwordHash');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// 2. APPROVE USER & GENERATE ID
export const approveUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Get User ID from URL (e.g., /approve/12345)

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // --- GENERATE ID LOGIC ---
    // Example format: SK-2026-ABCD (Year + Random string)
    const currentYear = new Date().getFullYear();
    const uniqueSuffix = uuidv4().split('-')[0].toUpperCase(); // Get first part of UUID
    const generatedId = `SK-${currentYear}-${uniqueSuffix}`;

    // Update User
    user.status = 'Approved';
    user.skIdNumber = generatedId;
    user.qrCode = generatedId; // The QR code will just contain this ID string

    await user.save();

    res.json({ 
      message: 'User Approved!', 
      skIdNumber: generatedId,
      user 
    });

  } catch (error) {
    res.status(500).json({ message: 'Server Error approving user' });
  }
};

export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Check 'Admin' collection, not 'User'
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(400).json({ message: 'Admin not found' });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Admin credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, role: 'admin' }, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: '1d' }
    );

    res.json({ token, role: 'admin' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 4. GET ALL USERS (For the Youth Profiles Dashboard)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // Fetch everyone, sorted by newest first
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

// 5. UPDATE USER (Admin Edit)
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Don't allow updating these fields through this endpoint
    delete updateData.passwordHash;
    delete updateData._id;
    
    // SK ID Number can only be set through approval, not edited
    if (updateData.skIdNumber && updateData.skIdNumber !== req.body.skIdNumber) {
      delete updateData.skIdNumber;
    }

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: 'Server error updating user' });
  }
};