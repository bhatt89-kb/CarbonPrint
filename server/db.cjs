const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'ecotrack.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id INTEGER PRIMARY KEY REFERENCES users(id),
      car_km_per_day REAL DEFAULT 0,
      fuel_type TEXT DEFAULT 'petrol',
      public_transport_days INTEGER DEFAULT 0,
      bike_km_per_day REAL DEFAULT 0,
      flights_per_year INTEGER DEFAULT 0,
      electricity_kwh REAL DEFAULT 150,
      heating_type TEXT DEFAULT 'gas',
      has_solar INTEGER DEFAULT 0,
      diet_type TEXT DEFAULT 'mixed',
      local_food_pct INTEGER DEFAULT 30,
      food_waste_freq TEXT DEFAULT 'sometimes',
      recycling_rate INTEGER DEFAULT 30,
      composts INTEGER DEFAULT 0,
      uses_single_use_plastics INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS footprint_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      transport_kg REAL DEFAULT 0,
      electricity_kg REAL DEFAULT 0,
      food_kg REAL DEFAULT 0,
      waste_kg REAL DEFAULT 0,
      total_kg REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, month, year)
    );

    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      target_kg REAL NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, month, year)
    );

    CREATE TABLE IF NOT EXISTS eco_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      co2_reduction_kg REAL NOT NULL,
      cost_savings REAL DEFAULT 0,
      difficulty TEXT DEFAULT 'medium',
      icon TEXT DEFAULT 'leaf'
    );

    CREATE TABLE IF NOT EXISTS user_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      action_id INTEGER REFERENCES eco_actions(id),
      adopted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed INTEGER DEFAULT 0,
      UNIQUE(user_id, action_id)
    );

    CREATE TABLE IF NOT EXISTS badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT DEFAULT 'award',
      criteria TEXT,
      points_required INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      badge_id INTEGER REFERENCES badges(id),
      earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, badge_id)
    );

    CREATE TABLE IF NOT EXISTS user_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      points INTEGER NOT NULL,
      reason TEXT,
      earned_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      points_reward INTEGER DEFAULT 50,
      category TEXT,
      icon TEXT DEFAULT 'target',
      week_number INTEGER
    );

    CREATE TABLE IF NOT EXISTS user_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      challenge_id INTEGER REFERENCES challenges(id),
      completed INTEGER DEFAULT 0,
      completed_at DATETIME,
      UNIQUE(user_id, challenge_id)
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      summary TEXT,
      content TEXT,
      category TEXT,
      reading_time INTEGER DEFAULT 5,
      thumbnail TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

module.exports = db;
module.exports.initDB = initDB;
