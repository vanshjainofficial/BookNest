import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
import Notification from '@/models/Notification';
import User from '@/models/User';

export async function GET(request) {
  try {
    await connectDB();
    
    
    const session = await getServerSession(authOptions);
    
    let userId;
    
    if (session?.user?.email) {
      
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

    
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);

    return NextResponse.json({
      notifications
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    
    
    const session = await getServerSession(authOptions);
    
    let userId;
    
    if (session?.user?.email) {
      
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

    const { notificationId } = await request.json();

    if (notificationId) {
      
      await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    } else {
      
      await Notification.updateMany({ userId }, { isRead: true });
    }

    return NextResponse.json({
      message: 'Notification(s) marked as read'
    });

  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}