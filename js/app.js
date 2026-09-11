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

CF.FEATURED_CODE = 'CF-1000-MV';

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
      if (action === 'cotizacion' && CF.state.lastProduct) {
        const url = CF.helpers.waLink(CF.state.lastProduct);
        if (url) {
          window.open(url, '_blank', 'noopener');
          return;
        }
        CF.showCta('Quiero cotización', 'WhatsApp comercial pendiente de configuración. Pronto podrás cotizar directo por WhatsApp.');
        return;
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

/* ---------- Home ---------- */
CF.renderHome = function () {
  const feat = CF.helpers.byCode(CF.FEATURED_CODE);
  CF.state.lastProduct = feat || null;
  const featured = feat ? `
    <section class="featured" aria-label="Modelo destacado">
      <a class="feat-media" href="#/modelo/${feat.slug}" aria-label="Ver ${CF.helpers.esc(feat.name)}">
        <img src="${CF.helpers.esc(feat.heroImg)}" alt="${CF.helpers.esc(feat.name)} ${feat.year}" loading="eager" decoding="async" />
      </a>
      <div class="feat-body">
        <div class="feat-kicker">${feat.year ? 'MODELO ' + feat.year + ' · ' : ''}DESTACADO</div>
        <h2 class="feat-name">${CF.helpers.esc(feat.name)}</h2>
        ${feat.price !== null ? `<div class="feat-price">${CF.helpers.esc(feat.priceDisplay)}</div>` : '<div class="feat-price" style="color:var(--muted);font-size:16px;font-weight:800">Precio a consultar</div>'}
        <div class="feat-ctas">
          <button class="btn btn-primary" data-cta="cotizacion">Quiero cotización</button>
          <a class="btn btn-ghost" href="#/modelo/${feat.slug}">Ver modelo</a>
        </div>
      </div>
    </section>`
    : '';

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

      ${featured}

      <section class="sec" aria-label="Categorías">
        <div class="sec-title"><h2>Explora</h2><span>${CF.state.data.count} modelos 2026</span></div>
        <div class="cats">${catsHtml}</div>
      </section>
    </div>`;

  CF.bindCta(CF.el('app'));
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