import User from '@/models/User';
import { createLevelUpNotification, createPointsNotification } from './notifications';

// Calculate level based on points
export function calculateLevel(points) {
  if (points >= 1000) return 'Diamond';
  if (points >= 500) return 'Platinum';
  if (points >= 200) return 'Gold';
  if (points >= 50) return 'Silver';
  return 'Bronze';
}

// Award points and update level
export async function awardPoints(userId, pointsToAdd, reason = '') {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const newPoints = (user.points || 0) + pointsToAdd;
    const newLevel = calculateLevel(newPoints);

    // Update points and level in one operation
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { 
        $inc: { points: pointsToAdd },
        level: newLevel
      },
      { new: true }
    );

    console.log(`Awarded ${pointsToAdd} points to user ${userId} for: ${reason}. New total: ${newPoints}, New level: ${newLevel}`);
    
    // Create notification for points earned
    try {
      await createPointsNotification(userId, pointsToAdd, reason);
    } catch (error) {
      console.error('Error creating points notification:', error);
    }
    
    // Check if level changed and create level up notification
    if (user.level !== newLevel) {
      try {
        await createLevelUpNotification(userId, newLevel, newPoints);
      } catch (error) {
        console.error('Error creating level up notification:', error);
      }
    }
    
    return { newPoints, newLevel, user: updatedUser };
  } catch (error) {
    console.error('Error awarding points:', error);
    throw error;
  }
}

// Update user level based on current points
export async function updateUserLevel(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const currentPoints = user.points || 0;
    const newLevel = calculateLevel(currentPoints);

    if (user.level !== newLevel) {
      await User.findByIdAndUpdate(userId, { level: newLevel });
      console.log(`Updated user ${userId} level from ${user.level} to ${newLevel} (${currentPoints} points)`);
      return { newLevel, points: currentPoints };
    }

    return { newLevel: user.level, points: currentPoints };
  } catch (error) {
    console.error('Error updating user level:', error);
    throw error;
  }
}

// Award points for different actions
export const POINT_REWARDS = {
  ADD_BOOK: 15,
  COMPLETE_EXCHANGE: 20,
  GIVE_RATING: 5,
  RECEIVE_5_STAR_RATING: 10,
  CREATE_FORUM_POST: 10,
  REPLY_FORUM_POST: 5
};
