import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import Admin from './models/Admin';

dotenv.config();

const seedAdmin = async () => {
  try {
    // 1. Connect
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sk-profiling-db');
    console.log('Connected to MongoDB...');

    // 2. DELETE existing admin to start fresh
    await Admin.deleteMany({ username: 'admin' });
    console.log('Old admin account deleted.');

    // 3. Create NEW Admin
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);

    const newAdmin = new Admin({
      username: 'admin',
      passwordHash,
      // FIXED: Must match one of your enum values exactly!
      position: 'SK Chairperson' 
    });

    await newAdmin.save();
    console.log('------------------------------------------------');
    console.log('SUCCESS: Admin created!');
    console.log('Position: SK Chairperson');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('------------------------------------------------');
    
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedAdmin();