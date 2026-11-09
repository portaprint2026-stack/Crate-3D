import React from 'react';
import { useState } from 'react';
import Brand from './Brand.jsx';
import Icon from './Icon.jsx';

const links = [
  { href: '#servicios', label: 'Categorías' },
  { href: '#proyectos', label: 'Ideas' },
  { href: '#empresa', label: 'Nosotros' },
];

function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="site-header" id="inicio">
      <nav className="nav container" aria-label="Navegación principal">
        <Brand />
        <button
          aria-controls="primary-navigation"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          type="button"
        >
          <Icon name={menuOpen ? 'close' : 'bars'} />
        </button>
        <div className={`nav-content${menuOpen ? ' is-open' : ''}`} id="primary-navigation">
          <div className="nav-links">
            {links.map((link) => (
              <a href={link.href} key={link.href} onClick={closeMenu}>{link.label}</a>
            ))}
          </div>
          <a className="nav-cta" href="#cotizar" onClick={closeMenu}>
            Cuéntanos tu idea <Icon name="arrow" />
          </a>
        </div>
      </nav>
    </header>
  );
}

export default SiteHeader;
