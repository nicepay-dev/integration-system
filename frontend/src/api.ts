const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export async function api(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('mp_token');
  const response = await fetch(BASE + path, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  if (response.status === 401 && path !== '/auth/login') { localStorage.removeItem('mp_token'); localStorage.removeItem('mp_user'); location.reload(); }
  if (!response.ok) throw new Error((await response.json()).message || 'Request failed');
  return response.json();
}
