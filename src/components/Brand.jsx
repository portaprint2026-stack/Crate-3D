import React from 'react';
import Icon from './Icon.jsx';

function Brand({ footer = false }) {
  return (
    <a className={`brand${footer ? ' brand-footer' : ''}`} href="#inicio" aria-label="PortaPrint, inicio">
      <span className="brand-symbol"><Icon name="cube" /></span>
      <span className="brand-wordmark">PORTA<span>PRINT</span></span>
    </a>
  );
}

export default Brand;
