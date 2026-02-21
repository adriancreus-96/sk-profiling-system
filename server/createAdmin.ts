import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import readline from 'readline';
import Admin from './models/Admin';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

const createAdmin = async () => {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sk-profiling-db');
    console.log('✅ Connected to MongoDB\n');

    let createAnother = true;

    while (createAnother) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('        CREATE NEW ADMIN ACCOUNT        ');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Get username
      const username = await question('Enter username: ');

      // Check if username already exists
      const existingAdmin = await Admin.findOne({ username });
      if (existingAdmin) {
        console.log('\n❌ Error: Username already exists. Try a different username.\n');
        continue;
      }

      // Get password
      const password = await question('Enter password: ');

      if (password.length < 6) {
        console.log('\n❌ Error: Password must be at least 6 characters.\n');
        continue;
      }

      // Get position
      console.log('\nSelect position:');
      console.log('  1. SK Chairperson');
      console.log('  2. SK Kagawad');
      console.log('  3. Secretary');
      console.log('  4. Treasurer');
      
      const positionChoice = await question('Enter choice (1-4): ');
      
      const positions = ['SK Chairperson', 'SK Kagawad', 'Secretary', 'Treasurer'];
      const positionIndex = parseInt(positionChoice) - 1;

      if (positionIndex < 0 || positionIndex > 3) {
        console.log('\n❌ Error: Invalid position choice.\n');
        continue;
      }

      const position = positions[positionIndex];

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create the admin
      const newAdmin = new Admin({
        username,
        passwordHash,
        position
      });

      await newAdmin.save();

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('       ✅ ADMIN CREATED SUCCESSFULLY      ');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Username: ${username}`);
      console.log(`Position: ${position}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Ask if they want to create another
      const response = await question('Create another admin? (y/n): ');
      createAnother = response.toLowerCase() === 'y' || response.toLowerCase() === 'yes';
      console.log('');
    }

    // List all admins
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('         ALL ADMIN ACCOUNTS           ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const allAdmins = await Admin.find({}).select('username position createdAt');
    
    if (allAdmins.length === 0) {
      console.log('No admins found.');
    } else {
      allAdmins.forEach((admin, index) => {
        console.log(`\n${index + 1}. Username: ${admin.username}`);
        console.log(`   Position: ${admin.position}`);
        console.log(`   Created: ${admin.createdAt?.toLocaleDateString()}`);
      });
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ Error creating admin:', error);
  } finally {
    rl.close();
    mongoose.connection.close();
    console.log('✅ Disconnected from MongoDB');
  }
};

createAdmin();