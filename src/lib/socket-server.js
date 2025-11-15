import { Server } from 'socket.io';
import { verifyToken } from './auth';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_APP_URL 
        : 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const user = verifyToken(token);
      if (!user) {
        return next(new Error('Authentication error'));
      }

      socket.userId = user.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    // User connected

    // Join exchange room
    socket.on('join-exchange', (exchangeId) => {
      socket.join(`exchange-${exchangeId}`);
      // User joined exchange
    });

    // Leave exchange room
    socket.on('leave-exchange', (exchangeId) => {
      socket.leave(`exchange-${exchangeId}`);
      // User left exchange
    });

    // Handle new message
    socket.on('send-message', async (data) => {
      try {
        const { exchangeId, content, messageType = 'text', imageUrl = null } = data;
        
        // Broadcast message to all users in the exchange room
        socket.to(`exchange-${exchangeId}`).emit('new-message', {
          exchangeId,
          content,
          messageType,
          imageUrl,
          senderId: socket.userId,
          timestamp: new Date()
        });

        // Send confirmation back to sender
        socket.emit('message-sent', {
          exchangeId,
          content,
          messageType,
          imageUrl,
          senderId: socket.userId,
          timestamp: new Date()
        });

        // Message sent successfully
      } catch (error) {
        console.error('Error handling message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing-start', (data) => {
      socket.to(`exchange-${data.exchangeId}`).emit('user-typing', {
        userId: socket.userId,
        exchangeId: data.exchangeId
      });
    });

    socket.on('typing-stop', (data) => {
      socket.to(`exchange-${data.exchangeId}`).emit('user-stopped-typing', {
        userId: socket.userId,
        exchangeId: data.exchangeId
      });
    });

    // Handle message read receipts
    socket.on('mark-read', (data) => {
      socket.to(`exchange-${data.exchangeId}`).emit('message-read', {
        messageId: data.messageId,
        userId: socket.userId,
        exchangeId: data.exchangeId
      });
    });

    socket.on('disconnect', () => {
      // User disconnected
    });
  });

  return io;
};

export const getSocket = () => io;
