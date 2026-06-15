import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Global JS error logger for debugging
window.onerror = function (message, source, lineno, colno, error) {
  console.error("Global JS Error caught:", message, "at", source, ":", lineno);
  alert("Vite App Runtime Error:\n\n" + message + "\n\nFile: " + source + "\nLine: " + lineno);
  return false;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

