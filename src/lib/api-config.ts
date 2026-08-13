// Centralized API Configuration & Dynamic Base URL Helper

export function getApiBaseUrl(): string {
  let url = process.env.NEXT_PUBLIC_API_URL || '';
  if (url) {
    url = url.replace(/\/$/, '');
    // Clean trailing /api if present so endpoints or safeFetch append /api cleanly without /api/api
    if (url.endsWith('/api')) {
      url = url.substring(0, url.length - 4);
    }
    return url;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return window.location.origin;
    }
    return `http://${hostname}:3001`;
  }
  return 'http://localhost:3001';
}

export const API_BASE_URL = getApiBaseUrl();

/**
 * Helper to perform safe fetch calls without throwing unhandled network errors if the backend is starting up or offline.
 */
export async function safeFetch<T = unknown>(endpoint: string, options?: RequestInit): Promise<{ ok: boolean; data: T | null; error?: string }> {
  if (endpoint.startsWith('http')) {
    try {
      const response = await fetch(endpoint, options);
      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        return { ok: false, data: null, error: `Error ${response.status}: ${response.statusText} ${errText}` };
      }
      const data = (await response.json().catch(() => null)) as T;
      return { ok: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Servidor backend no disponible';
      return { ok: false, data: null, error: message };
    }
  }

  const baseUrl = getApiBaseUrl();
  let path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Ensure /api prefix is present once and never duplicated as /api/api
  if (!path.startsWith('/api/') && path !== '/api') {
    path = `/api${path}`;
  }

  const fullUrl = `${baseUrl}${path}`;
  try {
    const response = await fetch(fullUrl, options);
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return { ok: false, data: null, error: `Error ${response.status}: ${response.statusText} ${errText}` };
    }
    const data = (await response.json().catch(() => null)) as T;
    return { ok: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Servidor backend no disponible en este momento';
    return { ok: false, data: null, error: message };
  }
}
