const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db.cjs');
const auth = require('../middleware/auth.cjs');
const { JWT_SECRET } = require('../middleware/auth.cjs');

const router = express.Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate inputs
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
    if (existingUser) {
      return res.status(409).json({ error: 'A user with that email or username already exists.' });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    // Insert user
    const insertUser = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)');
    const result = insertUser.run(username, email, password_hash);
    const userId = result.lastInsertRowid;

    // Create empty profile
    const insertProfile = db.prepare('INSERT INTO user_profiles (user_id) VALUES (?)');
    insertProfile.run(userId);

    // Generate JWT
    const token = jwt.sign({ user_id: userId }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      token,
      user: {
        id: userId,
        username,
        email,
      },
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user by email
    const user = db.prepare('SELECT id, username, email, password_hash FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Compare password
    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign({ user_id: user.id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/auth/profile (auth required)
router.get('/profile', auth, (req, res) => {
  try {
    const userId = req.user.id;

    const row = db.prepare(`
      SELECT 
        u.id, u.username, u.email, u.created_at,
        p.car_km_per_day, p.fuel_type, p.public_transport_days,
        p.bike_km_per_day, p.flights_per_year,
        p.electricity_kwh, p.heating_type, p.has_solar,
        p.diet_type, p.local_food_pct, p.food_waste_freq,
        p.recycling_rate, p.composts, p.uses_single_use_plastics,
        p.updated_at AS profile_updated_at
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE u.id = ?
    `).get(userId);

    if (!row) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      id: row.id,
      username: row.username,
      email: row.email,
      created_at: row.created_at,
      profile: {
        car_km_per_day: row.car_km_per_day,
        fuel_type: row.fuel_type,
        public_transport_days: row.public_transport_days,
        bike_km_per_day: row.bike_km_per_day,
        flights_per_year: row.flights_per_year,
        electricity_kwh: row.electricity_kwh,
        heating_type: row.heating_type,
        has_solar: !!row.has_solar,
        diet_type: row.diet_type,
        local_food_pct: row.local_food_pct,
        food_waste_freq: row.food_waste_freq,
        recycling_rate: row.recycling_rate,
        composts: !!row.composts,
        uses_single_use_plastics: !!row.uses_single_use_plastics,
        updated_at: row.profile_updated_at,
      },
    });
  } catch (err) {
    console.error('Profile fetch error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/auth/profile (auth required)
router.put('/profile', auth, (req, res) => {
  try {
    const userId = req.user.id;
    const allowedFields = [
      'car_km_per_day', 'fuel_type', 'public_transport_days',
      'bike_km_per_day', 'flights_per_year',
      'electricity_kwh', 'heating_type', 'has_solar',
      'diet_type', 'local_food_pct', 'food_waste_freq',
      'recycling_rate', 'composts', 'uses_single_use_plastics',
    ];

    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        // Convert booleans to 0/1 for SQLite
        let val = req.body[field];
        if (typeof val === 'boolean') {
          val = val ? 1 : 0;
        }
        values.push(val);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update.' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    const sql = `UPDATE user_profiles SET ${updates.join(', ')} WHERE user_id = ?`;
    const result = db.prepare(sql).run(...values);

    if (result.changes === 0) {
      // Profile might not exist, create it
      db.prepare('INSERT OR IGNORE INTO user_profiles (user_id) VALUES (?)').run(userId);
      db.prepare(sql).run(...values);
    }

    // Return updated profile
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId);

    res.json({
      message: 'Profile updated successfully.',
      profile,
    });
  } catch (err) {
    console.error('Profile update error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
