import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncementDocument extends Document {
  title: string;
  description: string;
  date: string;          // human-readable display date e.g. "March 15, 2026"
  isPermanent: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncementDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    date: {
      type: String,
      required: true, // display string e.g. "April 22, 2026"
    },
    isPermanent: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
  }
);

// Index: quickly fetch non-expired announcements sorted by newest first
AnnouncementSchema.index({ expiresAt: 1 });
AnnouncementSchema.index({ createdAt: -1 });

export default mongoose.model<IAnnouncementDocument>('Announcement', AnnouncementSchema);