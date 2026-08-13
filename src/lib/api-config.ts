// Centralized API Configuration & Dynamic Base URL Helper

export function getApiBaseUrl(): string {
  let url = process.env.NEXT_PUBLIC_API_URL || '';
  if (url) {
    url = url.replace(/\/$/, '');
    return url.endsWith('/api') ? url : `${url}/api`;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${window.location.origin}/api`;
    }
    return `http://${hostname}:3001/api`;
  }
  return 'http://localhost:3001/api';
}

export const API_BASE_URL = getApiBaseUrl();

/**
 * Helper to perform safe fetch calls without throwing unhandled network errors if the backend is starting up or offline.
 */
export async function safeFetch<T = unknown>(endpoint: string, options?: RequestInit): Promise<{ ok: boolean; data: T | null; error?: string }> {
  const baseUrl = getApiBaseUrl();
  let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Prevent duplicate /api/api prefix
  if (baseUrl.endsWith('/api') && cleanEndpoint.startsWith('/api/')) {
    cleanEndpoint = cleanEndpoint.substring(4);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${cleanEndpoint}`;
  try {
    const response = await fetch(url, options);
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
