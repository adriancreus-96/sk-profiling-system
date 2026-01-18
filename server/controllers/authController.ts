import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User, { IUser } from '../models/User';
import jwt from 'jsonwebtoken';

// --- REGISTER YOUTH ---
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { 
      // Extract specific fields to ensure we don't accidentally allow admin flags
      email, password, firstName, lastName, middleName, suffix,
      sex, birthday, profilePicture, civilStatus, educationalBackground, 
      youthClassification, workStatus, 
      block, lot, street, purok, contactNumber,
      registeredSkVoter, registeredNationalVoter, 
      isPwd, isCicwl, isIndigenous
    } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    // 2. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create the new User object
    // Notice we do NOT include 'points', 'qrCode', or 'status' here.
    // They automatically default to 0, null, and 'Pending' based on your Schema.
    const newUser = new User({
      email,
      passwordHash: hashedPassword,
      firstName, lastName, middleName, suffix,
      sex, birthday, profilePicture,
      civilStatus, educationalBackground, youthClassification, workStatus,
      block, lot, street, purok, contactNumber,
      registeredSkVoter, registeredNationalVoter, 
      isPwd, isCicwl, isIndigenous
    });

    // 4. Save to Database
    const savedUser = await newUser.save();

    res.status(201).json({ 
      message: 'Registration successful! Your account is pending approval.', 
      userId: savedUser._id 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error during registration.' });
  }
};

// --- LOGIN USER ---
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 2. Check Password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 3. Generate Token (The "Digital Key")
    // This token proves who they are without asking for a password every time.
    const token = jwt.sign(
      { id: user._id, role: 'user' }, 
      process.env.JWT_SECRET || 'fallback_secret_key', // You should add JWT_SECRET to your .env file later
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
        skIdNumber: user.skIdNumber, // Frontend needs this to display the ID
        qrCode: user.qrCode
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server Error during login.' });
  }
};