import React from 'react';
import Brand from './Brand.jsx';
import Icon from './Icon.jsx';

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand">
          <Brand footer />
          <p>Objetos útiles, decorativos y personalizados.<br />Ideas que encuentran su lugar.</p>
        </div>
        <div className="footer-navigation">
          <span className="footer-label">DESCUBRE</span>
          <a href="#empresa">Nuestra idea</a>
          <a href="#servicios">Categorías</a>
          <a href="#proyectos">Inspiración</a>
          <a href="#ventajas">Por qué Crate-3D</a>
        </div>
        <div className="footer-contact">
          <span className="footer-label">SIGAMOS EN CONTACTO</span>
          <p>Pronto compartiremos nuestros canales oficiales.</p>
          <a href="#cotizar">Comparte tu idea <Icon name="arrow" /></a>
          <div className="social-placeholders" aria-label="Redes sociales por configurar">
            <span aria-label="WhatsApp pendiente de configurar" title="WhatsApp pendiente de configurar"><Icon name="whatsapp" /></span>
            <span aria-label="Instagram pendiente de configurar" title="Instagram pendiente de configurar"><Icon name="instagram" /></span>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <span>CRATE-3D</span>
          <span>OBJETOS CREATIVOS · IMPRESIÓN 3D</span>
          <a href="#inicio">VOLVER AL INICIO ↑</a>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
