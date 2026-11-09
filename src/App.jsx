import React from 'react';
import SiteHeader from './components/SiteHeader.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import {
  AboutSection,
  BenefitsSection,
  ContactQuoteSection,
  HeroSection,
  ProjectsSection,
  ServicesSection,
} from './components/SiteSections.jsx';

function App() {
  return (
    <>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <SiteHeader />
      <main id="contenido">
        <HeroSection />
        <AboutSection />
        <ServicesSection />
        <ProjectsSection />
        <BenefitsSection />
        <ContactQuoteSection />
      </main>
      <SiteFooter />
    </>
  );
}

export default App;
