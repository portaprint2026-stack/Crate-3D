import emailjs from '@emailjs/browser';

const serviceId = 'service_kbgtiul';
const templateId = 'template_7u34ane';

export async function sendQuoteEmail(templateParams) {
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!publicKey) {
    throw new Error('EMAILJS_PUBLIC_KEY_MISSING');
  }

  return emailjs.send(serviceId, templateId, templateParams, { publicKey });
}
