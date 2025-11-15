import mongoose from 'mongoose';

const forumReplySchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  forumPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Forum',
    required: true
  },
  parentReply: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumReply',
    default: null
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isSolution: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better performance
forumReplySchema.index({ forumPost: 1, createdAt: 1 });
forumReplySchema.index({ author: 1, createdAt: -1 });

export default mongoose.models.ForumReply || mongoose.model('ForumReply', forumReplySchema);
