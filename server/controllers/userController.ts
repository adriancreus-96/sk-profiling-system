import dotenv from 'dotenv';
dotenv.config();

import { Request, Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import { Readable } from 'stream';

// Use require for cloudinary
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer: Buffer, originalname: string): Promise<string> => {
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
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('✅ Uploaded to Cloudinary:', result.secure_url);
          resolve(result.secure_url);
        }
      }
    );

    const readableStream = Readable.from(buffer);
    readableStream.pipe(uploadStream);
  });
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(userId).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log('📝 Profile update request');
    console.log('Has file?:', !!req.file);
    console.log('Body keys:', Object.keys(req.body));

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only pending users can edit their profile
    if (user.status !== 'Pending') {
      return res.status(403).json({ 
        message: 'Cannot edit profile after approval. Contact SK Admin for changes.' 
      });
    }

    // Extract data from req.body (works for both JSON and FormData)
    const {
      firstName, lastName, middleName, suffix,
      sex, birthday, civilStatus, educationalBackground,
      youthClassification, workStatus,
      purok, block, lot, houseNumber, street,
      registeredSkVoter, registeredNationalVoter,
      isPwd, isCicwl, isIndigenous
    } = req.body;

    // Update fields only if provided
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (middleName !== undefined) user.middleName = middleName || undefined;
    if (suffix !== undefined) user.suffix = suffix || undefined;
    if (sex !== undefined) user.sex = sex;
    if (birthday !== undefined) user.birthday = new Date(birthday);
    if (civilStatus !== undefined) user.civilStatus = civilStatus;
    if (educationalBackground !== undefined) user.educationalBackground = educationalBackground;
    if (youthClassification !== undefined) user.youthClassification = youthClassification;
    if (workStatus !== undefined) user.workStatus = workStatus;
    if (purok !== undefined) user.purok = purok;
    if (block !== undefined) user.block = block || undefined;
    if (lot !== undefined) user.lot = lot || undefined;
    if (houseNumber !== undefined) user.houseNumber = houseNumber || undefined;
    if (street !== undefined) user.street = street || undefined;

    // Handle boolean fields (they come as strings 'true'/'false' from FormData)
    if (registeredSkVoter !== undefined) {
      user.registeredSkVoter = registeredSkVoter === 'true' || registeredSkVoter === true;
    }
    if (registeredNationalVoter !== undefined) {
      user.registeredNationalVoter = registeredNationalVoter === 'true' || registeredNationalVoter === true;
    }
    if (isPwd !== undefined) {
      user.isPwd = isPwd === 'true' || isPwd === true;
    }
    if (isCicwl !== undefined) {
      user.isCicwl = isCicwl === 'true' || isCicwl === true;
    }
    if (isIndigenous !== undefined) {
      user.isIndigenous = isIndigenous === 'true' || isIndigenous === true;
    }

    // Handle profile picture upload if provided
    if (req.file) {
      try {
        console.log('📤 Uploading new profile picture to Cloudinary...');
        const profilePictureUrl = await uploadToCloudinary(req.file.buffer, req.file.originalname);
        user.profilePicture = profilePictureUrl;
        console.log('✅ Profile picture updated:', profilePictureUrl);
      } catch (uploadError: any) {
        console.error('Failed to upload profile picture:', uploadError);
        return res.status(500).json({ 
          message: 'Failed to upload profile picture. Please try again.' 
        });
      }
    }

    await user.save();
    
    console.log('✅ Profile updated successfully');
    
    // Return user without password hash
    const userResponse = user.toObject();
    delete (userResponse as any).passwordHash;
    
    res.json(userResponse);
  } catch (error: any) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      message: error.message || 'Server error updating profile' 
    });
  }
};