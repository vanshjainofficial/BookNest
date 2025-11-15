import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET(request) {
  try {
    await connectDB();
    
    // Try NextAuth session first
    const session = await getServerSession(authOptions);
    
    if (session?.user) {
      // Continue to fetch users for NextAuth users
    } else {
      // Fallback to JWT token
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
    }

    // Get all users with their public data
    const users = await User.find({})
      .select('name email profilePicture bio location rating books exchangesCompleted createdAt')
      .populate('books', 'title author coverImage genre')
      .sort({ createdAt: -1 });

    console.log('All Users API - Found users:', users.length);

    // Calculate exchange counts for users who don't have it set
    const Exchange = (await import('@/models/Exchange')).default;
    const usersWithExchangeCounts = await Promise.all(
      users.map(async (user) => {
        let exchangesCompleted = user.exchangesCompleted || 0;
        
        // If exchangesCompleted is 0 or not set, calculate it from completed exchanges
        if (exchangesCompleted === 0) {
          const completedExchanges = await Exchange.countDocuments({
            $or: [
              { requesterId: user._id, status: 'completed' },
              { ownerId: user._id, status: 'completed' }
            ]
          });
          
          // Update user's exchangesCompleted count in database
          if (completedExchanges > 0) {
            await User.findByIdAndUpdate(user._id, { 
              exchangesCompleted: completedExchanges 
            });
            exchangesCompleted = completedExchanges;
          }
        }
        
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture,
          bio: user.bio,
          location: user.location,
          rating: user.rating || 0,
          books: user.books || [],
          exchangesCompleted: exchangesCompleted,
          createdAt: user.createdAt
        };
      })
    );

    return NextResponse.json({ 
      users: usersWithExchangeCounts
    });

  } catch (error) {
    console.error('Get all users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
