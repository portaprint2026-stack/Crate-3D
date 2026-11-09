# Crate-3D

Tienda creativa adaptable de objetos útiles, decorativos y personalizados para el hogar y la vida cotidiana. Construida con React y Vite.

## Requisitos

- Node.js 18 o posterior
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

La página incluye categorías, una galería ilustrativa de ideas, navegación adaptable y un formulario con validación en el navegador. El formulario no envía datos todavía. Los canales oficiales, los productos disponibles y las fotografías reales deberán configurarse antes de lanzar la tienda.

## Publicación en GitHub Pages

El sitio usa Vite con la ruta base `/Crate-3D/`. El workflow de GitHub Actions en `.github/workflows/deploy.yml` compila y publica automáticamente al hacer push a `main`.

En el repositorio, selecciona **Settings → Pages → Build and deployment → Source → GitHub Actions**. Después de una publicación correcta, el sitio estará disponible en `https://portaprint2026-stack.github.io/Crate-3D/`.
