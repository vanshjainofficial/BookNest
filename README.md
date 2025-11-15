# Book Trading Club 📚

A full-stack book trading application built with Next.js, MongoDB, and TailwindCSS. Connect with fellow book lovers, exchange books, and build a community around reading.

## ✨ Features

### 🔐 Authentication & User Management
- JWT-based user authentication
- User profiles with bio, location, and profile pictures
- User rating and review system
- Points and level system with badges

### 📖 Book Management
- Add, edit, and delete book listings
- Advanced search and filtering (title, author, genre, condition, location)
- Book condition tracking
- Cover image uploads

### 🔄 Exchange System
- Request book exchanges
- Approve/reject exchange requests
- Track exchange status (pending, approved, completed, canceled)
- Post-exchange rating and review system

### 💬 Real-time Communication
- Socket.IO powered real-time chat
- Typing indicators and read receipts
- Image sharing in chat
- Email notifications for exchanges and messages

### 🌟 Community Features
- Forum for discussions and book recommendations
- Leaderboard system (points, exchanges, ratings)
- Points system with gamification
- User levels and badges

### 📧 Notifications
- In-app notifications
- Email notifications for exchanges, messages, and ratings
- Real-time updates

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB (local or MongoDB Atlas)
- Cloudinary account (for image uploads)
- Gmail account (for email notifications)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd book-trading-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/book-trading-club
   
   # JWT Secret
   JWT_SECRET=your-super-secret-jwt-key-here
   
   # ImgBB (for image uploads)
   IMGBB_API_KEY=your-imgbb-api-key
   
   # Email (Gmail)
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   
   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TailwindCSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcrypt
- **Real-time**: Socket.IO
- **File Uploads**: ImgBB
- **Email**: Nodemailer
- **Deployment**: Vercel

## 📱 Pages & Features

### Public Pages
- **Home** (`/`) - Landing page with authentication
- **Login** (`/login`) - User login
- **Register** (`/register`) - User registration
- **Browse Books** (`/books`) - Search and filter books

### Protected Pages
- **Dashboard** (`/dashboard`) - User dashboard with books and exchanges
- **My Books** (`/my-books`) - Manage your book collection
- **Add Book** (`/add-book`) - Add new books to your collection
- **Exchanges** (`/exchanges`) - Manage exchange requests
- **Chat** (`/chat/[id]`) - Real-time chat for exchanges
- **Profile** (`/profile`) - Edit user profile
- **Forum** (`/forum`) - Community discussions
- **Leaderboard** (`/leaderboard`) - Community rankings

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables in Vercel dashboard
   - Deploy!

3. **Set up MongoDB Atlas**
   - Create a MongoDB Atlas account
   - Create a new cluster
   - Get connection string
   - Update `MONGODB_URI` in Vercel environment variables

4. **Configure ImgBB**
   - Go to [imgbb.com](https://imgbb.com)
   - Create a free account
   - Get your API key from the API section
   - Add to Vercel environment variables

5. **Set up Email**
   - Use Gmail with App Password
   - Add credentials to Vercel environment variables

### Environment Variables for Production

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/book-trading-club
JWT_SECRET=your-production-jwt-secret
IMGBB_API_KEY=your-imgbb-api-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update user profile

### Books
- `GET /api/books` - Get books with search/filter
- `POST /api/books` - Create new book
- `GET /api/books/[id]` - Get single book
- `PUT /api/books/[id]` - Update book
- `DELETE /api/books/[id]` - Delete book

### Exchanges
- `GET /api/exchanges` - Get user exchanges
- `POST /api/exchanges` - Create exchange request
- `GET /api/exchanges/[id]` - Get single exchange
- `PUT /api/exchanges/[id]` - Update exchange status

### Chat
- `GET /api/chat` - Get messages for exchange
- `POST /api/chat` - Send message

### Forum
- `GET /api/forum` - Get forum posts
- `POST /api/forum` - Create forum post

### Leaderboard
- `GET /api/leaderboard` - Get leaderboard data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- MongoDB for the database
- TailwindCSS for the styling
- Socket.IO for real-time features
- ImgBB for image hosting
