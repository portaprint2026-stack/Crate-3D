import { createClient } from '@supabase/supabase-js';

let client;

export function getSupabaseClient() {
  const { VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY } = import.meta.env;

  if (!VITE_SUPABASE_URL) {
    throw new Error('Falta configurar VITE_SUPABASE_URL en .env.local.');
  }

  if (!VITE_SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('Falta configurar VITE_SUPABASE_PUBLISHABLE_KEY en .env.local.');
  }

  if (!client) {
    client = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY);
  }

  return client;
}

export async function checkSupabaseConnection() {
  const { VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY } = import.meta.env;

  if (!VITE_SUPABASE_URL || !VITE_SUPABASE_PUBLISHABLE_KEY) {
    const missing = [
      !VITE_SUPABASE_URL && 'VITE_SUPABASE_URL',
      !VITE_SUPABASE_PUBLISHABLE_KEY && 'VITE_SUPABASE_PUBLISHABLE_KEY',
    ].filter(Boolean);

    console.error(`[Supabase] Prueba no ejecutada. Configura: ${missing.join(', ')}.`);
    return false;
  }

  try {
    const response = await fetch(`${VITE_SUPABASE_URL.replace(/\/+$/, '')}/auth/v1/health`, {
      headers: { apikey: VITE_SUPABASE_PUBLISHABLE_KEY },
    });

    if (!response.ok) {
      console.error(`[Supabase] Error de conexión. El endpoint de salud respondió HTTP ${response.status}.`);
      return false;
    }

    console.info(`[Supabase] Conexión exitosa. Endpoint de salud accesible (HTTP ${response.status}).`);
    return true;
  } catch {
    console.error('[Supabase] Error de conexión. No fue posible acceder al endpoint de salud.');
    return false;
  }
}
