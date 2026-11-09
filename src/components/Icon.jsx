import React from 'react';

const paths = {
  arrow: (
    <>
      <path d="M5 15 15 5M6 5h9v9" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M4 10h12M11 5l5 5-5 5" />
    </>
  ),
  bars: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </>
  ),
  close: (
    <>
      <path d="m6 6 12 12M18 6 6 18" />
    </>
  ),
  cube: (
    <>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="m4.5 7.8 7.5 4.3 7.5-4.3M12 12v8.5" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
    </>
  ),
  printer: (
    <>
      <path d="M6 8V3h12v5M6 17H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 13h12v8H6zM17 11h.01" />
    </>
  ),
  ruler: (
    <>
      <path d="m4 16 12-12 5 5L9 21H4v-5Z" />
      <path d="m13 7 4 4M10 10l2 2M7 13l2 2" />
    </>
  ),
  spark: (
    <>
      <path d="m12 3 1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8L12 3Z" />
      <path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M20.2 11.7a8.2 8.2 0 0 1-12.1 7.2L4 20l1.2-4A8.2 8.2 0 1 1 20.2 11.7Z" />
      <path d="M8.2 8.1c.2-.5.4-.5.7-.5h.5c.2 0 .4.1.5.4l.7 1.7c.1.2.1.4 0 .6l-.5.6c-.2.2-.3.4-.1.7.5.8 1.2 1.5 2 2 .3.2.5.2.7-.1l.7-.8c.2-.2.4-.3.7-.2l1.5.7c.3.1.5.3.5.5s-.1 1-.7 1.5c-.5.5-1.2.7-1.8.7-.5 0-1.2-.2-2-.5-1-.4-2.2-1.3-3.1-2.4-.8-.9-1.3-2-1.4-2.9-.1-.8.3-1.5.7-2Z" />
    </>
  ),
};

function Icon({ name, className = '' }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}

export default Icon;
