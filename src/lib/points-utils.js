import connectDB from './db';
import User from '@/models/User';
import { calculateLevel } from './points';


export async function addPointsToUser(userId, points, reason) {
  try {
    await connectDB();
    
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found for points update:', userId);
      return false;
    }

    
    const newPoints = (user.points || 0) + points;
    const newLevel = calculateLevel(newPoints);
    
    
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


export async function addPointsForBook(userId) {
  return await addPointsToUser(userId, 15, 'Book added');
}


export async function addPointsForExchange(userId) {
  return await addPointsToUser(userId, 20, 'Exchange completed');
}


export async function addPointsForRating(userId) {
  return await addPointsToUser(userId, 5, 'Rating given');
}


export async function addPointsForFiveStarRating(userId) {
  return await addPointsToUser(userId, 10, 'Received 5-star rating');
}
