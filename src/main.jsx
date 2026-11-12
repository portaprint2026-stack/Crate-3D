import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { checkSupabaseConnection } from './lib/supabase.js';
import './styles.css';

if (import.meta.env.DEV) {
  void checkSupabaseConnection();
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
