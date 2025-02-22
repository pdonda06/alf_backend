const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  boxNumber: {
    type: Number,
    default: 1,
    min: 1,
    max: 5,
  },
  nextReviewDate: {
    type: Date,
    default: Date.now,
  },
  lastReviewed: {
    type: Date,
    default: null,
  },
  reviewHistory: [{
    date: {
      type: Date,
      required: true,
    },
    wasCorrect: {
      type: Boolean,
      required: true
    },
    fromBox: {
      type: Number,
      required: true
    },
    toBox: {
      type: Number,
      required: true
    },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add indexes for performance
flashcardSchema.index({ nextReviewDate: 1 });
flashcardSchema.index({ boxNumber: 1 });

module.exports = mongoose.model('Flashcard', flashcardSchema);