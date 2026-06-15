const express = require('express');
const db = require('../db.cjs');
const auth = require('../middleware/auth.cjs');

const router = express.Router();

// All routes require authentication
router.use(auth);

// POST /api/goals - Create or update a goal
router.post('/', (req, res) => {
  try {
    const userId = req.user.id;
    const { target_kg, month, year } = req.body;

    if (target_kg === undefined || target_kg === null) {
      return res.status(400).json({ error: 'target_kg is required.' });
    }

    if (target_kg <= 0) {
      return res.status(400).json({ error: 'target_kg must be a positive number.' });
    }

    const now = new Date();
    const goalMonth = month || now.getMonth() + 1;
    const goalYear = year || now.getFullYear();

    if (goalMonth < 1 || goalMonth > 12) {
      return res.status(400).json({ error: 'Month must be between 1 and 12.' });
    }

    const upsert = db.prepare(`
      INSERT INTO goals (user_id, target_kg, month, year)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, month, year) DO UPDATE SET
        target_kg = excluded.target_kg,
        created_at = CURRENT_TIMESTAMP
    `);
    upsert.run(userId, target_kg, goalMonth, goalYear);

    const goal = db.prepare(
      'SELECT * FROM goals WHERE user_id = ? AND month = ? AND year = ?'
    ).get(userId, goalMonth, goalYear);

    res.status(201).json({
      message: 'Goal saved successfully.',
      goal,
    });
  } catch (err) {
    console.error('Create goal error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/goals - Return all goals with footprint progress
router.get('/', (req, res) => {
  try {
    const userId = req.user.id;

    const goals = db.prepare(`
      SELECT 
        g.id, g.target_kg, g.month, g.year, g.created_at,
        f.total_kg AS actual_kg,
        f.transport_kg, f.electricity_kg, f.food_kg, f.waste_kg
      FROM goals g
      LEFT JOIN footprint_entries f ON g.user_id = f.user_id AND g.month = f.month AND g.year = f.year
      WHERE g.user_id = ?
      ORDER BY g.year DESC, g.month DESC
    `).all(userId);

    const goalsWithProgress = goals.map(goal => {
      const actual = goal.actual_kg || 0;
      const target = goal.target_kg;
      let percent_complete = 0;

      if (actual > 0 && target > 0) {
        // If actual is at or below target, goal is met (100%)
        // If actual is above target, calculate how close we are
        if (actual <= target) {
          percent_complete = 100;
        } else {
          // Percentage of target achieved (lower is better for carbon)
          percent_complete = Math.round((target / actual) * 100);
        }
      }

      return {
        id: goal.id,
        target_kg: goal.target_kg,
        month: goal.month,
        year: goal.year,
        created_at: goal.created_at,
        actual_kg: goal.actual_kg,
        breakdown: goal.actual_kg ? {
          transport_kg: goal.transport_kg,
          electricity_kg: goal.electricity_kg,
          food_kg: goal.food_kg,
          waste_kg: goal.waste_kg,
        } : null,
        percent_complete,
        goal_met: actual > 0 && actual <= target,
      };
    });

    res.json({ goals: goalsWithProgress });
  } catch (err) {
    console.error('Get goals error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/goals/current - Return current month goal with progress
router.get('/current', (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const goal = db.prepare(`
      SELECT 
        g.id, g.target_kg, g.month, g.year, g.created_at,
        f.total_kg AS actual_kg,
        f.transport_kg, f.electricity_kg, f.food_kg, f.waste_kg
      FROM goals g
      LEFT JOIN footprint_entries f ON g.user_id = f.user_id AND g.month = f.month AND g.year = f.year
      WHERE g.user_id = ? AND g.month = ? AND g.year = ?
    `).get(userId, month, year);

    if (!goal) {
      return res.status(404).json({ error: 'No goal set for the current month.' });
    }

    const actual = goal.actual_kg || 0;
    const target = goal.target_kg;
    let percent_complete = 0;

    if (actual > 0 && target > 0) {
      if (actual <= target) {
        percent_complete = 100;
      } else {
        percent_complete = Math.round((target / actual) * 100);
      }
    }

    res.json({
      id: goal.id,
      target_kg: goal.target_kg,
      month: goal.month,
      year: goal.year,
      created_at: goal.created_at,
      actual_kg: goal.actual_kg,
      breakdown: goal.actual_kg ? {
        transport_kg: goal.transport_kg,
        electricity_kg: goal.electricity_kg,
        food_kg: goal.food_kg,
        waste_kg: goal.waste_kg,
      } : null,
      percent_complete,
      goal_met: actual > 0 && actual <= target,
    });
  } catch (err) {
    console.error('Current goal error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
