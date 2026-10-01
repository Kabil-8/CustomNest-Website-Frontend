import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Handle Vite dynamic chunk import errors gracefully when a new version is deployed
window.addEventListener('vite:preloadError', (event) => {
  console.warn('[Vite] Dynamic chunk preload error, reloading page to fetch latest build:', event);
  window.location.reload();
});

// Register service worker for push notifications
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[App] Service Worker registered:', registration.scope);
      })
      .catch((error) => {
        console.error('[App] Service Worker registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
