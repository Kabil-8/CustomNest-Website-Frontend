// ---------------------------------------------------------------------------
// lib/config.ts — Centralized Application Environment & API Endpoints Config
// ---------------------------------------------------------------------------

export const PRODUCTION_BACKEND_URL = 'https://customnest-website-backend.onrender.com';
export const LOCAL_BACKEND_URL = 'http://localhost:5000';

/**
 * Dynamically resolves the backend base URL (without trailing slashes or /api).
 * Guaranteed to route production environments (thecustomnest.shop, vercel.app, etc.)
 * to the live Render backend, while preserving localhost for local development.
 */
export function getBackendBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL?.trim();

  // In browser: if not running on localhost/127.0.0.1, always use production backend
  // unless explicitly provided a valid non-localhost URL.
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.');
    if (!isLocal) {
      if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
        return envUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
      }
      return PRODUCTION_BACKEND_URL;
    }
  }

  // In production Vite build
  if (import.meta.env.PROD) {
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
    }
    return PRODUCTION_BACKEND_URL;
  }

  // Local development
  return (envUrl || LOCAL_BACKEND_URL).replace(/\/api\/?$/, '').replace(/\/+$/, '');
}

export const BACKEND_BASE = getBackendBaseUrl();
export const API_BASE = `${BACKEND_BASE}/api`;
