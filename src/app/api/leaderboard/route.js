import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'points'; // points, exchanges, rating
    const limit = parseInt(searchParams.get('limit')) || 10;

    let sortCriteria = {};
    let selectFields = 'name profilePicture level points totalExchanges rating';

    switch (type) {
      case 'points':
        sortCriteria = { points: -1 };
        break;
      case 'exchanges':
        sortCriteria = { totalExchanges: -1 };
        break;
      case 'rating':
        sortCriteria = { rating: -1, totalRatings: -1 };
        break;
      default:
        sortCriteria = { points: -1 };
    }

    const users = await User.find({})
      .select(selectFields)
      .sort(sortCriteria)
      .limit(limit);

    // Add rank to each user
    const usersWithRank = users.map((user, index) => ({
      ...user.toObject(),
      rank: index + 1
    }));

    return NextResponse.json({
      leaderboard: usersWithRank,
      type,
      totalUsers: await User.countDocuments()
    });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
