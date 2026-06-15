import { router } from './router.js';
import { renderDashboard } from './views/dashboard.js';
import { renderActions } from './views/actions.js';
import { renderAuth } from './views/auth.js';
import { renderCalculator } from './views/calculator.js';
import { renderInsights } from './views/insights.js';
import { renderOnboarding } from './views/onboarding.js';

function buildLayout() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <div class="logo-icon">🌿</div>
          <div class="logo-text">EcoTrack</div>
        </div>
      </div>
      <nav class="nav-links">
        <a href="#/dashboard" class="nav-link">Dashboard</a>
        <a href="#/calculator" class="nav-link">Calculator</a>
        <a href="#/actions" class="nav-link">Actions</a>
        <a href="#/insights" class="nav-link">Insights</a>
        <a href="#/onboarding" class="nav-link">Onboarding</a>
        <a href="#/auth" class="nav-link">Account</a>
      </nav>
      <div class="sidebar-footer">
        <button class="btn btn-ghost logout-btn" id="logout-btn">Logout</button>
      </div>
    </div>

    <main class="main-content">
      <div id="main-content"></div>
    </main>
  `;

  // wire logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    try { localStorage.removeItem('ecotrack_token'); } catch (e) {}
    window.location.hash = '#/auth';
  });

  // render lucide icons if available
  if (window.lucide) window.lucide.createIcons();
}

function registerRoutes() {
  router.addRoute('/dashboard', renderDashboard);
  router.addRoute('/calculator', renderCalculator);
  router.addRoute('/actions', renderActions);
  router.addRoute('/insights', renderInsights);
  router.addRoute('/onboarding', renderOnboarding);
  router.addRoute('/auth', renderAuth);
}

function start() {
  buildLayout();
  registerRoutes();
  router.start();
}

start();
