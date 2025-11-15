import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Book from '@/models/Book';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';

export async function GET(request) {
  try {
    await connectDB();
    
    // Check NextAuth session first
    const session = await getServerSession(authOptions);
    let userId;
    
    if (session?.user) {
      // For NextAuth users, get user from database
      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      userId = user._id;
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
      const currentUser = verifyToken(token);
      
      if (!currentUser) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
      userId = currentUser.userId;
    }

    console.log('My Books API - User ID:', userId);
    
    const books = await Book.find({ 
      ownerId: userId,
      status: 'available' // Only show available books (not in exchange)
    }).sort({ createdAt: -1 });

    console.log('Found my books:', books.length);

    return NextResponse.json({ books });

  } catch (error) {
    console.error('Get my books error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
