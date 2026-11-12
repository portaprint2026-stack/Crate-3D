import { getSupabaseClient } from './supabase.js';

export async function submitQuoteRequest(submission) {
  const { data, error } = await getSupabaseClient().functions.invoke('submit-quote-request', {
    body: submission,
  });

  if (error) {
    const requestError = new Error('No pudimos enviar tu solicitud. Inténtalo de nuevo.');
    requestError.status = error.context instanceof Response ? error.context.status : undefined;
    throw requestError;
  }

  if (!data || typeof data.requestCode !== 'string' || typeof data.status !== 'string') {
    throw new Error('No pudimos confirmar tu solicitud. Inténtalo de nuevo.');
  }

  return data;
}
