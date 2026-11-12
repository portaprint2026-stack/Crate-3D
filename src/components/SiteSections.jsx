import React from 'react';
import { useRef, useState } from 'react';
import Icon from './Icon.jsx';
import TurnstileWidget from './TurnstileWidget.jsx';
import { submitQuoteRequest } from '../lib/quote-requests.js';

const heroImage = `${import.meta.env.BASE_URL}home-products.svg`;
const pendingRequestKey = 'portaprint:quote-request:idempotency-key';

const categories = [
  { icon: 'layers', title: 'Organización para el hogar', description: 'Pequeños objetos que ayudan a que cada cosa encuentre su lugar.' },
  { icon: 'spark', title: 'Decoración', description: 'Formas, texturas y detalles para darle personalidad a tus espacios.' },
  { icon: 'cube', title: 'Accesorios personales', description: 'Complementos prácticos con un toque diferente.' },
  { icon: 'ruler', title: 'Organizadores de escritorio', description: 'Ideas para ordenar tus esenciales de trabajo y estudio.' },
  { icon: 'printer', title: 'Productos personalizados', description: 'Variaciones y detalles pensados alrededor de cada idea.' },
  { icon: 'arrow', title: 'Ideas y creaciones especiales', description: 'Un espacio para explorar algo que todavía no existe.' },
];

const products = [
  { type: 'vase', category: 'DECORACIÓN', title: 'Florero de líneas suaves', color: 'sage', number: '01' },
  { type: 'organizer', category: 'ORGANIZACIÓN', title: 'Un lugar para tus esenciales', color: 'peach', number: '02' },
  { type: 'planter', category: 'HOGAR', title: 'Maceta mini para rincones', color: 'lavender', number: '03' },
  { type: 'desk', category: 'ESCRITORIO', title: 'Orden para el día a día', color: 'butter', number: '04' },
];

const benefits = [
  { icon: 'spark', title: 'Diseñado para lo cotidiano', description: 'Objetos pensados para acompañarte en casa, en el escritorio y donde los necesites.' },
  { icon: 'cube', title: 'Ideas con personalidad', description: 'Formas y detalles que se salen de lo común sin complicar su uso.' },
  { icon: 'layers', title: 'Creado a tu manera', description: 'Explora ideas, ajustes y opciones personalizadas para dar forma a algo propio.' },
  { icon: 'shield', title: 'De una idea a un objeto', description: 'La impresión 3D ayuda a convertir conceptos creativos en objetos tangibles.' },
];

function SectionHeading({ eyebrow, title, highlight, description, centered = false }) {
  return (
    <div className={`section-heading${centered ? ' is-centered' : ''}`}>
      <p className="eyebrow"><span />{eyebrow}</p>
      <h2>{title} {highlight && <span>{highlight}</span>}</h2>
      {description && <p className="section-description">{description}</p>}
    </div>
  );
}

function clearPendingRequestKey() {
  try {
    sessionStorage.removeItem(pendingRequestKey);
    return true;
  } catch {
    return false;
  }
}

function HeroSection() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-photo">
        <img
          alt="Composición ilustrada de objetos impresos en 3D para decorar y organizar el hogar"
          decoding="async"
          src={heroImage}
        />
      </div>
      <div className="hero-overlay" />
      <div className="container hero-content">
        <p className="hero-kicker"><span className="status-light" /> OBJETOS CREATIVOS · IMPRESIÓN 3D</p>
        <h1 id="hero-title">Ideas que<br />encuentran su <span>lugar.</span></h1>
        <p className="hero-description">
          Objetos útiles, decorativos y personalizados para el hogar y la vida cotidiana.
          Diseñados para hacer cada día un poco más tuyo.
        </p>
        <div className="hero-actions">
          <a className="button button-primary" href="#proyectos">Explorar ideas <Icon name="arrow" /></a>
          <a className="button button-quiet" href="#servicios">Descubrir categorías <Icon name="arrowRight" /></a>
        </div>
        <div className="hero-note"><span className="hero-note-spark">✳</span> Pequeñas ideas. Nuevas posibilidades.</div>
      </div>
      <div className="hero-caption"><span className="caption-line" /> FORMAS COTIDIANAS · PORTAPRINT</div>
      <span className="hero-sticker" aria-hidden="true">OBJETOS<br />CON<br />IDEA <span>✳</span></span>
    </section>
  );
}

function AboutSection() {
  return (
    <section className="about-section section-pad container" id="empresa">
      <div className="about-label">
        <p className="eyebrow"><span /> HOLA, SOMOS PORTAPRINT</p>
        <span className="about-serial">DISEÑO COTIDIANO<br />HECHO DIFERENTE</span>
      </div>
      <div className="about-copy">
        <h2>Objetos sencillos para una vida llena de <span>ideas.</span></h2>
        <div className="about-bottom">
          <p>
            PortaPrint crea objetos útiles, decorativos y personalizados mediante impresión 3D.
            Nos inspira encontrar nuevas formas de resolver, organizar y disfrutar los pequeños
            momentos del día a día.
          </p>
          <a className="text-arrow" href="#servicios">Encuentra tu próxima idea <Icon name="arrow" /></a>
        </div>
      </div>
    </section>
  );
}

function CategoryCard({ category, index }) {
  return (
    <a className="category-card" href="#proyectos">
      <span className={`category-icon category-tone-${index + 1}`}><Icon name={category.icon} /></span>
      <span className="category-number">0{index + 1}</span>
      <h3>{category.title}</h3>
      <p>{category.description}</p>
      <span className="category-link">Explorar ideas <Icon name="arrow" /></span>
    </a>
  );
}

function ServicesSection() {
  return (
    <section className="services-section section-pad" id="servicios">
      <div className="container">
        <div className="services-heading">
          <SectionHeading
            description="Para organizar, decorar, regalar o simplemente hacer espacio para una nueva idea."
            eyebrow="UN UNIVERSO DE POSIBILIDADES"
            highlight="a tu vida."
            title="Pequeñas ideas que se suman"
          />
          <span className="section-code">PORTAPRINT / COLECCIONES</span>
        </div>
        <div className="services-grid">
          {categories.map((category, index) => (
            <CategoryCard category={category} index={index} key={category.title} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductArtwork({ type }) {
  return (
    <svg aria-hidden="true" className={`product-artwork artwork-${type}`} fill="none" viewBox="0 0 400 310">
      <defs>
        <linearGradient id={`product-${type}`} x1="120" x2="290" y1="80" y2="245" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFDF8" />
          <stop offset="1" stopColor="#B9B2A4" />
        </linearGradient>
        <linearGradient id={`product-side-${type}`} x1="215" x2="290" y1="130" y2="248" gradientUnits="userSpaceOnUse">
          <stop stopColor="#AAA495" />
          <stop offset="1" stopColor="#716E63" />
        </linearGradient>
        <filter id={`product-shadow-${type}`} x="65" y="175" width="270" height="100" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="13" />
        </filter>
      </defs>
      <ellipse cx="204" cy="248" rx="122" ry="17" fill="#534C40" fillOpacity=".16" filter={`url(#product-shadow-${type})`} />
      <ellipse cx="202" cy="247" rx="96" ry="9" fill="#716B60" fillOpacity=".15" />
      {type === 'vase' && (
        <g className="product-object">
          <path d="M170 107c0-16 13-29 29-29h8c16 0 29 13 29 29v23c0 12 3 22 10 34 9 15 16 32 16 49 0 34-27 53-59 53s-59-19-59-53c0-17 7-34 16-49 7-12 10-22 10-34v-23Z" fill={`url(#product-${type})`} />
          <path d="M229 92v39c0 13 4 25 12 38 9 15 14 29 14 44 0 29-21 46-51 49 31-4 58-22 58-53 0-17-7-34-16-49-7-12-10-22-10-34v-23c0-12-7-23-18-27 6 6 11 15 11 26Z" fill={`url(#product-side-${type})`} fillOpacity=".47" />
          <path d="M170 125h66M166 135h70m-72 10h75m-77 10h81m-82 10h84m-87 10h89m-93 10h96m-99 10h101m-103 10h105" stroke="#FFFFFF" strokeOpacity=".37" strokeWidth="2" />
          <ellipse cx="203" cy="79" rx="33" ry="9" fill="#DED8CB" /><ellipse cx="203" cy="79" rx="21" ry="5" fill="#928D82" />
        </g>
      )}
      {type === 'organizer' && (
        <g className="product-object">
          <path d="m110 152 94-35 93 35-93 38-94-38Z" fill="#FFF9EE" />
          <path d="m110 152 94 38v57l-94-39v-56Z" fill={`url(#product-${type})`} />
          <path d="m204 190 93-38v57l-93 38v-57Z" fill={`url(#product-side-${type})`} fillOpacity=".8" />
          <path d="m129 157 74 30 73-30M129 169l75 31m-75-18 75 31m0-16 74-31m-74 47 74-31" stroke="#948E81" strokeOpacity=".55" strokeWidth="2" />
          <path d="M145 143v-56c0-8 7-15 15-15s15 7 15 15v55m48-18V96c0-8 7-15 15-15s15 7 15 15v29" stroke="#E9E1D2" strokeWidth="18" strokeLinecap="round" />
          <circle cx="160" cy="87" r="6" fill="#C5BBAA" /><circle cx="238" cy="96" r="6" fill="#C5BBAA" />
        </g>
      )}
      {type === 'planter' && (
        <g className="product-object">
          <path d="M137 149h129l-13 81c-2 12-13 20-25 20h-54c-12 0-23-8-25-20l-12-81Z" fill={`url(#product-${type})`} />
          <path d="M230 149h36l-13 81c-2 12-13 20-25 20h-11c14-7 21-16 23-29l8-70h-18Z" fill={`url(#product-side-${type})`} fillOpacity=".55" />
          <ellipse cx="202" cy="149" rx="65" ry="14" fill="#EDE7DB" />
          <ellipse cx="202" cy="149" rx="51" ry="8" fill="#665B4D" />
          <path d="M203 151c-2-29-22-51-45-60m46 59c3-39 23-61 47-73m-47 73c-1-49-2-77 0-105" stroke="#818E6E" strokeWidth="6" strokeLinecap="round" />
          <path d="M159 95c-26-14-26-36-17-45 21 3 37 19 43 40m66-13c22-18 43-12 47-1-9 19-28 29-51 27m-48-55c-2-24 13-38 25-37 12 17 12 38 2 58" fill="#A4AE91" />
          <path d="M159 95c-26-14-26-36-17-45 21 3 37 19 43 40m66-13c22-18 43-12 47-1-9 19-28 29-51 27m-48-55c-2-24 13-38 25-37 12 17 12 38 2 58" stroke="#768365" strokeWidth="2" />
        </g>
      )}
      {type === 'desk' && (
        <g className="product-object">
          <path d="m112 175 91-35 94 37-93 38-92-40Z" fill="#FDFBF5" />
          <path d="m112 175 92 40v40l-92-41v-39Z" fill={`url(#product-${type})`} />
          <path d="m204 215 93-38v39l-93 39v-40Z" fill={`url(#product-side-${type})`} />
          <path d="m139 169 68 29 65-27m-131 38 63 28m-46-93v-49c0-7 6-13 13-13s13 6 13 13v59m37-41v-39c0-7 6-13 13-13s13 6 13 13v25" stroke="#DBD3C5" strokeWidth="15" strokeLinecap="round" />
          <path d="M163 98v44m63-25v44" stroke="#A8A092" strokeWidth="2" />
          <circle cx="171" cy="81" r="5" fill="#BB8E67" /><circle cx="234" cy="71" r="5" fill="#83917B" />
        </g>
      )}
      <path d="M70 270h260" stroke="#8F887A" strokeOpacity=".22" />
      <path d="M93 280h214" stroke="#8F887A" strokeOpacity=".13" />
    </svg>
  );
}

function ProductCard({ product }) {
  return (
    <article className="product-card">
      <a aria-label={`Consultar por ${product.title}`} className={`product-image product-tone-${product.color}`} href="#cotizar">
        <ProductArtwork type={product.type} />
        <span className="product-index">{product.number}</span>
        <span className="product-open"><Icon name="arrow" /></span>
      </a>
      <div className="product-copy">
        <span>{product.category}</span>
        <h3>{product.title}</h3>
        <a href="#cotizar">Descubrir <Icon name="arrowRight" /></a>
      </div>
    </article>
  );
}

function ProjectsSection() {
  return (
    <section className="projects-section section-pad container" id="proyectos">
      <div className="projects-heading">
        <SectionHeading
          description="Una selección de ideas para acompañar tus espacios y rutinas. Cada forma empieza con una posibilidad."
          eyebrow="OBJETOS CON POSIBILIDADES"
          highlight="ideas."
          title="Conoce algunas"
        />
        <span className="section-code">PORTAPRINT / IDEAS PARA EL DÍA A DÍA</span>
      </div>
      <div className="products-grid">
        {products.map((product) => <ProductCard key={product.type} product={product} />)}
      </div>
      <p className="gallery-note"><span /> Ideas ilustrativas de catálogo. Los modelos, variantes y disponibilidad están por definir.</p>
    </section>
  );
}

function BenefitsSection() {
  return (
    <section className="benefits-section section-pad" id="ventajas">
      <div className="container benefits-layout">
        <div className="benefits-intro">
          <SectionHeading
            description="Diseño creativo y fabricación 3D para dar forma a objetos que pueden encontrar su lugar en tu día."
            eyebrow="POR QUÉ PORTAPRINT"
            highlight="diferente."
            title="Lo cotidiano, un poco"
          />
          <a className="text-arrow" href="#cotizar">Cuéntanos qué imaginas <Icon name="arrow" /></a>
          <span className="benefits-watermark" aria-hidden="true">C3D</span>
        </div>
        <div className="benefits-grid">
          {benefits.map((benefit, index) => (
            <article className="benefit-item" key={benefit.title}>
              <div className="benefit-icon"><Icon name={benefit.icon} /></div>
              <span className="benefit-number">0{index + 1}</span>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactQuoteSection() {
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestCode, setRequestCode] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const pendingSubmission = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const submission = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone') || null,
      category: formData.get('projectType'),
      description: formData.get('message'),
    };

    const serializedSubmission = JSON.stringify(submission);
    let savedIdempotencyKey = null;
    try {
      savedIdempotencyKey = sessionStorage.getItem(pendingRequestKey);
    } catch {
      setStatus('No fue posible acceder al almacenamiento seguro de esta sesión.');
      return;
    }

    if (!turnstileToken && !savedIdempotencyKey) {
      setStatus('Completa la verificación de seguridad antes de enviar.');
      return;
    }

    if (pendingSubmission.current?.submission !== serializedSubmission) {
      let idempotencyKey;
      try {
        idempotencyKey = savedIdempotencyKey;
        if (!idempotencyKey) {
          idempotencyKey = crypto.randomUUID();
          sessionStorage.setItem(pendingRequestKey, idempotencyKey);
        }
      } catch {
        setStatus('No fue posible conservar el envío para reintentar de forma segura. Habilita el almacenamiento de sesión e inténtalo nuevamente.');
        return;
      }
      pendingSubmission.current = {
        idempotencyKey,
        submission: serializedSubmission,
      };
    }

    setIsSubmitting(true);
    setStatus('');
    setRequestCode('');

    try {
      const result = await submitQuoteRequest({
        ...submission,
        idempotencyKey: pendingSubmission.current.idempotencyKey,
        ...(turnstileToken ? { turnstileToken } : {}),
      });

      setRequestCode(result.requestCode);
      setStatus(result.status === 'received'
        ? 'Recibimos tu solicitud. Guarda este código de referencia.'
        : 'Tu solicitud ya estaba registrada. Guarda este código de referencia.');
      pendingSubmission.current = null;
      if (!clearPendingRequestKey()) {
        setStatus('Recibimos tu solicitud, pero no se pudo limpiar el reintento guardado en esta sesión.');
      }
      form.reset();
    } catch (error) {
      if (error?.status === 409) {
        pendingSubmission.current = null;
        if (!clearPendingRequestKey()) {
          setStatus('No se pudo renovar el reintento guardado. Habilita el almacenamiento de sesión antes de volver a enviar.');
          return;
        }
      }
      setStatus(error instanceof Error ? error.message : 'No pudimos enviar tu solicitud. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
      setTurnstileResetKey((current) => current + 1);
    }
  }

  return (
    <section className="contact-section section-pad container" id="cotizar">
      <div className="contact-panel">
        <div className="contact-copy">
          <p className="eyebrow"><span /> UNA IDEA EMPIEZA AQUÍ</p>
          <h2>¿Qué objeto<br />te gustaría <span>crear?</span></h2>
          <p>Cuéntanos qué tienes en mente. Recibiremos tu solicitud y el equipo podrá revisarla para preparar una cotización.</p>
          <div className="contact-channel-note">
            <span className="channel-status" />
            <span>WhatsApp y redes sociales<br /><b>Pendientes de configurar</b></span>
          </div>
        </div>
        <form className="quote-form" onSubmit={handleSubmit}>
          <div className="form-heading">
            <span>CUÉNTANOS TU IDEA</span>
            <span>01 — 04</span>
          </div>
          <label htmlFor="quote-name">Nombre</label>
          <input autoComplete="name" id="quote-name" name="name" placeholder="¿Cómo te llamas?" required />
          <label htmlFor="quote-email">Correo electrónico</label>
          <input autoComplete="email" id="quote-email" name="email" placeholder="nombre@empresa.com" required type="email" />
          <label htmlFor="quote-phone">Teléfono (opcional)</label>
          <input autoComplete="tel" id="quote-phone" name="phone" placeholder="Tu número de contacto" type="tel" />
          <label htmlFor="quote-type">¿Qué te gustaría crear?</label>
          <select defaultValue="" id="quote-type" name="projectType" required>
            <option disabled value="">Selecciona una categoría</option>
            <option value="home">Organización para el hogar</option>
            <option value="decor">Decoración</option>
            <option value="personal">Accesorios personales</option>
            <option value="desk">Organizadores de escritorio</option>
            <option value="custom">Producto personalizado</option>
            <option value="other">Otra idea especial</option>
          </select>
          <label htmlFor="quote-message">Un poco más sobre tu idea</label>
          <textarea id="quote-message" name="message" placeholder="¿Para qué lo necesitas? ¿Qué te gustaría que hiciera?" required rows="3" />
          <TurnstileWidget onToken={setTurnstileToken} resetKey={turnstileResetKey} />
          <button className="button button-primary quote-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Enviando…' : 'Compartir mi idea'} <Icon name="arrow" />
          </button>
          <p aria-live="polite" className={`form-status${status ? ' is-visible' : ''}`}>
            {status || 'No necesitas crear una cuenta para solicitar una cotización.'}
            {requestCode && <><br /><strong>Código de referencia: {requestCode}</strong></>}
          </p>
        </form>
      </div>
    </section>
  );
}

export {
  AboutSection,
  BenefitsSection,
  ContactQuoteSection,
  HeroSection,
  ProjectsSection,
  ServicesSection,
};
