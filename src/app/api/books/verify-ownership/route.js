import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Book from '@/models/Book';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    
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

    const { bookId } = await request.json();

    // Get book details
    const book = await Book.findById(bookId);
    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Get current owner details
    const currentOwner = await User.findById(book.ownerId);
    
    // Check if book is in current owner's books array
    const isInOwnerBooks = currentOwner.books.includes(bookId);

    return NextResponse.json({
      book: {
        id: book._id,
        title: book.title,
        ownerId: book.ownerId,
        status: book.status
      },
      owner: {
        id: currentOwner._id,
        name: currentOwner.name,
        hasBookInArray: isInOwnerBooks
      },
      ownershipCorrect: book.ownerId.toString() === currentOwner._id.toString() && isInOwnerBooks
    });

  } catch (error) {
    console.error('Verify ownership error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
