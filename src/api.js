const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('ecotrack_token');
}

function setToken(token) {
  localStorage.setItem('ecotrack_token', token);
}

function removeToken() {
  localStorage.removeItem('ecotrack_token');
}

function isAuthenticated() {
  return !!getToken();
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (res.status === 401) {
    removeToken();
    window.location.hash = '#/auth';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }

  return res.json();
}

export const api = {
  get:    (url)       => request(url),
  post:   (url, data) => request(url, { method: 'POST', body: JSON.stringify(data) }),
  put:    (url, data) => request(url, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (url)       => request(url, { method: 'DELETE' }),
  getToken,
  setToken,
  removeToken,
  isAuthenticated,
};
