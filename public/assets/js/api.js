
const _BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3002'
  : window.location.origin;
const API_BASE = `${_BASE_URL}/api`;

function getToken() { return localStorage.getItem('fc_token'); }
function getUsuario() { return JSON.parse(localStorage.getItem('fc_usuario') || 'null'); }

async function api(method, path, body = null) {
  const token = getToken();
  const opts = { method, headers: {
     'Content-Type': 'application/json',
     'ngrok-skip-browser-warning': 'true' 
    } };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    if (path.includes('/auth/login')) {
      const msg = data?.message || 'Credenciales incorrectas';
      throw new Error(Array.isArray(msg) ? msg.join(', ') : msg);
    }
    clearSession();
    window.location.href = '/pages/login.html';
    throw new Error('Sesión expirada');
  }
  if (!res.ok) {
    const msg = data?.message || `Error ${res.status}`;
    throw new Error(Array.isArray(msg) ? msg.join(', ') : msg);
  }
  return data;
}

async function apiForm(method, path, formData) {
  const token = getToken();
  const opts = { method, headers: {
      'ngrok-skip-browser-warning': 'true'
  } };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  opts.body = formData;

  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    clearSession();
    window.location.href = '/pages/login.html';
    throw new Error('Sesión expirada');
  }
  if (!res.ok) {
    const msg = data?.message || `Error ${res.status}`;
    throw new Error(Array.isArray(msg) ? msg.join(', ') : msg);
  }
  return data;
}

function apiAssetUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE.replace(/\/api$/, '')}/${String(url).replace(/^\/+/, '')}`;
}

function clearSession() {
  localStorage.removeItem('fc_token');
  localStorage.removeItem('fc_usuario');
}

function logout() {
  clearSession();
  window.location.href = '/pages/login.html';
}

// ── Toast ──
let _toastTimer;
function toast(msg, type = 'info') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = `toast show ${type}`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
}

// ── Sidebar toggle ──
function toggleSidebar() {
  const sb = document.querySelector('.sidebar');
  if (!sb) return;
  if (window.innerWidth <= 900) {
    sb.classList.toggle('mobile-open');
    let ov = document.querySelector('.sb-overlay');
    if (!ov) {
      ov = document.createElement('div');
      ov.className = 'sb-overlay';
      ov.onclick = toggleSidebar;
      document.body.appendChild(ov);
    }
    ov.classList.toggle('open');
  } else {
    sb.classList.toggle('collapsed');
  }
}

// ── Modales ──
function openModal(id) {
  const m = document.getElementById(id);
  if (m) { m.style.display = 'flex'; m.classList.add('open'); }
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.style.display = 'none'; m.classList.remove('open'); }
}
function closeModalOutside(e, id) {
  if (e.target.id === id) closeModal(id);
}

function toggleCollapsible(id) {
  const el = document.getElementById(id);
  if (el) {
    const isHidden = el.style.display === 'none';
    el.style.display = isHidden ? 'block' : 'none';
    
    const hdr = el.previousElementSibling;
    if (hdr && hdr.classList.contains('collapsible-header')) {
      const icon = hdr.querySelector('svg');
      if (icon) {
        icon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
      }
    }
  }
}

// ── Navegación de páginas (SPA interna) ──
function showPage(pageId, title) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const page = document.getElementById(`page-${pageId}`);
  if (page) page.classList.add('active');
  const nav = document.getElementById(`nav-${pageId}`);
  if (nav) nav.classList.add('active');
  const pt = document.getElementById('page-title');
  if (pt) pt.textContent = title || pageId;
}

// ── Formato ──
function fmt(n) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString('es-CO');
}
function fmtFecha(str) {
  if (!str) return '—';
  // Manejar el formato YYYY-MM-DD de la DB para evitar problemas de zona horaria
  const parts = str.split('T')[0].split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function iconAlerta(tipo) {
  return {
    orden_nueva: '🔧', mantenimiento_proximo: '🔧', mantenimiento_vencido: '🚨',
    documento_30dias: '📄', documento_15dias: '⚠️',
    documento_7dias: '🔴', documento_vencido: '❌'
  }[tipo] || '🔔';
}

// ── Sidebar builder ──
function buildSidebar(items) {
  const nav = document.getElementById('sb-nav');
  if (!nav) return;
  nav.innerHTML = items.map(i => `
    <div class="nav-item" id="nav-${i.id}" onclick="${i.fn}">
      <span class="nav-icon">${i.icon}</span>
      <span class="nav-label">${i.label}</span>
    </div>`).join('');
}

// ── Guardar sesión y redirigir por rol ──
function saveSession(token, usuario) {
  localStorage.setItem('fc_token', token);
  localStorage.setItem('fc_usuario', JSON.stringify(usuario));
  const dest = {
    Administrador: '/pages/admin.html',
    Tecnico:       '/pages/tecnico.html',
    Conductor:     '/pages/conductor.html',
  };
  window.location.href = dest[usuario.rol] || '/pages/admin.html';
}

// ── Check auth guard ──
function requireRole(rol) {
  const u = getUsuario();
  const t = getToken();
  if (!t || !u) { window.location.href = '/pages/login.html'; return null; }
  if (u.rol !== rol) {
    const dest = { Administrador: '/pages/admin.html', Tecnico: '/pages/tecnico.html', Conductor: '/pages/conductor.html' };
    window.location.href = dest[u.rol] || '/pages/login.html';
    return null;
  }
  return u;
}

// ══════════════════════════════════════════════════
// SEARCHABLE SELECT — select con búsqueda integrada
// ══════════════════════════════════════════════════

(function injectSearchableSelectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .ss-wrapper {
      position: relative;
      width: 100%;
    }
    .ss-input {
      width: 100%;
      padding: 10px 36px 10px 14px;
      border: 1.5px solid var(--slate-200);
      border-radius: var(--r8);
      font-size: 14px;
      font-family: inherit;
      color: var(--text);
      background: var(--white);
      cursor: pointer;
      transition: border-color .2s, box-shadow .2s;
      outline: none;
    }
    .ss-input:focus { border-color: var(--blue-500); box-shadow: 0 0 0 3px rgba(45,141,232,.15); }
    .ss-arrow {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      pointer-events: none; color: var(--text-lt); transition: transform .2s;
    }
    .ss-wrapper.open .ss-arrow { transform: translateY(-50%) rotate(180deg); }
    .ss-dropdown {
      display: none;
      position: absolute; top: calc(100% + 4px); left: 0; right: 0;
      background: var(--white);
      border: 1.5px solid var(--slate-200);
      border-radius: var(--r12);
      box-shadow: 0 8px 28px rgba(12,31,61,.14);
      z-index: 9999;
      max-height: 240px;
      overflow-y: auto;
    }
    .ss-wrapper.open .ss-dropdown { display: block; animation: slideDown .18s ease-out; }
    .ss-option {
      padding: 10px 14px;
      font-size: 13.5px;
      color: var(--text);
      cursor: pointer;
      transition: background .15s;
    }
    .ss-option:hover, .ss-option.focused { background: var(--blue-100); color: var(--blue-700); }
    .ss-option.selected { font-weight: 700; color: var(--blue-600); }
    .ss-empty { padding: 12px 14px; font-size: 13px; color: var(--text-lt); text-align: center; }
  `;
  document.head.appendChild(style);
})();

/**
 * Convierte un <select> en un searchable select.
 * @param {string|HTMLElement} selector  — ID del <select> o el elemento
 */
function makeSearchable(selector) {
  const orig = typeof selector === 'string'
    ? document.getElementById(selector)
    : selector;
  if (!orig || orig.dataset.ssInit) return;
  orig.dataset.ssInit = '1';
  orig.style.display = 'none';

  // Wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'ss-wrapper';
  orig.parentNode.insertBefore(wrapper, orig);
  wrapper.appendChild(orig);

  // Input visible
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'ss-input';
  input.placeholder = orig.options[0]?.text || 'Buscar…';
  input.autocomplete = 'off';
  wrapper.insertBefore(input, orig);

  // Flecha
  const arrow = document.createElement('span');
  arrow.className = 'ss-arrow';
  arrow.innerHTML = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>`;
  wrapper.appendChild(arrow);

  // Dropdown
  const dd = document.createElement('div');
  dd.className = 'ss-dropdown';
  wrapper.appendChild(dd);

  // Obtener opciones del select original
  function getOptions() {
    return Array.from(orig.options).map(o => ({ value: o.value, text: o.text }));
  }

  function renderOptions(filter = '') {
    const q = filter.trim().toLowerCase();
    const opts = getOptions().filter(o =>
      !q || o.text.toLowerCase().includes(q)
    );
    if (!opts.length) {
      dd.innerHTML = `<div class="ss-empty">Sin resultados</div>`;
      return;
    }
    dd.innerHTML = opts.map(o =>
      `<div class="ss-option ${o.value === orig.value ? 'selected' : ''}" data-value="${o.value}">${o.text}</div>`
    ).join('');
    dd.querySelectorAll('.ss-option').forEach(el => {
      el.addEventListener('mousedown', e => {
        e.preventDefault();
        selectOption(el.dataset.value, el.textContent);
      });
    });
  }

  function selectOption(value, text) {
    orig.value = value;
    input.value = value ? text : '';
    input.placeholder = orig.options[0]?.text || 'Buscar…';
    close();
    // Disparar evento change en el select original
    orig.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function open() {
    wrapper.classList.add('open');
    renderOptions(input.value);
  }

  function close() {
    wrapper.classList.remove('open');
  }

  // Sincronizar si el select original cambia programáticamente
  function syncFromSelect() {
    const sel = orig.options[orig.selectedIndex];
    input.value = sel && sel.value ? sel.text : '';
  }

  // Observar cambios en el select original (ej: poblar opciones)
  const mo = new MutationObserver(() => {
    syncFromSelect();
    if (wrapper.classList.contains('open')) renderOptions(input.value);
  });
  mo.observe(orig, { childList: true });

  // Eventos
  input.addEventListener('focus', () => open());
  input.addEventListener('input', () => { open(); renderOptions(input.value); });
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') { close(); input.blur(); }
  });
  document.addEventListener('click', e => {
    if (!wrapper.contains(e.target)) close();
  });

  syncFromSelect();
}

/**
 * Aplica makeSearchable a todos los selects de vehículos conocidos.
 * Llámala después de poblar los selects.
 */
function initVehicleSearchables() {
  const ids = [
    'fa-vehiculo',   // filtro alertas
    'rep-vehiculo',  // reportes
    'umb-evaluar-veh', // umbrales
    'planes-veh-sel',  // planes (página)
    'ord-veh',         // modal orden
    'asig-veh',        // modal asignación
    'plan-veh-sel',    // modal plan
  ];
  ids.forEach(id => makeSearchable(id));
}