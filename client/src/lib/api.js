const TOKEN_KEY = 'hiit_admin_token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(path, { method = 'GET', body, auth = false, blob = false } = {}) {
  const headers = {};
  let payload = body;
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  if (auth && getToken()) headers.Authorization = `Bearer ${getToken()}`;
  const res = await fetch('/api' + path, { method, headers, body: payload, credentials: 'omit', referrerPolicy: 'no-referrer' });
  if (res.status === 401 && auth) {
    clearToken();
    if (!location.pathname.startsWith('/admin/login')) location.assign('/admin/login');
  }
  if (blob) {
    if (!res.ok) throw new Error('Could not load file.');
    return res.blob();
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Request failed. Please try again.'), { status: res.status });
  return data;
}

export const api = {
  get: (p, o) => request(p, o),
  post: (p, body, o) => request(p, { method: 'POST', body, ...o }),
  patch: (p, body, o) => request(p, { method: 'PATCH', body, ...o }),
};

export async function downloadBlob(path, filename, auth = true) {
  const blob = await request(path, { auth, blob: true });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
