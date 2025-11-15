import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Book from '@/models/Book';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    
    const session = await getServerSession(authOptions);
    
    if (session?.user) {
      
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
    }

    const userId = params.id;

    
    const user = await User.findById(userId)
      .select('name email profilePicture bio location rating exchangesCompleted createdAt');

    
    if (!user.exchangesCompleted || user.exchangesCompleted === 0) {
      const Exchange = (await import('@/models/Exchange')).default;
      const completedExchanges = await Exchange.countDocuments({
        $or: [
          { requesterId: userId, status: 'completed' },
          { ownerId: userId, status: 'completed' }
        ]
      });
      
      
      await User.findByIdAndUpdate(userId, { 
        exchangesCompleted: completedExchanges 
      });
      
      user.exchangesCompleted = completedExchanges;
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    
    const books = await Book.find({ 
      ownerId: userId,
      status: 'available'
    })
    .select('title author coverImage genre condition description isbn publishedYear language pageCount tags')
    .sort({ createdAt: -1 });

    console.log('User Profile API - User:', user.name, 'Books:', books.length);

    return NextResponse.json({ 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        location: user.location,
        rating: user.rating || 0,
        exchangesCompleted: user.exchangesCompleted || 0,
        createdAt: user.createdAt
      },
      books: books.map(book => ({
        _id: book._id,
        title: book.title,
        author: book.author,
        coverImage: book.coverImage,
        genre: book.genre,
        condition: book.condition,
        description: book.description,
        isbn: book.isbn,
        publishedYear: book.publishedYear,
        language: book.language,
        pageCount: book.pageCount,
        tags: book.tags
      }))
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
