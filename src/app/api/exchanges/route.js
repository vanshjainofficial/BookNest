import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Exchange from '@/models/Exchange';
import Book from '@/models/Book';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
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
      
    const userId = currentUser.userId;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; 
    const status = searchParams.get('status') || 'all';


    let query = {};

    if (type === 'sent') {
      query.requesterId = userId;
    } else if (type === 'received') {
      query.ownerId = userId;
    } else {
      query.$or = [
        { requesterId: userId },
        { ownerId: userId }
      ];
    }

    if (status !== 'all') {
      query.status = status;
    }

    const exchanges = await Exchange.find(query)
      .populate('requesterId', 'name profilePicture rating')
      .populate('ownerId', 'name profilePicture rating')
      .populate('bookId', 'title author coverImage')
      .sort({ createdAt: -1 });

    return NextResponse.json({ exchanges });

  } catch (error) {
    console.error('Get exchanges error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const decoded = verifyToken(token);
      
    if (!decoded) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
      
    const userId = decoded.userId;
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    const currentUser = { name: user.name, email: user.email };

    const { bookId, requestMessage } = await request.json();

    if (!bookId) {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      );
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    if (book.ownerId.toString() === userId) {
      return NextResponse.json(
        { error: 'You cannot request your own book' },
        { status: 400 }
      );
    }

    if (book.status !== 'available') {
      return NextResponse.json(
        { error: 'Book is not available for exchange' },
        { status: 400 }
      );
    }
    const existingExchange = await Exchange.findOne({
      bookId,
      requesterId: userId,
      status: 'pending'
    });

    if (existingExchange) {
      return NextResponse.json(
        { error: 'You have already requested this book' },
        { status: 400 }
      );
    }
    const exchange = new Exchange({
      requesterId: userId,
      ownerId: book.ownerId,
      bookId,
      requestMessage: requestMessage || ''
    });

    await exchange.save();

    try {
      const { sendEmail, getUserEmail } = await import('@/lib/email');
      const ownerEmail = await getUserEmail(book.ownerId);
      const requesterName = currentUser.name || 'A user';
      
      if (ownerEmail) {
        await sendEmail(ownerEmail, 'exchangeRequest', [
          requesterName,
          book.title,
          book.ownerId.name || 'Book Owner'
        ]);
      }
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
    }

    await Book.findByIdAndUpdate(bookId, { status: 'exchanging' });

    const notification = new Notification({
      userId: book.ownerId,
      type: 'exchange_request',
      title: 'New Exchange Request',
      message: `Someone wants to exchange your book "${book.title}"`,
      relatedId: exchange._id,
      relatedModel: 'Exchange'
    });

    await notification.save();

    await exchange.populate([
      { path: 'requesterId', select: 'name profilePicture rating' },
      { path: 'ownerId', select: 'name profilePicture rating' },
      { path: 'bookId', select: 'title author coverImage' }
    ]);

    return NextResponse.json({
      message: 'Exchange request sent successfully',
      exchange
    }, { status: 201 });

  } catch (error) {
    console.error('Create exchange error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
