/* ============================================================
   EcoTrack — Auth View (Login / Register)
   ============================================================ */

import { api } from '../api.js';
import { showToast } from '../components.js';

export async function renderAuth(container) {
  let mode = 'login'; // 'login' | 'register'

  function render() {
    container.innerHTML = `
      <div class="auth-page">
        <div class="auth-container animate-fade-in">
          <!-- Branding Side -->
          <div class="auth-branding">
            <div class="brand-icon">🌍</div>
            <h1>EcoTrack</h1>
            <p class="tagline">Track your impact. Change the world.</p>
            <div style="margin-top:24px;display:flex;flex-direction:column;gap:12px;position:relative;z-index:1">
              <div class="flex items-center gap-1" style="color:var(--text-secondary);font-size:0.85rem">
                <i data-lucide="bar-chart-3" style="width:16px;height:16px;color:var(--accent-emerald)"></i>
                <span>Calculate your carbon footprint</span>
              </div>
              <div class="flex items-center gap-1" style="color:var(--text-secondary);font-size:0.85rem">
                <i data-lucide="target" style="width:16px;height:16px;color:var(--accent-teal)"></i>
                <span>Set reduction goals & track progress</span>
              </div>
              <div class="flex items-center gap-1" style="color:var(--text-secondary);font-size:0.85rem">
                <i data-lucide="trophy" style="width:16px;height:16px;color:var(--accent-amber)"></i>
                <span>Earn points & compete with friends</span>
              </div>
            </div>
          </div>

          <!-- Form Side -->
          <div class="auth-form-section">
            <div class="auth-tabs">
              <button class="auth-tab ${mode === 'login' ? 'active' : ''}" data-mode="login">Login</button>
              <button class="auth-tab ${mode === 'register' ? 'active' : ''}" data-mode="register">Register</button>
            </div>

            ${mode === 'login' ? renderLoginForm() : renderRegisterForm()}
          </div>
        </div>
      </div>`;

    bindEvents();
    if (window.lucide) lucide.createIcons();
  }

  function renderLoginForm() {
    return `
      <form id="auth-form" autocomplete="on">
        <div class="form-group">
          <label class="form-label" for="login-email">Email</label>
          <input class="form-input" type="email" id="login-email" name="email"
                 placeholder="you@example.com" required autocomplete="email" />
        </div>
        <div class="form-group">
          <label class="form-label" for="login-password">Password</label>
          <input class="form-input" type="password" id="login-password" name="password"
                 placeholder="••••••••" required autocomplete="current-password" />
        </div>
        <div id="auth-error" class="form-error mb-2" style="display:none"></div>
        <button type="submit" class="btn btn-primary btn-lg w-full" id="auth-submit">
          <i data-lucide="log-in" style="width:18px;height:18px"></i>
          Sign In
        </button>
      </form>`;
  }

  function renderRegisterForm() {
    return `
      <form id="auth-form" autocomplete="on">
        <div class="form-group">
          <label class="form-label" for="reg-username">Username</label>
          <input class="form-input" type="text" id="reg-username" name="username"
                 placeholder="ecowarrior42" required autocomplete="username" />
        </div>
        <div class="form-group">
          <label class="form-label" for="reg-email">Email</label>
          <input class="form-input" type="email" id="reg-email" name="email"
                 placeholder="you@example.com" required autocomplete="email" />
        </div>
        <div class="form-group">
          <label class="form-label" for="reg-password">Password</label>
          <input class="form-input" type="password" id="reg-password" name="password"
                 placeholder="Min 6 characters" required minlength="6" autocomplete="new-password" />
        </div>
        <div class="form-group">
          <label class="form-label" for="reg-confirm">Confirm Password</label>
          <input class="form-input" type="password" id="reg-confirm" name="confirmPassword"
                 placeholder="••••••••" required autocomplete="new-password" />
        </div>
        <div id="auth-error" class="form-error mb-2" style="display:none"></div>
        <button type="submit" class="btn btn-primary btn-lg w-full" id="auth-submit">
          <i data-lucide="user-plus" style="width:18px;height:18px"></i>
          Create Account
        </button>
      </form>`;
  }

  function bindEvents() {
    // Tab switching
    container.querySelectorAll('.auth-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        mode = tab.dataset.mode;
        render();
      });
    });

    // Form submit
    const form = container.querySelector('#auth-form');
    if (form) {
      form.addEventListener('submit', handleSubmit);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errorEl = container.querySelector('#auth-error');
    const submitBtn = container.querySelector('#auth-submit');
    errorEl.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner spinner-sm"></div> Please wait…';

    try {
      if (mode === 'login') {
        const email = container.querySelector('#login-email').value.trim();
        const password = container.querySelector('#login-password').value;

        const data = await api.post('/auth/login', { email, password });
        api.setToken(data.token);
        showToast('Welcome back! 🌿', 'success');

        // Check if user has completed onboarding
        try {
          const profile = await api.get('/auth/profile');
          if (!profile.diet_type && !profile.car_km_per_day) {
            window.location.hash = '#/onboarding';
          } else {
            window.location.hash = '#/dashboard';
          }
        } catch {
          window.location.hash = '#/dashboard';
        }
      } else {
        const username = container.querySelector('#reg-username').value.trim();
        const email = container.querySelector('#reg-email').value.trim();
        const password = container.querySelector('#reg-password').value;
        const confirmPassword = container.querySelector('#reg-confirm').value;

        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        const data = await api.post('/auth/register', { username, email, password });
        api.setToken(data.token);
        showToast('Account created! Let\'s set up your profile 🌱', 'success');
        window.location.hash = '#/onboarding';
      }
    } catch (err) {
      errorEl.textContent = err.message || 'Something went wrong';
      errorEl.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.innerHTML = mode === 'login'
        ? '<i data-lucide="log-in" style="width:18px;height:18px"></i> Sign In'
        : '<i data-lucide="user-plus" style="width:18px;height:18px"></i> Create Account';
      if (window.lucide) lucide.createIcons();
    }
  }

  render();
}
