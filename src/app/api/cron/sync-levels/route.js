import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { calculateLevel } from '@/lib/points';

export async function GET(request) {
  try {
    await connectDB();
    
    const users = await User.find({});
    let updatedCount = 0;
    
    for (const user of users) {
      const currentPoints = user.points || 0;
      const newLevel = calculateLevel(currentPoints);
      
      if (user.level !== newLevel) {
        await User.findByIdAndUpdate(user._id, { level: newLevel });
        console.log(`Updated user ${user.name} from ${user.level} to ${newLevel} (${currentPoints} points)`);
        updatedCount++;
      }
    }

    return NextResponse.json({
      message: 'Levels synced successfully',
      totalUsers: users.length,
      updatedCount: updatedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cron sync levels error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
