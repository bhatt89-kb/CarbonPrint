const express = require('express');
const db = require('../db.cjs');
const auth = require('../middleware/auth.cjs');

const router = express.Router();

// ── Badge Checking Helper ───────────────────────────────────────────────

function checkAndAwardBadges(database, userId) {
  const badges = database.prepare('SELECT * FROM badges').all();
  const earnedBadgeIds = database.prepare(
    'SELECT badge_id FROM user_badges WHERE user_id = ?'
  ).all(userId).map(r => r.badge_id);

  for (const badge of badges) {
    // Skip already earned badges
    if (earnedBadgeIds.includes(badge.id)) continue;

    let earned = false;

    switch (badge.criteria) {
      case 'first_calculation': {
        const entry = database.prepare(
          'SELECT id FROM footprint_entries WHERE user_id = ?'
        ).get(userId);
        earned = !!entry;
        break;
      }

      case 'adopt_5_actions': {
        const count = database.prepare(
          'SELECT COUNT(*) as cnt FROM user_actions WHERE user_id = ?'
        ).get(userId);
        earned = count.cnt >= 5;
        break;
      }

      case 'adopt_10_actions': {
        const count = database.prepare(
          'SELECT COUNT(*) as cnt FROM user_actions WHERE user_id = ?'
        ).get(userId);
        earned = count.cnt >= 10;
        break;
      }

      case 'reduce_10_pct': {
        const entries = database.prepare(
          'SELECT total_kg FROM footprint_entries WHERE user_id = ? ORDER BY year ASC, month ASC'
        ).all(userId);
        if (entries.length >= 2) {
          const first = entries[0].total_kg;
          const last = entries[entries.length - 1].total_kg;
          earned = first > 0 && last <= first * 0.9;
        }
        break;
      }

      case 'reduce_50_pct': {
        const entries = database.prepare(
          'SELECT total_kg FROM footprint_entries WHERE user_id = ? ORDER BY year ASC, month ASC'
        ).all(userId);
        if (entries.length >= 2) {
          const first = entries[0].total_kg;
          const last = entries[entries.length - 1].total_kg;
          earned = first > 0 && last <= first * 0.5;
        }
        break;
      }

      case 'first_goal_met': {
        const goalMet = database.prepare(`
          SELECT g.id FROM goals g
          INNER JOIN footprint_entries f ON g.user_id = f.user_id AND g.month = f.month AND g.year = f.year
          WHERE g.user_id = ? AND f.total_kg <= g.target_kg
          LIMIT 1
        `).get(userId);
        earned = !!goalMet;
        break;
      }

      case 'streak_3_months': {
        const goalsWithFootprint = database.prepare(`
          SELECT g.month, g.year, g.target_kg, f.total_kg
          FROM goals g
          INNER JOIN footprint_entries f ON g.user_id = f.user_id AND g.month = f.month AND g.year = f.year
          WHERE g.user_id = ? AND f.total_kg <= g.target_kg
          ORDER BY g.year ASC, g.month ASC
        `).all(userId);

        if (goalsWithFootprint.length >= 3) {
          let consecutive = 1;
          for (let i = 1; i < goalsWithFootprint.length; i++) {
            const prev = goalsWithFootprint[i - 1];
            const curr = goalsWithFootprint[i];
            const prevDate = new Date(prev.year, prev.month - 1);
            const currDate = new Date(curr.year, curr.month - 1);
            const diffMonths = (currDate.getFullYear() - prevDate.getFullYear()) * 12 +
              (currDate.getMonth() - prevDate.getMonth());

            if (diffMonths === 1) {
              consecutive++;
              if (consecutive >= 3) {
                earned = true;
                break;
              }
            } else {
              consecutive = 1;
            }
          }
        }
        break;
      }

      case 'read_5_articles': {
        // This badge is tracked via points with "Read article" reason
        const readCount = database.prepare(
          "SELECT COUNT(*) as cnt FROM user_points WHERE user_id = ? AND reason LIKE 'Read article%'"
        ).get(userId);
        earned = readCount.cnt >= 5;
        break;
      }

      case 'complete_5_challenges': {
        const count = database.prepare(
          'SELECT COUNT(*) as cnt FROM user_challenges WHERE user_id = ? AND completed = 1'
        ).get(userId);
        earned = count.cnt >= 5;
        break;
      }

      case 'top_10_leaderboard': {
        const leaderboard = database.prepare(`
          SELECT user_id, SUM(points) as total
          FROM user_points
          GROUP BY user_id
          ORDER BY total DESC
          LIMIT 10
        `).all();
        earned = leaderboard.some(entry => entry.user_id === userId);
        break;
      }

      case 'total_1000_points': {
        const totalPoints = database.prepare(
          'SELECT COALESCE(SUM(points), 0) as total FROM user_points WHERE user_id = ?'
        ).get(userId);
        earned = totalPoints.total >= 1000;
        break;
      }

      case 'all_waste_actions': {
        const wasteActions = database.prepare(
          "SELECT COUNT(*) as cnt FROM eco_actions WHERE category = 'waste'"
        ).get();
        const adoptedWaste = database.prepare(`
          SELECT COUNT(*) as cnt FROM user_actions ua
          INNER JOIN eco_actions ea ON ua.action_id = ea.id
          WHERE ua.user_id = ? AND ea.category = 'waste'
        `).get(userId);
        earned = wasteActions.cnt > 0 && adoptedWaste.cnt >= wasteActions.cnt;
        break;
      }

      default:
        break;
    }

    if (earned) {
      database.prepare('INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)').run(
        userId, badge.id
      );
      // Award badge points
      if (badge.points_required > 0) {
        database.prepare('INSERT INTO user_points (user_id, points, reason) VALUES (?, ?, ?)').run(
          userId, badge.points_required, `Earned badge: ${badge.name}`
        );
      }
    }
  }
}

// All routes require authentication
router.use(auth);

// GET /api/gamification/points - Get user's total points and history
router.get('/points', (req, res) => {
  try {
    const userId = req.user.id;

    const totalResult = db.prepare(
      'SELECT COALESCE(SUM(points), 0) as total FROM user_points WHERE user_id = ?'
    ).get(userId);

    const history = db.prepare(
      'SELECT id, points, reason, earned_at FROM user_points WHERE user_id = ? ORDER BY earned_at DESC LIMIT 50'
    ).all(userId);

    res.json({
      total: totalResult.total,
      history,
    });
  } catch (err) {
    console.error('Get points error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/gamification/badges - Get all badges with earned status
router.get('/badges', (req, res) => {
  try {
    const userId = req.user.id;

    // Check and award any new badges first
    checkAndAwardBadges(db, userId);

    const badges = db.prepare(`
      SELECT 
        b.id, b.name, b.description, b.icon, b.criteria, b.points_required,
        CASE WHEN ub.id IS NOT NULL THEN 1 ELSE 0 END AS earned,
        ub.earned_at
      FROM badges b
      LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = ?
      ORDER BY b.points_required ASC
    `).all(userId);

    const result = badges.map(b => ({
      ...b,
      earned: b.earned === 1,
    }));

    res.json({ badges: result });
  } catch (err) {
    console.error('Get badges error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/gamification/leaderboard - Top 20 users by points
router.get('/leaderboard', (req, res) => {
  try {
    const userId = req.user.id;

    const leaderboard = db.prepare(`
      SELECT 
        u.id, u.username,
        COALESCE(SUM(up.points), 0) as total_points,
        COUNT(DISTINCT ub.badge_id) as badge_count
      FROM users u
      LEFT JOIN user_points up ON u.id = up.user_id
      LEFT JOIN user_badges ub ON u.id = ub.user_id
      GROUP BY u.id
      HAVING total_points > 0
      ORDER BY total_points DESC
      LIMIT 20
    `).all();

    // Assign ranks
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      ...entry,
      is_current_user: entry.id === userId,
    }));

    // Get current user's rank if not in top 20
    let currentUserRank = rankedLeaderboard.find(e => e.is_current_user);

    if (!currentUserRank) {
      const userPoints = db.prepare(
        'SELECT COALESCE(SUM(points), 0) as total FROM user_points WHERE user_id = ?'
      ).get(userId);

      const rank = db.prepare(`
        SELECT COUNT(*) + 1 as rank
        FROM (
          SELECT user_id, SUM(points) as total
          FROM user_points
          GROUP BY user_id
          HAVING total > ?
        )
      `).get(userPoints.total);

      const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(userId);
      const badgeCount = db.prepare(
        'SELECT COUNT(*) as cnt FROM user_badges WHERE user_id = ?'
      ).get(userId);

      currentUserRank = {
        rank: rank.rank,
        id: userId,
        username: user ? user.username : 'Unknown',
        total_points: userPoints.total,
        badge_count: badgeCount.cnt,
        is_current_user: true,
      };
    }

    res.json({
      leaderboard: rankedLeaderboard,
      current_user: currentUserRank,
    });
  } catch (err) {
    console.error('Leaderboard error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/gamification/challenges - Get challenges for current and next week
router.get('/challenges', (req, res) => {
  try {
    const userId = req.user.id;

    // Calculate current week of the year (1-52)
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000)) + 1;
    const currentWeek = Math.ceil(dayOfYear / 7);

    // Map to challenge weeks (1-12 cycling)
    const currentChallengeWeek = ((currentWeek - 1) % 12) + 1;
    const nextChallengeWeek = (currentChallengeWeek % 12) + 1;

    const challenges = db.prepare(`
      SELECT 
        c.id, c.title, c.description, c.points_reward, c.category, c.icon, c.week_number,
        CASE WHEN uc.id IS NOT NULL THEN 1 ELSE 0 END AS joined,
        COALESCE(uc.completed, 0) AS completed,
        uc.completed_at
      FROM challenges c
      LEFT JOIN user_challenges uc ON c.id = uc.challenge_id AND uc.user_id = ?
      WHERE c.week_number IN (?, ?)
      ORDER BY c.week_number ASC
    `).all(userId, currentChallengeWeek, nextChallengeWeek);

    const result = challenges.map(c => ({
      ...c,
      joined: c.joined === 1,
      completed: c.completed === 1,
      is_current_week: c.week_number === currentChallengeWeek,
    }));

    res.json({
      current_week: currentChallengeWeek,
      next_week: nextChallengeWeek,
      challenges: result,
    });
  } catch (err) {
    console.error('Get challenges error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/gamification/challenges/:id/complete - Complete a challenge
router.post('/challenges/:id/complete', (req, res) => {
  try {
    const userId = req.user.id;
    const challengeId = parseInt(req.params.id, 10);

    // Check if challenge exists
    const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(challengeId);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found.' });
    }

    // Check if already completed
    const existing = db.prepare(
      'SELECT * FROM user_challenges WHERE user_id = ? AND challenge_id = ?'
    ).get(userId, challengeId);

    if (existing && existing.completed) {
      return res.status(409).json({ error: 'Challenge already completed.' });
    }

    // Upsert challenge completion
    db.prepare(`
      INSERT INTO user_challenges (user_id, challenge_id, completed, completed_at)
      VALUES (?, ?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, challenge_id) DO UPDATE SET
        completed = 1,
        completed_at = CURRENT_TIMESTAMP
    `).run(userId, challengeId);

    // Award points
    db.prepare('INSERT INTO user_points (user_id, points, reason) VALUES (?, ?, ?)').run(
      userId, challenge.points_reward, `Completed challenge: ${challenge.title}`
    );

    // Check and award badges
    checkAndAwardBadges(db, userId);

    res.json({
      message: `Challenge completed: ${challenge.title}`,
      points_earned: challenge.points_reward,
    });
  } catch (err) {
    console.error('Complete challenge error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
module.exports.checkAndAwardBadges = checkAndAwardBadges;
