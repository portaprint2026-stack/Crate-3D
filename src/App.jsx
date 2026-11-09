import { useState } from 'react';

const ArrowUpRight = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
    <path d="M5 15 15 5M6 5h9v9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Check = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
    <path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const features = [
  {
    number: '01',
    title: 'Todo tiene su lugar',
    description: 'Organiza tareas, conversaciones y archivos en espacios claros que tu equipo sí quiere usar.',
    icon: '◫',
    tone: 'lavender',
  },
  {
    number: '02',
    title: 'El progreso, a la vista',
    description: 'Cambia entre tablero, lista y calendario. Cada persona trabaja a su manera, sin perder el rumbo.',
    icon: '↗',
    tone: 'peach',
  },
  {
    number: '03',
    title: 'Más foco, menos ruido',
    description: 'Prioridades y próximos pasos siempre claros para que la energía vaya a lo que importa.',
    icon: '✳',
    tone: 'mint',
  },
];

const tasks = [
  { title: 'Definir dirección visual', label: 'Diseño', color: 'purple', done: true },
  { title: 'Preparar prototipo inicial', label: 'Producto', color: 'orange', done: false },
  { title: 'Revisar con el equipo', label: 'Equipo', color: 'green', done: false },
];

function Logo() {
  return (
    <a className="brand" href="#inicio" aria-label="Impulso, inicio">
      <span className="brand-mark">i.</span>
      <span>impulso</span>
    </a>
  );
}

function DashboardPreview() {
  return (
    <div className="dashboard-wrap" aria-label="Vista previa del espacio de trabajo de Impulso">
      <div className="dashboard">
        <aside className="dash-sidebar">
          <div className="dash-logo"><span className="mini-mark">i.</span> impulso</div>
          <p className="side-label">ESPACIO DE TRABAJO</p>
          <div className="side-item selected"><span>▦</span> Mi semana</div>
          <div className="side-item"><span>◷</span> Bandeja de entrada <b>3</b></div>
          <p className="side-label projects-label">TUS PROYECTOS <span>＋</span></p>
          <div className="side-item project"><i className="dot dot-purple" /> Rediseño web</div>
          <div className="side-item project"><i className="dot dot-orange" /> Lanzamiento Q3</div>
          <div className="side-item project"><i className="dot dot-green" /> Contenido</div>
          <div className="sidebar-bottom"><span className="avatar avatar-small">ML</span><span>María López</span><span className="more">···</span></div>
        </aside>
        <div className="dash-main">
          <div className="dash-top">
            <span>Mis proyectos <span className="crumb">/</span> <b>Rediseño web</b></span>
            <div className="avatar-stack"><span className="avatar avatar-one">ML</span><span className="avatar avatar-two">JR</span><span className="avatar avatar-three">AC</span><span className="invite">＋</span></div>
          </div>
          <div className="dash-heading">
            <div><p className="eyebrow">MARTES, 18 DE JUNIO</p><h3>Un buen día para avanzar.</h3></div>
            <button type="button" className="new-task">＋ <span>Nueva tarea</span></button>
          </div>
          <div className="progress-card">
            <div className="progress-copy"><span>Progreso del proyecto</span><b>68%</b></div>
            <div className="progress-track"><span /></div>
            <div className="progress-foot"><span>17 de 25 tareas completadas</span><span>Quedan 7 días</span></div>
          </div>
          <div className="task-heading"><b>En marcha</b><span>Ver todas <ArrowUpRight /></span></div>
          <div className="task-list">
            {tasks.map((task) => (
              <div className="task-row" key={task.title}>
                <span className={`task-check ${task.done ? 'is-done' : ''}`}>{task.done && <Check />}</span>
                <span className="task-title">{task.title}</span>
                <span className={`tag ${task.color}`}>{task.label}</span>
                <span className="task-date">{task.done ? 'Ayer' : 'Hoy'}</span>
              </div>
            ))}
          </div>
          <div className="dash-note"><span className="note-star">✳</span><span><b>¡Buen ritmo!</b> El equipo completó 5 tareas esta semana.</span><span className="note-close">×</span></div>
        </div>
      </div>
      <div className="float-card"><span className="float-icon">✓</span><span><b>Todo en orden</b><small>Tu equipo va por buen camino</small></span><span className="sparkle">✳</span></div>
    </div>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      <header className="site-header" id="inicio">
        <nav className="nav container" aria-label="Navegación principal">
          <Logo />
          <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span />
          </button>
          <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
            <a href="#producto" onClick={closeMenu}>Producto</a>
            <a href="#como-funciona" onClick={closeMenu}>Cómo funciona</a>
            <a href="#historias" onClick={closeMenu}>Historias</a>
          </div>
          <a className="nav-cta" href="#empezar">Empieza gratis <ArrowUpRight /></a>
        </nav>
      </header>

      <main>
        <section className="hero container">
          <div className="hero-copy">
            <div className="announcement"><span className="announcement-dot" /> Una forma más simple de trabajar <ArrowUpRight /></div>
            <h1>Las buenas ideas<br />merecen <span>avanzar.</span></h1>
            <p className="hero-description">El espacio de trabajo que convierte el caos del día a día en progreso real. Todo tu equipo, en la misma dirección.</p>
            <div className="hero-actions">
              <a className="button button-dark" href="#empezar">Prueba Impulso gratis <ArrowUpRight /></a>
              <a className="text-link" href="#producto"><span className="play">▶</span> Descubre cómo funciona</a>
            </div>
            <div className="social-proof">
              <div className="avatar-stack proof-avatars"><span className="avatar avatar-one">ML</span><span className="avatar avatar-two">JR</span><span className="avatar avatar-three">AC</span><span className="avatar avatar-four">LV</span></div>
              <div><div className="stars">★★★★★</div><span>Equipos pequeños, grandes ideas.</span></div>
            </div>
          </div>
          <DashboardPreview />
          <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
        </section>

        <section className="trust-strip" aria-label="Confían en Impulso">
          <div className="container trust-inner"><span>Para equipos que hacen que las cosas pasen</span><div className="client-logos"><b className="logo-norte">norte<span>®</span></b><b className="logo-onda">onda<span> studio</span></b><b className="logo-atelier">✳ atelier</b><b className="logo-punto">punto<span>.</span></b><b className="logo-lumen">lumen</b></div></div>
        </section>

        <section className="features-section section-pad container" id="producto">
          <div className="section-intro">
            <p className="eyebrow">MENOS HERRAMIENTAS. MÁS AVANCE.</p>
            <h2>Tu trabajo, por fin<br />en <span>su sitio.</span></h2>
            <p>Olvídate de perseguir actualizaciones en mil pestañas. Impulso pone lo importante justo donde lo necesitas.</p>
          </div>
          <div className="feature-grid" id="como-funciona">
            {features.map((feature) => (
              <article className="feature-card" key={feature.number}>
                <div className={`feature-icon ${feature.tone}`}>{feature.icon}</div>
                <span className="feature-number">{feature.number}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <a href="#empezar" aria-label={`Descubre: ${feature.title}`}><ArrowUpRight /></a>
              </article>
            ))}
          </div>
        </section>

        <section className="quote-section" id="historias">
          <div className="container quote-inner">
            <span className="quote-mark">“</span>
            <blockquote>Por primera vez, siento que nuestro trabajo está al servicio de nuestras ideas, y no al revés.</blockquote>
            <div className="quote-author"><span className="avatar author-avatar">CR</span><span><b>Clara Ruiz</b><small>Co-fundadora, Estudio Brava</small></span></div>
            <div className="quote-decoration">✳</div>
          </div>
        </section>

        <section className="signup-section container" id="empezar">
          <div className="signup-card">
            <div className="signup-copy">
              <p className="eyebrow">TU PRÓXIMO GRAN PASO</p>
              <h2>Menos vueltas.<br /><span>Más hecho.</span></h2>
              <p>Empieza gratis. Sin tarjeta, sin complicaciones. Solo tú y tu equipo haciendo avanzar las cosas.</p>
              <form className="signup-form" onSubmit={handleSubmit}>
                <label className="sr-only" htmlFor="signup-email">Tu correo electrónico</label>
                <input id="signup-email" type="email" placeholder="Tu correo electrónico" value={email} onChange={(event) => { setEmail(event.target.value); setSubmitted(false); }} required />
                <button type="submit">{submitted ? '¡Listo!' : 'Empieza gratis'} <ArrowUpRight /></button>
              </form>
              <span className={`form-message ${submitted ? 'visible' : ''}`} role="status">{submitted ? `¡Gracias! Te contactaremos en ${email}.` : 'Sin spam. Cancela cuando quieras.'}</span>
            </div>
            <div className="signup-art" aria-hidden="true">
              <div className="art-sun" /><div className="art-card art-card-back"><span>UNA COSA A LA VEZ</span><i>↗</i></div>
              <div className="art-card art-card-front"><span className="art-check">✓</span><div><b>Un paso adelante</b><small>Y luego, el siguiente.</small></div><span className="art-dots">···</span></div>
              <span className="art-spark art-spark-one">✳</span><span className="art-spark art-spark-two">✳</span><span className="art-squiggle">⌁</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner"><Logo /><span>Hecho para avanzar, con calma. © 2025 Impulso</span><div><a href="#inicio">Volver arriba ↑</a><a href="mailto:hola@impulso.example">Contacto</a></div></div>
      </footer>
    </>
  );
}

export default App;
