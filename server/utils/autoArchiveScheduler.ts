import cron from 'node-cron';
import User from '../models/User';

/**
 * Automatically archive users who turn 31 years old
 * This runs daily at midnight
 */
export const scheduleAutoArchive = () => {
  // Run every day at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('Running auto-archive job for users turning 31...');
      
      const today = new Date();
      // Calculate the date 31 years ago
      const thirtyOneYearsAgo = new Date(
        today.getFullYear() - 31,
        today.getMonth(),
        today.getDate()
      );

      // Find all users who are now 31 or older and not already archived/rejected
      const usersToArchive = await User.find({
        birthday: { $lte: thirtyOneYearsAgo },
        status: { $nin: ['Archived', 'Rejected'] }
      });

      if (usersToArchive.length > 0) {
        // Update all users 31 or older to Archived status
        await User.updateMany(
          {
            birthday: { $lte: thirtyOneYearsAgo },
            status: { $nin: ['Archived', 'Rejected'] }
          },
          {
            $set: { status: 'Archived' }
          }
        );

        console.log(`Auto-archived ${usersToArchive.length} users who are 31 years or older`);
      } else {
        console.log('No users to auto-archive');
      }
    } catch (error) {
      console.error('Error in auto-archive job:', error);
    }
  });

  console.log('Auto-archive scheduler initialized - will run daily at midnight to archive users turning 31');
};