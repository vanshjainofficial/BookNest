import { Server } from 'socket.io';
import { verifyToken } from './auth';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_APP_URL 
        : 'http:
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
    

    
    socket.on('join-exchange', (exchangeId) => {
      socket.join(`exchange-${exchangeId}`);
      
    });

    
    socket.on('leave-exchange', (exchangeId) => {
      socket.leave(`exchange-${exchangeId}`);
      
    });

    
    socket.on('send-message', async (data) => {
      try {
        const { exchangeId, content, messageType = 'text', imageUrl = null } = data;
        
        
        socket.to(`exchange-${exchangeId}`).emit('new-message', {
          exchangeId,
          content,
          messageType,
          imageUrl,
          senderId: socket.userId,
          timestamp: new Date()
        });

        
        socket.emit('message-sent', {
          exchangeId,
          content,
          messageType,
          imageUrl,
          senderId: socket.userId,
          timestamp: new Date()
        });

        
      } catch (error) {
        console.error('Error handling message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    
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

    
    socket.on('mark-read', (data) => {
      socket.to(`exchange-${data.exchangeId}`).emit('message-read', {
        messageId: data.messageId,
        userId: socket.userId,
        exchangeId: data.exchangeId
      });
    });

    socket.on('disconnect', () => {
      
    });
  });

  return io;
};

export const getSocket = () => io;
