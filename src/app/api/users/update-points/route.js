import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { calculateLevel } from '@/lib/points';

export async function POST(request) {
  try {
    await connectDB();
    
    
    const session = await getServerSession(authOptions);
    
    let userId;
    
    if (session?.user) {
      
      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      userId = user._id;
    } else {
      
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7);
      const { verifyToken } = await import('@/lib/auth');
      const currentUser = verifyToken(token);
      
      if (!currentUser) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
      
      userId = currentUser.userId;
    }

    
    const users = await User.find({});
    
    for (const user of users) {
      const currentPoints = user.points || 0;
      const newLevel = calculateLevel(currentPoints);
      
      if (user.level !== newLevel) {
        await User.findByIdAndUpdate(user._id, { level: newLevel });
        console.log(`Updated user ${user.name} from ${user.level} to ${newLevel} (${currentPoints} points)`);
      }
    }

    return NextResponse.json({
      message: 'All user levels updated successfully',
      updatedCount: users.length
    });

  } catch (error) {
    console.error('Update points error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
