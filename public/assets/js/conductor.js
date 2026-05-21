/* ═══════════════════════════════════════════════════
   conductor.js — Dashboard Conductor
═══════════════════════════════════════════════════ */

const usuario = requireRole('Conductor');
if (!usuario) throw new Error('stop');

let historialCache = [];
let vehCondCache   = [];

// ── Inicializar ───────────────────────────────────
(function init() {
  const ini = usuario.nombre.charAt(0).toUpperCase();
  document.getElementById('av').textContent      = ini;
  document.getElementById('av2').textContent     = ini;
  document.getElementById('u-name').textContent  = usuario.nombre;
  document.getElementById('u-title').textContent = usuario.nombre;

  cargarVehiculos();
  cargarHistorial();
})();

// ── Navegación ────────────────────────────────────
function showPage(id, title) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`page-${id}`)?.classList.add('active');
  document.getElementById(`nav-${id}`)?.classList.add('active');
  document.getElementById('page-title').textContent = title;
  if (id === 'historial') cargarHistorial();
  if (id === 'vehiculos')  cargarVehiculos();
}

// ══════════════════════════════════════════════════
// VEHÍCULOS
// ══════════════════════════════════════════════════
async function cargarVehiculos() {
  try {
    const res = await api('GET', `/conductores/${usuario.id}/asignaciones`);
    const asignaciones = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);

    // Deduplicar vehículos
    const vistos = new Set();
    vehCondCache = [];
    for (const a of asignaciones) {
      if (a.vehiculo && !vistos.has(a.vehiculo.id)) {
        vistos.add(a.vehiculo.id);
        vehCondCache.push(a.vehiculo);
      }
    }

    document.getElementById('stat-vehs').textContent = vehCondCache.length;

    // Poblar select del formulario unificado
    const sel = document.getElementById('km-vehiculo');
    sel.innerHTML = '<option value="">— Seleccione un vehículo —</option>' +
      vehCondCache.map(v =>
        `<option value="${v.id}" data-km="${v.kmActual}" data-nombre="${v.placa} — ${v.marca} ${v.modelo}">
          ${v.placa} — ${v.marca} ${v.modelo}
        </option>`
      ).join('');

    // Poblar select de historial
    const selH = document.getElementById('hist-vehiculo');
    if (selH) {
      selH.innerHTML = '<option value="">Todos mis vehículos</option>' +
        vehCondCache.map(v =>
          `<option value="${v.id}">${v.placa} — ${v.marca}</option>`
        ).join('');
    }

    renderVehiculosCond(vehCondCache);

    if (typeof _fcConductorBanners === 'function') {
      setTimeout(() => _fcConductorBanners(vehCondCache), 1200);
    }
  } catch (err) {
    toast('Error cargando vehículos: ' + err.message, 'error');
    document.getElementById('stat-vehs').textContent = '0';
  }
}

function renderVehiculosCond(lista) {
  const g = document.getElementById('veh-grid-cond');
  if (!g) return;
  if (!lista.length) {
    g.innerHTML = '<div class="grid-loading">Sin vehículos asignados hoy</div>';
    return;
  }
  g.innerHTML = lista.map(v => {
    const s  = v.estadoSemaforo || 'verde';
    const sl = {
      verde:    '<svg viewBox="0 0 24 24" style="width:11px;height:11px;fill:#22c07a;vertical-align:middle;margin-right:3px"><circle cx="12" cy="12" r="10"/></svg>Operativo',
      amarillo: '<svg viewBox="0 0 24 24" style="width:11px;height:11px;fill:#f0c94a;vertical-align:middle;margin-right:3px"><circle cx="12" cy="12" r="10"/></svg>Revisar',
      rojo:     '<svg viewBox="0 0 24 24" style="width:11px;height:11px;fill:#e84a3a;vertical-align:middle;margin-right:3px"><circle cx="12" cy="12" r="10"/></svg>Urgente'
    }[s] || s;
    return `
    <div class="veh-card ${s}">
      <div class="veh-header">
        <div>
          <div class="veh-placa">${v.placa}</div>
          <div class="veh-marca">${v.marca} ${v.modelo} · ${v.anio}</div>
        </div>
        <span class="veh-sem-badge ${s}">${sl}</span>
      </div>
      <div class="veh-stats">
        <div class="veh-stat-item"><span class="vst-label">Km actual</span><span class="vst-val">${fmt(v.kmActual)} km</span></div>
        <div class="veh-stat-item"><span class="vst-label">Capacidad</span><span class="vst-val">${v.capacidad} pasajeros</span></div>
        <div class="veh-stat-item"><span class="vst-label">N° Motor</span><span class="vst-val" style="font-size:11px">${v.numMotor || '—'}</span></div>
        <div class="veh-stat-item"><span class="vst-label">N° Chasis</span><span class="vst-val" style="font-size:11px">${v.numChasis || '—'}</span></div>
      </div>
      <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--slate-100)">
        <button class="btn-primary btn-sm" style="width:100%" onclick="seleccionarVehiculo(${v.id},'${v.placa} — ${v.marca} ${v.modelo}',${v.kmActual})">
          <svg viewBox="0 0 24 24" style="width:13px;height:13px;stroke:currentColor;stroke-width:2;fill:none;vertical-align:middle;margin-right:4px"><path d="M3 12a9 9 0 1018 0A9 9 0 003 12z"/><path d="M12 8v4l3 3"/></svg>Registrar km aquí
        </button>
      </div>
    </div>`;
  }).join('');
}

function seleccionarVehiculo(id, nombre, kmActual) {
  const sel = document.getElementById('km-vehiculo');
  sel.value = id;
  onVehiculoChange();
  showPage('km', 'Registrar kilómetros');
  toast(`Vehículo seleccionado: ${nombre}`, 'info');
}

// ══════════════════════════════════════════════════
// FORMULARIO UNIFICADO — onVehiculoChange
// ══════════════════════════════════════════════════
function onVehiculoChange() {
  const sel  = document.getElementById('km-vehiculo');
  const card = document.getElementById('km-info-card');

  if (!sel.value) {
    card.style.display = 'none';
    document.getElementById('turno-info-card').style.display = 'none';
    document.getElementById('km-valor').value = '';
    return;
  }

  const opt      = sel.options[sel.selectedIndex];
  const kmActual = +(opt.getAttribute('data-km') || '0');
  const nombre   = opt.getAttribute('data-nombre') || opt.text;

  document.getElementById('km-veh-nombre').textContent = nombre;
  document.getElementById('km-veh-actual').textContent = fmt(kmActual) + ' km';
  card.style.display = 'block';

  const inp = document.getElementById('km-valor');
  inp.min         = kmActual;
  inp.placeholder = `Mín. ${fmt(kmActual)} km`;
  inp.value       = '';

  const momento = document.getElementById('km-momento').value;
  consultarTurnoYKm(sel.value, kmActual, momento);
}

// ── REGLA 4: turno y km encadenado ───────────────
const TURNO_META = {
  manana:         { label: 'Turno Mañana',        hora: '4:00 am – 12:00 pm',   icon: '🌅', css: 'manana'        },
  tarde:          { label: 'Turno Tarde',          hora: '12:00 pm – 7:00 pm',   icon: '☀️', css: 'tarde'         },
  noche:          { label: 'Turno Noche',          hora: '7:00 pm – madrugada',  icon: '🌙', css: 'noche'         },
  completo:       { label: 'Turno Completo',       hora: 'Jornada completa',      icon: '🔄', css: 'completo'      },
  sin_asignacion: { label: 'Sin asignación hoy',   hora: 'Consulta con admin',    icon: '⚠️', css: 'sin_asignacion'},
};

async function consultarTurnoYKm(vehiculoId, kmActualFallback, momento) {
  const inp      = document.getElementById('km-valor');
  const card     = document.getElementById('turno-info-card');
  const iconEl   = document.getElementById('turno-icon');
  const nombreEl = document.getElementById('turno-nombre');
  const horaEl   = document.getElementById('turno-hora');

  try {
    const res        = await api('GET', `/vehiculos/${vehiculoId}/kilometraje/km-inicio`);
    const turno      = res?.turno      ?? res?.data?.turno      ?? 'sin_asignacion';
    const km         = res?.kmSugerido ?? res?.data?.kmSugerido ?? kmActualFallback;
    const encadenado = res?.encadenado ?? res?.data?.encadenado ?? false;
    const meta       = TURNO_META[turno] || TURNO_META['sin_asignacion'];

    iconEl.textContent   = meta.icon;
    nombreEl.textContent = meta.label;
    horaEl.textContent   = meta.hora;
    card.className       = `turno-badge-card ${meta.css}`;
    card.style.display   = 'flex';

    const isSinAsignacion = (turno === 'sin_asignacion');
    inp.disabled = isSinAsignacion;
    document.getElementById('km-momento').disabled = isSinAsignacion;
    const btnSubmit = document.querySelector('#form-km button[type="submit"]');
    if (btnSubmit) {
      btnSubmit.disabled = isSinAsignacion;
    }

    if (isSinAsignacion) {
      toast('No tienes este vehículo asignado para el día de hoy, para esta fecha o para tu turno.', 'error');
    }

    inp.min         = km;
    inp.placeholder = isSinAsignacion ? 'Vehículo no asignado' : `Mín. ${fmt(km)} km`;

    if (momento === 'inicio' && encadenado && !isSinAsignacion) {
      inp.value = km;
      toast(`Km autocompletado: ${fmt(km)} km`, 'info');
    } else {
      inp.value = '';
    }
  } catch {
    card.style.display = 'none';
    inp.min         = kmActualFallback;
    inp.placeholder = `Mín. ${fmt(kmActualFallback)} km`;
    inp.value       = '';
    inp.disabled    = false;
    document.getElementById('km-momento').disabled = false;
    const btnSubmit = document.querySelector('#form-km button[type="submit"]');
    if (btnSubmit) btnSubmit.disabled = false;
  }
}

// Cuando cambia el momento, reconsultar
document.getElementById('km-momento').addEventListener('change', () => {
  const vehiculoId = document.getElementById('km-vehiculo').value;
  if (!vehiculoId) return;
  const opt      = document.getElementById('km-vehiculo').options[document.getElementById('km-vehiculo').selectedIndex];
  const kmActual = +(opt.getAttribute('data-km') || '0');
  const momento  = document.getElementById('km-momento').value;
  document.getElementById('km-valor').value = '';
  consultarTurnoYKm(vehiculoId, kmActual, momento);
});

// ══════════════════════════════════════════════════
// REGISTRAR KM
// ══════════════════════════════════════════════════
document.getElementById('form-km').addEventListener('submit', async (e) => {
  e.preventDefault();
  const vehiculoId = document.getElementById('km-vehiculo').value;
  const momento    = document.getElementById('km-momento').value;
  const kmValor    = +document.getElementById('km-valor').value;

  if (!vehiculoId) { toast('Selecciona un vehículo', 'error'); return; }
  
  if (document.getElementById('km-valor').disabled) {
    toast('No puedes registrar km: no tienes este vehículo asignado hoy o para tu turno.', 'error');
    return;
  }

  if (!kmValor || kmValor <= 0) { toast('Ingresa un valor de km válido', 'error'); return; }

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled    = true;
  btn.textContent = 'Registrando…';

  try {
    await api('POST', `/vehiculos/${vehiculoId}/kilometraje`, { kmValor, momento });

    const rcv = document.getElementById('km-result-val');
    rcv.textContent = `${fmt(kmValor)} km · ${momento === 'inicio' ? 'Inicio de turno' : 'Fin de turno'}`;
    document.getElementById('km-result').classList.add('show');

    toast('Kilometraje registrado correctamente', 'success');
    e.target.reset();
    document.getElementById('km-info-card').style.display  = 'none';
    document.getElementById('turno-info-card').style.display = 'none';

    cargarVehiculos();
    cargarHistorial();

    setTimeout(() => document.getElementById('km-result').classList.remove('show'), 4000);
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Registrar kilómetros';
  }
});

// ══════════════════════════════════════════════════
// HISTORIAL
// ══════════════════════════════════════════════════
async function cargarHistorial() {
  const tb = document.getElementById('tb-hist');
  if (tb) tb.innerHTML = '<tr><td colspan="4" class="td-loading">Cargando historial…</td></tr>';

  try {
    if (!vehCondCache.length) {
      const res2 = await api('GET', `/conductores/${usuario.id}/asignaciones`);
      const asigs = Array.isArray(res2) ? res2 : (Array.isArray(res2?.data) ? res2.data : []);
      const vistos = new Set();
      for (const a of asigs) {
        if (a.vehiculo && !vistos.has(a.vehiculo.id)) {
          vistos.add(a.vehiculo.id);
          vehCondCache.push(a.vehiculo);
        }
      }
    }

    if (!vehCondCache.length) {
      if (tb) tb.innerHTML = '<tr><td colspan="4" class="td-loading">No tienes vehículos asignados</td></tr>';
      return;
    }

    const resultados = await Promise.allSettled(
      vehCondCache.map(v =>
        api('GET', `/vehiculos/${v.id}/kilometraje`)
          .then(res => {
            const items = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
            return items.map(r => ({ ...r, vehPlaca: v.placa, vehMarca: v.marca, _vehId: v.id }));
          })
      )
    );

    let todos = [];
    resultados.forEach(r => { if (r.status === 'fulfilled') todos = [...todos, ...r.value]; });
    todos.sort((a, b) => new Date(b.registradoEn) - new Date(a.registradoEn));
    historialCache = todos;

    actualizarStatsHoy();
    renderHistorial(historialCache);
  } catch (err) {
    if (tb) tb.innerHTML = `<tr><td colspan="4" class="td-loading" style="color:var(--red)">Error: ${err.message}</td></tr>`;
  }
}

function actualizarStatsHoy() {
  const ahora = new Date();
  const hoy   = `${ahora.getFullYear()}-${String(ahora.getMonth()+1).padStart(2,'0')}-${String(ahora.getDate()).padStart(2,'0')}`;

  const deHoy = historialCache.filter(r => {
    if (!r.registradoEn) return false;
    const d = new Date(r.registradoEn);
    const s = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return s === hoy;
  });

  document.getElementById('stat-hoy').textContent = deHoy.length;

  let kmHoy = 0;
  const porVehiculo = {};
  deHoy.forEach(r => {
    const vid = r.vehiculo?.id ?? r._vehId;
    if (!porVehiculo[vid]) porVehiculo[vid] = {};
    porVehiculo[vid][r.momento] = r.kmValor;
  });
  Object.values(porVehiculo).forEach(v => {
    if (v.fin !== undefined && v.inicio !== undefined) kmHoy += v.fin - v.inicio;
  });

  document.getElementById('stat-km').textContent = kmHoy > 0 ? fmt(kmHoy) : (deHoy.length > 0 ? '—' : '0');
}

// ── Paginación historial ──────────────────────────
const HIST_PER_PAGE = 10;
let histPagActual   = 1;
let histListaActual = [];

function renderHistorial(lista) {
  histListaActual = lista;
  histPagActual   = 1;
  _renderHistPag();
}

function _renderHistPag() {
  const tb    = document.getElementById('tb-hist');
  const total = histListaActual.length;
  const pages = Math.max(1, Math.ceil(total / HIST_PER_PAGE));
  histPagActual = Math.min(Math.max(1, histPagActual), pages);

  if (!tb) return;
  if (!total) {
    tb.innerHTML = '<tr><td colspan="4" class="td-loading">Sin registros de kilometraje</td></tr>';
    _renderPagCond(0, 1, 0);
    return;
  }

  const desde  = (histPagActual - 1) * HIST_PER_PAGE;
  const pagina = histListaActual.slice(desde, desde + HIST_PER_PAGE);

  tb.innerHTML = pagina.map(r => `
    <tr>
      <td data-label="Fecha y hora">${fmtFechaHora(r.registradoEn)}</td>
      <td data-label="Vehículo"><strong>${r.vehPlaca || '—'}</strong><br><span style="font-size:11px;color:var(--text-lt)">${r.vehMarca || ''}</span></td>
      <td data-label="Momento">
        <span style="display:inline-flex;align-items:center;gap:6px">
          ${r.momento === 'inicio'
            ? '<svg viewBox="0 0 24 24" style="width:13px;height:13px;stroke:#f0c94a;stroke-width:2;fill:none"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
            : '<svg viewBox="0 0 24 24" style="width:13px;height:13px;stroke:#6366f1;stroke-width:2;fill:none"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/></svg>'
          }
          <span class="badge-estado ${r.momento === 'inicio' ? 'abierta' : 'cerrada'}">${r.momento === 'inicio' ? 'Inicio' : 'Fin'}</span>
        </span>
      </td>
      <td data-label="Km registrado"><strong>${fmt(r.kmValor)} km</strong></td>
    </tr>`).join('');

  _renderPagCond(total, pages, histPagActual);
}

function _renderPagCond(total, pages, current) {
  let cont = document.getElementById('c-hist-pagination');
  if (!cont) {
    const sc = document.querySelector('.c-section-card');
    if (!sc) return;
    cont = document.createElement('div');
    cont.id        = 'c-hist-pagination';
    cont.className = 'c-pagination';
    sc.appendChild(cont);
  }
  if (pages <= 1) { cont.innerHTML = ''; return; }

  const desde = (current - 1) * HIST_PER_PAGE + 1;
  const hasta = Math.min(current * HIST_PER_PAGE, total);

  const nums = _pagNums(current, pages);
  const btns = nums.map(n => {
    if (n === '…') return `<span class="c-pag-dots">…</span>`;
    return `<button class="c-pag-btn${n === current ? ' active' : ''}"
      onclick="histPagActual=${n};_renderHistPag()">${n}</button>`;
  }).join('');

  cont.innerHTML = `
    <div class="c-pag-inner">
      <button class="c-pag-btn" onclick="histPagActual--;_renderHistPag()" ${current===1?'disabled':''}>‹</button>
      ${btns}
      <button class="c-pag-btn" onclick="histPagActual++;_renderHistPag()" ${current===pages?'disabled':''}>›</button>
      <span class="c-pag-info">${desde}–${hasta} de ${total}</span>
    </div>`;
}

function _pagNums(cur, total) {
  if (total <= 7) return Array.from({length:total},(_,i)=>i+1);
  const s = new Set([1, total, cur, cur-1, cur+1].filter(n=>n>=1&&n<=total));
  const arr = [...s].sort((a,b)=>a-b);
  const res = [];
  arr.forEach((n,i) => {
    if (i && n - arr[i-1] > 1) res.push('…');
    res.push(n);
  });
  return res;
}

function filtrarHistorial() {
  const q     = document.getElementById('search-hist').value.toLowerCase();
  const vehId = document.getElementById('hist-vehiculo').value;
  let lista   = historialCache;
  if (vehId) lista = lista.filter(r => String(r.vehiculo?.id ?? r._vehId) === vehId);
  if (q)     lista = lista.filter(r =>
    (r.vehPlaca || '').toLowerCase().includes(q) ||
    fmtFechaHora(r.registradoEn).toLowerCase().includes(q));
  renderHistorial(lista);
}

// ── Utils ─────────────────────────────────────────
function fmtFechaHora(str) {
  if (!str) return '—';
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}