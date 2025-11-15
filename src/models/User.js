import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() {
      return !this.isGoogleUser;
    },
    minlength: [6, 'Password must be at least 6 characters']
  },
  isGoogleUser: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    required: function() {
      return !this.isGoogleUser;
    },
    trim: true,
    default: ''
  },
  profilePicture: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters'],
    default: ''
  },
  books: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  }],
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratings: [{
    raterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    review: {
      type: String,
      maxlength: [500, 'Review cannot be more than 500 characters'],
      default: ''
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalExchanges: {
    type: Number,
    default: 0
  },
  points: {
    type: Number,
    default: 0
  },
  level: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
    default: 'Bronze'
  },
  badges: [{
    type: String,
    enum: ['First Exchange', 'Book Lover', 'Helpful Member', 'Top Reviewer', 'Community Leader']
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || this.isGoogleUser) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Calculate level based on points
userSchema.methods.calculateLevel = function() {
  const points = this.points || 0;
  
  if (points >= 1000) return 'Diamond';
  if (points >= 500) return 'Platinum';
  if (points >= 200) return 'Gold';
  if (points >= 50) return 'Silver';
  return 'Bronze';
};

// Update level before saving
userSchema.pre('save', function(next) {
  if (this.isModified('points')) {
    this.level = this.calculateLevel();
  }
  next();
});

// Update level after any update operation
userSchema.post(['findOneAndUpdate', 'updateOne', 'updateMany'], function(doc) {
  if (doc && doc.points !== undefined) {
    const newLevel = doc.calculateLevel();
    if (doc.level !== newLevel) {
      doc.level = newLevel;
      doc.save().catch(err => console.error('Error updating level:', err));
    }
  }
});

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

export default mongoose.models.User || mongoose.model('User', userSchema);
