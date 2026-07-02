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

function showPage(id, title) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`page-${id}`)?.classList.add('active');
  document.getElementById(`nav-${id}`)?.classList.add('active');
  
  // Sincronizar navegación móvil inferior
  document.querySelectorAll('.c-bottom-nav .c-bn-item').forEach(b => b.classList.remove('active'));
  document.getElementById(`bn-${id}`)?.classList.add('active');

  document.getElementById('page-title').textContent = title;
  if (id === 'historial') cargarHistorial();
  if (id === 'vehiculos') cargarVehiculos();
  if (id === 'alertas') cargarAlertasFull();
  if (id === 'novedades') setTimeout(initNovedadesPage, 100);
}

// ══════════════════════════════════════════════════
// VEHÍCULOS
// ══════════════════════════════════════════════════
async function cargarVehiculos() {
  try {
    const res = await api('GET', `/conductores/${usuario.id}/asignaciones`);
    const asignaciones = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);

    // Guardar asignaciones completas (con turno) para uso posterior
    // y deduplicar vehículos para la grilla
    const vistos = new Set();
    vehCondCache = [];
    // asignCache: mapa vehiculoId -> asignacion (para acceder al turno)
    window._asignHoyMap = {};
    for (const a of asignaciones) {
      if (a.vehiculo) {
        window._asignHoyMap[a.vehiculo.id] = a; // turno disponible en a.turno
        if (!vistos.has(a.vehiculo.id)) {
          vistos.add(a.vehiculo.id);
          vehCondCache.push(a.vehiculo);
        }
      }
    }

    document.getElementById('stat-vehs').textContent = vehCondCache.length;
    document.getElementById('stat-vehs-sub').textContent = vehCondCache.length > 0 ? 'Listos para conducir' : 'Sin asignaciones hoy';

    // Poblar select: muestra placa + turno del día
    const sel = document.getElementById('km-vehiculo');
    sel.innerHTML = '<option value="">— Seleccione un vehículo —</option>' +
      vehCondCache.map(v => {
        const asig   = window._asignHoyMap[v.id];
        const turno  = asig?.turno ?? '';
        const meta   = TURNO_META[turno];
        const label  = meta ? ` (${meta.label})` : '';
        const nombre = `${v.placa} — ${v.marca} ${v.modelo}`;
        return `<option value="${v.id}" data-km="${v.kmActual}" data-nombre="${nombre}" data-turno="${turno}">
          ${nombre}${label}
        </option>`;
      }).join('');

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

  // Mostrar badge de turno inmediatamente con los datos ya cargados
  const turnoLocal = opt.getAttribute('data-turno') || 'sin_asignacion';
  mostrarTurnoBadge(turnoLocal);

  const momento = document.getElementById('km-momento').value;
  consultarTurnoYKm(sel.value, kmActual, momento);
}

// ── Badge de turno desde datos locales (sin llamada API) ──────────────────
function mostrarTurnoBadge(turno) {
  const meta    = TURNO_META[turno] || TURNO_META['sin_asignacion'];
  const card    = document.getElementById('turno-info-card');
  const iconEl  = document.getElementById('turno-icon');
  const nomEl   = document.getElementById('turno-nombre');
  const horaEl  = document.getElementById('turno-hora');
  iconEl.textContent  = meta.icon;
  nomEl.textContent   = meta.label;
  horaEl.textContent  = meta.hora;
  card.className      = `turno-badge-card ${meta.css}`;
  card.style.display  = 'flex';
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
    const res = await api('GET', `/conductores/${usuario.id}/kilometraje`);
    const registros = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
    
    historialCache = registros.map(r => ({
      ...r,
      vehPlaca: r.vehPlaca ?? r.vehiculo?.placa ?? '—',
      vehMarca: r.vehMarca ?? r.vehiculo?.marca ?? '',
      _vehId: r.vehiculo?.id
    }));

    historialCache.sort((a, b) => new Date(b.registradoEn) - new Date(a.registradoEn));

    actualizarStatsHoy();
    renderHistorial(historialCache);
    renderHistorialMobile(historialCache);
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

  const sortedDeHoy = [...deHoy].sort((a, b) => new Date(a.registradoEn) - new Date(b.registradoEn));
  const ultimoMomento = sortedDeHoy[sortedDeHoy.length - 1]?.momento;
  const subHoy = ultimoMomento === 'inicio' ? 'Turno en progreso' : (ultimoMomento === 'fin' ? 'Turno finalizado' : 'Inicia tu turno');
  document.getElementById('stat-hoy-sub').textContent = subHoy;

  let kmHoy = 0;
  const vehMap = {};
  deHoy.forEach(r => {
    const vid = r.vehiculo?.id ?? r._vehId;
    if (vid) {
      if (!vehMap[vid]) vehMap[vid] = [];
      vehMap[vid].push(r);
    }
  });

  Object.values(vehMap).forEach(regs => {
    regs.sort((a, b) => new Date(a.registradoEn) - new Date(b.registradoEn));
    for (let i = 0; i < regs.length; i++) {
      if (regs[i].momento === 'inicio') {
        for (let j = i + 1; j < regs.length; j++) {
          if (regs[j].momento === 'fin') {
            const diff = regs[j].kmValor - regs[i].kmValor;
            if (diff > 0) {
              kmHoy += diff;
            }
            i = j;
            break;
          }
        }
      }
    }
  });

  document.getElementById('stat-km').textContent = kmHoy > 0 ? fmt(kmHoy) : (deHoy.length > 0 ? '—' : '0');
  const subKm = kmHoy > 0 ? 'Diferencia registrada' : (ultimoMomento === 'inicio' ? 'Registra fin al terminar' : 'Inicia tu turno');
  document.getElementById('stat-km-sub').textContent = subKm;
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

// ══════════════════════════════════════════════════
// ALERTAS (Asignaciones y Turnos)
// ══════════════════════════════════════════════════
let alertasCondCache = [];
let alertasCondListaActual = [];
let alertasCondPagActual = 1;
const ALERTAS_COND_PER_PAGE = 10;

async function cargarAlertasFull() {
  const c = document.getElementById('alertas-full');
  if (!c) return;
  c.innerHTML = '<div class="td-loading">Cargando alertas…</div>';
  document.getElementById('c-alertas-pagination').innerHTML = '';

  try {
    const res = await api('GET', `/conductores/${usuario.id}/asignaciones/todas`);
    const asignaciones = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);

    let alertas = [];
    asignaciones.forEach(a => {
      const v = a.vehiculo || {};
      const t = a.turno || 'sin_asignacion';
      const metaT = TURNO_META[t] || TURNO_META['sin_asignacion'];
      
      alertas.push({
        id: a.id || Math.random(),
        tipoAlerta: 'asignacion',
        mensaje: `Se te ha asignado el vehículo ${v.placa || 'N/D'} para el turno: ${metaT.label}`,
        placa: v.placa,
        generadaEn: a.createdAt || a.fechaInicio || new Date().toISOString(),
        turno: metaT.label,
        vehiculoId: v.id
      });
    });

    alertas.sort((a, b) => new Date(b.generadaEn) - new Date(a.generadaEn));
    alertasCondCache = alertas;
    
    // Reset filters
    document.getElementById('search-alertas-cond').value = '';
    document.getElementById('fecha-alertas-cond').value = '';

    renderAlertasCond(alertasCondCache);
  } catch (err) {
    c.innerHTML = `<div class="td-loading" style="color:var(--red)">Error: ${err.message}</div>`;
  }
}

function filtrarAlertasCond() {
  const q = document.getElementById('search-alertas-cond').value.toLowerCase();
  const fecha = document.getElementById('fecha-alertas-cond').value;
  
  let lista = alertasCondCache;
  
  if (q) {
    lista = lista.filter(a => 
      (a.placa || '').toLowerCase().includes(q) || 
      (a.turno || '').toLowerCase().includes(q)
    );
  }
  
  if (fecha) {
    lista = lista.filter(a => {
      if (!a.generadaEn) return false;
      const d = new Date(a.generadaEn);
      const s = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      return s === fecha;
    });
  }
  
  renderAlertasCond(lista);
}

function renderAlertasCond(lista) {
  alertasCondListaActual = lista;
  alertasCondPagActual = 1;
  _renderAlertasCondPag();
}

function _renderAlertasCondPag() {
  const c = document.getElementById('alertas-full');
  const pag = document.getElementById('c-alertas-pagination');
  if (!c) return;

  const total = alertasCondListaActual.length;
  if (!total) {
    c.innerHTML = `
      <div style="text-align:center; padding:48px 20px; color:#888; font-size:14px;">
        <div style="font-size:48px; margin-bottom:12px; color:var(--slate-300)"><svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none"><path d="M5 13l4 4L19 7"/></svg></div>
        <div style="font-weight:700; color:var(--navy); font-size:16px; margin-bottom:4px;">Sin alertas</div>
        No hay alertas que coincidan con la búsqueda.
      </div>`;
    pag.innerHTML = '';
    return;
  }

  const pages = Math.max(1, Math.ceil(total / ALERTAS_COND_PER_PAGE));
  alertasCondPagActual = Math.min(Math.max(1, alertasCondPagActual), pages);

  const desde = (alertasCondPagActual - 1) * ALERTAS_COND_PER_PAGE;
  const pagina = alertasCondListaActual.slice(desde, desde + ALERTAS_COND_PER_PAGE);

  c.innerHTML = `<div class="ai-feed-list">${pagina.map(a => _renderAlertaFeedCond(a)).join('')}</div>`;

  if (pages <= 1) {
    pag.innerHTML = '';
    return;
  }

  const nums = _pagNums(alertasCondPagActual, pages);
  const btns = nums.map(n => {
    if (n === '…') return `<span class="c-pag-dots">…</span>`;
    return `<button class="c-pag-btn${n === alertasCondPagActual ? ' active' : ''}"
      onclick="alertasCondPagActual=${n};_renderAlertasCondPag()">${n}</button>`;
  }).join('');

  const hasta = Math.min(alertasCondPagActual * ALERTAS_COND_PER_PAGE, total);
  
  pag.innerHTML = `
    <div class="c-pagination" style="border-top: 1px solid var(--slate-100); padding: 14px 20px;">
      <div class="c-pag-inner">
        <button class="c-pag-btn" onclick="alertasCondPagActual--;_renderAlertasCondPag()" ${alertasCondPagActual===1?'disabled':''}>‹</button>
        ${btns}
        <button class="c-pag-btn" onclick="alertasCondPagActual++;_renderAlertasCondPag()" ${alertasCondPagActual===pages?'disabled':''}>›</button>
        <span class="c-pag-info">${desde + 1}–${hasta} de ${total}</span>
      </div>
    </div>`;
}

function _renderAlertaFeedCond(a) {
  return `
  <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--slate-100); cursor: pointer; transition: background 0.2s; background: #fff;" onmouseover="this.style.background='var(--slate-50)'" onmouseout="this.style.background='#fff'" onclick="if(document.querySelector('.c-bn-item')) { cbnNav('km', 'Registrar kilómetros', document.getElementById('bn-km')); } else { showPage('km', 'Registrar kilómetros'); }">
    <div style="display: flex; align-items: center; gap: 16px;">
      <div style="color: #1a56db; background: #e8f0fe; font-size: 18px; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;">
        <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
           <path d="M5 17H3a2 2 0 01-2-2V7a2 2 0 012-2h13l4 4v6a2 2 0 01-2 2h-2" />
           <circle cx="8.5" cy="17.5" r="2.5" />
           <circle cx="17.5" cy="17.5" r="2.5" />
        </svg>
      </div>
      <div>
        <div style="font-weight: 600; font-size: 15px; color: var(--navy); line-height: 1.3;">${a.mensaje}</div>
        <div style="font-size: 13px; color: var(--text-lt); margin-top: 4px; display: flex; gap: 8px; align-items: center;">
          <span>${a.placa || 'N/D'}</span>
          <span style="color: var(--slate-300)">•</span>
          <span>${fmtFechaHora(a.generadaEn)}</span>
        </div>
      </div>
    </div>
    <div style="text-align: right; flex-shrink: 0;">
      <span style="font-size: 11px; font-weight: 700; color: #1a56db; background: #e8f0fe; padding: 5px 12px; border-radius: 99px; white-space: nowrap;">Asignación</span>
    </div>
  </div>`;
}

// ══════════════════════════════════════════════════════════════════════════════
// MÓDULO NOVEDADES — Conductor
// Integrado directamente en conductor.js siguiendo el mismo patrón del módulo
// de kilometraje y alertas ya existentes.
// ══════════════════════════════════════════════════════════════════════════════

let _misNovedadesCache = [];

// showPage ya maneja 'novedades' directamente en su definición original arriba.

// ── Inicializar sección novedades ──────────────────────────────────────────────
function initNovedadesPage() {
  // Ocultar resultado anterior si quedó visible
  const res = document.getElementById('nov-result');
  if (res) res.style.display = 'none';
  // Limpiar el formulario
  const form = document.getElementById('form-novedad');
  if (form) form.reset();
  const cc = document.getElementById('nov-char-count');
  if (cc) cc.textContent = '0';
  // Cargar historial
  cargarMisNovedades();
  // Cargar tarjeta del vehículo asignado
  if (!vehCondCache.length) {
    cargarVehiculos().then(cargarVehiculoAsignadoNovedad);
  } else {
    cargarVehiculoAsignadoNovedad();
  }
}

// ── Tarjeta "Bus asignado" ───────────────────────────────────────────────────
function cargarVehiculoAsignadoNovedad() {
  const card = document.getElementById('nov-veh-card');
  if (!card) return;

  if (!vehCondCache.length) {
    card.style.display = 'none';
    return;
  }

  const v = vehCondCache[0];

  document.getElementById('nov-veh-placa').textContent  = v.placa ?? '—';

  const partes = [v.marca, v.modelo].filter(Boolean).join(' ');
  document.getElementById('nov-veh-modelo').textContent =
    partes + (v.anio ? ` - ${v.anio}` : '');

  const badge = document.getElementById('nov-veh-badge');
  if (v.activo === false) {
    badge.textContent = 'Inactivo';
    badge.classList.add('inactivo');
  } else {
    badge.textContent = 'Activo';
    badge.classList.remove('inactivo');
  }

  card.style.display = 'flex';
}

// ── Cancelar reporte ────────────────────────────────────────────────────────
function cancelarNovedad() {
  const form = document.getElementById('form-novedad');
  if (form) form.reset();
  const cc = document.getElementById('nov-char-count');
  if (cc) cc.textContent = '0';
  const res = document.getElementById('nov-result');
  if (res) res.style.display = 'none';
  showPage('km', 'Registrar kilómetros');
}

// ── Contador de caracteres ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  const ta = document.getElementById('nov-descripcion');
  const cc = document.getElementById('nov-char-count');
  if (ta && cc) {
    ta.addEventListener('input', () => { cc.textContent = ta.value.length; });
  }

  // Registrar submit del formulario de novedades
  const form = document.getElementById('form-novedad');
  if (form) form.addEventListener('submit', onSubmitNovedad);
});

// ── Enviar novedad ─────────────────────────────────────────────────────────────
async function onSubmitNovedad(e) {
  e.preventDefault();

  const btn  = document.querySelector('#form-novedad button[type="submit"]');
  const tipo = document.getElementById('nov-tipo')?.value ?? '';
  const desc = (document.getElementById('nov-descripcion')?.value ?? '').trim();

  if (!tipo || !desc) {
    toast('Completa todos los campos antes de enviar', 'error');
    return;
  }

  const origHTML = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = 'Enviando…';

  try {
    const res  = await api('POST', '/novedades', { tipoNovedad: tipo, descripcion: desc });
    const data = res?.data ?? res;

    // Mostrar tarjeta de resultado exitoso
    const novResult = document.getElementById('nov-result');
    if (novResult) {
      document.getElementById('nov-result-tipo').textContent  = data.tipoNovedad ?? tipo;
      document.getElementById('nov-result-placa').textContent = data.vehiculo?.placa ?? '—';
      document.getElementById('nov-result-fecha').textContent =
        data.fechaReporte ? new Date(data.fechaReporte).toLocaleString('es-CO') : '';
      novResult.style.display = 'block';
    }

    // Limpiar formulario
    document.getElementById('form-novedad').reset();
    const cc = document.getElementById('nov-char-count');
    if (cc) cc.textContent = '0';

    toast('Novedad reportada correctamente', 'success');
    cargarMisNovedades();

    // Ocultar resultado después de 6 segundos
    setTimeout(() => {
      const r = document.getElementById('nov-result');
      if (r) r.style.display = 'none';
    }, 6000);

  } catch (err) {
    // Mostrar mensaje de error amigable
    const msg = err?.message ?? 'Error al reportar la novedad';
    if (msg.toLowerCase().includes('asignado') || msg.toLowerCase().includes('asignaci')) {
      toast('No tienes vehículos asignados para hoy. Contacta al administrador.', 'error');
    } else {
      toast(msg, 'error');
    }
  } finally {
    btn.disabled  = false;
    btn.innerHTML = origHTML;
  }
}

// ── Cargar historial de novedades del conductor ────────────────────────────────
async function cargarMisNovedades() {
  const tbody = document.getElementById('tb-novedades');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" class="td-loading">Cargando…</td></tr>';

  try {
    const res = await api('GET', '/novedades/mias');
    _misNovedadesCache = res?.data ?? res ?? [];
    // Resetear filtros visuales sin perder valores
    filtrarMisNovedades();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="td-loading" style="color:var(--red)">Error: ${err.message}</td></tr>`;
  }
}

// ── Filtrar novedades en cliente ───────────────────────────────────────────────
function filtrarMisNovedades() {
  const q      = (document.getElementById('search-nov')?.value ?? '').toLowerCase();
  const estado = document.getElementById('filtro-nov-estado')?.value ?? '';

  const filtrado = _misNovedadesCache.filter(n =>
    (!estado || n.estado === estado) &&
    (!q ||
      (n.tipoNovedad ?? '').toLowerCase().includes(q) ||
      (n.vehiculo?.placa ?? '').toLowerCase().includes(q) ||
      (n.descripcion ?? '').toLowerCase().includes(q))
  );
  renderMisNovedades(filtrado);
}

// ── Render tabla de novedades ──────────────────────────────────────────────────
function renderMisNovedades(lista) {
  const tbody = document.getElementById('tb-novedades');
  if (!tbody) return;

  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="td-loading">Sin novedades registradas</td></tr>';
    return;
  }

  // Estilos de badge por estado — inline para no depender de CSS externo
  const badgeStyle = {
    Pendiente: 'background:#fef3c7;color:#92400e;border:1px solid #fbbf24',
    Aprobada:  'background:#dcfce7;color:#166534;border:1px solid #4ade80',
    Rechazada: 'background:#fee2e2;color:#991b1b;border:1px solid #f87171',
  };

  tbody.innerHTML = lista.map(n => {
    const bs  = badgeStyle[n.estado] ?? '';
    const ot  = n.ordenTrabajo
      ? `<span style="background:#dbeafe;color:#1d4ed8;border:1px solid #93c5fd;padding:2px 8px;border-radius:20px;font-size:12px;font-weight:700">OT #${n.ordenTrabajo.id}</span>`
      : '<span style="color:var(--text-lt)">—</span>';
    const fecha = n.fechaReporte
      ? new Date(n.fechaReporte).toLocaleString('es-CO', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
      : '—';

    return `<tr>
      <td data-label="Fecha">${fecha}</td>
      <td data-label="Vehículo"><strong>${n.vehiculo?.placa ?? '—'}</strong></td>
      <td data-label="Tipo">${n.tipoNovedad}</td>
      <td data-label="Estado"><span style="${bs};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;display:inline-block">${n.estado}</span></td>
      <td data-label="OT generada">${ot}</td>
    </tr>`;
  }).join('');
}

// ── Utilidad: fmt ─────────────────────────────────────────────────────────────
// fmt ya está definida en conductor.js original, pero si por alguna razón
// este módulo se carga antes, definimos una versión de respaldo:
if (typeof fmt === 'undefined') {
  window.fmt = n => (n ?? 0).toLocaleString('es-CO');
}
// ══════════════════════════════════════════════════
//  HISTORIAL MÓVIL — cards agrupadas por fecha
// ══════════════════════════════════════════════════
let histFiltroActivo   = 'todos';
let histFechaPickerVal = null;

function setFiltroHist(filtro, btn) {
  histFiltroActivo   = filtro;
  histFechaPickerVal = null;
  document.querySelectorAll('.hist-pill').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  _aplicarFiltroMobile();
}

function abrirFiltroFecha() {
  document.getElementById('hist-fecha-picker')?.click();
}

function setFiltroFechaPicker(val) {
  histFechaPickerVal = val;
  histFiltroActivo   = 'fecha';
  document.querySelectorAll('.hist-pill').forEach(b => b.classList.remove('active'));
  _aplicarFiltroMobile();
}

function filtrarHistorialMobile() {
  _aplicarFiltroMobile();
}

function _aplicarFiltroMobile() {
  const q     = (document.getElementById('search-hist-mobile')?.value ?? '').toLowerCase();
  const ahora = new Date();

  let lista = historialCache.filter(r => {
    if (!r.registradoEn) return false;
    const d = new Date(r.registradoEn);
    if (histFiltroActivo === 'hoy')
      return d.toDateString() === ahora.toDateString();
    if (histFiltroActivo === 'semana') {
      const lunes = new Date(ahora);
      lunes.setDate(ahora.getDate() - ((ahora.getDay() + 6) % 7));
      lunes.setHours(0, 0, 0, 0);
      return d >= lunes;
    }
    if (histFiltroActivo === 'mes')
      return d.getMonth() === ahora.getMonth() && d.getFullYear() === ahora.getFullYear();
    if (histFiltroActivo === 'fecha' && histFechaPickerVal) {
      const [y, m, dd] = histFechaPickerVal.split('-');
      return d.getFullYear() === +y && d.getMonth() + 1 === +m && d.getDate() === +dd;
    }
    return true;
  });

  if (q) lista = lista.filter(r =>
    (r.vehPlaca || '').toLowerCase().includes(q) ||
    fmtFechaHora(r.registradoEn).toLowerCase().includes(q));

  renderHistorialMobile(lista);
}

function _agruparEnTurnos(lista) {
  const porVeh = {};
  lista.forEach(r => {
    const vid = String(r._vehId ?? r.vehiculo?.id ?? r.vehPlaca);
    (porVeh[vid] = porVeh[vid] ?? []).push({ ...r });
  });

  const turnos = [];
  Object.values(porVeh).forEach(regs => {
    regs.sort((a, b) => new Date(a.registradoEn) - new Date(b.registradoEn));
    let i = 0;
    while (i < regs.length) {
      if (regs[i].momento === 'inicio') {
        const inicio = regs[i];
        let fin = null;
        // Buscar el fin más cercano posterior al inicio, sin restricción de día
        for (let j = i + 1; j < regs.length; j++) {
          if (regs[j].momento === 'fin' &&
              new Date(regs[j].registradoEn) > new Date(inicio.registradoEn)) {
            fin = regs.splice(j, 1)[0];
            break;
          }
        }
        turnos.push({ inicio, fin, vehPlaca: inicio.vehPlaca, vehMarca: inicio.vehMarca });
      } else {
        // Fin huérfano (sin inicio) — no mostrar
        // regs[i] es un fin que no pudo emparejarse, se descarta
      }
      i++;
    }
  });

  return turnos.sort((a, b) =>
    new Date((b.inicio ?? b.fin).registradoEn) - new Date((a.inicio ?? a.fin).registradoEn));
}

function renderHistorialMobile(lista) {
  const cont = document.getElementById('hist-cards-container');
  if (!cont) return;

  if (!lista.length) {
    cont.innerHTML = '<div class="hist-loading">Sin registros de kilometraje</div>';
    return;
  }

  const turnos = _agruparEnTurnos([...lista]);

  const porFecha = {};
  turnos.forEach(t => {
    const d = new Date((t.inicio ?? t.fin).registradoEn);
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    (porFecha[k] = porFecha[k] ?? []).push(t);
  });

  cont.innerHTML = Object.keys(porFecha).sort((a, b) => b.localeCompare(a)).map(key => {
    const [y, m, d] = key.split('-');
    const label = new Date(+y, +m - 1, +d).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
    return `
      <div class="hist-fecha-grupo">
        <div class="hist-fecha-hdr">
          <span class="hist-fecha-label">${label}</span>
          <svg viewBox="0 0 24 24" class="hist-fecha-ico"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        ${porFecha[key].map(_buildTurnoCard).join('')}
      </div>`;
  }).join('');
}

function _buildTurnoCard(t) {
  const completo = t.inicio && t.fin;
  const busIcon  = `<svg viewBox="0 0 24 24"><path d="M5 17H3a2 2 0 01-2-2V7a2 2 0 012-2h13l4 4v6a2 2 0 01-2 2h-2"/><circle cx="8.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`;
  const checkIco = `<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
  const fmtH = str => str ? new Date(str).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—';
  const fmtD = str => str ? new Date(str).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const filaInicio = t.inicio ? `
    <div class="hist-turno-fila">
      <div class="hist-turno-momento">
        <div class="hist-momento-dot inicio"></div>
        <div class="hist-momento-info">
          <div class="hist-momento-label">Inicio</div>
          <div class="hist-momento-fecha">${fmtD(t.inicio.registradoEn)}</div>
          <div class="hist-momento-hora">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            ${fmtH(t.inicio.registradoEn)}
          </div>
        </div>
      </div>
      <div class="hist-turno-km">
        <div class="hist-km-label">KM REGISTRADO</div>
        <div class="hist-km-val">${fmt(t.inicio.kmValor)} km</div>
      </div>
    </div>` : '';

  const filaFin = t.fin ? `
    <div class="hist-turno-fila">
      <div class="hist-turno-momento">
        <div class="hist-momento-dot fin"></div>
        <div class="hist-momento-info">
          <div class="hist-momento-label">Fin</div>
          <div class="hist-momento-fecha">${fmtD(t.fin.registradoEn)}</div>
          <div class="hist-momento-hora">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            ${fmtH(t.fin.registradoEn)}
          </div>
        </div>
      </div>
      <div class="hist-turno-km">
        <div class="hist-km-label">KM REGISTRADO</div>
        <div class="hist-km-val">${fmt(t.fin.kmValor)} km</div>
      </div>
    </div>` : `
    <div class="hist-turno-fila">
      <div class="hist-turno-momento">
        <div class="hist-momento-dot fin pendiente"></div>
        <div class="hist-momento-info">
          <div class="hist-momento-label">Fin</div>
          <div class="hist-momento-fecha hist-pendiente-txt">Pendiente de registro</div>
          <div class="hist-momento-hora hist-pendiente-txt">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>—
          </div>
        </div>
      </div>
      <div class="hist-turno-km">
        <div class="hist-km-label">KM REGISTRADO</div>
        <div class="hist-km-val hist-pendiente-txt">—</div>
      </div>
    </div>`;

  return `
    <div class="hist-turno-card">
      <div class="hist-card-header">
        <div class="hist-card-veh-icon">${busIcon}</div>
        <div class="hist-card-veh-info">
          <div class="hist-card-placa">${t.vehPlaca}</div>
          <div class="hist-card-marca">${t.vehMarca}</div>
        </div>
        <span class="hist-status-badge ${completo ? 'completado' : 'en-progreso'}">
          ${completo ? 'Turno completado' : 'En progreso'}
          ${completo ? checkIco : ''}
        </span>
      </div>
      <div class="hist-turno-body">
        <div class="hist-turno-linea-lateral"></div>
        <div class="hist-turno-filas">${filaInicio}${filaFin}</div>
      </div>
      ${completo ? `<div class="hist-card-footer">${checkIco} Registrado correctamente</div>` : ''}
    </div>`;
}