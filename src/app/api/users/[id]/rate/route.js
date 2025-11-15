import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { verifyToken } from '@/lib/auth';
import { addPointsForRating, addPointsForFiveStarRating } from '@/lib/points-utils';

export async function POST(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;
    const { rating, review } = await request.json();


    let raterId;

    
    const session = await getServerSession(authOptions);
    
    if (session?.user?.id) {
      raterId = session.user.id;
    } else {
      
      const authHeader = request.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'No authentication provided' }, { status: 401 });
      }

      const token = authHeader.split(' ')[1];
      
      
      const decoded = verifyToken(token);
      if (!decoded) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
      
      raterId = decoded.userId;
    }

    
    if (raterId === id) {
      return NextResponse.json({ error: 'Cannot rate yourself' }, { status: 400 });
    }

    
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    
    const userToRate = await User.findById(id);
    if (!userToRate) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    
    const existingRating = userToRate.ratings.find(r => r.raterId.toString() === raterId);
    
    if (existingRating) {
      
      existingRating.rating = rating;
      existingRating.review = review || '';
      existingRating.updatedAt = new Date();
    } else {
      
      userToRate.ratings.push({
        raterId,
        rating,
        review: review || '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    
    const totalRatings = userToRate.ratings.length;
    const sumRatings = userToRate.ratings.reduce((sum, r) => sum + r.rating, 0);
    userToRate.rating = totalRatings > 0 ? sumRatings / totalRatings : 0;

    await userToRate.save();

    
    if (!existingRating) {
      await addPointsForRating(raterId);
    }

    
    if (rating === 5) {
      await addPointsForFiveStarRating(id);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Rating submitted successfully',
      newRating: userToRate.rating,
      totalRatings: totalRatings
    });

  } catch (error) {
    console.error('Error submitting rating:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    let userId;

    
    const session = await getServerSession(authOptions);
    
    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      
      const authHeader = request.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'No authentication provided' }, { status: 401 });
      }

      const token = authHeader.split(' ')[1];
      
      
      const decoded = verifyToken(token);
      if (!decoded) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
      
      userId = decoded.userId;
    }

    
    const user = await User.findById(id).select('ratings rating');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    
    const userRating = user.ratings.find(r => r.raterId.toString() === userId);

    return NextResponse.json({ 
      userRating: userRating || null,
      averageRating: user.rating,
      totalRatings: user.ratings.length
    });

  } catch (error) {
    console.error('Error fetching rating:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
