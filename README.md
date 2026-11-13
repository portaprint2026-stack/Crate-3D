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

La página incluye categorías, una galería ilustrativa de ideas, navegación adaptable y un formulario de solicitudes de cotización enviado mediante EmailJS.

## Publicación en GitHub Pages

El proyecto conserva la ruta de publicación existente `/Crate-3D/` para mantener sin cambios la dirección pública de GitHub Pages. El workflow de GitHub Actions en `.github/workflows/deploy.yml` compila y publica automáticamente al hacer push a `main`.

La dirección pública es `https://portaprint2026-stack.github.io/Crate-3D/`. El workflow de Pages incluye la Public Key de EmailJS para compilar y publicar.

## Solicitudes de cotización por EmailJS

El formulario usa el servicio `service_kbgtiul` y la plantilla `template_7u34ane`. Para desarrollo, configura la **Public Key** de EmailJS como `VITE_EMAILJS_PUBLIC_KEY` en `.env.local`; el workflow de Pages la inyecta al compilar. La Public Key está pensada para el frontend; nunca uses una Private Key en `VITE_*`.

Los campos se envían como `name`, `email` (correo del visitante), `phone`, `project_type` (nombre legible de la categoría), `description` y `title` (asunto con el nombre del visitante). Configura el destinatario `portaprint2026@gmail.com` dentro de la plantilla de EmailJS; el parámetro `email` se reserva para el visitante y puede usarse como Reply-To. Restringe los dominios permitidos en EmailJS a los de desarrollo y producción.

El envío del formulario se procesa directamente por EmailJS y no guarda una copia de la solicitud en Supabase.
