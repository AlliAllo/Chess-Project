const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const Game = require('../models/Game');

// Create / log a new game
router.post('/new', authenticateToken, async (req, res) => {
  try {
    const { PGN, result } = req.body;

    const game = new Game({
      creator: { id: req.user.id, username: req.user.username },
      PGN,
      result: result || 'ongoing'
    });

    await game.save();
    res.status(201).json({ message: 'Game logged', game });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all games for the logged-in user
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const games = await Game.find({ 'creator.id': req.user.id }).sort({ createdAt: -1 });
    res.json({ games });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
