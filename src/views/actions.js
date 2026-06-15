/* ============================================================
   EcoTrack — Actions View
   ============================================================ */

import { api } from '../api.js';
import { createBadgeChip, showToast, createEmptyState } from '../components.js';

export async function renderActions(container) {
  let actions = [];
  let activeCategory = 'all';
  let activeDifficulty = 'all';

  try {
    const data = await api.get('/actions');
    actions = Array.isArray(data) ? data : (data.actions || []);
  } catch {
    actions = [];
  }

  function getFilteredActions() {
    return actions.filter(a => {
      const catMatch = activeCategory === 'all' || (a.category || '').toLowerCase() === activeCategory.toLowerCase();
      const diffMatch = activeDifficulty === 'all' || (a.difficulty || '').toLowerCase() === activeDifficulty.toLowerCase();
      return catMatch && diffMatch;
    }).sort((a, b) => {
      // Adopted first
      if (a.adopted && !b.adopted) return -1;
      if (!a.adopted && b.adopted) return 1;
      return (b.co2_reduction_kg || 0) - (a.co2_reduction_kg || 0);
    });
  }

  function render() {
    const filtered = getFilteredActions();
    const adoptedCount = actions.filter(a => a.adopted).length;
    const totalSavings = actions.filter(a => a.adopted).reduce((sum, a) => sum + (a.co2_reduction_kg || 0), 0);
    const categories = ['All', 'Transport', 'Energy', 'Food', 'Waste'];
    const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

    container.innerHTML = `
      <div class="page-header animate-slide-up">
        <h1><i data-lucide="list-checks" style="width:28px;height:28px;color:var(--accent-emerald);vertical-align:middle"></i> Green Actions</h1>
        <p class="subtitle">Adopt actions to reduce your carbon footprint</p>
      </div>

      <!-- Summary -->
      <div class="flex gap-3 mb-3 animate-slide-up stagger-1" style="flex-wrap:wrap">
        <div class="glass-card no-hover flex items-center gap-2" style="padding:16px 24px;flex:1;min-width:200px">
          <div class="stat-icon emerald"><i data-lucide="check-circle"></i></div>
          <div>
            <div class="font-bold text-lg">${adoptedCount}</div>
            <div class="text-sm text-secondary">Actions Adopted</div>
          </div>
        </div>
        <div class="glass-card no-hover flex items-center gap-2" style="padding:16px 24px;flex:1;min-width:200px">
          <div class="stat-icon teal"><i data-lucide="leaf"></i></div>
          <div>
            <div class="font-bold text-lg text-emerald">${totalSavings.toFixed(1)} kg</div>
            <div class="text-sm text-secondary">Monthly CO₂ Saved</div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="animate-slide-up stagger-2">
        <div class="filter-bar">
          <span class="text-sm text-muted mr-1">Category:</span>
          ${categories.map(c => `
            <button class="filter-pill ${activeCategory === c.toLowerCase() ? 'active' : ''}" data-filter="category" data-value="${c.toLowerCase()}">${c}</button>
          `).join('')}
        </div>
        <div class="filter-bar">
          <span class="text-sm text-muted mr-1">Difficulty:</span>
          ${difficulties.map(d => `
            <button class="filter-pill ${activeDifficulty === d.toLowerCase() ? 'active' : ''}" data-filter="difficulty" data-value="${d.toLowerCase()}">${d}</button>
          `).join('')}
        </div>
      </div>

      <!-- Actions Grid -->
      ${filtered.length === 0
        ? createEmptyState('search', 'No actions found', 'Try adjusting your filters.')
        : `<div class="grid grid-3 gap-3 animate-slide-up stagger-3">
            ${filtered.map(action => renderActionCard(action)).join('')}
          </div>`
      }`;

    bindEvents();
    if (window.lucide) lucide.createIcons();
  }

  function renderActionCard(action) {
    const icon = action.icon || 'leaf';
    const diffType = (action.difficulty || 'easy').toLowerCase();
    const adopted = action.adopted;

    return `
      <div class="action-card ${adopted ? 'adopted' : ''}" data-action-id="${action.id}">
        <div class="flex items-center justify-between">
          <div class="action-icon">
            <i data-lucide="${icon}" style="width:22px;height:22px"></i>
          </div>
          ${createBadgeChip(action.difficulty || 'Easy', diffType)}
        </div>
        <div class="action-title">${action.title}</div>
        <div class="action-desc">${action.description || ''}</div>
        <div class="action-stats">
          <span class="action-savings">
            <i data-lucide="leaf" style="width:14px;height:14px;vertical-align:middle"></i>
            ${(action.co2_reduction_kg || 0).toFixed(1)} kg/month
          </span>
          ${action.cost_savings ? `
            <span class="action-cost">
              <i data-lucide="coins" style="width:14px;height:14px;vertical-align:middle"></i>
              $${action.cost_savings}/month
            </span>` : ''}
        </div>
        <button class="btn ${adopted ? 'btn-secondary' : 'btn-primary'} btn-sm w-full adopt-btn"
                data-id="${action.id}" data-adopted="${adopted ? '1' : '0'}">
          ${adopted
            ? '<i data-lucide="check" style="width:14px;height:14px"></i> Adopted ✓'
            : '<i data-lucide="plus" style="width:14px;height:14px"></i> Adopt Action'}
        </button>
      </div>`;
  }

  function bindEvents() {
    // Filter clicks
    container.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const filterType = pill.dataset.filter;
        const value = pill.dataset.value;
        if (filterType === 'category') activeCategory = value;
        else activeDifficulty = value;
        render();
      });
    });

    // Adopt / Unadopt
    container.querySelectorAll('.adopt-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const isAdopted = btn.dataset.adopted === '1';
        btn.disabled = true;

        try {
          if (isAdopted) {
            await api.delete(`/actions/${id}/adopt`);
            showToast('Action removed', 'info');
          } else {
            await api.post(`/actions/${id}/adopt`);
            showToast('Action adopted! 🌱', 'success');
          }

          // Toggle local state
          const action = actions.find(a => String(a.id) === String(id));
          if (action) action.adopted = !isAdopted;
          render();
        } catch (err) {
          showToast(err.message || 'Failed to update', 'error');
          btn.disabled = false;
        }
      });
    });
  }

  render();
}
