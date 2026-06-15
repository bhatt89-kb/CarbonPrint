/* ============================================================
   EcoTrack — Insights View
   ============================================================ */

import { Chart, registerables } from 'chart.js';
import { api } from '../api.js';
import { createInsightCard, createEmptyState } from '../components.js';

Chart.register(...registerables);

export async function renderInsights(container) {
  let summary, profile;

  try {
    [summary, profile] = await Promise.all([
      api.get('/footprint/summary'),
      api.get('/auth/profile'),
    ]);
  } catch {
    container.innerHTML = createEmptyState('lightbulb', 'No data yet', 'Complete the calculator first to see personalized insights.');
    return;
  }

  if (!summary || !summary.monthly_kg) {
    container.innerHTML = `
      <div class="page-header animate-slide-up">
        <h1><i data-lucide="lightbulb" style="width:28px;height:28px;color:var(--accent-amber);vertical-align:middle"></i> Insights</h1>
      </div>
      ${createEmptyState('lightbulb', 'No footprint data', 'Calculate your footprint first to unlock personalized insights.')}
      <div class="text-center mt-2">
        <a href="#/calculator" class="btn btn-primary">Go to Calculator</a>
      </div>`;
    return;
  }

  const monthly = summary.monthly_kg || 0;
  const transportPct = summary.transport_pct || 0;
  const electricityPct = summary.electricity_pct || 0;
  const foodPct = summary.food_pct || 0;
  const wastePct = summary.waste_pct || 0;

  const transportKg = (transportPct / 100) * monthly;
  const electricityKg = (electricityPct / 100) * monthly;
  const foodKg = (foodPct / 100) * monthly;
  const wasteKg = (wastePct / 100) * monthly;

  // Generate personalized insights
  const insights = generateInsights(summary, profile, { transportKg, electricityKg, foodKg, wasteKg });

  // Calculate what-if scenarios
  const scenarios = calculateScenarios(profile, monthly);

  container.innerHTML = `
    <div class="page-header animate-slide-up">
      <h1><i data-lucide="lightbulb" style="width:28px;height:28px;color:var(--accent-amber);vertical-align:middle"></i> Your Emission Profile</h1>
      <p class="subtitle">Personalized insights based on your lifestyle data</p>
    </div>

    <!-- Top Sources Chart -->
    <div class="glass-card no-hover mb-3 animate-slide-up stagger-1">
      <h3 class="mb-2 flex items-center gap-1">
        <i data-lucide="bar-chart-3" style="width:18px;height:18px;color:var(--accent-emerald)"></i>
        Top Emission Sources
      </h3>
      <div class="h-bar">
        ${renderSourceBars([
          { name: 'Transport', pct: transportPct, kg: transportKg, color: '#10B981' },
          { name: 'Electricity', pct: electricityPct, kg: electricityKg, color: '#14B8A6' },
          { name: 'Food', pct: foodPct, kg: foodKg, color: '#F59E0B' },
          { name: 'Waste', pct: wastePct, kg: wasteKg, color: '#8B5CF6' },
        ].sort((a, b) => b.pct - a.pct))}
      </div>
    </div>

    <!-- Personalized Insights -->
    <div class="mb-3 animate-slide-up stagger-2">
      <h3 class="mb-2 flex items-center gap-1">
        <i data-lucide="sparkles" style="width:18px;height:18px;color:var(--accent-amber)"></i>
        Personalized Insights
      </h3>
      <div class="flex-col gap-2">
        ${insights.join('')}
      </div>
    </div>

    <!-- What-If Scenarios -->
    <div class="glass-card no-hover mb-3 animate-slide-up stagger-3">
      <h3 class="mb-3 flex items-center gap-1">
        <i data-lucide="shuffle" style="width:18px;height:18px;color:var(--accent-teal)"></i>
        What-If Scenarios
      </h3>
      <p class="text-secondary text-sm mb-3">See how behavior changes would affect your footprint</p>
      <div class="flex-col gap-2">
        ${scenarios.map(s => `
          <div class="scenario-item">
            <div class="scenario-info">
              <div class="scenario-title">${s.title}</div>
              <div class="scenario-savings">${s.savings > 0 ? '-' : ''}${Math.abs(s.savings).toFixed(0)} kg/month</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" class="scenario-toggle" data-scenario="${s.id}" />
              <span class="toggle-slider"></span>
            </label>
          </div>`).join('')}
      </div>
      <div class="mt-3" style="padding:16px;background:rgba(16,185,129,0.08);border-radius:var(--radius-md);text-align:center">
        <span class="text-secondary text-sm">Projected monthly footprint: </span>
        <span class="font-bold text-lg" id="projected-value" style="color:var(--accent-emerald)">${monthly.toFixed(0)} kg</span>
      </div>
    </div>

    <!-- Global Comparison -->
    <div class="glass-card no-hover animate-slide-up stagger-4">
      <h3 class="mb-2 flex items-center gap-1">
        <i data-lucide="globe" style="width:18px;height:18px;color:var(--accent-purple)"></i>
        Global Comparison
      </h3>
      <canvas id="comparison-chart" height="200"></canvas>
    </div>`;

  // Bind scenario toggles
  let activeScenarios = new Set();
  container.querySelectorAll('.scenario-toggle').forEach(toggle => {
    toggle.addEventListener('change', () => {
      const id = toggle.dataset.scenario;
      if (toggle.checked) activeScenarios.add(id);
      else activeScenarios.delete(id);

      let projected = monthly;
      scenarios.forEach(s => {
        if (activeScenarios.has(s.id)) projected -= s.savings;
      });
      projected = Math.max(0, projected);
      const projEl = container.querySelector('#projected-value');
      if (projEl) projEl.textContent = projected.toFixed(0) + ' kg';
    });
  });

  // Animate source bars
  setTimeout(() => {
    container.querySelectorAll('.insight-bar-fill').forEach(bar => {
      bar.style.width = bar.dataset.width;
    });
  }, 300);

  // Build comparison chart
  buildComparisonChart(monthly);
}

function renderSourceBars(sources) {
  return sources.map(s => `
    <div class="h-bar-item">
      <span class="h-bar-label">${s.name}</span>
      <div class="h-bar-track">
        <div class="h-bar-fill insight-bar-fill" data-width="${Math.max(5, s.pct)}%" style="width:0%;background:${s.color}">
          ${s.pct.toFixed(1)}%
        </div>
      </div>
      <span class="h-bar-value">${s.kg.toFixed(1)} kg</span>
    </div>`).join('');
}

function generateInsights(summary, profile, kgs) {
  const insights = [];
  const transportPct = summary.transport_pct || 0;
  const electricityPct = summary.electricity_pct || 0;
  const foodPct = summary.food_pct || 0;
  const wastePct = summary.waste_pct || 0;

  if (transportPct > 35) {
    insights.push(createInsightCard('car', 'High Transport Emissions',
      `Your daily commute contributes ${transportPct.toFixed(0)}% of your emissions (${kgs.transportKg.toFixed(1)} kg/month). Switching to public transport twice a week could reduce this by ~20%.`,
      'rose'));
  } else if (transportPct > 0) {
    insights.push(createInsightCard('car', 'Transport',
      `Transport accounts for ${transportPct.toFixed(0)}% of your footprint. ${profile.car_km_per_day > 0 ? 'Consider carpooling or cycling for short trips.' : 'Great job minimizing car usage!'}`,
      'emerald'));
  }

  if (electricityPct > 30) {
    const savingKg = (kgs.electricityKg * 0.15).toFixed(0);
    insights.push(createInsightCard('zap', 'Energy Consumption Above Average',
      `Your energy usage accounts for ${electricityPct.toFixed(0)}% of emissions. Switching to LED lighting and smart power strips could save ~${savingKg} kg CO₂/month.`,
      'amber'));
  } else {
    insights.push(createInsightCard('zap', 'Energy Efficiency',
      `Energy is ${electricityPct.toFixed(0)}% of your footprint. ${profile.has_solar ? 'Solar panels are helping reduce your impact! ☀️' : 'Consider renewable energy options to go even greener.'}`,
      'teal'));
  }

  if (profile.diet_type === 'mixed') {
    insights.push(createInsightCard('utensils', 'Diet Impact',
      `A plant-based diet can reduce food emissions by up to 60%. Try starting with Meatless Mondays — even one day a week makes a difference!`,
      'amber'));
  } else if (profile.diet_type === 'vegetarian') {
    insights.push(createInsightCard('utensils', 'Great Dietary Choice',
      `Being vegetarian reduces your food emissions significantly! Going fully plant-based could save another 15-20%.`,
      'emerald'));
  } else {
    insights.push(createInsightCard('utensils', 'Excellent Diet Choice',
      `Your vegan diet is one of the most impactful choices for the planet. Food is only ${foodPct.toFixed(0)}% of your footprint. 🌱`,
      'emerald'));
  }

  if (profile.recycling_rate < 50) {
    const potentialSave = (kgs.wasteKg * 0.3).toFixed(0);
    insights.push(createInsightCard('recycle', 'Improve Recycling',
      `Your recycling rate is ${profile.recycling_rate || 0}%. Improving to 80%+ could reduce waste emissions by ~${potentialSave} kg/month.`,
      'purple'));
  } else {
    insights.push(createInsightCard('recycle', 'Good Recycling Habits',
      `Your recycling rate of ${profile.recycling_rate || 0}% is solid! ${profile.composts ? 'Composting adds extra impact reduction.' : 'Consider adding composting for even better results.'}`,
      'emerald'));
  }

  if (profile.flights_per_year > 4) {
    insights.push(createInsightCard('plane', 'Frequent Flyer Impact',
      `With ${profile.flights_per_year} flights/year, aviation is a significant contributor. Each round-trip flight can add 500-1500 kg CO₂. Consider trains for shorter trips.`,
      'rose'));
  }

  if (!profile.has_solar && electricityPct > 20) {
    insights.push(createInsightCard('sun', 'Consider Solar Energy',
      `Installing solar panels could reduce your electricity emissions by 40-80%, saving up to ${(kgs.electricityKg * 0.6).toFixed(0)} kg CO₂/month.`,
      'amber'));
  }

  return insights;
}

function calculateScenarios(profile, monthly) {
  const scenarios = [];

  if (profile.car_km_per_day > 0) {
    const carEmission = profile.car_km_per_day * 0.21 * 30;
    scenarios.push({
      id: 'public-transport',
      title: '🚌 Switch to public transport',
      savings: carEmission * 0.7,
    });
  }

  if (profile.diet_type === 'mixed') {
    const foodBase = profile.diet_type === 'mixed' ? 120 : 70;
    scenarios.push({
      id: 'vegetarian',
      title: '🥗 Go vegetarian',
      savings: foodBase * 0.4,
    });
  }

  if (!profile.has_solar) {
    const elecEmission = (profile.electricity_kwh || 200) * 0.5;
    scenarios.push({
      id: 'solar',
      title: '☀️ Install solar panels',
      savings: elecEmission * 0.6,
    });
  }

  if ((profile.recycling_rate || 0) < 80) {
    scenarios.push({
      id: 'recycle',
      title: '♻️ Recycle 80%+',
      savings: 15,
    });
  }

  return scenarios;
}

function buildComparisonChart(userMonthly) {
  const ctx = document.getElementById('comparison-chart');
  if (!ctx) return;

  const data = [
    { label: 'You', value: userMonthly },
    { label: 'India', value: 167 },
    { label: 'Global Avg', value: 333 },
    { label: 'EU Avg', value: 583 },
    { label: 'US Avg', value: 1333 },
  ];

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.label),
      datasets: [{
        data: data.map(d => d.value),
        backgroundColor: data.map((d, i) =>
          i === 0 ? '#10B981' : 'rgba(139, 146, 180, 0.3)'
        ),
        borderColor: data.map((d, i) =>
          i === 0 ? '#10B981' : 'rgba(139, 146, 180, 0.1)'
        ),
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
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
          callbacks: {
            label: (ctx2) => ` ${ctx2.parsed.x.toFixed(0)} kg CO₂/month`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
          ticks: { color: '#5a6b84', font: { size: 11 } },
        },
        y: {
          grid: { display: false },
          ticks: { color: '#e8edf5', font: { size: 12, weight: '500' } },
        },
      },
    },
  });
}
