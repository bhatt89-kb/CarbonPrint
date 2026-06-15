const express = require('express');
const db = require('../db.cjs');
const auth = require('../middleware/auth.cjs');
const { checkAndAwardBadges } = require('./gamification.cjs');

const router = express.Router();

// All routes require authentication
router.use(auth);

// GET /api/actions - List all eco-actions with adoption status
router.get('/', (req, res) => {
  try {
    const userId = req.user.id;
    const { category, difficulty } = req.query;

    let sql = `
      SELECT 
        ea.id, ea.title, ea.description, ea.category,
        ea.co2_reduction_kg, ea.cost_savings, ea.difficulty, ea.icon,
        CASE WHEN ua.id IS NOT NULL THEN 1 ELSE 0 END AS adopted,
        ua.adopted_at
      FROM eco_actions ea
      LEFT JOIN user_actions ua ON ea.id = ua.action_id AND ua.user_id = ?
      WHERE 1=1
    `;
    const params = [userId];

    if (category) {
      sql += ' AND ea.category = ?';
      params.push(category);
    }

    if (difficulty) {
      sql += ' AND ea.difficulty = ?';
      params.push(difficulty);
    }

    sql += ' ORDER BY ea.category, ea.co2_reduction_kg DESC';

    const actions = db.prepare(sql).all(...params);

    // Convert adopted to boolean
    const result = actions.map(a => ({
      ...a,
      adopted: a.adopted === 1,
    }));

    res.json({ actions: result });
  } catch (err) {
    console.error('Get actions error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/actions/:id/adopt - Adopt an eco-action
router.post('/:id/adopt', (req, res) => {
  try {
    const userId = req.user.id;
    const actionId = parseInt(req.params.id, 10);

    // Check if action exists
    const action = db.prepare('SELECT * FROM eco_actions WHERE id = ?').get(actionId);
    if (!action) {
      return res.status(404).json({ error: 'Action not found.' });
    }

    // Check if already adopted
    const existing = db.prepare(
      'SELECT id FROM user_actions WHERE user_id = ? AND action_id = ?'
    ).get(userId, actionId);

    if (existing) {
      return res.status(409).json({ error: 'You have already adopted this action.' });
    }

    // Adopt the action
    db.prepare('INSERT INTO user_actions (user_id, action_id) VALUES (?, ?)').run(userId, actionId);

    // Award 25 points
    db.prepare('INSERT INTO user_points (user_id, points, reason) VALUES (?, ?, ?)').run(
      userId, 25, `Adopted eco-action: ${action.title}`
    );

    // Check and award badges
    checkAndAwardBadges(db, userId);

    res.status(201).json({
      message: `Successfully adopted: ${action.title}`,
      points_earned: 25,
      action: {
        ...action,
        adopted: true,
        adopted_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Adopt action error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/actions/:id/adopt - Remove adoption of an eco-action
router.delete('/:id/adopt', (req, res) => {
  try {
    const userId = req.user.id;
    const actionId = parseInt(req.params.id, 10);

    const result = db.prepare(
      'DELETE FROM user_actions WHERE user_id = ? AND action_id = ?'
    ).run(userId, actionId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Action not found or not adopted.' });
    }

    res.json({ message: 'Action removed successfully.' });
  } catch (err) {
    console.error('Remove action error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
