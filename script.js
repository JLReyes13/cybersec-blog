/* Fondo compartido: estrellas discretas y sin movimiento al reducir animaciones. */
(() => {
  const canvas = document.getElementById('bg');
  const ctx = canvas?.getContext('2d');
  if (!ctx) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let stars = [];
  let frame;
  let previous;

  function draw(time) {
    const delta = previous === undefined ? 0 : Math.min((time - previous) / 1000, 0.05);
    previous = time;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(190, 213, 243, 0.45)';
    for (const star of stars) {
      if (!motion.matches) star.y = (star.y + delta * star.speed) % canvas.height;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!motion.matches && !document.hidden) frame = requestAnimationFrame(draw);
  }
  function restart() {
    cancelAnimationFrame(frame);
    previous = undefined;
    draw(performance.now());
  }
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = Array.from({ length: window.innerWidth < 700 ? 25 : 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 0.8 + 0.3,
      speed: Math.random() * 3 + 1
    }));
    restart();
  }
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', restart);
  motion.addEventListener('change', restart);
  resize();
})();


/* Orden cronológico y tipo de caso del catálogo. */
(() => {
  const form = document.getElementById('lab-filters');
  if (!form) return;
  const order = document.getElementById('lab-order');
  const type = document.getElementById('lab-type');
  const results = document.getElementById('lab-results');
  const count = document.getElementById('lab-count');
  const empty = document.getElementById('lab-empty');
  const labs = [...results.querySelectorAll('.card')];
  const types = [...new Set(labs.map(card => card.dataset.caseType))].sort((a, b) => a.localeCompare(b, 'es'));
  for (const label of types) type.add(new Option(label, label));
  function restore() {
    const params = new URLSearchParams(location.search);
    order.value = params.get('orden') === 'oldest' ? 'oldest' : 'newest';
    type.value = types.includes(params.get('tipo')) ? params.get('tipo') : '';
    update(false);
  }
  function update(save = true) {
    const sorted = [...labs].sort((a, b) => {
      const chronological = a.dataset.date.localeCompare(b.dataset.date);
      return order.value === 'oldest' ? chronological : -chronological;
    });
    let visible = 0;
    const fragment = document.createDocumentFragment();
    for (const card of sorted) {
      card.hidden = Boolean(type.value && card.dataset.caseType !== type.value);
      if (!card.hidden) visible++;
      fragment.append(card);
    }
    results.append(fragment);
    count.textContent = `Mostrando ${visible} de ${labs.length} laboratorios`;
    empty.hidden = visible !== 0;
    form.querySelector('.filter-reset').hidden = !type.value && order.value === 'newest';
    const url = new URL(location.href);
    for (const [key, value] of [['orden', order.value === 'oldest' ? 'oldest' : ''], ['tipo', type.value]]) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    if (save || url.searchParams.has('q')) {
      url.searchParams.delete('q');
      history.replaceState(null, '', url);
    }
    document.querySelectorAll('a[href*="posts/"]').forEach(link => {
      const target = new URL(link.href);
      target.searchParams.set('catalogo', url.search);
      link.href = target.href;
    });
  }
  form.addEventListener('submit', event => event.preventDefault());
  order.addEventListener('change', () => update());
  type.addEventListener('change', () => update());
  form.addEventListener('reset', () => setTimeout(() => update(), 0));
  window.addEventListener('popstate', restore);
  restore();
  form.hidden = false;
  count.hidden = false;
})();

/* Animar una sola vez al entrar en pantalla; el contenido siempre es visible. */
(() => {
  if (!('IntersectionObserver' in window)) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches) return;
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      if (!motion.matches) entry.target.classList.add('entered-view');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.08 });
  document.querySelectorAll('.hero, .card, .credential-card, .about-profile, .about-text, .soc-hero, .post-heading')
    .forEach(element => observer.observe(element));
  motion.addEventListener('change', event => {
    if (event.matches) observer.disconnect();
  });
})();

/* Conservar el catálogo al regresar desde un análisis. */
(() => {
  const saved = new URLSearchParams(location.search).get('catalogo');
  if (saved === null) return;
  const params = new URLSearchParams(saved);
  document.querySelectorAll('a[href="../laboratorios.html"]').forEach(link => {
    const target = new URL(link.href);
    for (const key of ['orden', 'tipo']) {
      if (params.has(key)) target.searchParams.set(key, params.get(key));
    }
    link.href = target.href;
  });
})();

/* Menú móvil: la navegación permanece visible si JavaScript no carga. */
(() => {
  const nav = document.querySelector('body > header nav');
  if (!nav) return;
  const mobile = matchMedia('(max-width: 700px)');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'nav-toggle';
  button.textContent = 'Menú';
  nav.id = 'primary-navigation';
  button.setAttribute('aria-controls', nav.id);
  nav.before(button);
  function setOpen(open) {
    button.setAttribute('aria-expanded', String(open));
    nav.hidden = mobile.matches && !open;
    button.textContent = open ? 'Cerrar menú' : 'Menú';
  }
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobile.matches) {
      setOpen(false);
      button.focus();
    }
  });
  mobile.addEventListener('change', () => setOpen(false));
  setOpen(false);
})();

/* Analítica compartida y contador público del total del blog. */
(() => {
  if (!['http:', 'https:'].includes(location.protocol)) return;
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  if (local) return;

  const endpoint = 'https://luisfo13.goatcounter.com';
  const script = document.createElement('script');
  script.dataset.goatcounter = endpoint + '/count';
  script.async = true;
  script.src = 'https://gc.zgo.at/count.js';
  document.head.append(script);

  const counter = document.querySelector('.visitor-count');
  if (!counter) return;
  counter.textContent = 'Visitas al blog: cargando…';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  fetch(endpoint + '/counter/TOTAL.json', {
    signal: controller.signal,
    credentials: 'omit'
  })
    .then(response => {
      if (!response.ok) throw new Error('Contador no disponible');
      return response.json();
    })
    .then(data => {
      if (typeof data.count !== 'string' || !data.count.trim()) {
        throw new Error('Cifra no disponible');
      }
      counter.textContent = 'Visitas al blog: ' + data.count;
      counter.title = 'Total registrado por GoatCounter; puede tardar hasta cuatro horas en actualizarse.';
    })
    .catch(() => {
      counter.textContent = 'Visitas al blog: no disponible';
    })
    .finally(() => clearTimeout(timeout));
})();
