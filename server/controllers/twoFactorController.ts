import { Request, Response } from 'express';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import Admin from '../models/Admin';

// Generate 2FA secret and QR code
export const setup2FA = async (req: Request, res: Response) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `SK Admin (${admin.username})`,
      issuer: 'SK Profiling System'
    });

    // Save secret to database (temporary, not enabled yet)
    admin.twoFactorSecret = secret.base32;
    await admin.save();

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    res.json({
      message: '2FA setup initiated',
      qrCode: qrCodeUrl,
      secret: secret.base32, // Show this as backup
      manualEntryKey: secret.base32 // For manual entry in authenticator apps
    });

  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ message: 'Failed to setup 2FA' });
  }
};

// Verify and enable 2FA
export const enable2FA = async (req: Request, res: Response) => {
  try {
    const { username, token } = req.body;

    if (!username || !token) {
      return res.status(400).json({ message: 'Username and token are required' });
    }

    const admin = await Admin.findOne({ username });
    if (!admin || !admin.twoFactorSecret) {
      return res.status(400).json({ message: 'No 2FA setup found. Please setup 2FA first.' });
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: admin.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps before/after for clock skew
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Enable 2FA
    admin.twoFactorEnabled = true;
    await admin.save();

    res.json({
      message: '2FA enabled successfully',
      twoFactorEnabled: true
    });

  } catch (error) {
    console.error('2FA enable error:', error);
    res.status(500).json({ message: 'Failed to enable 2FA' });
  }
};

// Disable 2FA
export const disable2FA = async (req: Request, res: Response) => {
  try {
    const { username, token } = req.body;

    if (!username || !token) {
      return res.status(400).json({ message: 'Username and token are required' });
    }

    const admin = await Admin.findOne({ username });
    if (!admin || !admin.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled' });
    }

    // Verify current token before disabling
    const verified = speakeasy.totp.verify({
      secret: admin.twoFactorSecret!,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Disable 2FA
    admin.twoFactorEnabled = false;
    admin.twoFactorSecret = undefined;
    await admin.save();

    res.json({
      message: '2FA disabled successfully',
      twoFactorEnabled: false
    });

  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ message: 'Failed to disable 2FA' });
  }
};

// Verify 2FA token (used during login)
export const verify2FAToken = (secret: string, token: string): boolean => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2
  });
};