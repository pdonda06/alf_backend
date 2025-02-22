const express = require('express');
const router = express.Router();
const Flashcard = require('../models/Flashcard');

// Leitner System intervals (in days)
const BOX_INTERVALS = {
  1: 1,    // Review daily
  2: 2,    // Review every 2 days
  3: 4,    // Review every 4 days
  4: 8,    // Review every 8 days
  5: 16    // Review every 16 days
};

// Get all flashcards (with optional due date filter)
router.get('/flashcards', async (req, res) => {
  try {
    const query = req.query.due === 'true' 
      ? { nextReviewDate: { $lte: new Date() } }
      : {};
    const flashcards = await Flashcard.find(query);
    res.json(flashcards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get flashcard statistics
router.get('/flashcards/stats', async (req, res) => {
  try {
    const stats = await Flashcard.aggregate([
      {
        $group: {
          _id: '$boxNumber',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Format stats into an object
    const boxStats = {};
    stats.forEach(stat => {
      boxStats[stat._id] = stat.count;
    });
    
    res.json(boxStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new flashcard
router.post('/flashcards', async (req, res) => {
  const flashcard = new Flashcard({
    question: req.body.question,
    answer: req.body.answer,
    boxNumber: 1, // All new cards start in Box 1
    nextReviewDate: new Date() // Due immediately
  });

  try {
    const newFlashcard = await flashcard.save();
    res.status(201).json(newFlashcard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update flashcard (handle review)
router.put('/flashcards/:id', async (req, res) => {
  try {
    const flashcard = await Flashcard.findById(req.params.id);
    if (!flashcard) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }

    const { isCorrect } = req.body;
    
    // Update box number based on answer
    if (isCorrect) {
      // Move to next box if answered correctly (max box is 5)
      flashcard.boxNumber = Math.min(flashcard.boxNumber + 1, 5);
    } else {
      // Reset to Box 1 if answered incorrectly
      flashcard.boxNumber = 1;
    }

    // Calculate next review date based on box number
    const intervalDays = BOX_INTERVALS[flashcard.boxNumber];
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + intervalDays);
    flashcard.nextReviewDate = nextReview;

    // Update review history
    flashcard.lastReviewed = new Date();
    
    const updatedFlashcard = await flashcard.save();
    res.json(updatedFlashcard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete flashcard
router.delete('/flashcards/:id', async (req, res) => {
  try {
    const flashcard = await Flashcard.findById(req.params.id);
    if (!flashcard) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }
    await flashcard.deleteOne();
    res.json({ message: 'Flashcard deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
