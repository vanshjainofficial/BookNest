import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
import Book from '@/models/Book';
import User from '@/models/User';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { id } = await params;

    const book = await Book.findById(id)
      .populate('ownerId', 'name location profilePicture rating totalExchanges bio');

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await Book.findByIdAndUpdate(id, { $inc: { views: 1 } });

    return NextResponse.json({ book });

  } catch (error) {
    console.error('Get book error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    // Try NextAuth session first
    const session = await getServerSession(authOptions);
    
    let userId;
    
    if (session?.user) {
      // Get user ID from database using email
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

    const { id } = await params;

    const book = await Book.findById(id);
    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Check if user owns the book
    if (book.ownerId.toString() !== userId) {
      return NextResponse.json(
        { error: 'You can only edit your own books' },
        { status: 403 }
      );
    }

    const updateData = await request.json();

    // Remove fields that shouldn't be updated directly
    delete updateData.ownerId;
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const updatedBook = await Book.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('ownerId', 'name location profilePicture rating');

    return NextResponse.json({
      message: 'Book updated successfully',
      book: updatedBook
    });

  } catch (error) {
    console.error('Update book error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    // Try NextAuth session first
    const session = await getServerSession(authOptions);
    
    let userId;
    
    if (session?.user) {
      // Get user ID from database using email
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

    const { id } = await params;

    const book = await Book.findById(id);
    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Check if user owns the book
    if (book.ownerId.toString() !== userId) {
      return NextResponse.json(
        { error: 'You can only delete your own books' },
        { status: 403 }
      );
    }

    // Actually delete the book from database
    await Book.findByIdAndDelete(id);

    return NextResponse.json({
      message: 'Book deleted successfully'
    });

  } catch (error) {
    console.error('Delete book error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
