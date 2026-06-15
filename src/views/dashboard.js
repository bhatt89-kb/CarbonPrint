/* ============================================================
   EcoTrack — Dashboard View
   ============================================================ */

import { Chart, registerables } from 'chart.js';
import { api } from '../api.js';
import { createStatCard, createProgressRing, animateCounter, createEmptyState } from '../components.js';

Chart.register(...registerables);

export async function renderDashboard(container) {
  let summary, history, goal, points, profile;

  try {
    const results = await Promise.allSettled([
      api.get('/footprint/summary'),
      api.get('/footprint/history'),
      api.get('/goals/current'),
      api.get('/gamification/points'),
      api.get('/auth/profile'),
    ]);

    summary = results[0].status === 'fulfilled' ? results[0].value : null;
    history = results[1].status === 'fulfilled' ? results[1].value : [];
    goal    = results[2].status === 'fulfilled' ? results[2].value : null;
    points  = results[3].status === 'fulfilled' ? results[3].value : { total_points: 0 };
    profile = results[4].status === 'fulfilled' ? results[4].value : {};
  } catch {
    summary = null;
    history = [];
    goal = null;
    points = { total_points: 0 };
    profile = {};
  }

  // Normalize to arrays if needed
  if (history && !Array.isArray(history)) history = history.history || [];

  const username = profile.username || 'User';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // If no footprint data, show empty state
  if (!summary || (!summary.daily_kg && !summary.monthly_kg)) {
    container.innerHTML = `
      <div class="page-header animate-slide-up">
        <h1>Welcome, ${username}! 👋</h1>
        <p class="subtitle">${today}</p>
      </div>
      ${createEmptyState('leaf', 'No footprint data yet', 'Complete the calculator to see your carbon footprint breakdown, trends, and personalized insights.')}
      <div class="text-center mt-3">
        <a href="#/calculator" class="btn btn-primary btn-lg">
          <i data-lucide="calculator" style="width:18px;height:18px"></i>
          Calculate My Footprint
        </a>
      </div>`;
    return;
  }

  const dailyKg   = summary.daily_kg   || 0;
  const monthlyKg = summary.monthly_kg || 0;
  const annualKg  = summary.annual_kg  || (monthlyKg * 12);

  const transport  = summary.transport_pct  || 0;
  const electricity = summary.electricity_pct || 0;
  const food       = summary.food_pct       || 0;
  const waste      = summary.waste_pct      || 0;

  const trendChange = summary.trend_pct || 0;

  // Goal progress
  const goalPct = goal && goal.target_kg
    ? Math.min(100, Math.max(0, ((goal.target_kg - monthlyKg) / goal.target_kg) * 100 + 100))
    : 0;
  const goalLabel = goal ? `${monthlyKg.toFixed(0)} / ${goal.target_kg} kg` : 'No goal set';

  container.innerHTML = `
    <div class="page-header animate-slide-up">
      <h1>Welcome back, ${username}! 👋</h1>
      <p class="subtitle">${today}</p>
    </div>

    <!-- Hero Stats -->
    <div class="hero-stats">
      ${createStatCard('sun', 'Daily CO₂', dailyKg.toFixed(1) + ' kg', trendChange, 'emerald')}
      ${createStatCard('calendar', 'Monthly CO₂', monthlyKg.toFixed(1) + ' kg', trendChange, 'teal')}
      ${createStatCard('globe', 'Annual CO₂', (annualKg / 1000).toFixed(2) + ' t', trendChange, 'amber')}
    </div>

    <!-- Charts Grid -->
    <div class="dashboard-grid">
      <div class="chart-container animate-slide-up stagger-2">
        <div class="chart-header">
          <h3 class="flex items-center gap-1"><i data-lucide="trending-up" style="width:18px;height:18px;color:var(--accent-emerald)"></i> Emission Trend</h3>
        </div>
        <canvas id="trend-chart" height="220"></canvas>
      </div>
      <div class="chart-container animate-slide-up stagger-3">
        <div class="chart-header">
          <h3 class="flex items-center gap-1"><i data-lucide="pie-chart" style="width:18px;height:18px;color:var(--accent-teal)"></i> Category Breakdown</h3>
        </div>
        <canvas id="breakdown-chart" height="220"></canvas>
      </div>
    </div>

    <!-- Bottom Row -->
    <div class="dashboard-bottom">
      <div class="glass-card no-hover animate-slide-up stagger-4 text-center">
        <h4 class="mb-2">Goal Progress</h4>
        ${createProgressRing(goalPct, 130, '#10B981', goal ? 'of target' : 'No goal')}
        <p class="text-sm text-secondary mt-2">${goalLabel}</p>
      </div>

      <div class="glass-card no-hover animate-slide-up stagger-5">
        <h4 class="mb-3">Quick Actions</h4>
        <div class="flex-col gap-2">
          <a href="#/calculator" class="btn btn-secondary w-full">
            <i data-lucide="calculator" style="width:16px;height:16px"></i> Update Calculator
          </a>
          <a href="#/goals" class="btn btn-secondary w-full">
            <i data-lucide="target" style="width:16px;height:16px"></i> Set Goal
          </a>
          <a href="#/actions" class="btn btn-secondary w-full">
            <i data-lucide="list-checks" style="width:16px;height:16px"></i> View Actions
          </a>
        </div>
      </div>

      <div class="glass-card no-hover animate-slide-up stagger-6 text-center">
        <h4 class="mb-2">🌿 Green Points</h4>
        <div class="points-value" id="points-counter">${points.total_points || 0}</div>
        <p class="text-sm text-secondary">Total points earned</p>
        <a href="#/gamification" class="btn btn-ghost mt-2 text-sm">View Rewards →</a>
      </div>
    </div>`;

  // Animate counters
  requestAnimationFrame(() => {
    container.querySelectorAll('.animated-number').forEach((el) => {
      const target = parseFloat(el.dataset.target);
      if (!isNaN(target) && target > 0) animateCounter(el, target);
    });
    const pointsEl = container.querySelector('#points-counter');
    if (pointsEl) animateCounter(pointsEl, points.total_points || 0, 1500);
  });

  // Build charts
  buildTrendChart(history);
  buildBreakdownChart({ transport, electricity, food, waste });
}

function buildTrendChart(history) {
  const ctx = document.getElementById('trend-chart');
  if (!ctx) return;

  // Use last 6 entries or generate placeholder months
  let labels = [];
  let data = [];

  if (history && history.length > 0) {
    const recent = history.slice(-6);
    labels = recent.map((h) => {
      const d = new Date(h.month || h.date || h.created_at);
      return d.toLocaleDateString('en-US', { month: 'short' });
    });
    data = recent.map((h) => h.total_kg || 0);
  } else {
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(d.toLocaleDateString('en-US', { month: 'short' }));
      data.push(0);
    }
  }

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'CO₂ (kg)',
        data,
        borderColor: '#10B981',
        borderWidth: 2.5,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#10B981',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true,
        backgroundColor: (ctx2) => {
          const gradient = ctx2.chart.ctx.createLinearGradient(0, 0, 0, 220);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.02)');
          return gradient;
        },
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f1f3a',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          titleColor: '#e8edf5',
          bodyColor: '#8899b4',
          padding: 12,
          cornerRadius: 8,
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
          ticks: { color: '#5a6b84', font: { size: 11 } },
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
          ticks: { color: '#5a6b84', font: { size: 11 } },
          beginAtZero: true,
        },
      },
    },
  });
}

function buildBreakdownChart(percentages) {
  const ctx = document.getElementById('breakdown-chart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Transport', 'Electricity', 'Food', 'Waste'],
      datasets: [{
        data: [percentages.transport, percentages.electricity, percentages.food, percentages.waste],
        backgroundColor: ['#10B981', '#14B8A6', '#F59E0B', '#8B5CF6'],
        borderColor: 'rgba(10, 22, 40, 0.8)',
        borderWidth: 3,
        hoverBorderWidth: 0,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#8899b4',
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 10,
            font: { size: 12 },
          },
        },
        tooltip: {
          backgroundColor: '#0f1f3a',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          titleColor: '#e8edf5',
          bodyColor: '#8899b4',
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx2) => ` ${ctx2.label}: ${ctx2.parsed.toFixed(1)}%`,
          },
        },
      },
    },
  });
}
