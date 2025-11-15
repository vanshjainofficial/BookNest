import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Forum from '@/models/Forum';
import User from '@/models/User';
import { awardPoints, POINT_REWARDS } from '@/lib/points';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'lastActivity';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    let query = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Execute query
    const posts = await Forum.find(query)
      .populate('author', 'name profilePicture level points')
      .populate('replies')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Forum.countDocuments(query);

    return NextResponse.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get forum posts error:', error);
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
    const { verifyToken } = await import('@/lib/auth');
    const currentUser = verifyToken(token);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = currentUser.userId;
    const { title, content, category, tags } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Create new forum post
    const post = new Forum({
      title,
      content,
      author: userId,
      category: category || 'general',
      tags: tags || []
    });

    await post.save();

    // Award points for creating a post
    await awardPoints(userId, POINT_REWARDS.CREATE_FORUM_POST, 'Creating a forum post');

    // Populate author data
    await post.populate('author', 'name profilePicture level points');

    return NextResponse.json({
      message: 'Forum post created successfully',
      post
    }, { status: 201 });

  } catch (error) {
    console.error('Create forum post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
