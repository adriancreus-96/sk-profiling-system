import mongoose, { Schema, Document } from 'mongoose';

// 1. The Interface
export interface IAdmin extends Document {
  username: string;
  passwordHash: string;
  position: 'SK Chairperson' | 'SK Kagawad' | 'Secretary' | 'Treasurer';
  twoFactorSecret?: string;      // 2FA secret key
  twoFactorEnabled: boolean;     // Whether 2FA is enabled
  createdAt?: Date;
  updatedAt?: Date;
}

// 2. The Schema
const AdminSchema: Schema = new Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  passwordHash: { 
    type: String, 
    required: true 
  },
  position: { 
    type: String, 
    enum: ['SK Chairperson', 'SK Kagawad', 'Secretary', 'Treasurer'], 
    required: true 
  },
  twoFactorSecret: {
    type: String,
    required: false
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model<IAdmin>('Admin', AdminSchema);