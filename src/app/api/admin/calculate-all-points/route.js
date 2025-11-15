import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { calculateLevel } from '@/lib/points';

export async function POST(request) {
  try {
    await connectDB();
    
    // Get all users
    const users = await User.find({});
    let updatedCount = 0;
    
    for (const user of users) {
      let calculatedPoints = 0;
      
      // Calculate points based on user activities
      // Points for books added
      calculatedPoints += (user.books?.length || 0) * 15;
      
      // Points for exchanges completed
      calculatedPoints += (user.totalExchanges || 0) * 20;
      
      // Points for ratings given
      calculatedPoints += (user.ratings?.length || 0) * 5;
      
      // Points for 5-star ratings received
      const fiveStarRatings = user.ratings?.filter(r => r.rating === 5).length || 0;
      calculatedPoints += fiveStarRatings * 10;
      
      // Calculate new level
      const newLevel = calculateLevel(calculatedPoints);
      
      // Update user with calculated points and level
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
