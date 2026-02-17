import dotenv from 'dotenv';
dotenv.config();

import { Request, Response } from 'express';
import User from '../models/User';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import Admin from '../models/Admin';
import jwt from 'jsonwebtoken';
import { Readable } from 'stream';

const cloudinary = require('cloudinary').v2;

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'sk-profile-pictures',
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto' }
        ]
      },
      (error: any, result: any) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
};

// 1. GET ALL PENDING USERS
export const getPendingUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({ status: 'Pending' }).select('-passwordHash');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// 2. APPROVE USER & GENERATE ID
export const approveUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentYear = new Date().getFullYear();
    const uniqueSuffix = uuidv4().split('-')[0].toUpperCase();
    const generatedId = `SK-${currentYear}-${uniqueSuffix}`;

    user.status = 'Approved';
    user.skIdNumber = generatedId;
    user.qrCode = generatedId;

    await user.save();

    res.json({ message: 'User Approved!', skIdNumber: generatedId, user });
  } catch (error) {
    res.status(500).json({ message: 'Server Error approving user' });
  }
};

export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

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
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '1d' }
    );

    res.json({ token, role: 'admin' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 4. GET ALL USERS
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

// 5. UPDATE USER (Admin Edit) — now handles FormData + optional profile picture
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log('📝 Admin update user:', id);
    console.log('Has file?:', !!req.file);
    console.log('Body keys:', Object.keys(req.body));

    // Find user first
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Extract update data from req.body (works for both JSON and FormData)
    const updateData = { ...req.body };

    // Never allow these to be updated this way
    delete updateData.passwordHash;
    delete updateData._id;
    delete updateData.skIdNumber;
    delete updateData.qrCode;
    delete updateData.status;
    delete updateData.points;

    // Fix booleans — FormData sends strings 'true'/'false'
    const booleanFields = [
      'registeredSkVoter', 'registeredNationalVoter',
      'isPwd', 'isCicwl', 'isIndigenous'
    ];
    booleanFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateData[field] = updateData[field] === 'true' || updateData[field] === true;
      }
    });

    // Fix birthday — ensure it's a Date object
    if (updateData.birthday) {
      updateData.birthday = new Date(updateData.birthday);
    }

    // Handle profile picture upload if provided
    if (req.file) {
      try {
        console.log('📤 Uploading new profile picture to Cloudinary...');
        const profilePictureUrl = await uploadToCloudinary(req.file.buffer);
        updateData.profilePicture = profilePictureUrl;
        console.log('✅ Profile picture updated:', profilePictureUrl);
      } catch (uploadError: any) {
        console.error('Failed to upload profile picture:', uploadError);
        return res.status(500).json({
          message: 'Failed to upload profile picture. Please try again.'
        });
      }
    }

    // Apply updates to user
    Object.assign(user, updateData);
    await user.save();

    // Return without password hash
    const userResponse = user.toObject();
    delete (userResponse as any).passwordHash;

    res.json(userResponse);
  } catch (error: any) {
    console.error('Update error:', error);
    res.status(500).json({ message: error.message || 'Server error updating user' });
  }
};

// 6. REJECT USER
export const rejectUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'Rejected';
    await user.save();

    res.status(200).json({ message: 'User rejected successfully', ...user.toObject() });
  } catch (error: any) {
    console.error('Error rejecting user:', error);
    res.status(500).json({ message: 'Failed to reject user', error: error.message });
  }
};

// 7. RESTORE USER
export const restoreUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'Pending';
    await user.save();

    res.status(200).json({ message: 'User restored successfully', ...user.toObject() });
  } catch (error: any) {
    console.error('Error restoring user:', error);
    res.status(500).json({ message: 'Failed to restore user', error: error.message });
  }
};

// 8. PERMANENTLY DELETE USER
export const permanentDeleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User permanently deleted', deletedUser: user });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};

export const createProfileAndApprove = async (req: Request, res: Response) => {
  try {
    const {
      email, password, firstName, lastName, middleName, suffix,
      sex, birthday, civilStatus, educationalBackground,
      youthClassification, workStatus,
      block, lot, street, purok, houseNumber, contactNumber,
      registeredSkVoter, registeredNationalVoter,
      isPwd, isCicwl, isIndigenous
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const currentYear = new Date().getFullYear();
    const uniqueSuffix = uuidv4().split('-')[0].toUpperCase();
    const generatedId = `SK-${currentYear}-${uniqueSuffix}`;

    // Handle profile picture upload if provided
    let profilePicture: string | undefined;
    if (req.file) {
      try {
        profilePicture = await uploadToCloudinary(req.file.buffer);
      } catch (uploadError) {
        console.error('Failed to upload profile picture:', uploadError);
      }
    }

    const newUser = new User({
      email,
      passwordHash: hashedPassword,
      firstName, lastName, middleName, suffix,
      sex, birthday, profilePicture,
      civilStatus, educationalBackground, youthClassification, workStatus,
      block, lot, street, purok, houseNumber, contactNumber,
      registeredSkVoter, registeredNationalVoter,
      isPwd, isCicwl, isIndigenous,
      status: 'Approved',
      skIdNumber: generatedId,
      qrCode: generatedId
    });

    const savedUser = await newUser.save();

    res.status(201).json({
      message: 'Profile created and approved successfully!',
      userId: savedUser._id,
      skIdNumber: generatedId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error during profile creation.' });
  }
};

export const markIdAsPrinted = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status !== 'Approved') {
      return res.status(400).json({ message: 'Cannot print ID for non-approved user' });
    }

    if (user.idPrinted) {
      return res.status(400).json({ 
        message: 'ID card has already been printed for this user',
        datePrinted: user.datePrinted
      });
    }

    if (!user.skIdNumber) {
      return res.status(400).json({ message: 'User does not have an SK ID number assigned' });
    }

    user.idPrinted = true;
    user.datePrinted = new Date();
    await user.save();

    res.json({
      message: 'ID marked as printed successfully',
      user: {
        _id: user._id,
        skIdNumber: user.skIdNumber,
        idPrinted: user.idPrinted,
        datePrinted: user.datePrinted
      }
    });
  } catch (error: any) {
    console.error('Error marking ID as printed:', error);
    res.status(500).json({ message: 'Failed to mark ID as printed', error: error.message });
  }
};

export const resetPrintStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.idPrinted = false;
    user.datePrinted = null;
    await user.save();

    res.json({
      message: 'Print status reset successfully',
      user: {
        _id: user._id,
        skIdNumber: user.skIdNumber,
        idPrinted: user.idPrinted,
        datePrinted: user.datePrinted
      }
    });
  } catch (error: any) {
    console.error('Error resetting print status:', error);
    res.status(500).json({ message: 'Failed to reset print status', error: error.message });
  }
};