import { useEffect, useRef, useState } from 'react';

const scriptId = 'portaprint-turnstile-script';

export default function TurnstileWidget({ onToken, resetKey }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const tokenHandlerRef = useRef(onToken);
  const [message, setMessage] = useState('');
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  tokenHandlerRef.current = onToken;

  useEffect(() => {
    if (!siteKey) {
      setMessage('La verificación de seguridad no está configurada.');
      return undefined;
    }

    let active = true;
    const renderWidget = () => {
      if (!active || !containerRef.current || !window.turnstile || widgetIdRef.current !== null) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        action: 'quote_request',
        callback: (token) => {
          tokenHandlerRef.current(token);
          setMessage('');
        },
        'expired-callback': () => {
          tokenHandlerRef.current('');
          setMessage('La verificación expiró. Complétala nuevamente.');
        },
        'error-callback': () => {
          tokenHandlerRef.current('');
          setMessage('No fue posible cargar la verificación. Inténtalo nuevamente.');
        },
      });
    };
    const handleScriptError = () => {
      if (active) setMessage('No fue posible cargar la verificación. Inténtalo nuevamente.');
    };

    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    script.addEventListener('load', renderWidget);
    script.addEventListener('error', handleScriptError);
    renderWidget();

    return () => {
      active = false;
      script.removeEventListener('load', renderWidget);
      script.removeEventListener('error', handleScriptError);
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  useEffect(() => {
    if (widgetIdRef.current !== null && window.turnstile) {
      tokenHandlerRef.current('');
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [resetKey]);

  return (
    <div className="turnstile-widget">
      {siteKey && <div ref={containerRef} />}
      {message && <p aria-live="polite" role="status">{message}</p>}
    </div>
  );
}
