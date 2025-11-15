import connectDB from './db';
import User from '@/models/User';
import { calculateLevel } from './points';

// Add points to user and update level
export async function addPointsToUser(userId, points, reason) {
  try {
    await connectDB();
    
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found for points update:', userId);
      return false;
    }

    // Add points
    const newPoints = (user.points || 0) + points;
    const newLevel = calculateLevel(newPoints);
    
    // Update user
    await User.findByIdAndUpdate(userId, {
      points: newPoints,
      level: newLevel
    });

    console.log(`Added ${points} points to user ${user.name} (${reason}). New total: ${newPoints} points, Level: ${newLevel}`);
    
    return {
      success: true,
      newPoints,
      newLevel,
      pointsAdded: points,
      reason
    };
  } catch (error) {
    console.error('Error adding points to user:', error);
    return { success: false, error: error.message };
  }
}

// Add points for book addition
export async function addPointsForBook(userId) {
  return await addPointsToUser(userId, 15, 'Book added');
}

// Add points for exchange completion
export async function addPointsForExchange(userId) {
  return await addPointsToUser(userId, 20, 'Exchange completed');
}

// Add points for giving rating
export async function addPointsForRating(userId) {
  return await addPointsToUser(userId, 5, 'Rating given');
}

// Add points for receiving 5-star rating
export async function addPointsForFiveStarRating(userId) {
  return await addPointsToUser(userId, 10, 'Received 5-star rating');
}
