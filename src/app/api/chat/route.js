import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Message from '@/models/Message';
import Exchange from '@/models/Exchange';
import User from '@/models/User';
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
    const exchangeId = searchParams.get('exchangeId');

    if (!exchangeId) {
      return NextResponse.json(
        { error: 'Exchange ID is required' },
        { status: 400 }
      );
    }

    const exchange = await Exchange.findById(exchangeId);
    if (!exchange) {
      return NextResponse.json(
        { error: 'Exchange not found' },
        { status: 404 }
      );
    }

    if (exchange.requesterId.toString() !== userId.toString() && 
        exchange.ownerId.toString() !== userId.toString()) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const messages = await Message.find({
      exchangeId,
      isDeleted: false
    })
    .populate('senderId', 'name profilePicture')
    .sort({ createdAt: 1 });

    return NextResponse.json({ messages });

  } catch (error) {
    console.error('Get messages error:', error);
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
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const currentUser = { name: user.name, email: user.email };
    
    const { exchangeId, content, messageType = 'text', imageUrl } = await request.json();

    if (!exchangeId) {
      return NextResponse.json(
        { error: 'Exchange ID is required' },
        { status: 400 }
      );
    }

    if (messageType === 'text' && !content) {
      return NextResponse.json(
        { error: 'Content is required for text messages' },
        { status: 400 }
      );
    }

    if (messageType === 'image' && !imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required for image messages' },
        { status: 400 }
      );
    }

    const exchange = await Exchange.findById(exchangeId);
    if (!exchange) {
      return NextResponse.json(
        { error: 'Exchange not found' },
        { status: 404 }
      );
    }

    if (exchange.requesterId.toString() !== userId.toString() && 
        exchange.ownerId.toString() !== userId.toString()) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const receiverId = exchange.requesterId.toString() === userId.toString() 
      ? exchange.ownerId 
      : exchange.requesterId;

    const message = new Message({
      senderId: userId,
      receiverId,
      exchangeId,
      content: content || '',
      messageType,
      imageUrl: imageUrl || null
    });

    await message.save();

    await Exchange.findByIdAndUpdate(exchangeId, {
      $push: { messages: message._id }
    });

    await message.populate('senderId', 'name profilePicture');
    try {
      const { sendEmail, getUserEmail } = await import('@/lib/email');
      const receiverEmail = await getUserEmail(receiverId);
      const exchange = await Exchange.findById(exchangeId)
        .populate('bookId', 'title');
      
      if (receiverEmail && exchange && exchange.bookId) {
        await sendEmail(receiverEmail, 'newMessage', [
          currentUser.name || 'A user',
          receiver.name || 'User',
          exchange.bookId.title
        ]);
      }
    } catch (emailError) {
    }

    return NextResponse.json({
      message: 'Message sent successfully',
      newMessage: message
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
