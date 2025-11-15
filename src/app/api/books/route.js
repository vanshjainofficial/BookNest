import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Book from '@/models/Book';
import User from '@/models/User';
import { addPointsForBook } from '@/lib/points-utils';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 12;
    const search = searchParams.get('search') || '';
    const genre = searchParams.get('genre') || '';
    const condition = searchParams.get('condition') || '';
    const location = searchParams.get('location') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const excludeOwner = searchParams.get('excludeOwner');
    const minRating = parseFloat(searchParams.get('minRating')) || 0;
    const maxDistance = parseFloat(searchParams.get('maxDistance')) || 50; 
    const userLat = parseFloat(searchParams.get('userLat'));
    const userLng = parseFloat(searchParams.get('userLng')); 

    let query = { 
      status: 'available' 
    };
    if (excludeOwner) {
      query.ownerId = { $ne: excludeOwner };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { genre: { $regex: search, $options: 'i' } }
      ];
    }

    if (genre) {
      query.genre = genre;
    }

    if (condition) {
      query.condition = condition;
    }

    if (location) {
      const usersInLocation = await User.find({ 
        location: { $regex: location, $options: 'i' } 
      }).select('_id');
      
      query.ownerId = { $in: usersInLocation.map(user => user._id) };
    }

    if (minRating > 0) {
      const usersWithRating = await User.find({ 
        rating: { $gte: minRating } 
      }).select('_id');
      
      query.ownerId = { $in: usersWithRating.map(user => user._id) };
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const skip = (page - 1) * limit;
    console.log('Books API Query:', JSON.stringify(query, null, 2));
    console.log('Exclude Owner:', excludeOwner);

    const books = await Book.find(query)
      .populate('ownerId', 'name location profilePicture rating')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Book.countDocuments(query);
    
    console.log('Found books:', books.length);
    console.log('Total books:', total);

    return NextResponse.json({
      books,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalBooks: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get books error:', error);
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
      const currentUser = verifyToken(token);
      
      if (!currentUser) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
      
    const userId = currentUser.userId;

    const {
      title,
      author,
      genre,
      condition,
      coverImage,
      description,
      isbn,
      publishedYear,
      language,
      pageCount,
      tags
    } = await request.json();
    if (!title || !author || !genre || !condition || !coverImage || !description) {
      return NextResponse.json(
        { error: 'Title, author, genre, condition, cover image, and description are required' },
        { status: 400 }
      );
    }

    const book = new Book({
      title,
      author,
      genre,
      condition,
      coverImage,
      description,
      ownerId: userId,
      isbn: isbn || '',
      publishedYear: publishedYear || null,
      language: language || 'English',
      pageCount: pageCount || null,
      tags: tags || []
    });

    await book.save();
    await User.findByIdAndUpdate(userId, {
      $push: { books: book._id }
    });

    await addPointsForBook(userId);

    await book.populate('ownerId', 'name location profilePicture rating');

    return NextResponse.json({
      message: 'Book added successfully',
      book
    }, { status: 201 });

  } catch (error) {
    console.error('Add book error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
