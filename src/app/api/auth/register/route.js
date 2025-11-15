import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { generateToken, setAuthCookie } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    
    const { name, email, password, location, bio } = await request.json();

    // Validation
    if (!name || !email || !password || !location) {
      return NextResponse.json(
        { error: 'Name, email, password, and location are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      location,
      bio: bio || ''
    });

    await user.save();

    // Generate JWT token
    const token = generateToken({
      userId: user._id,
      email: user.email,
      name: user.name
    });

    // Return response with token
    return NextResponse.json({
      message: 'User registered successfully',
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        location: user.location,
        bio: user.bio,
        profilePicture: user.profilePicture,
        rating: user.rating,
        totalExchanges: user.totalExchanges
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
