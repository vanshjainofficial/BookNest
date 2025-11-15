import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import { MongoClient } from 'mongodb'
import connectDB from './db'
import User from '../models/User'

const client = new MongoClient(process.env.MONGODB_URI)
const clientPromise = client.connect()

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true, // Allow linking accounts with same email
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === 'google') {
        try {
          await connectDB()
          
          // Check if user already exists in our custom User model
          const existingUser = await User.findOne({ email: user.email })
          
          if (existingUser) {
            // If user exists, update them to be a Google user
            if (!existingUser.isGoogleUser) {
              await User.findByIdAndUpdate(existingUser._id, {
                isGoogleUser: true,
                profilePicture: user.image,
                // Keep existing data but mark as Google user
              })
            }
          } else {
            // Create new user in our custom User model
            const newUser = new User({
              name: user.name,
              email: user.email,
              profilePicture: user.image,
              isGoogleUser: true,
              location: '', // Set empty location for Google users
              // Set a random password for Google users (they won't use it)
              password: Math.random().toString(36).slice(-8)
            })
            
            await newUser.save()
          }
          
          return true
        } catch (error) {
          console.error('Error in signIn callback:', error)
          return false
        }
      }
      return true
    },
    async session({ session, user }) {
      if (session?.user) {
        try {
          await connectDB()
          
          // Get user from our custom User model
          const dbUser = await User.findOne({ email: session.user.email })
          
          if (dbUser) {
            session.user.id = dbUser._id.toString()
            session.user.isGoogleUser = dbUser.isGoogleUser || false
            session.user.image = dbUser.profilePicture || session.user.image
            session.user.location = dbUser.location
            session.user.bio = dbUser.bio
            session.user.books = dbUser.books || []
            session.user.exchanges = dbUser.exchanges || []
            session.user.rating = dbUser.rating || 0
            session.user.totalExchanges = dbUser.totalExchanges || 0
          }
        } catch (error) {
          console.error('Error in session callback:', error)
        }
      }
      return session
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.isGoogleUser = user.isGoogleUser
      }
      return token
    }
  },
  pages: {
    signIn: '/login',
    signUp: '/register',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
