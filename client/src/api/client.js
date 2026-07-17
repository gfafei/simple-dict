const BASE = '/api';
const USERNAME_KEY = 'simple-dict:username';

export function getUsername() {
  return localStorage.getItem(USERNAME_KEY);
}

export function setUsername(username) {
  localStorage.setItem(USERNAME_KEY, username);
}

export function clearUsername() {
  localStorage.removeItem(USERNAME_KEY);
}

async function request(path, options) {
  const username = getUsername();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(username && { 'X-Username': username }),
    },
    ...options,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  login: () => request('/session'),
  search: (q) => request(`/words/search?q=${encodeURIComponent(q)}&limit=5`),
  lookup: (word) => request(`/words/${encodeURIComponent(word)}`),
  random: () => request('/words/random'),
  getFavorites: () => request('/favorites'),
  addFavorite: (word) => request('/favorites', { method: 'POST', body: JSON.stringify({ word }) }),
  removeFavorite: (word) => request(`/favorites/${encodeURIComponent(word)}`, { method: 'DELETE' }),
  getHistory: () => request('/history'),
  addHistory: (word) => request('/history', { method: 'POST', body: JSON.stringify({ word }) }),
  clearHistory: () => request('/history', { method: 'DELETE' }),
};
