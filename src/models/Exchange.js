import mongoose from 'mongoose';

const exchangeSchema = new mongoose.Schema({
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'completed', 'canceled', 'rejected'],
    default: 'pending'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  review: {
    type: String,
    default: ''
  },
  ratedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  requestMessage: {
    type: String,
    maxlength: [500, 'Request message cannot be more than 500 characters']
  },
  exchangeDate: {
    type: Date
  },
  completionDate: {
    type: Date
  },
  rating: {
    requesterRating: {
      type: Number,
      min: 1,
      max: 5
    },
    ownerRating: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  reviews: {
    requesterReview: {
      type: String,
      maxlength: [500, 'Review cannot be more than 500 characters']
    },
    ownerReview: {
      type: String,
      maxlength: [500, 'Review cannot be more than 500 characters']
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});


exchangeSchema.index({ requesterId: 1, status: 1 });
exchangeSchema.index({ ownerId: 1, status: 1 });
exchangeSchema.index({ bookId: 1 });
exchangeSchema.index({ status: 1 });

export default mongoose.models.Exchange || mongoose.model('Exchange', exchangeSchema);
