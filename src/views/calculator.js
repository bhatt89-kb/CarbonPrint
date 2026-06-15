/* ============================================================
   EcoTrack — Calculator View (Profile update + results)
   ============================================================ */

import { api } from '../api.js';
import { createStepIndicator, showToast, animateCounter } from '../components.js';

export async function renderCalculator(container) {
  let currentStep = 0;
  const totalSteps = 5; // 4 input steps + 1 results step
  const stepNames = ['Transport', 'Energy', 'Food', 'Waste', 'Results'];

  // Load existing profile
  let formData = {
    car_km_per_day: 20,
    fuel_type: 'gasoline',
    public_transport_days: 2,
    bike_km_per_day: 0,
    flights_per_year: 2,
    electricity_kwh: 200,
    heating_type: 'gas',
    has_solar: false,
    diet_type: 'mixed',
    local_food_pct: 30,
    food_waste_freq: 'sometimes',
    recycling_rate: 40,
    composts: false,
    uses_single_use_plastics: true,
  };

  let calcResult = null;

  try {
    const profile = await api.get('/auth/profile');
    if (profile) {
      Object.keys(formData).forEach((key) => {
        if (profile[key] !== undefined && profile[key] !== null) {
          formData[key] = profile[key];
        }
      });
    }
  } catch { /* use defaults */ }

  function render() {
    container.innerHTML = `
      <div class="page-header animate-slide-up">
        <h1><i data-lucide="calculator" style="width:28px;height:28px;color:var(--accent-emerald);vertical-align:middle"></i> Carbon Calculator</h1>
        <p class="subtitle">Update your lifestyle data to recalculate your footprint</p>
      </div>

      <div style="max-width:640px;margin:0 auto">
        ${createStepIndicator(stepNames, currentStep)}

        <div class="glass-card no-hover" style="margin-top:8px">
          <div class="step-content" id="step-content">
            ${currentStep < 4 ? renderInputStep(currentStep) : renderResults()}
          </div>

          ${currentStep < 4 ? `
          <div class="flex justify-between mt-3">
            ${currentStep > 0
              ? '<button class="btn btn-secondary" id="calc-prev-btn"><i data-lucide="arrow-left" style="width:16px;height:16px"></i> Back</button>'
              : '<div></div>'}
            ${currentStep < 3
              ? '<button class="btn btn-primary" id="calc-next-btn">Next <i data-lucide="arrow-right" style="width:16px;height:16px"></i></button>'
              : '<button class="btn btn-primary" id="calc-submit-btn"><i data-lucide="calculator" style="width:16px;height:16px"></i> Recalculate</button>'
            }
          </div>` : ''}
        </div>
      </div>`;

    bindEvents();
    if (window.lucide) lucide.createIcons();

    if (currentStep === 4 && calcResult) {
      requestAnimationFrame(() => {
        const counterEl = container.querySelector('#result-total');
        if (counterEl) animateCounter(counterEl, calcResult.total_kg || 0, 1500);

        // Animate bars
        setTimeout(() => {
          container.querySelectorAll('.result-bar-fill').forEach((bar) => {
            bar.style.width = bar.dataset.width;
          });
        }, 200);
      });
    }
  }

  function renderInputStep(step) {
    switch (step) {
      case 0: return renderTransportStep();
      case 1: return renderEnergyStep();
      case 2: return renderFoodStep();
      case 3: return renderWasteStep();
      default: return '';
    }
  }

  function renderTransportStep() {
    return `
      <h3 class="mb-2 flex items-center gap-1">
        <i data-lucide="car" style="width:22px;height:22px;color:var(--accent-emerald)"></i> Transportation
      </h3>
      <div class="field-group">
        <label class="form-label">Daily car distance</label>
        <div class="range-value" id="rv-car">${formData.car_km_per_day} km</div>
        <input type="range" class="form-range" id="car_km_per_day" min="0" max="100" value="${formData.car_km_per_day}" />
        <div class="range-labels"><span>0 km</span><span>100 km</span></div>
      </div>
      <div class="field-group">
        <label class="form-label">Fuel type</label>
        <select class="form-select" id="fuel_type">
          ${['gasoline','diesel','hybrid','electric','none'].map(f => `<option value="${f}" ${formData.fuel_type===f?'selected':''}>${f.charAt(0).toUpperCase()+f.slice(1)}</option>`).join('')}
        </select>
      </div>
      <div class="field-group">
        <label class="form-label">Public transport days/week</label>
        <div class="range-value" id="rv-pt">${formData.public_transport_days} days</div>
        <input type="range" class="form-range" id="public_transport_days" min="0" max="7" value="${formData.public_transport_days}" />
      </div>
      <div class="field-group">
        <label class="form-label">Daily cycling distance</label>
        <div class="range-value" id="rv-bike">${formData.bike_km_per_day} km</div>
        <input type="range" class="form-range" id="bike_km_per_day" min="0" max="50" value="${formData.bike_km_per_day}" />
      </div>
      <div class="field-group">
        <label class="form-label">Flights per year</label>
        <div class="range-value" id="rv-flights">${formData.flights_per_year}</div>
        <input type="range" class="form-range" id="flights_per_year" min="0" max="20" value="${formData.flights_per_year}" />
      </div>`;
  }

  function renderEnergyStep() {
    return `
      <h3 class="mb-2 flex items-center gap-1">
        <i data-lucide="zap" style="width:22px;height:22px;color:var(--accent-amber)"></i> Home Energy
      </h3>
      <div class="field-group">
        <label class="form-label">Monthly electricity (kWh)</label>
        <div class="range-value" id="rv-elec">${formData.electricity_kwh} kWh</div>
        <input type="range" class="form-range" id="electricity_kwh" min="50" max="500" step="10" value="${formData.electricity_kwh}" />
      </div>
      <div class="field-group">
        <label class="form-label">Heating type</label>
        <select class="form-select" id="heating_type">
          ${['gas','electric','oil','none'].map(h => `<option value="${h}" ${formData.heating_type===h?'selected':''}>${h==='gas'?'Natural Gas':h.charAt(0).toUpperCase()+h.slice(1)}</option>`).join('')}
        </select>
      </div>
      <div class="field-group">
        <div class="flex items-center justify-between">
          <label class="form-label" style="margin:0">Solar panels</label>
          <label class="toggle-switch">
            <input type="checkbox" id="has_solar" ${formData.has_solar?'checked':''} />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>`;
  }

  function renderFoodStep() {
    return `
      <h3 class="mb-2 flex items-center gap-1">
        <i data-lucide="utensils" style="width:22px;height:22px;color:var(--accent-teal)"></i> Diet & Food
      </h3>
      <div class="field-group">
        <label class="form-label">Diet type</label>
        <select class="form-select" id="diet_type">
          ${['vegan','vegetarian','mixed'].map(d => `<option value="${d}" ${formData.diet_type===d?'selected':''}>${d.charAt(0).toUpperCase()+d.slice(1)}</option>`).join('')}
        </select>
      </div>
      <div class="field-group">
        <label class="form-label">Locally sourced food</label>
        <div class="range-value" id="rv-local">${formData.local_food_pct}%</div>
        <input type="range" class="form-range" id="local_food_pct" min="0" max="100" step="5" value="${formData.local_food_pct}" />
      </div>
      <div class="field-group">
        <label class="form-label">Food waste frequency</label>
        <select class="form-select" id="food_waste_freq">
          ${['rarely','sometimes','often'].map(f => `<option value="${f}" ${formData.food_waste_freq===f?'selected':''}>${f.charAt(0).toUpperCase()+f.slice(1)}</option>`).join('')}
        </select>
      </div>`;
  }

  function renderWasteStep() {
    return `
      <h3 class="mb-2 flex items-center gap-1">
        <i data-lucide="recycle" style="width:22px;height:22px;color:var(--accent-purple)"></i> Waste & Recycling
      </h3>
      <div class="field-group">
        <label class="form-label">Recycling rate</label>
        <div class="range-value" id="rv-recycle">${formData.recycling_rate}%</div>
        <input type="range" class="form-range" id="recycling_rate" min="0" max="100" step="5" value="${formData.recycling_rate}" />
      </div>
      <div class="field-group">
        <div class="flex items-center justify-between">
          <label class="form-label" style="margin:0">Composting</label>
          <label class="toggle-switch">
            <input type="checkbox" id="composts" ${formData.composts?'checked':''} />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
      <div class="field-group">
        <div class="flex items-center justify-between">
          <label class="form-label" style="margin:0">Single-use plastics</label>
          <label class="toggle-switch">
            <input type="checkbox" id="uses_single_use_plastics" ${formData.uses_single_use_plastics?'checked':''} />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>`;
  }

  function renderResults() {
    if (!calcResult) return '<p>No results yet.</p>';

    const total = calcResult.total_kg || 0;
    const globalAvg = 333;
    const isAbove = total > globalAvg;
    const categories = [
      { name: 'Transport', kg: calcResult.transport_kg || 0, color: '#10B981' },
      { name: 'Electricity', kg: calcResult.electricity_kg || 0, color: '#14B8A6' },
      { name: 'Food', kg: calcResult.food_kg || 0, color: '#F59E0B' },
      { name: 'Waste', kg: calcResult.waste_kg || 0, color: '#8B5CF6' },
    ];
    const maxKg = Math.max(...categories.map(c => c.kg), 1);

    return `
      <div class="text-center mb-3 animate-slide-up">
        <p class="text-secondary text-sm mb-1">Your Monthly Carbon Footprint</p>
        <div style="font-family:var(--font-heading);font-size:3.5rem;font-weight:800;color:${isAbove ? 'var(--accent-rose)' : 'var(--accent-emerald)'}" id="result-total">0</div>
        <p class="text-secondary">kg CO₂ / month</p>
      </div>

      <div class="mb-3">
        <h4 class="mb-2">Category Breakdown</h4>
        <div class="h-bar">
          ${categories.map(c => {
            const pct = Math.max(5, (c.kg / maxKg) * 100);
            return `
              <div class="h-bar-item">
                <span class="h-bar-label">${c.name}</span>
                <div class="h-bar-track">
                  <div class="h-bar-fill result-bar-fill" data-width="${pct}%" style="width:0%;background:${c.color}">${c.kg.toFixed(1)} kg</div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>

      <div class="insight-card ${isAbove ? 'rose' : 'emerald'} mb-3" style="border-left-color:${isAbove ? 'var(--accent-rose)' : 'var(--accent-emerald)'}">
        <div class="insight-desc">
          ${isAbove
            ? `Your footprint of <strong>${total.toFixed(0)} kg/month</strong> is above the global average of ${globalAvg} kg/month. Consider adopting green actions to reduce your impact! 🌱`
            : `Great job! Your footprint of <strong>${total.toFixed(0)} kg/month</strong> is below the global average of ${globalAvg} kg/month. Keep up the eco-friendly lifestyle! 🎉`
          }
        </div>
      </div>

      <div class="flex gap-2 justify-center">
        <a href="#/dashboard" class="btn btn-primary">
          <i data-lucide="layout-dashboard" style="width:16px;height:16px"></i> View Dashboard
        </a>
        <a href="#/goals" class="btn btn-secondary">
          <i data-lucide="target" style="width:16px;height:16px"></i> Set a Goal
        </a>
      </div>`;
  }

  function collectCurrentStep() {
    const get = (id) => { const el = container.querySelector(`#${id}`); return el ? el.value : undefined; };
    const getChecked = (id) => { const el = container.querySelector(`#${id}`); return el ? el.checked : false; };

    switch (currentStep) {
      case 0:
        formData.car_km_per_day = Number(get('car_km_per_day'));
        formData.fuel_type = get('fuel_type');
        formData.public_transport_days = Number(get('public_transport_days'));
        formData.bike_km_per_day = Number(get('bike_km_per_day'));
        formData.flights_per_year = Number(get('flights_per_year'));
        break;
      case 1:
        formData.electricity_kwh = Number(get('electricity_kwh'));
        formData.heating_type = get('heating_type');
        formData.has_solar = getChecked('has_solar');
        break;
      case 2:
        formData.diet_type = get('diet_type');
        formData.local_food_pct = Number(get('local_food_pct'));
        formData.food_waste_freq = get('food_waste_freq');
        break;
      case 3:
        formData.recycling_rate = Number(get('recycling_rate'));
        formData.composts = getChecked('composts');
        formData.uses_single_use_plastics = getChecked('uses_single_use_plastics');
        break;
    }
  }

  function bindSliders() {
    const map = {
      car_km_per_day: ['rv-car', ' km'],
      public_transport_days: ['rv-pt', ' days'],
      bike_km_per_day: ['rv-bike', ' km'],
      flights_per_year: ['rv-flights', ''],
      electricity_kwh: ['rv-elec', ' kWh'],
      local_food_pct: ['rv-local', '%'],
      recycling_rate: ['rv-recycle', '%'],
    };
    Object.entries(map).forEach(([id, [displayId, suffix]]) => {
      const slider = container.querySelector(`#${id}`);
      const display = container.querySelector(`#${displayId}`);
      if (slider && display) {
        slider.addEventListener('input', () => { display.textContent = slider.value + suffix; });
      }
    });
  }

  function bindEvents() {
    const prevBtn = container.querySelector('#calc-prev-btn');
    const nextBtn = container.querySelector('#calc-next-btn');
    const submitBtn = container.querySelector('#calc-submit-btn');

    if (prevBtn) prevBtn.addEventListener('click', () => { collectCurrentStep(); currentStep--; render(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { collectCurrentStep(); currentStep++; render(); });
    if (submitBtn) submitBtn.addEventListener('click', handleSubmit);

    bindSliders();
  }

  async function handleSubmit() {
    collectCurrentStep();
    const btn = container.querySelector('#calc-submit-btn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner spinner-sm"></div> Calculating…';

    try {
      await api.put('/auth/profile', formData);
      calcResult = await api.post('/footprint/calculate', formData);
      showToast('Footprint updated! 🌍', 'success');
      currentStep = 4;
      render();
    } catch (err) {
      showToast(err.message || 'Calculation failed', 'error');
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="calculator" style="width:16px;height:16px"></i> Recalculate';
      if (window.lucide) lucide.createIcons();
    }
  }

  render();
}
