/* ============================================================
   EcoTrack — Hash-based SPA Router
   ============================================================ */

class Router {
  constructor() {
    this.routes = {};
    this.currentView = null;
  }

  addRoute(path, viewFn) {
    this.routes[path] = viewFn;
  }

  async navigate(path) {
    window.location.hash = path;
  }

  async handleRoute() {
    const hash = window.location.hash.slice(1) || '/dashboard';
    const viewFn = this.routes[hash];
    if (!viewFn) return;

    const content = document.getElementById('main-content');
    if (!content) return;

    // Animate out
    content.classList.add('page-exit');
    await new Promise((r) => setTimeout(r, 150));

    // Show spinner while loading
    content.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';
    content.classList.remove('page-exit');
    content.classList.add('page-enter');

    try {
      await viewFn(content);
    } catch (e) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i data-lucide="alert-triangle"></i></div>
          <div class="empty-title">Something went wrong</div>
          <div class="empty-message">${e.message || 'Error loading page'}</div>
        </div>`;
      console.error('[Router]', e);
    }

    // Animate in
    requestAnimationFrame(() => {
      content.classList.remove('page-enter');
      content.classList.add('page-enter-active');
      setTimeout(() => content.classList.remove('page-enter-active'), 400);
    });

    // Update sidebar active state
    this.updateActiveNav(hash);

    // Re-render Lucide icons for the new view
    if (window.lucide) lucide.createIcons();
  }

  updateActiveNav(hash) {
    document.querySelectorAll('.nav-link').forEach((link) => {
      const href = link.getAttribute('href');
      if (href) {
        link.classList.toggle('active', href === '#' + hash);
      }
    });
  }

  start() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  }
}

export const router = new Router();
