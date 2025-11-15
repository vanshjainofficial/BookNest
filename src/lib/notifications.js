import Notification from '@/models/Notification';


export async function createLevelUpNotification(userId, newLevel, points) {
  try {
    const notification = new Notification({
      userId: userId,
      type: 'level_up',
      title: `Level Up! 🎉`,
      message: `Congratulations! You've reached ${newLevel} level with ${points} points!`,
      isRead: false
    });

    await notification.save();
    console.log(`Level up notification created for user ${userId}`);
    return notification;
  } catch (error) {
    console.error('Error creating level up notification:', error);
    throw error;
  }
}


export async function createPointsNotification(userId, points, reason) {
  try {
    const notification = new Notification({
      userId: userId,
      type: 'points_earned',
      title: `Points Earned! ⭐`,
      message: `You earned ${points} points for ${reason}!`,
      isRead: false
    });

    await notification.save();
    console.log(`Points notification created for user ${userId}`);
    return notification;
  } catch (error) {
    console.error('Error creating points notification:', error);
    throw error;
  }
}


export async function createLeaderboardNotification(userId, position, totalUsers) {
  try {
    let message = '';
    if (position <= 3) {
      message = `🏆 You're in the top ${position} of ${totalUsers} users! Keep it up!`;
    } else if (position <= 10) {
      message = `🎯 You're in the top 10! Currently at position ${position} of ${totalUsers} users.`;
    } else {
      message = `📈 You're at position ${position} of ${totalUsers} users. Keep trading books to climb higher!`;
    }

    const notification = new Notification({
      userId: userId,
      type: 'leaderboard_position',
      title: `Leaderboard Update 📊`,
      message: message,
      isRead: false
    });

    await notification.save();
    console.log(`Leaderboard notification created for user ${userId}`);
    return notification;
  } catch (error) {
    console.error('Error creating leaderboard notification:', error);
    throw error;
  }
}
