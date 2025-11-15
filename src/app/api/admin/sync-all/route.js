import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { calculateLevel } from '@/lib/points';
import { createLeaderboardNotification } from '@/lib/notifications';

export async function POST(request) {
  try {
    await connectDB();
    
    // Get all users and update their levels based on current points
    const users = await User.find({}).sort({ points: -1 });
    let updatedCount = 0;
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const currentPoints = user.points || 0;
      const newLevel = calculateLevel(currentPoints);
      
      if (user.level !== newLevel) {
        await User.findByIdAndUpdate(user._id, { level: newLevel });
        console.log(`Updated user ${user.name} from ${user.level} to ${newLevel} (${currentPoints} points)`);
        updatedCount++;
      }
      
      // Create leaderboard position notification for top users
      const position = i + 1;
      if (position <= 10) {
        try {
          await createLeaderboardNotification(user._id, position, users.length);
        } catch (error) {
          console.error('Error creating leaderboard notification:', error);
        }
      }
    }

    return NextResponse.json({
      message: 'All users synced successfully',
      totalUsers: users.length,
      updatedCount: updatedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sync all error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
