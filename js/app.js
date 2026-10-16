'use strict';

/* CFMOTO catálogo — app.js: datos, router, home, helpers compartidos. */

window.CF = window.CF || {};
const CF = window.CF;

CF.cats = [
  { id: 'motos',  label: 'MOTOCICLETAS',         sub: 'Naked · Sport · Classic · Adventure', familias: ['NAKED', 'SPORT', 'CLASSIC', 'TOURING', 'MINI', 'SCOOTER'], img: 'img/cards/450sr.jpg' },
  { id: 'atv',    label: 'CUATRIMOTOS / ATV',    sub: 'Trabajo y recreo sobre ruedas',       familias: ['ATV'], img: 'img/cards/cforce1000mud.jpg' },
  { id: 'ssv',    label: 'SIDE BY SIDE / SSV',   sub: 'Deportivos premium',                  familias: ['SSV'], img: 'img/cards/zforce950.jpg' },
  { id: 'utv',    label: 'TRABAJO / UTV',        sub: 'Utilitarios de trabajo',              familias: ['UTV'], img: 'img/cards/u10pro.jpg' },
  { id: 'youth',  label: 'YOUTH',                sub: 'Para los más pequeños',               familias: ['YOUTH'], img: 'img/cards/cforce110.jpg' },
  { id: 'cflite', label: 'CFLITE',               sub: 'Submarca económica',                  familias: ['CFLITE'], img: 'img/cards/cflite_250dual.jpg' },
  { id: 'promos', label: 'PROMOCIONES',          sub: 'Precios especiales vigentes',         promos: true, img: 'img/cards/500sr.jpg' },
];

CF.FEATURED_CODES = [
  'MOTO-450SR-S',
  'MOTO-450NK-G2',
  'CFL-230-DUAL',
  'CFL-250-DUAL-FIABS',
  'MOTO-450MT',
  'CFL-250NK-CARB',
  'CFL-250SR-CARB',
  'MOTO-500SR-VOOM',
  'MOTO-250NK-FUN',
  'MOTO-800MT-X',
  'MOTO-450CLC',
  'MOTO-150SC',
  'CF-625-TOURING',
  'CF-1000-MV',
  'ZF-950-SPORT'
];

CF.CAROUSEL_IMAGES = {
  'MOTO-450SR-S': 'img/carousel/450srs.webp',
  'MOTO-500SR-VOOM': 'img/carousel/500sr.webp',
  'MOTO-450NK-G2': 'img/carousel/450nk.webp',
  'MOTO-250NK-FUN': 'img/carousel/250nk.webp',
  'MOTO-450MT': 'img/carousel/450mt.webp',
  'MOTO-800MT-X': 'img/carousel/800mtx.webp',
  'MOTO-450CLC': 'img/carousel/450clc.webp',
  'MOTO-150SC': 'img/carousel/150sc.webp',
  'CF-625-TOURING': 'img/carousel/cforce625.webp',
  'CF-1000-MV': 'img/carousel/cforce1000mud.webp',
  'ZF-950-SPORT': 'img/carousel/zforce950.webp',
  'CFL-230-DUAL': 'img/carousel/cflite_230dual.webp',
  'CFL-250-DUAL-FIABS': 'img/carousel/cflite_250dual.webp',
  'CFL-250NK-CARB': 'img/carousel/cflite_250nk.webp',
  'CFL-250SR-CARB': 'img/carousel/cflite_250sr.webp'
};

CF.state = { data: null };

CF.el = (id) => document.getElementById(id);

CF.helpers = {
  money(n) {
    if (n === null || n === undefined || n === '') return null;
    return '$' + Number(n).toLocaleString('en-US') + ' MXN';
  },
  byCode(code) {
    return CF.state.data.products.find((p) => p.code === code) || null;
  },
  bySlug(slug) {
    return CF.state.data.products.find((p) => p.slug === slug) || null;
  },
  inCat(product, cat) {
    if (!cat) return false;
    if (cat.promos) return !!product.hasPromo;
    return cat.familias.includes(product.category);
  },
  esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },
  catById(id) {
    return CF.cats.find((c) => c.id === id) || null;
  },
  /* Mensaje de cotización por producto (texto natural, datos reales). */
  waMessage(p) {
    const nombre = p.name + (p.year ? ' ' + p.year : '');
    const lines = [`Hola, me interesa cotizar ${nombre}.`];
    if (p.price !== null && p.hasPromo) {
      lines.push(`Precio lista: ${p.priceDisplay}`);
      lines.push(`Promoción mostrada: ${p.promoDisplay}`);
    } else if (p.price !== null) {
      lines.push(`Precio mostrado en catálogo: ${p.priceDisplay}`);
    } else {
      lines.push('Precio: Consultar precio');
    }
    lines.push(`Código: ${p.code}`);
    lines.push('¿Me puedes compartir disponibilidad y opciones de financiamiento?');
    return lines.join('\n');
  },
  /* Enlace wa.me estándar con mensaje prellenado; null si no hay número configurado. */
  waLink(p) {
    const cfg = (window.CF_CONFIG && window.CF_CONFIG.WHATSAPP_NUMBER) || '';
    let digits = String(cfg).replace(/\D/g, '');
    if (!digits) return null;
    if (digits.length === 10) digits = '52' + digits;
    else if (digits.length === 11 && digits.startsWith('1')) digits = '52' + digits.slice(1);
    else if (digits.length === 13 && digits.startsWith('521')) digits = '52' + digits.slice(3);
    return 'https://wa.me/' + digits + '?text=' + encodeURIComponent(CF.helpers.waMessage(p));
  },
};

CF.load = async function () {
  const res = await fetch('data/catalog-master.json');
  if (!res.ok) throw new Error('No se pudo cargar el catálogo');
  CF.state.data = await res.json();
};

/* ---------- Modal CTA (sin integración aún) ---------- */
CF.ctaMessages = {
  cotizacion: 'Muy pronto podrás solicitar tu cotización y la armaremos con nuestro asesor por WhatsApp.',
  financiamiento: 'Muy pronto podrás revisar las opciones de financiamiento para este modelo.',
  asesor: 'Muy pronto podrás hablar directo con tu asesor de motos por WhatsApp.',
};

CF.bindCta = function (root) {
  (root || document).querySelectorAll('[data-cta]').forEach((b) => {
    b.addEventListener('click', () => {
      const action = b.dataset.cta;
      if (action === 'cotizacion') {
        const prodCode = b.dataset.productCode;
        const prod = prodCode ? CF.helpers.byCode(prodCode) : CF.state.lastProduct;
        if (prod) {
          const url = CF.helpers.waLink(prod);
          if (url) {
            window.open(url, '_blank', 'noopener');
            return;
          }
          CF.showCta('Quiero cotización', 'WhatsApp comercial pendiente de configuración. Pronto podrás cotizar directo por WhatsApp.');
          return;
        }
      }
      CF.showCta(b.textContent.trim(), CF.ctaMessages[action] || '');
    });
  });
};

CF.showCta = function (title, text) {
  CF.el('modalTitle').textContent = title || 'Integración disponible próximamente';
  CF.el('modalText').textContent = text || 'Esta función se conectará pronto con nuestro equipo de ventas por WhatsApp.';
  CF.el('ctaModal').hidden = false;
  document.body.style.overflow = 'hidden';
  const close = CF.el('ctaModal').querySelector('.modal-close');
  if (close) close.focus();
};
CF.hideCta = function () {
  CF.el('ctaModal').hidden = true;
  document.body.style.overflow = '';
};
CF.bindModal = function () {
  const modal = CF.el('ctaModal');
  modal.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', CF.hideCta));
  modal.addEventListener('click', (e) => { if (e.target === modal) CF.hideCta(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !CF.el('ctaModal').hidden) CF.hideCta();
  });
};

/* ---------- Router ---------- */
CF.render = function () {
  const hash = (location.hash || '#/').replace(/^#\/?/, '');
  const parts = hash.split('/').filter(Boolean);
  const page = parts[0] || '';
  const id = decodeURIComponent(parts[1] || '');

  if (CF.__carouselCleanup) {
    CF.__carouselCleanup();
    CF.__carouselCleanup = null;
  }

  document.body.classList.remove('show-sticky');
  const sticky = CF.el('stickyCta');
  if (sticky) sticky.hidden = page !== 'modelo';
  if (window.__ctaIo) { window.__ctaIo.disconnect(); window.__ctaIo = null; }
  if (window.__ctaFooterIo) { window.__ctaFooterIo.disconnect(); window.__ctaFooterIo = null; }

  const back = CF.el('btnBack');
  if (page === 'categoria' || page === 'modelo') back.hidden = false;
  else back.hidden = true;

  if (page === 'categoria') CF.renderCategory(id);
  else if (page === 'modelo') CF.renderProduct(id);
  else CF.renderHome();
};

/* ---------- Carrusel Hero Multimodelo ---------- */
CF.renderCarousel = function () {
  const products = (CF.FEATURED_CODES || [])
    .map((code) => CF.helpers.byCode(code))
    .filter(Boolean);

  if (!products.length) return '';

  const slidesHtml = products.map((p, idx) => {
    const kicker = (p.category ? p.category + ' · ' : '') + (p.year ? 'MODELO ' + p.year : '2026');
    const imgUrl = (CF.CAROUSEL_IMAGES && CF.CAROUSEL_IMAGES[p.code]) || p.heroImg;
    const priceHtml = p.hasPromo && p.promoPrice
      ? `<div class="feat-price promo">${CF.helpers.esc(p.promoDisplay)} <span class="feat-price-old">${CF.helpers.esc(p.priceDisplay)}</span></div>`
      : (p.price !== null
        ? `<div class="feat-price">${CF.helpers.esc(p.priceDisplay)}</div>`
        : '<div class="feat-price" style="color:var(--muted);font-size:16px;font-weight:800">Precio a consultar</div>');

    return `
      <div class="carousel-slide" data-index="${idx}">
        <a class="feat-media" href="#/modelo/${p.slug}" aria-label="Ver ${CF.helpers.esc(p.name)}">
          <span class="slide-badge">${CF.helpers.esc(kicker)}</span>
          <img src="${CF.helpers.esc(imgUrl)}" alt="${CF.helpers.esc(p.name)} ${p.year || ''}" loading="${idx === 0 ? 'eager' : 'lazy'}" decoding="async" />
        </a>
        <div class="feat-body">
          <div class="feat-kicker">${CF.helpers.esc(kicker)}</div>
          <h2 class="feat-name">${CF.helpers.esc(p.name)}</h2>
          ${priceHtml}
          <div class="feat-ctas">
            <button class="btn btn-primary" data-cta="cotizacion" data-product-code="${p.code}">Quiero cotización</button>
            <a class="btn btn-ghost" href="#/modelo/${p.slug}">Ver modelo</a>
          </div>
        </div>
      </div>`;
  }).join('');

  const dotsHtml = products.map((_, idx) => `
    <button class="carousel-dot ${idx === 0 ? 'active' : ''}" data-dot-index="${idx}" aria-label="Ir a diapositiva ${idx + 1}" type="button"></button>
  `).join('');

  return `
    <section class="hero-carousel" aria-label="Modelos destacados de CFMOTO">
      <div class="carousel-bar">
        <div class="carousel-title-wrap">
          <span class="carousel-sub">Gama Destacada</span>
          <h2 class="carousel-title">Modelos 2026</h2>
        </div>
        <div class="carousel-arrows">
          <button class="carousel-arrow" id="carouselPrev" aria-label="Modelo anterior" type="button">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button class="carousel-arrow" id="carouselNext" aria-label="Modelo siguiente" type="button">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>

      <div class="carousel-viewport" id="carouselViewport">
        <div class="carousel-track" id="carouselTrack">
          ${slidesHtml}
        </div>
      </div>

      <div class="carousel-indicators" id="carouselDots" aria-label="Paginación de modelos">
        ${dotsHtml}
      </div>
    </section>`;
};

CF.initCarousel = function () {
  const track = CF.el('carouselTrack');
  const viewport = CF.el('carouselViewport');
  const prevBtn = CF.el('carouselPrev');
  const nextBtn = CF.el('carouselNext');
  const dotsContainer = CF.el('carouselDots');
  if (!track || !viewport) return;

  const slides = Array.from(track.querySelectorAll('.carousel-slide'));
  const dots = dotsContainer ? Array.from(dotsContainer.querySelectorAll('.carousel-dot')) : [];
  if (!slides.length) return;

  let currentIndex = 0;
  let autoplayTimer = null;
  let isInteracting = false;

  function updateActiveDot(idx) {
    currentIndex = idx;
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === idx);
    });
  }

  function goToSlide(idx, smooth = true) {
    if (idx < 0) idx = slides.length - 1;
    if (idx >= slides.length) idx = 0;
    currentIndex = idx;
    const slide = slides[idx];
    if (slide) {
      viewport.scrollTo({
        left: slide.offsetLeft,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
    updateActiveDot(idx);
  }

  function nextSlide() {
    goToSlide((currentIndex + 1) % slides.length);
  }

  function prevSlide() {
    goToSlide((currentIndex - 1 + slides.length) % slides.length);
  }

  if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); resetAutoplay(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); resetAutoplay(); });

  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      goToSlide(idx);
      resetAutoplay();
    });
  });

  let scrollTimeout = null;
  viewport.addEventListener('scroll', () => {
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const scrollLeft = viewport.scrollLeft;
      let bestIdx = 0;
      let minDiff = Infinity;
      slides.forEach((s, i) => {
        const diff = Math.abs(s.offsetLeft - scrollLeft);
        if (diff < minDiff) {
          minDiff = diff;
          bestIdx = i;
        }
      });
      updateActiveDot(bestIdx);
    }, 60);
  }, { passive: true });

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(() => {
      if (!isInteracting) {
        nextSlide();
      }
    }, 4500);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function resetAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  viewport.addEventListener('mouseenter', () => { isInteracting = true; });
  viewport.addEventListener('mouseleave', () => { isInteracting = false; });
  viewport.addEventListener('touchstart', () => { isInteracting = true; }, { passive: true });
  viewport.addEventListener('touchend', () => {
    isInteracting = false;
    resetAutoplay();
  }, { passive: true });

  startAutoplay();
  CF.__carouselCleanup = stopAutoplay;
};

/* ---------- Home ---------- */
CF.renderHome = function () {
  const firstFeat = CF.helpers.byCode(CF.FEATURED_CODES[0]);
  CF.state.lastProduct = firstFeat || null;

  const carouselHtml = CF.renderCarousel();

  const catsHtml = CF.cats.map((c) => {
    const n = CF.state.data.products.filter((p) => CF.helpers.inCat(p, c)).length;
    return `
      <a class="cat-tile ${c.promos ? 'promo' : ''}" href="#/categoria/${c.id}" aria-label="${CF.helpers.esc(c.label)}, ${n} modelos">
        <img class="cat-img" src="${CF.helpers.esc(c.img)}" alt="" loading="lazy" decoding="async" aria-hidden="true" />
        <span class="cat-ov" aria-hidden="true"></span>
        <div class="cat-txt">
          <div class="cat-t">${CF.helpers.esc(c.label)}</div>
          <div class="cat-s">${CF.helpers.esc(c.sub)}</div>
        </div>
        <span class="cat-n">${n}</span>
      </a>`;
  }).join('');

  CF.el('app').innerHTML = `
    <div class="page">
      <section class="hero">
        <h1 class="hero-brand">CFMOTO</h1>
        <div class="hero-city">SAN LUIS POTOSÍ</div>
        <p class="hero-tag">Más aventuras en tu camino</p>
        <div class="hero-line" aria-hidden="true"></div>
      </section>

      ${carouselHtml}

      <section class="sec" aria-label="Categorías">
        <div class="sec-title"><h2>Explora</h2><span>${CF.state.data.count} modelos 2026</span></div>
        <div class="cats">${catsHtml}</div>
      </section>
    </div>`;

  CF.bindCta(CF.el('app'));
  CF.initCarousel();
};

/* ---------- Inicialización ---------- */
CF.init = async function () {
  try {
    CF.el('app').innerHTML = `<div class="empty" style="padding-top:120px"><div class="skel" style="height:180px;border-radius:20px"></div><div class="skel" style="height:60px;border-radius:14px;margin-top:14px"></div></div>`;
    await CF.load();
    CF.bindModal();
    CF.bindCta(document);
    CF.el('btnBack').addEventListener('click', () => { history.back(); });
    window.addEventListener('hashchange', CF.render);
    CF.render();
  } catch (err) {
    CF.el('app').innerHTML = `<div class="empty"><strong>No se pudo cargar el catálogo</strong>${CF.helpers.esc(err.message)}</div>`;
    console.error('[catalogo-web] init error:', err);
  }
};

document.addEventListener('DOMContentLoaded', CF.init);