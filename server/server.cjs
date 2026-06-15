const express = require('express');
const cors = require('cors');
const path = require('path');

// Import database and seed
const db = require('./db.cjs');
const { initDB } = require('./db.cjs');
const { seedDB } = require('./seed.cjs');

// Import routes
const authRoutes = require('./routes/auth.cjs');
const footprintRoutes = require('./routes/footprint.cjs');
const goalsRoutes = require('./routes/goals.cjs');
const actionsRoutes = require('./routes/actions.cjs');
const gamificationRoutes = require('./routes/gamification.cjs');
const articlesRoutes = require('./routes/articles.cjs');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database tables
initDB();
console.log('\x1b[36m%s\x1b[0m', '✓ Database tables initialized');

// Seed database with initial data
seedDB(db);
console.log('\x1b[36m%s\x1b[0m', '✓ Database seeding complete');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/footprint', footprintRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/actions', actionsRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/articles', articlesRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'EcoTrack API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to EcoTrack API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      footprint: '/api/footprint',
      goals: '/api/goals',
      actions: '/api/actions',
      gamification: '/api/gamification',
      articles: '/api/articles',
      health: '/api/health',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('\x1b[31m%s\x1b[0m', 'Server error:', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('\x1b[32m%s\x1b[0m', '╔══════════════════════════════════════════╗');
  console.log('\x1b[32m%s\x1b[0m', '║                                          ║');
  console.log('\x1b[32m%s\x1b[0m', '║   🌿 EcoTrack API Server Running 🌿     ║');
  console.log('\x1b[32m%s\x1b[0m', '║                                          ║');
  console.log('\x1b[32m%s\x1b[0m', `║   Port: ${PORT}                            ║`);
  console.log('\x1b[32m%s\x1b[0m', `║   URL:  http://localhost:${PORT}            ║`);
  console.log('\x1b[32m%s\x1b[0m', '║                                          ║');
  console.log('\x1b[32m%s\x1b[0m', '╚══════════════════════════════════════════╝');
  console.log('');
  console.log('\x1b[33m%s\x1b[0m', 'Available API Routes:');
  console.log('\x1b[33m%s\x1b[0m', '  POST   /api/auth/register');
  console.log('\x1b[33m%s\x1b[0m', '  POST   /api/auth/login');
  console.log('\x1b[33m%s\x1b[0m', '  GET    /api/auth/profile');
  console.log('\x1b[33m%s\x1b[0m', '  PUT    /api/auth/profile');
  console.log('\x1b[33m%s\x1b[0m', '  POST   /api/footprint/calculate');
  console.log('\x1b[33m%s\x1b[0m', '  GET    /api/footprint/history');
  console.log('\x1b[33m%s\x1b[0m', '  GET    /api/footprint/current');
  console.log('\x1b[33m%s\x1b[0m', '  GET    /api/footprint/summary');
  console.log('\x1b[33m%s\x1b[0m', '  POST   /api/goals');
  console.log('\x1b[33m%s\x1b[0m', '  GET    /api/goals');
  console.log('\x1b[33m%s\x1b[0m', '  GET    /api/goals/current');
  console.log('\x1b[33m%s\x1b[0m', '  GET    /api/actions');
  console.log('\x1b[33m%s\x1b[0m', '  POST   /api/actions/:id/adopt');
  console.log('\x1b[33m%s\x1b[0m', '  DELETE /api/actions/:id/adopt');
  console.log('\x1b[33m%s\x1b[0m', '  GET    /api/gamification/points');
  console.log('\x1b[33m%s\x1b[0m', '  GET    /api/gamification/badges');
  console.log('\x1b[33m%s\x1b[0m', '  GET    /api/gamification/leaderboard');
  console.log('\x1b[33m%s\x1b[0m', '  GET    /api/gamification/challenges');
  console.log('\x1b[33m%s\x1b[0m', '  POST   /api/gamification/challenges/:id/complete');
  console.log('\x1b[33m%s\x1b[0m', '  GET    /api/articles');
  console.log('\x1b[33m%s\x1b[0m', '  GET    /api/articles/:id');
  console.log('');
});

module.exports = app;
