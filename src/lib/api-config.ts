// Centralized API Configuration & Dynamic Base URL Helper

export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return `http://${hostname}:3001`;
  }
  return 'http://localhost:3001';
}

export const API_BASE_URL = 'http://localhost:3001';

/**
 * Helper to perform safe fetch calls without throwing unhandled network errors if the backend is starting up or offline.
 */
export async function safeFetch<T = unknown>(endpoint: string, options?: RequestInit): Promise<{ ok: boolean; data: T | null; error?: string }> {
  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
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
