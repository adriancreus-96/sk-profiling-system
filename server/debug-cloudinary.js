// Debug script to test Cloudinary configuration
// Run this with: node debug-cloudinary.js

require('dotenv').config();

console.log('\n=== CLOUDINARY CONFIGURATION DEBUG ===\n');

// Check environment variables
console.log('1. Environment Variables:');
console.log('   CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✓ Set' : '✗ Missing');
console.log('   CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✓ Set' : '✗ Missing');
console.log('   CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✓ Set' : '✗ Missing');

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.log('\n❌ ERROR: Missing Cloudinary credentials in .env file!');
  console.log('\nAdd these to your .env file:');
  console.log('CLOUDINARY_CLOUD_NAME=your_cloud_name');
  console.log('CLOUDINARY_API_KEY=your_api_key');
  console.log('CLOUDINARY_API_SECRET=your_api_secret');
  process.exit(1);
}

// Test Cloudinary import
console.log('\n2. Testing Cloudinary Import:');
const cloudinary = require('cloudinary').v2;
console.log('   Cloudinary imported:', typeof cloudinary === 'object' ? '✓' : '✗');
console.log('   Has uploader?:', typeof cloudinary.uploader === 'object' ? '✓' : '✗');

// Configure Cloudinary
console.log('\n3. Configuring Cloudinary:');
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Check configuration
const config = cloudinary.config();
console.log('   Cloud Name:', config.cloud_name ? '✓ ' + config.cloud_name : '✗ Not set');
console.log('   API Key:', config.api_key ? '✓ ' + config.api_key.substring(0, 5) + '...' : '✗ Not set');
console.log('   API Secret:', config.api_secret ? '✓ Set (hidden)' : '✗ Not set');

// Test multer-storage-cloudinary
console.log('\n4. Testing multer-storage-cloudinary:');
try {
  const cloudinaryStorage = require('multer-storage-cloudinary');
  console.log('   Package imported:', typeof cloudinaryStorage === 'function' ? '✓' : '✗');
  
  const storage = cloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'test-folder',
    }
  });
  
  console.log('   Storage created:', storage ? '✓' : '✗');
  console.log('   Storage type:', typeof storage);
  
} catch (error) {
  console.log('   ✗ Error creating storage:', error.message);
}

console.log('\n=== DEBUG COMPLETE ===\n');