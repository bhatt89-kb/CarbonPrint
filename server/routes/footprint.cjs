const express = require('express');
const db = require('../db.cjs');
const auth = require('../middleware/auth.cjs');

const router = express.Router();

// All routes require authentication
router.use(auth);

// ── Carbon Calculation Logic ────────────────────────────────────────────

const EMISSION_FACTORS = {
  petrol: 0.21,
  diesel: 0.27,
  hybrid: 0.12,
  electric: 0.05,
};

const DIET_EMISSIONS = {
  vegan: 50,
  vegetarian: 80,
  mixed: 130,
};

const FOOD_WASTE_MULTIPLIERS = {
  rarely: 1.0,
  sometimes: 1.1,
  often: 1.25,
};

function calculateTransport(profile) {
  const fuelFactor = EMISSION_FACTORS[profile.fuel_type] || EMISSION_FACTORS.petrol;
  const carEmissions = profile.car_km_per_day * 30 * fuelFactor;
  const flightEmissions = (profile.flights_per_year / 12) * 255;
  const publicTransportSavings = profile.public_transport_days * 4 * 0.089;
  // Bike emissions are zero, so bike_km_per_day * 30 * 0 = 0
  return Math.max(0, carEmissions + flightEmissions - publicTransportSavings);
}

function calculateElectricity(profile) {
  const solarMultiplier = profile.has_solar ? 0.4 : 1.0;
  return profile.electricity_kwh * 0.42 * solarMultiplier;
}

function calculateFood(profile) {
  const dietBase = DIET_EMISSIONS[profile.diet_type] || DIET_EMISSIONS.mixed;
  const localFactor = 1 - (profile.local_food_pct / 200);
  const wasteFactor = FOOD_WASTE_MULTIPLIERS[profile.food_waste_freq] || FOOD_WASTE_MULTIPLIERS.sometimes;
  return dietBase * localFactor * wasteFactor;
}

function calculateWaste(profile) {
  const base = 30;
  const recyclingFactor = 1 - (profile.recycling_rate / 100);
  const compostFactor = profile.composts ? 0.7 : 1.0;
  const plasticFactor = profile.uses_single_use_plastics ? 1.2 : 0.8;
  return base * recyclingFactor * compostFactor * plasticFactor;
}

function calculateFootprint(profile) {
  const transport_kg = Math.round(calculateTransport(profile) * 100) / 100;
  const electricity_kg = Math.round(calculateElectricity(profile) * 100) / 100;
  const food_kg = Math.round(calculateFood(profile) * 100) / 100;
  const waste_kg = Math.round(calculateWaste(profile) * 100) / 100;
  const total_kg = Math.round((transport_kg + electricity_kg + food_kg + waste_kg) * 100) / 100;

  return { transport_kg, electricity_kg, food_kg, waste_kg, total_kg };
}

// ── Routes ──────────────────────────────────────────────────────────────

// POST /api/footprint/calculate
router.post('/calculate', (req, res) => {
  try {
    const userId = req.user.id;

    // Get user profile
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId);
    if (!profile) {
      return res.status(404).json({ error: 'User profile not found. Please complete your profile first.' });
    }

    // Calculate footprint
    const { transport_kg, electricity_kg, food_kg, waste_kg, total_kg } = calculateFootprint(profile);

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Check if this is the first calculation (for points)
    const existingEntry = db.prepare(
      'SELECT id FROM footprint_entries WHERE user_id = ?'
    ).get(userId);
    const isFirstCalculation = !existingEntry;

    // Upsert footprint entry for current month
    const upsert = db.prepare(`
      INSERT INTO footprint_entries (user_id, month, year, transport_kg, electricity_kg, food_kg, waste_kg, total_kg)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, month, year) DO UPDATE SET
        transport_kg = excluded.transport_kg,
        electricity_kg = excluded.electricity_kg,
        food_kg = excluded.food_kg,
        waste_kg = excluded.waste_kg,
        total_kg = excluded.total_kg,
        created_at = CURRENT_TIMESTAMP
    `);
    upsert.run(userId, month, year, transport_kg, electricity_kg, food_kg, waste_kg, total_kg);

    // Award 50 points on first calculation
    if (isFirstCalculation) {
      db.prepare('INSERT INTO user_points (user_id, points, reason) VALUES (?, ?, ?)').run(
        userId, 50, 'First carbon footprint calculation'
      );

      // Award "First Steps" badge
      const firstStepsBadge = db.prepare("SELECT id FROM badges WHERE criteria = 'first_calculation'").get();
      if (firstStepsBadge) {
        db.prepare('INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)').run(
          userId, firstStepsBadge.id
        );
      }
    }

    // Return the entry
    const entry = db.prepare(
      'SELECT * FROM footprint_entries WHERE user_id = ? AND month = ? AND year = ?'
    ).get(userId, month, year);

    res.json({
      message: 'Footprint calculated successfully.',
      entry,
      first_calculation: isFirstCalculation,
      points_earned: isFirstCalculation ? 50 : 0,
    });
  } catch (err) {
    console.error('Calculate footprint error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/footprint/history
router.get('/history', (req, res) => {
  try {
    const userId = req.user.id;

    const entries = db.prepare(
      'SELECT * FROM footprint_entries WHERE user_id = ? ORDER BY year DESC, month DESC'
    ).all(userId);

    res.json({ entries });
  } catch (err) {
    console.error('Footprint history error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/footprint/current
router.get('/current', (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const entry = db.prepare(
      'SELECT * FROM footprint_entries WHERE user_id = ? AND month = ? AND year = ?'
    ).get(userId, month, year);

    if (!entry) {
      return res.status(404).json({ error: 'No footprint entry found for the current month. Please calculate your footprint first.' });
    }

    res.json({ entry });
  } catch (err) {
    console.error('Current footprint error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/footprint/summary
router.get('/summary', (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const entry = db.prepare(
      'SELECT * FROM footprint_entries WHERE user_id = ? AND month = ? AND year = ?'
    ).get(userId, month, year);

    if (!entry) {
      return res.status(404).json({ error: 'No footprint entry found for the current month. Please calculate your footprint first.' });
    }

    const total = entry.total_kg;
    const daily = Math.round((total / 30) * 100) / 100;
    const annual = Math.round(total * 12 * 100) / 100;

    const breakdown = {
      transport_kg: entry.transport_kg,
      electricity_kg: entry.electricity_kg,
      food_kg: entry.food_kg,
      waste_kg: entry.waste_kg,
    };

    const percentages = {};
    if (total > 0) {
      percentages.transport = Math.round((entry.transport_kg / total) * 1000) / 10;
      percentages.electricity = Math.round((entry.electricity_kg / total) * 1000) / 10;
      percentages.food = Math.round((entry.food_kg / total) * 1000) / 10;
      percentages.waste = Math.round((entry.waste_kg / total) * 1000) / 10;
    } else {
      percentages.transport = 0;
      percentages.electricity = 0;
      percentages.food = 0;
      percentages.waste = 0;
    }

    res.json({
      daily,
      monthly: total,
      annual,
      breakdown,
      percentages,
    });
  } catch (err) {
    console.error('Footprint summary error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
