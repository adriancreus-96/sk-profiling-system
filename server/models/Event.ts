import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IEvent extends Document {
  eventId: string;              // Unique ID like "EVT-2026-ABC123"
  title: string;
  description: string;
  eventDate: Date;
  startTime: string;            // "2:00 PM"
  endTime: string;              // "5:00 PM"
  location: string;             // "Barangay Covered Court"
  venue: string;                // Additional venue details
  category: string;             // "Sports", "Educational", etc.
  posterImage?: string;         // URL to uploaded image
  pointsReward: number;         // Points for attending (default: 10)
  maxCapacity?: number;         // Max participants (optional)
  
  // Tracking
  registered: mongoose.Types.ObjectId[];  // Users who clicked "Register"
  attendees: mongoose.Types.ObjectId[];   // Users who actually attended (QR scanned)
  
  // QR Code for check-in
  qrCode: string;               // Generated QR code data (matches eventId)
  
  // Status
  status: 'Draft' | 'Published' | 'Cancelled' | 'Completed';
  
  // Metadata
  createdBy: mongoose.Types.ObjectId;     // Admin who created
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>({
  eventId: { 
    type: String, 
    unique: true 
  },
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String, 
    required: true 
  },
  eventDate: { 
    type: Date, 
    required: true 
  },
  startTime: { 
    type: String, 
    required: true 
  },
  endTime: { 
    type: String, 
    required: true 
  },
  location: { 
    type: String, 
    required: true 
  },
  venue: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    required: true,
    enum: ['Sports', 'Educational', 'Cultural', 'Health', 'Environmental', 'Social', 'Others']
  },
  posterImage: { 
    type: String,
    default: null
  },
  pointsReward: { 
    type: Number, 
    required: true,
    default: 10,
    min: 0
  },
  maxCapacity: { 
    type: Number,
    min: 1
  },
  registered: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  attendees: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  qrCode: { 
    type: String
  },
  status: { 
    type: String, 
    enum: ['Draft', 'Published', 'Cancelled', 'Completed'],
    default: 'Draft' 
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'Admin',
    required: true 
  }
}, {
  timestamps: true
});

// Generate unique Event ID before validation
EventSchema.pre('validate', function() {
  if (!this.eventId) {
    const currentYear = new Date().getFullYear();
    const uniqueSuffix = uuidv4().split('-')[0].toUpperCase();
    this.eventId = `EVT-${currentYear}-${uniqueSuffix}`;
    this.qrCode = this.eventId; // QR code contains the event ID
  }
});

export default mongoose.model<IEvent>('Event', EventSchema);