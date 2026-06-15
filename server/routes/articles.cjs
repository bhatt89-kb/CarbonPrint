const express = require('express');
const db = require('../db.cjs');

const router = express.Router();

// GET /api/articles - List all articles (no auth required)
router.get('/', (req, res) => {
  try {
    const { category } = req.query;

    let sql = 'SELECT id, title, summary, category, reading_time, thumbnail, created_at FROM articles';
    const params = [];

    if (category) {
      sql += ' WHERE category = ?';
      params.push(category);
    }

    sql += ' ORDER BY created_at DESC';

    const articles = db.prepare(sql).all(...params);

    res.json({ articles });
  } catch (err) {
    console.error('Get articles error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/articles/:id - Get full article by id
router.get('/:id', (req, res) => {
  try {
    const articleId = parseInt(req.params.id, 10);

    const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(articleId);

    if (!article) {
      return res.status(404).json({ error: 'Article not found.' });
    }

    res.json({ article });
  } catch (err) {
    console.error('Get article error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
