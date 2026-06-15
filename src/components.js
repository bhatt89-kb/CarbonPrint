/* ============================================================
   EcoTrack — Reusable UI Components
   Every function returns an HTML string unless noted otherwise.
   ============================================================ */

// ─── Stat Card ────────────────────────────────────────────────
export function createStatCard(icon, label, value, trend, color = 'emerald') {
  const trendDir = trend > 0 ? 'up' : trend < 0 ? 'down' : '';
  const trendIcon = trend > 0 ? 'trending-up' : trend < 0 ? 'trending-down' : 'minus';
  const trendText = trend !== 0 ? `${trend > 0 ? '+' : ''}${trend.toFixed(1)}%` : '—';

  return `
    <div class="stat-card animate-slide-up">
      <div class="stat-icon ${color}">
        <i data-lucide="${icon}"></i>
      </div>
      <div class="stat-value animated-number" data-target="${parseFloat(value) || 0}">${value}</div>
      <div class="stat-label">${label}</div>
      ${trend !== undefined ? `
        <div class="stat-trend ${trendDir}">
          <i data-lucide="${trendIcon}" style="width:14px;height:14px"></i>
          <span>${trendText}</span>
        </div>` : ''}
    </div>`;
}

// ─── Progress Ring (SVG) ──────────────────────────────────────
export function createProgressRing(percent, size = 120, color = '#10B981', label = '') {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;

  return `
    <div class="progress-ring-container" style="width:${size}px;height:${size}px">
      <svg class="progress-ring" width="${size}" height="${size}">
        <circle class="progress-ring-bg" cx="${size / 2}" cy="${size / 2}" r="${radius}"
                stroke-width="${strokeWidth}" />
        <circle class="progress-ring-fill" cx="${size / 2}" cy="${size / 2}" r="${radius}"
                stroke-width="${strokeWidth}" stroke="${color}"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${offset}"
                style="--circumference:${circumference}" />
      </svg>
      <div class="progress-ring-text">
        <span class="progress-ring-value" style="color:${color}">${Math.round(percent)}%</span>
        ${label ? `<span class="progress-ring-label">${label}</span>` : ''}
      </div>
    </div>`;
}

// ─── Badge / Chip ─────────────────────────────────────────────
export function createBadgeChip(text, type = 'category') {
  const cls = type === 'easy' ? 'badge-easy'
            : type === 'medium' ? 'badge-medium'
            : type === 'hard' ? 'badge-hard'
            : type === 'info' ? 'badge-info'
            : 'badge-category';
  return `<span class="badge ${cls}">${text}</span>`;
}

// ─── Achievement Badge ────────────────────────────────────────
export function createAchievementBadge(badge, earned = false) {
  const icon = badge.icon || 'award';
  return `
    <div class="achievement-badge ${earned ? 'earned' : 'locked'}" data-badge-id="${badge.id || ''}">
      <div class="badge-icon">
        <i data-lucide="${icon}"></i>
        ${!earned ? '<div class="lock-overlay"><i data-lucide="lock" style="width:16px;height:16px"></i></div>' : ''}
      </div>
      <div class="badge-name">${badge.name}</div>
      <div class="badge-desc">${badge.description || ''}</div>
      ${earned && badge.earned_at ? `<div class="text-xs text-muted mt-1">${new Date(badge.earned_at).toLocaleDateString()}</div>` : ''}
    </div>`;
}

// ─── Toast Notification ───────────────────────────────────────
export function createToast(message, type = 'success') {
  const icons = { success: 'check-circle', error: 'x-circle', warning: 'alert-triangle', info: 'info' };
  const iconName = icons[type] || icons.info;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i data-lucide="${iconName}" class="toast-icon" style="width:20px;height:20px"></i>
    <span>${message}</span>`;
  return toast;
}

export function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = createToast(message, type);
  container.appendChild(toast);

  if (window.lucide) lucide.createIcons({ nodes: [toast] });

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ─── Modal ────────────────────────────────────────────────────
export function createModal(title, content, onConfirm, onCancel) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>${title}</h2>
        <button class="modal-close"><i data-lucide="x" style="width:20px;height:20px"></i></button>
      </div>
      <div class="modal-body">${content}</div>
      <div class="modal-actions">
        ${onCancel ? '<button class="btn btn-secondary modal-cancel-btn">Cancel</button>' : ''}
        ${onConfirm ? '<button class="btn btn-primary modal-confirm-btn">Confirm</button>' : ''}
      </div>
    </div>`;

  const close = () => {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 200);
  };

  overlay.querySelector('.modal-close').addEventListener('click', () => { close(); if (onCancel) onCancel(); });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) { close(); if (onCancel) onCancel(); } });

  const cancelBtn = overlay.querySelector('.modal-cancel-btn');
  if (cancelBtn) cancelBtn.addEventListener('click', () => { close(); if (onCancel) onCancel(); });

  const confirmBtn = overlay.querySelector('.modal-confirm-btn');
  if (confirmBtn) confirmBtn.addEventListener('click', () => { close(); if (onConfirm) onConfirm(); });

  document.body.appendChild(overlay);
  if (window.lucide) lucide.createIcons({ nodes: [overlay] });

  return overlay;
}

// ─── Empty State ──────────────────────────────────────────────
export function createEmptyState(icon, title, message) {
  return `
    <div class="empty-state">
      <div class="empty-icon"><i data-lucide="${icon}"></i></div>
      <div class="empty-title">${title}</div>
      <div class="empty-message">${message}</div>
    </div>`;
}

// ─── Article Card ─────────────────────────────────────────────
export function createArticleCard(article) {
  const categoryColors = {
    'Climate Change': 'var(--accent-amber)',
    'Sustainable Living': 'var(--accent-emerald)',
    'Renewable Energy': 'var(--accent-teal)',
    'Waste Management': 'var(--accent-purple)',
  };
  const bgColor = categoryColors[article.category] || 'var(--accent-emerald)';
  const categoryIcons = {
    'Climate Change': '🌡️',
    'Sustainable Living': '🌱',
    'Renewable Energy': '⚡',
    'Waste Management': '♻️',
  };
  const emoji = categoryIcons[article.category] || '📖';

  return `
    <div class="article-card" data-article-id="${article.id}">
      <div class="article-image" style="background:linear-gradient(135deg, ${bgColor}22, ${bgColor}44)">
        <span>${emoji}</span>
      </div>
      <div class="article-body">
        <div class="article-title">${article.title}</div>
        <div class="article-summary line-clamp-2">${article.summary || ''}</div>
        <div class="article-meta">
          ${createBadgeChip(article.category || 'General', 'category')}
          <span class="text-muted text-xs">${article.reading_time || 5} min read</span>
        </div>
      </div>
    </div>`;
}

// ─── Leaderboard Item ─────────────────────────────────────────
export function createLeaderboardItem(rank, username, points, isCurrentUser = false) {
  const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
  const initial = (username || '?')[0].toUpperCase();

  return `
    <div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''}">
      <div class="leaderboard-rank ${rankClass}">${medal || '#' + rank}</div>
      <div class="avatar avatar-sm">${initial}</div>
      <div class="leaderboard-info">
        <span class="leaderboard-name">${username}${isCurrentUser ? ' (You)' : ''}</span>
      </div>
      <div class="leaderboard-points">${points.toLocaleString()} pts</div>
    </div>`;
}

// ─── Challenge Card ───────────────────────────────────────────
export function createChallengeCard(challenge, completed = false) {
  const icon = challenge.icon || 'zap';
  return `
    <div class="challenge-card ${completed ? 'completed' : ''}" data-challenge-id="${challenge.id}">
      <div class="flex items-center justify-between">
        <div class="stat-icon emerald" style="width:36px;height:36px">
          <i data-lucide="${icon}" style="width:18px;height:18px"></i>
        </div>
        <span class="challenge-points">+${challenge.points || 0} pts</span>
      </div>
      <div class="challenge-title">${challenge.title}</div>
      <div class="challenge-desc">${challenge.description || ''}</div>
      ${completed
        ? '<button class="btn btn-secondary btn-sm w-full" disabled>Completed ✓</button>'
        : `<button class="btn btn-primary btn-sm w-full challenge-complete-btn">Complete</button>`
      }
    </div>`;
}

// ─── Insight Card ─────────────────────────────────────────────
export function createInsightCard(icon, title, description, color = 'emerald') {
  return `
    <div class="insight-card ${color} animate-slide-up">
      <div class="insight-header">
        <i data-lucide="${icon}" style="width:20px;height:20px;color:var(--accent-${color})"></i>
        <span class="insight-title">${title}</span>
      </div>
      <div class="insight-desc">${description}</div>
    </div>`;
}

// ─── Animate Counter ──────────────────────────────────────────
export function animateCounter(element, target, duration = 1200) {
  if (!element) return;
  const start = 0;
  const startTime = performance.now();
  const decimals = target % 1 !== 0 ? 1 : 0;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = start + (target - start) * eased;
    element.textContent = current.toFixed(decimals);
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

// ─── Loading Spinner ──────────────────────────────────────────
export function createSpinner() {
  return '<div class="spinner-container"><div class="spinner"></div></div>';
}

// ─── Step Indicator ───────────────────────────────────────────
export function createStepIndicator(steps, currentStep) {
  return `
    <div class="step-indicator">
      ${steps.map((s, i) => {
        const state = i < currentStep ? 'completed' : i === currentStep ? 'active' : '';
        return `
          <div class="step ${state}" style="position:relative">
            ${i > 0 ? `<div class="step-line" style="${i <= currentStep ? 'background:var(--accent-emerald)' : ''}"></div>` : ''}
            <div class="step-circle">${i < currentStep ? '✓' : i + 1}</div>
          </div>`;
      }).join('')}
    </div>`;
}
