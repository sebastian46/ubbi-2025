import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/custom.css';
import App from './App';

// Configure console logging to file in development
if (process.env.NODE_ENV === 'development') {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  console.log = function() {
    const args = Array.from(arguments);
    originalConsoleLog.apply(console, args);
    // This will still log to browser console but browser dev tools are better for debugging
  };
  
  console.error = function() {
    const args = Array.from(arguments);
    originalConsoleError.apply(console, args);
  };
  
  console.warn = function() {
    const args = Array.from(arguments);
    originalConsoleWarn.apply(console, args);
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 