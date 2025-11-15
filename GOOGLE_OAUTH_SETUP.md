# Google OAuth Setup Instructions

## 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)

## 2. Environment Variables

Add these variables to your `.env.local` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# MongoDB (if not already added)
MONGODB_URI=your_mongodb_connection_string
```

## 3. Generate NextAuth Secret

You can generate a random secret using:

```bash
openssl rand -base64 32
```

Or use any random string generator.

## 4. Features Added

- ✅ Google OAuth login/signup buttons on login and register pages
- ✅ Automatic user creation in database for Google users
- ✅ Integration with existing JWT system
- ✅ Google users don't need password or location (optional)
- ✅ Profile picture automatically imported from Google
- ✅ Seamless integration with existing authentication flow

## 5. How It Works

1. User clicks "Continue with Google" button
2. Redirected to Google OAuth consent screen
3. After approval, user is created/authenticated
4. Session is established with NextAuth
5. User data is synced with existing User model
6. User is redirected to dashboard

## 6. Testing

1. Start your development server: `npm run dev`
2. Go to `/login` or `/register`
3. Click "Continue with Google"
4. Complete Google OAuth flow
5. Verify user is created in database
6. Check that user can access protected routes
