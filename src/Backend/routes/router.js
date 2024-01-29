const express = require('express');
const router = express.Router();

const { ask } = require('../stockfish-utility.js');

router.use(express.json());

router.post('/getMove', async (req, res) => {
  async function getMove() {
    try {
        const { fen, depth } = req.body;
        const move = await ask(fen, depth);
        res.json({ move });
    } catch (error) {
        console.error("Error:", error);
    }
  }

  getMove();
});


module.exports = router;
