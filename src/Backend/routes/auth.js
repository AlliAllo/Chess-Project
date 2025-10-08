require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Signup route (email/password)
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: 'Username already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, passwordHash });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id, username: newUser.username }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(201).json({ message: 'User created successfully', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login route (email/password)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user =
      (await User.findOne({ username })) || // try finding by username first, then by email.
      (await User.findOne({ email: username }));

    if (!user) return res.status(400).json({ error: 'Invalid username or password' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(400).json({ error: 'Invalid username or password' });

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Google OAuth login
router.post('/google', async (req, res) => {
  const { credential } = req.body; // JWT from Google
  if (!credential) return res.status(400).json({ error: "No credential provided" });

  try {
    // decode the Google JWT
    const decoded = jwt.decode(credential); // { sub, email, name, picture, ... }
    if (!decoded) return res.status(400).json({ error: "Invalid Google credential" });

    // check if user exists by Google ID
    let user = await User.findOne({ googleId: decoded.sub });
    if (!user) {
      // create new user
      user = new User({
        username: decoded.name,
        email: decoded.email,
        googleId: decoded.sub
      });
      await user.save();
    }

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
