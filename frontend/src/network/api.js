// REST API wrapper (fetch-based, includes credentials for cookies).
const BASE = '/api/v1';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  me: () => request('/auth/me'),
  register: (username, password) => request('/auth/register', { method: 'POST', body: { username, password } }),
  login: (username, password) => request('/auth/login', { method: 'POST', body: { username, password } }),
  guest: () => request('/auth/guest', { method: 'POST' }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  listWorlds: () => request('/worlds'),
  createWorld: (name, seed, gamemode) => request('/worlds', { method: 'POST', body: { name, seed, gamemode } }),
  deleteWorld: (id) => request(`/worlds/${id}`, { method: 'DELETE' }),
  getChunks: (id, cx, cz, radius) => request(`/worlds/${id}/chunks?cx=${cx}&cz=${cz}&radius=${radius}`),
  getState: (id) => request(`/worlds/${id}/state`),
  saveState: (id, state) => request(`/worlds/${id}/state`, { method: 'POST', body: state }),
};
