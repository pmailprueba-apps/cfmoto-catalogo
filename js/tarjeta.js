/**
 * TARJETA DIGITAL NFC — ALEX RAMOS / CFMOTO
 * Lógica de negocio, tracking NFC, vCard dinámico y cotizador por WhatsApp
 */

(function () {
  'use strict';

  // Configuración base de Alex Ramos
  const CONFIG = {
    ADVISOR_NAME: 'Alex Ramos',
    ADVISOR_TITLE: 'Asesor CFMOTO',
    WHATSAPP_NUMBER: '524448448721',
    RAW_PHONE: '444 844 8721',
    AGENCY_NAME: 'CFMOTO San Luis Potosí',
    AGENCY_ADDRESS: 'Av. Venustiano Carranza 1433, Tequisquiapan, SLP',
    MAPS_URL: 'https://maps.google.com/?q=CFMOTO+San+Luis+Potosi+Av+Venustiano+Carranza+1433',
    CATALOG_JSON_URL: 'data/catalog-master.json',
    WEBSITE_URL: 'https://pmailprueba-apps.github.io/cfmoto-catalogo/',
    CARD_URL: 'https://pmailprueba-apps.github.io/cfmoto-catalogo/tarjeta.html',
    EMAIL: 'alexram@me.com',
    INSTAGRAM_URL: 'https://www.instagram.com/cfalexram80?stkn=dHNjNjZrNmhiYm5w&utm_source=qr',
    TIKTOK_URL: 'https://www.tiktok.com/@alexram804?_r=1&_t=ZS-9A0ANJhojBs',
    FACEBOOK_URL: 'https://www.facebook.com/share/1KfgKSY36s/?mibextid=wwXIfr'
  };

  // 1. Detección y Tracking de Origen NFC / URL Query
  const urlParams = new URLSearchParams(window.location.search);
  const nfcOrigin = urlParams.get('nfc') || urlParams.get('source') || urlParams.get('origen') || 'tarjeta-personal';
  const tagOrigin = `REF:NFC-${nfcOrigin.toUpperCase()}`;

  // Registrar evento analítico (preparado para CRM / Píxel)
  function trackEvent(eventName, details = {}) {
    const payload = {
      event: eventName,
      nfc: nfcOrigin,
      timestamp: new Date().toISOString(),
      ...details
    };
    try {
      const history = JSON.parse(localStorage.getItem('cfmoto_nfc_events') || '[]');
      history.push(payload);
      localStorage.setItem('cfmoto_nfc_events', JSON.stringify(history.slice(-50)));
    } catch (e) {
      // Ignorar si localStorage está bloqueado
    }
    console.log('[CFMOTO Analytics]', payload);
  }

  // Notificación Toast
  function showToast(message) {
    const toast = document.getElementById('toastNotification');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // 2. Generación y Descarga de Contacto vCard (.vcf)
  function downloadVCard() {
    trackEvent('download_vcard');
    const vCardContent = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${CONFIG.ADVISOR_NAME}`,
      'N:Ramos;Alex;;;',
      'ORG:CFMOTO;Ventas',
      `TITLE:${CONFIG.ADVISOR_TITLE}`,
      `TEL;TYPE=CELL,VOICE,PREF:+${CONFIG.WHATSAPP_NUMBER}`,
      `ADR;TYPE=WORK:;;${CONFIG.AGENCY_ADDRESS};San Luis Potosí;SLP;;Mexico`,
      `NOTE:Asesor Oficial CFMOTO San Luis Potosí. Contacto directo por NFC [${tagOrigin}]`,
      `EMAIL;TYPE=INTERNET,PREF:${CONFIG.EMAIL}`,
      `URL:${CONFIG.WEBSITE_URL}`,
      'END:VCARD'
    ].join('\r\n');

    const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Alex_Ramos_CFMOTO.vcf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Contacto de Alex Ramos descargado');
  }

  // 3. Enlace directo a WhatsApp con mensaje inteligente
  function openWhatsApp(customText = null) {
    trackEvent('whatsapp_click', { customText });
    const defaultText = `¡Hola Alex! Estuve revisando tu tarjeta digital CFMOTO y me gustaría recibir información sobre motos y planes de financiamiento.\n\n📲 (Mi tarjeta guardada: ${CONFIG.CARD_URL}) [${tagOrigin}]`;
    const message = encodeURIComponent(customText || defaultText);
    const whatsappUrl = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  }

  // 4. Carga y gestión de Modelos desde catalog-master.json
  let allProducts = [];

  async function loadCatalog() {
    try {
      const response = await fetch(CONFIG.CATALOG_JSON_URL);
      if (!response.ok) throw new Error('No se pudo cargar el catálogo');
      const data = await response.json();
      allProducts = data.products || [];
      renderFeaturedModels(allProducts);
      populateCotizarSelect(allProducts);
      renderFichasTecnicas(allProducts);
    } catch (err) {
      console.warn('Cargando con lista de respaldo por:', err.message);
      // Fallback si corre en entorno sin fetch local
      setupFallbackModels();
    }
  }

  function setupFallbackModels() {
    const fallbacks = [
      { name: '675SR-R', specs: { potencia: '95 HP', cc: '675' }, priceDisplay: '$169,900 MXN', cardImg: 'img/cards/675sr.jpg', pdfFicha: '#' },
      { name: '450MT', specs: { potencia: '44 HP', cc: '450' }, priceDisplay: '$149,900 MXN', cardImg: 'img/cards/450mt.jpg', pdfFicha: '#' },
      { name: '800MT-X', specs: { potencia: '95 HP', cc: '799' }, priceDisplay: '$239,900 MXN', cardImg: 'img/cards/800mtx.jpg', pdfFicha: '#' },
      { name: '450SR', specs: { potencia: '50 HP', cc: '450' }, priceDisplay: '$129,900 MXN', cardImg: 'img/cards/450sr.jpg', pdfFicha: '#' }
    ];
    renderFeaturedModels(fallbacks);
    populateCotizarSelect(fallbacks);
    renderFichasTecnicas(fallbacks);
  }

  // Render carrusel de modelos destacados
  function renderFeaturedModels(products) {
    const container = document.getElementById('featuredModelsContainer');
    if (!container) return;

    // Priorizar modelos insignia: 675SR-R, 450MT, 800MT-X, 450SR, 250NK
    const targetSlugs = ['675sr', '450mt', '800mtx', '450sr', '250nk', 'z10'];
    let featured = products.filter(p => {
      const name = (p.name || '').toLowerCase();
      const code = (p.code || '').toLowerCase();
      return targetSlugs.some(t => name.includes(t) || code.includes(t));
    });

    if (featured.length === 0) featured = products.slice(0, 5);

    container.innerHTML = featured.map(p => `
      <div class="mini-bike-card" data-model="${p.name}">
        <img class="mini-bike-img" src="${p.cardImg || 'img/cards/450mt.jpg'}" alt="${p.name}" loading="lazy" onerror="this.src='img/cards/450mt.jpg'">
        <div class="mini-bike-name">${p.name}</div>
        <div class="mini-bike-specs">${p.specs?.potencia || ''} · ${p.specs?.cc ? p.specs.cc + ' cc' : ''}</div>
        <div class="mini-bike-price">Cotizar modelo ➔</div>
      </div>
    `).join('');

    // Click en una moto abre cotizador directo de ese modelo
    container.querySelectorAll('.mini-bike-card').forEach(card => {
      card.addEventListener('click', () => {
        const modelName = card.getAttribute('data-model');
        openCotizarModal(modelName);
      });
    });
  }

  // Llenar select del cotizador (sin precios para evitar discrepancias)
  function populateCotizarSelect(products) {
    const select = document.getElementById('cotizarModeloSelect');
    if (!select) return;
    select.innerHTML = '<option value="">-- Selecciona el modelo que te gusta --</option>' +
      products.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
  }

  // Render lista de fichas técnicas oficiales
  function renderFichasTecnicas(products) {
    const container = document.getElementById('fichasListContainer');
    if (!container) return;

    const withPdf = products.filter(p => p.pdfFicha && p.pdfFicha.startsWith('http'));
    const listToRender = withPdf.length > 0 ? withPdf : products;

    container.innerHTML = listToRender.map(p => `
      <a href="${p.pdfFicha || '#'}" class="ficha-item" target="_blank" rel="noopener noreferrer" data-search="${(p.name || '').toLowerCase()}">
        <div class="ficha-info">
          <h4>${p.name}</h4>
          <p>${p.category || 'CFMOTO'} · Ficha Técnica Oficial PDF</p>
        </div>
        <span class="ficha-badge">Descargar PDF ↗</span>
      </a>
    `).join('');

    // Buscador interactivo en fichas técnicas
    const searchInput = document.getElementById('fichasSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        container.querySelectorAll('.ficha-item').forEach(item => {
          const match = item.getAttribute('data-search').includes(term);
          item.style.display = match ? 'flex' : 'none';
        });
      });
    }
  }

  // 5. Manejo de Modales (Cotizador, Fichas)
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function openCotizarModal(preselectedModel = '') {
    trackEvent('open_cotizar_modal', { preselectedModel });
    const select = document.getElementById('cotizarModeloSelect');
    if (select && preselectedModel) {
      select.value = preselectedModel;
    }
    openModal('modalCotizar');
  }

  // Configuración de eventos de UI
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Mostrar origen NFC en badge si existe parámetro
    const nfcBadge = document.getElementById('nfcBadge');
    if (nfcBadge && nfcOrigin !== 'tarjeta-personal') {
      nfcBadge.innerHTML = `<span class="nfc-dot"></span> Dispositivo: ${nfcOrigin.toUpperCase()}`;
    }

    // 2. Botón WhatsApp principal
    const btnWhatsapp = document.getElementById('btnWhatsapp');
    if (btnWhatsapp) {
      btnWhatsapp.addEventListener('click', (e) => {
        e.preventDefault();
        openWhatsApp();
      });
    }

    // 3. Botón Guardar Contacto vCard
    const btnVcard = document.getElementById('btnSaveContact');
    if (btnVcard) {
      btnVcard.addEventListener('click', (e) => {
        e.preventDefault();
        downloadVCard();
      });
    }

    // 4. Botón Cotizar
    const btnCotizar = document.getElementById('btnOpenCotizar');
    if (btnCotizar) {
      btnCotizar.addEventListener('click', (e) => {
        e.preventDefault();
        openCotizarModal();
      });
    }

    // 5. Botón Fichas Técnicas
    const btnFichas = document.getElementById('btnOpenFichas');
    if (btnFichas) {
      btnFichas.addEventListener('click', (e) => {
        e.preventDefault();
        trackEvent('open_fichas_modal');
        openModal('modalFichas');
      });
    }

    // 6. Botón Ubicación
    const btnUbicacion = document.getElementById('btnUbicacion');
    if (btnUbicacion) {
      btnUbicacion.addEventListener('click', (e) => {
        e.preventDefault();
        trackEvent('open_location');
        window.open(CONFIG.MAPS_URL, '_blank');
      });
    }

    // 6.1 Botón Visita Carranza
    const btnVisitaCarranza = document.getElementById('btnVisitaCarranza');
    if (btnVisitaCarranza) {
      btnVisitaCarranza.addEventListener('click', (e) => {
        e.preventDefault();
        trackEvent('agenda_visita_carranza');
        openWhatsApp(`¡Hola Alex! Vi tu tarjeta digital y quiero visitarte en la agencia de Carranza 1433.\n¿En qué horario me puedes atender?\n\n📲 (Tarjeta guardada: ${CONFIG.CARD_URL}) [${tagOrigin}]`);
      });
    }

    // 6.2 Redes Sociales
    const linkIg = document.getElementById('linkInstagram');
    if (linkIg) linkIg.href = CONFIG.INSTAGRAM_URL;
    const linkTt = document.getElementById('linkTikTok');
    if (linkTt) linkTt.href = CONFIG.TIKTOK_URL;
    const linkFb = document.getElementById('linkFacebook');
    if (linkFb) linkFb.href = CONFIG.FACEBOOK_URL;

    // 7. Cierre de modales
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close-modal');
        closeModal(modalId);
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    });

    // 8. Opciones de Forma de Pago en Cotizador (Pills)
    const radioPills = document.querySelectorAll('.radio-pill');
    let paymentType = 'Financiamiento';
    radioPills.forEach(pill => {
      pill.addEventListener('click', () => {
        radioPills.forEach(p => p.classList.remove('selected'));
        pill.classList.add('selected');
        const input = pill.querySelector('input');
        if (input) {
          input.checked = true;
          paymentType = input.value;
        }
      });
    });

    // 9. Envío del Formulario de Cotización por WhatsApp
    const formCotizar = document.getElementById('formCotizar');
    if (formCotizar) {
      formCotizar.addEventListener('submit', (e) => {
        e.preventDefault();
        const modelo = document.getElementById('cotizarModeloSelect').value || 'Modelo por definir';
        const nombre = document.getElementById('cotizarNombre').value.trim() || 'No especificado';
        const telefono = document.getElementById('cotizarTelefono').value.trim() || 'No especificado';
        const enganche = document.getElementById('cotizarEnganche').value.trim() || 'Por consultar';

        const customMessage = [
          `Hola Alex, quiero cotizar una CFMOTO en la agencia de Carranza:`,
          `*Modelo:* ${modelo}`,
          `*Nombre:* ${nombre}`,
          `*Teléfono:* ${telefono}`,
          `*Plan:* ${paymentType}`,
          paymentType === 'Financiamiento' ? `*Enganche estimado:* ${enganche}` : '',
          `\n📲 (Visto en mi tarjeta digital: ${CONFIG.CARD_URL})`,
          `[${tagOrigin}]`
        ].filter(Boolean).join('\n');

        trackEvent('submit_quote', { modelo, nombre, paymentType });
        closeModal('modalCotizar');
        openWhatsApp(customMessage);
      });
    }

    // 10. Interacción con el Tablero Digital de Motocicleta (Cluster Sweep 10K RPM / 288 km/h)
    const motoDash = document.getElementById('motoDashboard');
    const speedEl = document.getElementById('dashSpeed');

    function triggerDashSweep() {
      if (!motoDash) return;
      motoDash.classList.remove('revving');
      void motoDash.offsetWidth; // Forzar reflow
      motoDash.classList.add('revving');

      let count = 0;
      const speedInterval = setInterval(() => {
        count += 36;
        if (count >= 288) {
          if (speedEl) speedEl.textContent = '288';
          clearInterval(speedInterval);
          setTimeout(() => {
            if (speedEl) speedEl.textContent = 'READY';
          }, 750);
        } else {
          if (speedEl) speedEl.textContent = String(count);
        }
      }, 50);
    }

    if (motoDash) {
      motoDash.addEventListener('click', triggerDashSweep);
      // Barrido inicial de bienvenida estilo encendido de moto
      setTimeout(triggerDashSweep, 450);
    }

    // 11. Cargar el catálogo
    loadCatalog();
    trackEvent('page_view');
  });
})();
