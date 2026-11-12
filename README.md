# PortaPrint

Tienda creativa adaptable de objetos útiles, decorativos y personalizados para el hogar y la vida cotidiana. Construida con React y Vite.

## Requisitos

- Node.js 22 o posterior
- npm

## Desarrollo

```bash
npm install
npm run dev
```

## Producción

```bash
npm run build
npm run preview
```

La página incluye categorías, una galería ilustrativa de ideas, navegación adaptable y un formulario para solicitudes de cotización.

## Publicación en GitHub Pages

El proyecto conserva la ruta de publicación existente `/Crate-3D/` para mantener sin cambios la dirección pública de GitHub Pages. El workflow de GitHub Actions en `.github/workflows/deploy.yml` compila y publica automáticamente al hacer push a `main`.

La dirección pública es `https://portaprint2026-stack.github.io/Crate-3D/`.

## Conexión con Supabase

Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` en `.env.local`. Este archivo está excluido de Git. La clave publicable está pensada para uso en el frontend; nunca pongas una clave `service_role` ni otros secretos en variables `VITE_*`.

El cliente reutilizable está en `src/lib/supabase.js`. Se obtiene mediante `getSupabaseClient()` y valida que ambas variables estén configuradas antes de inicializarlo.

## Solicitudes de cotización (Fase 1)

El formulario invoca la Edge Function `submit-quote-request`; el navegador no escribe directamente en las tablas ni recibe claves privilegiadas. La función valida y normaliza los campos, exige sesión válida, correo confirmado y coincidencia de correo para usuarios autenticados, y permite envíos de invitados. Una sesión autenticada sin registro asociado en `customers` se rechaza.

La clave de idempotencia es un UUID v4 mantenido en `sessionStorage` y solo se conserva en base de datos su hash SHA-256. Los reintentos idénticos devuelven el código y estado reales de la solicitud; la referencia no se devuelve si los datos o la identidad asociada no coinciden.

La migración supabase/migrations/20261111000100_phase1_customers_quote_requests.sql ya se aplicó correctamente en Supabase. Se verificó la existencia de las cuatro tablas y las dos funciones esperadas.
Añade `customers`, `admin_memberships`, `quote_requests` y contadores de límites de frecuencia, además de RLS y funciones restringidas. La autorización administrativa consulta exclusivamente `admin_memberships`; sus filas no se pueden administrar desde el navegador. El primer administrador deberá asignarse mediante un operador de confianza en SQL Editor después de crear su usuario Auth.

### Turnstile y configuración

1. En Cloudflare Turnstile, crea un widget para `portaprint2026-stack.github.io`. Para desarrollo local, añade también `localhost` y `127.0.0.1` como hostnames permitidos.
2. Añade la clave pública del widget como `VITE_TURNSTILE_SITE_KEY` en `.env.local` para desarrollo. En GitHub, define una **Actions repository variable** con ese nombre; el workflow de Pages la requiere para compilar. Es una clave pública y se incluye en el frontend.
3. Configura los secretos de Edge Functions en Supabase: `TURNSTILE_SECRET_KEY` (secreto de Cloudflare) y `RATE_LIMIT_HMAC_SECRET` (secreto aleatorio de al menos 32 caracteres). `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` son las variables de Supabase utilizadas por la función; la clave `service_role` nunca debe estar en el frontend ni en variables `VITE_*`.

La función verifica el token con el endpoint oficial de Siteverify, comprobando `success`, hostname y action. Por ahora no aplica límites por IP porque la arquitectura actual no cuenta con una fuente de IP cuya confiabilidad esté confirmada. Para nuevas solicitudes, aplica un límite atómico de 3 por correo normalizado por ventana fija de 10 minutos. El correo se identifica en los contadores mediante HMAC seudonimizado. La función SQL `submit_quote_request` serializa reintentos por clave de idempotencia, devuelve la referencia existente sin consumir nuevamente el límite y, para nuevas solicitudes, comprueba el contador e inserta en una única transacción. Las filas vencidas se limpian durante nuevas solicitudes. Las respuestas y logs de la Edge Function no incluyen datos personales ni secretos.

La migración SQL ya está aplicada en Supabase. La Edge Function todavía no se ha desplegado y la persistencia real mediante el formulario aún no se ha probado. Para habilitar el formulario se requiere desplegar la función y completar pruebas integradas de límites, Turnstile, autenticación, RLS e idempotencia. Para habilitar el formulario se requiere revisar/aprobar la migración, aplicarla, configurar secretos y variable pública, desplegar la función y completar pruebas integradas de límites, Turnstile, autenticación, RLS e idempotencia.

Esta fase no incluye carga de archivos, cotizaciones, pedidos, OTP, correo, cuentas voluntarias ni panel administrativo completo.
