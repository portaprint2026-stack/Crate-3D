import React from 'react';
import Icon from './Icon.jsx';

function Brand({ footer = false }) {
  return (
    <a className={`brand${footer ? ' brand-footer' : ''}`} href="#inicio" aria-label="Crate-3D, inicio">
      <span className="brand-symbol"><Icon name="cube" /></span>
      <span className="brand-wordmark">CRATE<span>-3D</span></span>
    </a>
  );
}

export default Brand;
