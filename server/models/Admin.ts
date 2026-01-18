import mongoose, { Schema, Document } from 'mongoose';

// 1. The Interface
// This tells TypeScript what an Admin object looks like in your code.
export interface IAdmin extends Document {
  username: string;
  passwordHash: string;
  position: 'SK Chairperson' | 'SK Kagawad' | 'Secretary' | 'Treasurer';
}

// 2. The Schema
// This tells MongoDB how to store the data.
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
  }
}, { timestamps: true });

export default mongoose.model<IAdmin>('Admin', AdminSchema);