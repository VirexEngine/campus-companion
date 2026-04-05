const envUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const runtimeUrl = typeof window !== 'undefined' ? (window as any).__API_BASE_URL__?.replace(/\/$/, '') : undefined;
export const API_BASE_URL = envUrl || runtimeUrl || 'https://campus-companion-kzl2.onrender.com';

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL || ''}/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Error ${response.status}`);
  }

  return response.json();
};
