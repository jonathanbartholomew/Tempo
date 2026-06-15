const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function apiFetch(path, { method = 'GET', accessToken, body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${method} ${path} failed: ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}
