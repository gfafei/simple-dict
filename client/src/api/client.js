const BASE = '/api';

async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  search: (q) => request(`/words/search?q=${encodeURIComponent(q)}&limit=5`),
  lookup: (word) => request(`/words/${encodeURIComponent(word)}`),
  random: () => request('/words/random'),
  getFavorites: () => request('/favorites'),
  addFavorite: (word) => request('/favorites', { method: 'POST', body: JSON.stringify({ word }) }),
  removeFavorite: (word) => request(`/favorites/${encodeURIComponent(word)}`, { method: 'DELETE' }),
  getHistory: () => request('/history'),
  addHistory: (word) => request('/history', { method: 'POST', body: JSON.stringify({ word }) }),
};
