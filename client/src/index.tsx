import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Override the global error handler to ignore ResizeObserver loop errors
const originalError = window.onerror;
window.onerror = function(message, source, lineno, colno, error) {
  if (typeof message === 'string' && message.includes('ResizeObserver loop')) {
    return true; // Suppress the error
  }
  return originalError?.(message, source, lineno, colno, error);
};

// Also handle unhandled promise rejections
const originalOnUnhandledRejection = window.onunhandledrejection;
window.onunhandledrejection = function(event) {
  if (event.reason?.message?.includes?.('ResizeObserver loop')) {
    event.preventDefault();
    return false;
  }
  return originalOnUnhandledRejection?.call(window, event);
};

// Find the root element
const rootElement = document.getElementById('root');

// Make sure the element exists
if (!rootElement) {
  throw new Error('Root element not found');
}

// Create a root
const root = createRoot(rootElement);

// Render the app
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
