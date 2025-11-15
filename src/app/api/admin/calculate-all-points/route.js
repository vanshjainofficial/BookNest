import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { calculateLevel } from '@/lib/points';

export async function POST(request) {
  try {
    await connectDB();
    
    const users = await User.find({});
    let updatedCount = 0;
    
    for (const user of users) {
      let calculatedPoints = 0;
      
      calculatedPoints += (user.books?.length || 0) * 15;
      
      calculatedPoints += (user.totalExchanges || 0) * 20;
      
      calculatedPoints += (user.ratings?.length || 0) * 5;
      
      const fiveStarRatings = user.ratings?.filter(r => r.rating === 5).length || 0;
      calculatedPoints += fiveStarRatings * 10;
      
      const newLevel = calculateLevel(calculatedPoints);
      
      await User.findByIdAndUpdate(user._id, {
        points: calculatedPoints,
        level: newLevel
      });
      
      console.log(`Updated user ${user.name}: ${calculatedPoints} points, ${newLevel} level`);
      updatedCount++;
    }

    return NextResponse.json({
      message: 'All user points calculated and updated successfully',
      totalUsers: users.length,
      updatedCount: updatedCount
    });

  } catch (error) {
    console.error('Calculate all points error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
