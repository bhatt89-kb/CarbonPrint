/* ============================================================
   EcoTrack — Onboarding View (Multi-step lifestyle questionnaire)
   ============================================================ */

import { api } from '../api.js';
import { createStepIndicator, showToast } from '../components.js';

export async function renderOnboarding(container) {
  let currentStep = 0;
  const totalSteps = 4;
  const stepNames = ['Transport', 'Energy', 'Food', 'Waste'];

  // Default values
  const formData = {
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

  function render() {
    container.innerHTML = `
      <div class="onboarding-page">
        <div class="onboarding-container animate-fade-in">
          <div style="text-align:center;margin-bottom:24px">
            <h1 style="font-size:1.6rem;margin-bottom:4px">
              <span style="background:var(--gradient-emerald);-webkit-background-clip:text;-webkit-text-fill-color:transparent">
                Tell us about your lifestyle
              </span>
            </h1>
            <p class="text-secondary text-sm">We'll calculate your carbon footprint based on your daily habits</p>
          </div>

          ${createStepIndicator(stepNames, currentStep)}

          <div class="onboarding-card">
            <div class="step-content" id="step-content">
              ${renderStep(currentStep)}
            </div>

            <div class="flex justify-between mt-3">
              ${currentStep > 0
                ? '<button class="btn btn-secondary" id="prev-btn"><i data-lucide="arrow-left" style="width:16px;height:16px"></i> Back</button>'
                : '<div></div>'}
              ${currentStep < totalSteps - 1
                ? '<button class="btn btn-primary" id="next-btn">Next <i data-lucide="arrow-right" style="width:16px;height:16px"></i></button>'
                : '<button class="btn btn-primary" id="submit-btn"><i data-lucide="calculator" style="width:16px;height:16px"></i> Calculate My Footprint</button>'
              }
            </div>
          </div>
        </div>
      </div>`;

    bindEvents();
    if (window.lucide) lucide.createIcons();
  }

  function renderStep(step) {
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
        <i data-lucide="car" style="width:22px;height:22px;color:var(--accent-emerald)"></i>
        Transportation
      </h3>
      <p class="text-secondary text-sm mb-3">How do you get around?</p>

      <div class="field-group">
        <div class="field-header">
          <i data-lucide="gauge"></i>
          <label class="form-label">Daily car distance</label>
        </div>
        <div class="range-value" id="car-km-val">${formData.car_km_per_day} km</div>
        <input type="range" class="form-range" id="car_km_per_day" min="0" max="100" step="1" value="${formData.car_km_per_day}" />
        <div class="range-labels"><span>0 km</span><span>100 km</span></div>
      </div>

      <div class="field-group">
        <div class="field-header">
          <i data-lucide="fuel"></i>
          <label class="form-label">Fuel type</label>
        </div>
        <select class="form-select" id="fuel_type">
          <option value="gasoline" ${formData.fuel_type === 'gasoline' ? 'selected' : ''}>Gasoline</option>
          <option value="diesel" ${formData.fuel_type === 'diesel' ? 'selected' : ''}>Diesel</option>
          <option value="hybrid" ${formData.fuel_type === 'hybrid' ? 'selected' : ''}>Hybrid</option>
          <option value="electric" ${formData.fuel_type === 'electric' ? 'selected' : ''}>Electric</option>
          <option value="none" ${formData.fuel_type === 'none' ? 'selected' : ''}>No car</option>
        </select>
      </div>

      <div class="field-group">
        <div class="field-header">
          <i data-lucide="train-front"></i>
          <label class="form-label">Public transport days per week</label>
        </div>
        <div class="range-value" id="pt-val">${formData.public_transport_days} days</div>
        <input type="range" class="form-range" id="public_transport_days" min="0" max="7" step="1" value="${formData.public_transport_days}" />
        <div class="range-labels"><span>0</span><span>7 days</span></div>
      </div>

      <div class="field-group">
        <div class="field-header">
          <i data-lucide="bike"></i>
          <label class="form-label">Daily cycling distance</label>
        </div>
        <div class="range-value" id="bike-val">${formData.bike_km_per_day} km</div>
        <input type="range" class="form-range" id="bike_km_per_day" min="0" max="50" step="1" value="${formData.bike_km_per_day}" />
        <div class="range-labels"><span>0 km</span><span>50 km</span></div>
      </div>

      <div class="field-group">
        <div class="field-header">
          <i data-lucide="plane"></i>
          <label class="form-label">Flights per year</label>
        </div>
        <div class="range-value" id="flights-val">${formData.flights_per_year}</div>
        <input type="range" class="form-range" id="flights_per_year" min="0" max="20" step="1" value="${formData.flights_per_year}" />
        <div class="range-labels"><span>0</span><span>20</span></div>
      </div>`;
  }

  function renderEnergyStep() {
    return `
      <h3 class="mb-2 flex items-center gap-1">
        <i data-lucide="zap" style="width:22px;height:22px;color:var(--accent-amber)"></i>
        Home Energy
      </h3>
      <p class="text-secondary text-sm mb-3">Tell us about your home energy usage.</p>

      <div class="field-group">
        <div class="field-header">
          <i data-lucide="plug"></i>
          <label class="form-label">Monthly electricity usage</label>
        </div>
        <div class="range-value" id="elec-val">${formData.electricity_kwh} kWh</div>
        <input type="range" class="form-range" id="electricity_kwh" min="50" max="500" step="10" value="${formData.electricity_kwh}" />
        <div class="range-labels"><span>50 kWh</span><span>500 kWh</span></div>
      </div>

      <div class="field-group">
        <div class="field-header">
          <i data-lucide="flame"></i>
          <label class="form-label">Heating type</label>
        </div>
        <select class="form-select" id="heating_type">
          <option value="gas" ${formData.heating_type === 'gas' ? 'selected' : ''}>Natural Gas</option>
          <option value="electric" ${formData.heating_type === 'electric' ? 'selected' : ''}>Electric</option>
          <option value="oil" ${formData.heating_type === 'oil' ? 'selected' : ''}>Oil</option>
          <option value="none" ${formData.heating_type === 'none' ? 'selected' : ''}>No heating</option>
        </select>
      </div>

      <div class="field-group">
        <div class="flex items-center justify-between">
          <div class="field-header" style="margin-bottom:0">
            <i data-lucide="sun"></i>
            <label class="form-label" style="margin:0">Solar panels installed</label>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="has_solar" ${formData.has_solar ? 'checked' : ''} />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>`;
  }

  function renderFoodStep() {
    return `
      <h3 class="mb-2 flex items-center gap-1">
        <i data-lucide="utensils" style="width:22px;height:22px;color:var(--accent-teal)"></i>
        Diet & Food
      </h3>
      <p class="text-secondary text-sm mb-3">What does your diet look like?</p>

      <div class="field-group">
        <div class="field-header">
          <i data-lucide="salad"></i>
          <label class="form-label">Diet type</label>
        </div>
        <select class="form-select" id="diet_type">
          <option value="vegan" ${formData.diet_type === 'vegan' ? 'selected' : ''}>Vegan</option>
          <option value="vegetarian" ${formData.diet_type === 'vegetarian' ? 'selected' : ''}>Vegetarian</option>
          <option value="mixed" ${formData.diet_type === 'mixed' ? 'selected' : ''}>Mixed / Omnivore</option>
        </select>
      </div>

      <div class="field-group">
        <div class="field-header">
          <i data-lucide="map-pin"></i>
          <label class="form-label">Locally sourced food</label>
        </div>
        <div class="range-value" id="local-val">${formData.local_food_pct}%</div>
        <input type="range" class="form-range" id="local_food_pct" min="0" max="100" step="5" value="${formData.local_food_pct}" />
        <div class="range-labels"><span>0%</span><span>100%</span></div>
      </div>

      <div class="field-group">
        <div class="field-header">
          <i data-lucide="trash-2"></i>
          <label class="form-label">Food waste frequency</label>
        </div>
        <select class="form-select" id="food_waste_freq">
          <option value="rarely" ${formData.food_waste_freq === 'rarely' ? 'selected' : ''}>Rarely</option>
          <option value="sometimes" ${formData.food_waste_freq === 'sometimes' ? 'selected' : ''}>Sometimes</option>
          <option value="often" ${formData.food_waste_freq === 'often' ? 'selected' : ''}>Often</option>
        </select>
      </div>`;
  }

  function renderWasteStep() {
    return `
      <h3 class="mb-2 flex items-center gap-1">
        <i data-lucide="recycle" style="width:22px;height:22px;color:var(--accent-purple)"></i>
        Waste & Recycling
      </h3>
      <p class="text-secondary text-sm mb-3">How do you handle waste?</p>

      <div class="field-group">
        <div class="field-header">
          <i data-lucide="recycle"></i>
          <label class="form-label">Recycling rate</label>
        </div>
        <div class="range-value" id="recycle-val">${formData.recycling_rate}%</div>
        <input type="range" class="form-range" id="recycling_rate" min="0" max="100" step="5" value="${formData.recycling_rate}" />
        <div class="range-labels"><span>0%</span><span>100%</span></div>
      </div>

      <div class="field-group">
        <div class="flex items-center justify-between">
          <div class="field-header" style="margin-bottom:0">
            <i data-lucide="flower-2"></i>
            <label class="form-label" style="margin:0">Composting</label>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="composts" ${formData.composts ? 'checked' : ''} />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="field-group">
        <div class="flex items-center justify-between">
          <div class="field-header" style="margin-bottom:0">
            <i data-lucide="package-x"></i>
            <label class="form-label" style="margin:0">Uses single-use plastics</label>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="uses_single_use_plastics" ${formData.uses_single_use_plastics ? 'checked' : ''} />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>`;
  }

  function collectCurrentStep() {
    const get = (id) => {
      const el = container.querySelector(`#${id}`);
      return el ? el.value : undefined;
    };
    const getChecked = (id) => {
      const el = container.querySelector(`#${id}`);
      return el ? el.checked : false;
    };

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
    const sliders = {
      car_km_per_day: { el: 'car-km-val', suffix: ' km' },
      public_transport_days: { el: 'pt-val', suffix: ' days' },
      bike_km_per_day: { el: 'bike-val', suffix: ' km' },
      flights_per_year: { el: 'flights-val', suffix: '' },
      electricity_kwh: { el: 'elec-val', suffix: ' kWh' },
      local_food_pct: { el: 'local-val', suffix: '%' },
      recycling_rate: { el: 'recycle-val', suffix: '%' },
    };

    Object.entries(sliders).forEach(([id, config]) => {
      const slider = container.querySelector(`#${id}`);
      const display = container.querySelector(`#${config.el}`);
      if (slider && display) {
        slider.addEventListener('input', () => {
          display.textContent = slider.value + config.suffix;
        });
      }
    });
  }

  function bindEvents() {
    const prevBtn = container.querySelector('#prev-btn');
    const nextBtn = container.querySelector('#next-btn');
    const submitBtn = container.querySelector('#submit-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        collectCurrentStep();
        currentStep--;
        render();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        collectCurrentStep();
        currentStep++;
        render();
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', handleSubmit);
    }

    bindSliders();
  }

  async function handleSubmit() {
    collectCurrentStep();
    const submitBtn = container.querySelector('#submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner spinner-sm"></div> Calculating…';

    try {
      // Save profile
      await api.put('/auth/profile', formData);

      // Calculate footprint
      await api.post('/footprint/calculate', formData);

      showToast('Footprint calculated! 🌍', 'success');
      window.location.hash = '#/dashboard';
    } catch (err) {
      showToast(err.message || 'Failed to save profile', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i data-lucide="calculator" style="width:16px;height:16px"></i> Calculate My Footprint';
      if (window.lucide) lucide.createIcons();
    }
  }

  render();
}
