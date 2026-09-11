'use strict';

/* CFMOTO catálogo — catalog.js: página de categoría + tarjetas de modelo. */

(function (CF) {

CF.cardHtml = function (p) {
  const chip = CF.helpers.esc(p.category);
  const year = p.year ? CF.helpers.esc(String(p.year)) : '';
  let priceHtml;
  if (p.price === null) {
    priceHtml = `<div class="card-price-ask">Consultar precio</div>`;
  } else if (p.hasPromo) {
    priceHtml = `
      <div class="card-price-old">${CF.helpers.esc(p.priceDisplay)}</div>
      <div class="card-promo-price">${CF.helpers.esc(p.promoDisplay)}</div>`;
  } else {
    priceHtml = `<div class="card-price">${CF.helpers.esc(p.priceDisplay)}</div>`;
  }

  return `
    <article class="card">
      <a href="#/modelo/${CF.helpers.esc(p.slug)}" class="card-media" aria-label="Ver ${CF.helpers.esc(p.name)}">
        <img src="${CF.helpers.esc(p.cardImg)}" alt="${CF.helpers.esc(p.name)} ${year} — CFMOTO ${CF.helpers.esc(p.category)}" loading="lazy" decoding="async" />
        <span class="card-chip">${chip}</span>
        ${p.hasPromo ? '<span class="card-promo">PROMOCIÓN</span>' : ''}
      </a>
      <div class="card-body">
        ${year ? `<div class="card-year">MODELO ${year}</div>` : ''}
        <h3 class="card-name">${CF.helpers.esc(p.name)}</h3>
        ${priceHtml}
        <a href="#/modelo/${CF.helpers.esc(p.slug)}" class="card-cta ${p.price === null ? 'ghost' : ''}" aria-label="Ver modelo ${CF.helpers.esc(p.name)}">
          ${p.price === null ? 'Consultar precio' : 'Ver modelo'}
        </a>
      </div>
    </article>`;
};

CF.renderCategory = function (catId) {
  const cat = CF.helpers.catById(catId);
  if (!cat) { CF.el('app').innerHTML = `<div class="empty"><strong>Categoría no encontrada</strong></div>`; return; }

  const list = CF.state.data.products.filter((p) => CF.helpers.inCat(p, cat));
  list.sort((a, b) => (a.price === null ? 1 : 0) - (b.price === null ? 1 : 0) || a.name.localeCompare(b.name));

  const grid = list.map(CF.cardHtml).join('');

  CF.el('app').innerHTML = `
    <div class="page">
      <section class="cat-head">
        <h1>${CF.helpers.esc(cat.label)}</h1>
        <p><span class="count">${list.length}</span> modelos · ${CF.helpers.esc(cat.sub)}</p>
      </section>
      <section class="sec">
        <div class="grid">${grid || '<div class="empty"><strong>Sin modelos</strong></div>'}</div>
      </section>
    </div>`;
};

})(window.CF);