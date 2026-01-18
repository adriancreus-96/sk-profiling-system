import mongoose, { Schema, Document } from 'mongoose';

// --- CONSTANTS (Shared lists to prevent typos) ---
const PUROK_OPTIONS = ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5', 'Purok 6', 'Purok 7'];

// Matches standard SK forms (corrected spelling)
const CIVIL_STATUS_OPTIONS = ['Single', 'Married', 'Widowed', 'Separated', 'Live-in', 'Annulled', 'Others'];

// Updated based on Image 1
const EDUCATION_OPTIONS = [
  'Elementary Level',
  'Elementary Grad',
  'High School Level',
  'High School Grad',
  'Vocational Grad',
  'College Level',
  'College Grad',
  'Masters Level',
  'Masters Grad',
  'Doctorate Level',
  'Doctorate Graduate'
];

// Updated based on Image 2 (Top Section)
const YOUTH_CLASS_OPTIONS = [
  'In School Youth',
  'Out of School Youth',
  'Working Youth',
  'Youth with Specific Needs'
];

// Updated based on Image 2 (Bottom Section)
const WORK_STATUS_OPTIONS = [
  'Employed',
  'Unemployed',
  'Self-Employed',
  'Currently looking for a Job',
  'Not Interested Looking for a Job'
];

export interface IUser extends Document {
  // --- Personal Information ---
  lastName: string;
  firstName: string;
  middleName?: string;
  suffix?: string;
  sex: 'Male' | 'Female';
  birthday: Date;
  profilePicture?: string;
  
  // Virtuals
  readonly age: number;
  readonly youthAgeGroup: string; // Keep this generic string to avoid complex TS union errors with Virtuals

  // --- Address ---
  block?: string;
  lot?: string;
  houseNumber?: string;
  street?: string;
  purok: string; // validated by enum in schema

  // --- Account Details ---
  email: string;
  contactNumber: string;
  passwordHash: string;
  
  // --- System Data ---
  points: number;
  skIdNumber?: string; 
  qrCode?: string;     
  status: 'Pending' | 'Approved';

  // --- Demographics ---
  // Using typeof allows TS to automatically grab the values from the arrays above
  civilStatus: typeof CIVIL_STATUS_OPTIONS[number];
  educationalBackground: typeof EDUCATION_OPTIONS[number];
  youthClassification: typeof YOUTH_CLASS_OPTIONS[number];
  workStatus: typeof WORK_STATUS_OPTIONS[number];

  // --- Flags ---
  registeredSkVoter: boolean;
  registeredNationalVoter: boolean;
  isPwd: boolean;
  isCicwl: boolean;
  isIndigenous: boolean;
}

const UserSchema: Schema = new Schema({
  lastName: { type: String, required: true },
  firstName: { type: String, required: true },
  middleName: { type: String },
  suffix: { type: String },
  sex: { type: String, enum: ['Male', 'Female'], required: true },
  birthday: { type: Date, required: true },
  profilePicture: { type: String, default: null },

  block: { type: String },
  lot: { type: String },
  houseNumber: { type: String },
  street: { type: String },
  // FIXED: Added enum validation here
  purok: { type: String, enum: PUROK_OPTIONS, required: true },

  email: { type: String, required: true, unique: true },
  contactNumber: { type: String, required: true },
  passwordHash: { type: String, required: true },
  
  points: { type: Number, default: 0 },
  skIdNumber: { type: String, default: null },
  qrCode: { type: String, default: null },     
  status: { type: String, enum: ['Pending', 'Approved'], default: 'Pending' },

  // FIXED: Added enum validation to all these fields
  civilStatus: { type: String, enum: CIVIL_STATUS_OPTIONS, required: true },
  educationalBackground: { type: String, enum: EDUCATION_OPTIONS, required: true },
  youthClassification: { type: String, enum: YOUTH_CLASS_OPTIONS, required: true },
  workStatus: { type: String, enum: WORK_STATUS_OPTIONS, required: true },

  registeredSkVoter: { type: Boolean, default: false },
  registeredNationalVoter: { type: Boolean, default: false },
  isPwd: { type: Boolean, default: false },
  isCicwl: { type: Boolean, default: false },
  isIndigenous: { type: Boolean, default: false },

}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// --- VIRTUALS ---

// 1. Age Calculation
UserSchema.virtual('age').get(function(this: IUser) {
  if (!this.birthday) return 0;
  const today = new Date();
  const birthDate = new Date(this.birthday);
  let age = today.getFullYear() - birthDate.getFullYear();
  if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// 2. Youth Age Group Calculation (ADDED THIS BACK)
UserSchema.virtual('youthAgeGroup').get(function(this: IUser) {
  const age = this.age;
  if (age >= 15 && age <= 17) return 'Child Youth (15-17 yrs old)';
  if (age >= 18 && age <= 24) return 'Core Youth (18-24 yrs old)';
  if (age >= 25 && age <= 30) return 'Young Adult (25-30 yrs old)';
  return 'N/A';
});

export default mongoose.model<IUser>('User', UserSchema);