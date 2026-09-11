'use strict';

/* CFMOTO catálogo — product.js: ficha de producto. */

(function (CF) {

const SPEC_LABELS = {
  motor: 'Motor',
  cilindrada: 'Cilindrada',
  potencia: 'Potencia',
  torque: 'Torque',
  peso: 'Peso',
  combustible: 'Combustible',
  dimensiones: 'Dimensiones',
  tanque: 'Tanque',
  extras: 'Extras',
};

CF.renderProduct = function (slug) {
  const p = CF.helpers.bySlug(slug);
  if (!p) { CF.el('app').innerHTML = `<div class="empty"><strong>Modelo no encontrado</strong><br/>No existe en este catálogo.</div>`; return; }
  CF.state.lastProduct = p;

  const year = p.year ? p.year : '';
  const tag = `${p.category}${year ? ' · ' + year : ''}`;

  let priceHtml;
  if (p.price === null) {
    priceHtml = `<div class="p-price-ask" style="font-size:20px;font-weight:800;color:var(--muted);margin-top:14px">Precio a consultar</div>`;
  } else if (p.hasPromo) {
    priceHtml = `
      <div class="p-price-old">Lista: ${CF.helpers.esc(p.priceDisplay)}</div>
      <div class="p-promo">${CF.helpers.esc(p.promoDisplay)}</div>`;
  } else {
    priceHtml = `<div class="p-price">${CF.helpers.esc(p.priceDisplay)}</div>`;
  }

  const specs = Object.entries(p.tech || {})
    .filter(([k, v]) => k !== 'lineas' && v != null && String(v).trim() !== '')
    .map(([k, v]) => `
      <div class="spec">
        <dt>${SPEC_LABELS[k] || CF.helpers.esc(k)}</dt>
        <dd>${CF.helpers.esc(String(v))}</dd>
      </div>`)
    .join('');

  const features = (p.tech && p.tech.lineas && p.tech.lineas.length)
    ? `<div class="p-sec"><h2>Ficha técnica</h2><ul class="feature-list">${p.tech.lineas.map((l) => `<li>${CF.helpers.esc(l)}</li>`).join('')}</ul></div>`
    : '';

  const arg = p.arg ? `<div class="p-arg">${CF.helpers.esc(p.arg)}</div>` : '';

  const cmp = CF.state.data.comparativos.find((c) => c.id === p.compId);
  const cmpHtml = cmp && cmp.datos && cmp.datos.length
    ? `<div class="p-sec"><h2>Comparativo vs competencia</h2>
        ${cmp.datos.map((r) => {
          const celda = (v) => (v != null && String(v).trim() !== '' && String(v) !== '—') ? CF.helpers.esc(String(v)) : '';
          const precio = (typeof r.p === 'number') ? CF.helpers.money(r.p) : (r.p ? CF.helpers.esc(String(r.p)) : '');
          const detalle = [precio, celda(r.c), celda(r.h), celda(r.t)].filter(Boolean).join(' · ');
          return `
          <div class="cmp-row ${r.dest ? 'cmp-dest' : ''}">
            <div class="cmp-m">${CF.helpers.esc(r.m)}${r.dest ? ' <span style="font-size:11px;letter-spacing:1px">(CFMOTO)</span>' : ''}</div>
            <div class="cmp-r">${detalle}</div>
          </div>`;
        }).join('')}
        </div>`
    : '';

  const pdf = p.pdfFicha ? `<a class="btn btn-ghost" href="${CF.helpers.esc(p.pdfFicha)}" target="_blank" rel="noopener noreferrer">Ficha oficial PDF</a>` : '';

  CF.el('app').innerHTML = `
    <div class="page">
      <div class="p-hero">
        <img src="${CF.helpers.esc(p.heroImg)}" alt="${CF.helpers.esc(p.name)} — imagen principal" loading="eager" decoding="async" />
        <span class="p-tag">${CF.helpers.esc(tag)}</span>
      </div>

      <section class="p-head">
        <div class="p-year">${year ? 'MODELO ' + year : p.category}</div>
        <h1>${CF.helpers.esc(p.name)}</h1>
        ${priceHtml}
      </section>

      ${arg}

      <section class="p-ctas" aria-label="Acciones">
        <button class="btn btn-primary" data-cta="cotizacion">Quiero cotización</button>
        <button class="btn btn-ghost" data-cta="financiamiento">Ver financiamiento</button>
        <button class="btn btn-ghost" data-cta="asesor">Hablar con asesor</button>
        ${pdf}
      </section>

      ${specs ? `<section class="p-sec"><h2>Especificaciones principales</h2><dl class="spec-grid">${specs}</dl></section>` : ''}
      ${features}
      ${cmpHtml}
    </div>`;

  CF.bindCta(CF.el('app'));

  const primaryCta = CF.el('app').querySelector('.p-ctas [data-cta="cotizacion"]');
  const sticky = CF.el('stickyCta');
  if (sticky) sticky.hidden = false;
  const updateSticky = () => {
    if (!primaryCta) return;
    const r = primaryCta.getBoundingClientRect();
    const visible = r.top < window.innerHeight && r.bottom > 0;
    document.body.classList.toggle('show-sticky', !visible);
  };
  if (primaryCta && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      document.body.classList.toggle('show-sticky', !entries[0].isIntersecting);
    }, { threshold: 0 });
    io.observe(primaryCta);
    window.__ctaIo = io;
    const foot = document.querySelector('.foot');
    if (foot) {
      const ioFoot = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) document.body.classList.remove('show-sticky');
      }, { threshold: 0.15 });
      ioFoot.observe(foot);
      window.__ctaFooterIo = ioFoot;
    }
  } else if (primaryCta) {
    window.addEventListener('scroll', updateSticky, { passive: true });
    updateSticky();
    window.__ctaScroll = updateSticky;
  }
};

})(window.CF);