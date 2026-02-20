import dotenv from 'dotenv';
dotenv.config();

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';                          
import User, { IUser } from '../models/User';
import jwt from 'jsonwebtoken';
import { Readable } from 'stream';

// Use require for cloudinary
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Debug: Check if config is loaded
console.log('🔧 Cloudinary config in controller:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing'
});

// Helper function to send email via Brevo API
const sendBrevoEmail = async (to: string, subject: string, htmlContent: string) => {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY || '',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: 'SK Youth Registration',
        email: process.env.EMAIL_USER || 'noreply@skprofiling.com',
      },
      to: [{ email: to }],
      subject: subject,
      htmlContent: htmlContent,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Brevo API error: ${error}`);
  }

  return response.json();
};

// Store verification codes temporarily (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string; expiresAt: number }>();

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer: Buffer, originalname: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Configure Cloudinary HERE, right before upload
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    
    console.log('🔧 Cloudinary config:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing'
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

    // Convert buffer to stream and pipe to Cloudinary
    const readableStream = Readable.from(buffer);
    readableStream.pipe(uploadStream);
  });
};

// Generate 6-digit verification code
const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// --- SEND VERIFICATION CODE ---
export const sendVerificationCode = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if email already exists in database
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Generate verification code
    const code = generateVerificationCode();
    
    // Store code with expiration (10 minutes)
    verificationCodes.set(email, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    console.log(`📧 Sending verification code to ${email}: ${code}`);

    // Send email using Brevo API
    await sendBrevoEmail(
      email,
      'Email Verification Code - SK Youth Registration',
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background-color: #f9fafb;">
        <div style="background-color: white; padding: 32px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h2 style="color: #2563eb; margin-bottom: 16px; font-size: 24px;">Email Verification</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Thank you for registering with SK Youth Registration System! Please use the following verification code to complete your registration:
          </p>
          <div style="background-color: #eff6ff; padding: 24px; text-align: center; margin: 24px 0; border-radius: 8px; border: 2px solid #2563eb;">
            <h1 style="color: #1e40af; letter-spacing: 8px; margin: 0; font-size: 36px; font-weight: bold;">${code}</h1>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            <strong>Important:</strong> This code will expire in 10 minutes.
          </p>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            If you didn't request this code, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            SK Youth Registration System © ${new Date().getFullYear()}
          </p>
        </div>
      </div>
    `
    );

    console.log(`✅ Verification code sent to ${email}`);

    res.status(200).json({ 
      message: 'Verification code sent successfully',
      success: true 
    });

  } catch (error: any) {
    console.error('Error sending verification code:', error);
    res.status(500).json({ 
      message: 'Failed to send verification code',
      error: error.message 
    });
  }
};

// --- VERIFY CODE ---
export const verifyCode = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    const storedData = verificationCodes.get(email);

    if (!storedData) {
      return res.status(400).json({ message: 'No verification code found for this email' });
    }

    // Check if code expired
    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(email);
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    // Check if code matches
    if (storedData.code !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Code is valid - remove it from storage
    verificationCodes.delete(email);

    console.log(`✅ Email verified successfully: ${email}`);

    res.status(200).json({ 
      message: 'Email verified successfully',
      success: true 
    });

  } catch (error: any) {
    console.error('Error verifying code:', error);
    res.status(500).json({ 
      message: 'Failed to verify code',
      error: error.message 
    });
  }
};

// Password validation function (simplified)
const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
};

// --- REGISTER YOUTH ---
export const registerUser = async (req: Request, res: Response) => {
  try {
    console.log('📝 Registration request received');
    console.log('Has file?:', !!req.file);
    
    const { 
      email, password, firstName, lastName, middleName, suffix,
      sex, birthday, civilStatus, educationalBackground, 
      youthClassification, workStatus, 
      block, lot, street, purok, contactNumber, houseNumber,
      registeredSkVoter, registeredNationalVoter, 
      isPwd, isCicwl, isIndigenous
    } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    // 2. Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    // 3. Validate age (15-30 years old)
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 15 || age > 30) {
      return res.status(400).json({ message: 'You must be between 15 and 30 years old to register.' });
    }

    // 4. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Upload profile picture to Cloudinary if provided
    let profilePicture: string | undefined = undefined;
    
    if (req.file) {
      try {
        console.log('📤 Uploading to Cloudinary...');
        profilePicture = await uploadToCloudinary(req.file.buffer, req.file.originalname);
      } catch (uploadError: any) {
        console.error('Failed to upload image:', uploadError);
        return res.status(500).json({ 
          message: 'Failed to upload profile picture. Please try again.' 
        });
      }
    }

    // 6. Create the new User object
    const newUser = new User({
      email,
      passwordHash: hashedPassword,
      firstName, lastName, middleName, suffix,
      sex, birthday, profilePicture,
      civilStatus, educationalBackground, youthClassification, workStatus,
      block, lot, street, purok, contactNumber, houseNumber,
      registeredSkVoter: registeredSkVoter === 'true' || registeredSkVoter === true,
      registeredNationalVoter: registeredNationalVoter === 'true' || registeredNationalVoter === true,
      isPwd: isPwd === 'true' || isPwd === true,
      isCicwl: isCicwl === 'true' || isCicwl === true,
      isIndigenous: isIndigenous === 'true' || isIndigenous === true
    });

    // 7. Save to Database
    const savedUser = await newUser.save();
    
    console.log('✅ User registered successfully');

    res.status(201).json({ 
      message: 'Registration successful! Your account is pending approval.', 
      userId: savedUser._id 
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: error.message || 'Server Error during registration.' 
    });
  }
};

// --- LOGIN USER ---
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: 'user' }, 
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        skIdNumber: user.skIdNumber,
        qrCode: user.qrCode,
        profilePicture: user.profilePicture
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server Error during login.' });
  }
};


// --- FORGOT PASSWORD ---
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    console.log('--- forgotPassword hit ---');
    console.log('Body:', req.body);

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    console.log('Looking up user:', email);
    const user = await User.findOne({ email });
    console.log('User found:', !!user);
    
    if (!user) {
      return res.status(200).json({
        message: 'If an account with that email exists, a reset link has been sent.',
      });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.passwordResetToken  = hashedToken;
    user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}&email=${user.email}`;

    // Send password reset email using Brevo API
    await sendBrevoEmail(
      user.email,
      'SK System – Password Reset Request',
      `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #1e40af;">Password Reset Request</h2>
        <p style="color: #4b5563;">
          You requested a password reset for your SK System account.
          Click the button below to choose a new password.
        </p>
        <a href="${resetUrl}"
           style="display: inline-block; margin: 24px 0; padding: 12px 28px;
                  background-color: #2563eb; color: #fff; border-radius: 6px;
                  text-decoration: none; font-weight: 600;">
          Reset My Password
        </a>
        <p style="color: #6b7280; font-size: 13px;">
          This link expires in <strong>1 hour</strong>.<br>
          If you did not request a password reset, you can safely ignore this email.
        </p>
      </div>
    `
    );

    res.status(200).json({
      message: 'If an account with that email exists, a reset link has been sent.',
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error during forgot password.' });
  }
};


// --- RESET PASSWORD ---
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, email, newPassword } = req.body;

    if (!token || !email || !newPassword) {
      return res.status(400).json({ message: 'Token, email, and new password are required.' });
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    const user = await User.findOne({ email });
    if (!user || !user.passwordResetToken || !user.passwordResetExpiry) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    if (user.passwordResetExpiry < new Date()) {
      user.passwordResetToken  = null;
      user.passwordResetExpiry = null;
      await user.save();
      return res.status(400).json({ message: 'Reset token has expired. Please request a new one.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    if (hashedToken !== user.passwordResetToken) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);

    user.passwordResetToken  = null;
    user.passwordResetExpiry = null;

    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error during password reset.' });
  }
};

// Clean up expired verification codes periodically (run every 15 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of verificationCodes.entries()) {
    if (now > data.expiresAt) {
      verificationCodes.delete(email);
      console.log(`🧹 Cleaned up expired verification code for ${email}`);
    }
  }
}, 15 * 60 * 1000);