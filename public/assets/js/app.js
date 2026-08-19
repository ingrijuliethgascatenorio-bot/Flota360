const usuario = requireRole('Administrador');
if (!usuario) throw new Error('stop');

// ── Cachés separados ──────────────────────────────
let dashVehCache = [];   // /dashboard → vehiculoId
let vehCache = [];   // /vehiculos  → id
let usrCache = [];
let ordCache = [];
let alertasCache = [];   // todas las alertas cargadas
let reporteCache = [];   // filas del reporte actual
let asigCache = [];
let planesCache = [];    // planes de mantenimiento
let predCache  = [];     // proyecciones

const TURNO_LABEL = { completo: 'Completo', manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };

// ══════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════
(function init() {
  const ini = usuario.nombre.charAt(0).toUpperCase();
  const d = new Date();
  const h = d.getHours();
  // Sidebar elements removed, update topbar and dropdown
  ['av2', 'av3'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = ini;
  });
  ['topbar-name', 'ud-name', 'u-title'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = usuario.nombre;
  });

  document.getElementById('dash-date').textContent = d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
  document.getElementById('greeting').textContent = h < 12 ? 'Buenos días,' : h < 18 ? 'Buenas tardes,' : 'Buenas noches,';
  cargarDashboard();
  cargarVehiculos();
  cargarOrdenes();
  cargarUsuarios();
  cargarInsights();
  fcAdminLoadNotifications(dashVehCache);
  // Mostrar popup de alertas urgentes al ingresar
setTimeout(() => {
  api('GET', '/dashboard').then(res => {
    const vehs = res.data?.vehiculos || [];
    fcMostrarPopupUrgentes(vehs);         // popup enriquecido
    fcAdminLoadNotifications(vehs);       // cargar panel campana
  }).catch(() => {});
}, 1200);
})();

// ══════════════════════════════════════════════════
// NAVEGACIÓN
// ══════════════════════════════════════════════════
function showPage(id, title) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`page-${id}`)?.classList.add('active');
  document.getElementById(`nav-${id}`)?.classList.add('active');
  document.getElementById('page-title').textContent = title;

  if (id === 'alertas') {
    cargarAlertas();
    // Ocultar badges al ver alertas (estilo TikTok/FB)
    const bTopbar = document.getElementById('notif-badge');
    if (bTopbar) bTopbar.style.display = 'none';
  }
  if (id === 'asignaciones') cargarAsignaciones();
  if (id === 'galeria') cargarGaleria();
}

// ── Dropdown Usuario ──
function toggleUserDropdown(e) {
  e.stopPropagation();
  document.getElementById('user-dropdown')?.classList.toggle('show');
}

window.addEventListener('click', () => {
  document.getElementById('user-dropdown')?.classList.remove('show');
});

// ══════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════
async function cargarDashboard() {
  try {
    const res = await api('GET', '/dashboard');
    const d = res.data;
    document.getElementById('cnt-v').textContent = d.resumenSemaforo?.verde ?? 0;
    document.getElementById('cnt-a').textContent = d.resumenSemaforo?.amarillo ?? 0;
    document.getElementById('cnt-r').textContent = d.resumenSemaforo?.rojo ?? 0;
    document.getElementById('cnt-t').textContent = d.totalVehiculos ?? 0;

    const totalAlertas = (d.vehiculos || []).reduce((s, v) => s + (v.alertasActivas || 0), 0);
    const bTopbar = document.getElementById('notif-badge');

    if (totalAlertas > 0) {
      if (bTopbar) { bTopbar.textContent = totalAlertas; bTopbar.style.display = 'block'; }
    } else {
      if (bTopbar) bTopbar.style.display = 'none';
    }

    dashVehCache = d.vehiculos || [];
    // Mostrar urgentes por defecto
    filterSem('rojo');
    // Marcar tab activo
    document.querySelectorAll('.dash-ftab').forEach(b => b.classList.remove('active'));
    const tabRojo = document.getElementById('dash-ftab-rojo');
    if (tabRojo) tabRojo.classList.add('active');

    // Si hay vehículos sin kmPorDia, recalcular predicción en background y refrescar grid
    const sinPrediccion = dashVehCache.filter(v => v.kmPorDia == null);
    if (sinPrediccion.length > 0) {
      Promise.allSettled(
        sinPrediccion.map(v => api('POST', `/prediccion/vehiculos/${v.vehiculoId}/recalcular`))
      ).then(() =>
        api('GET', '/dashboard').then(r => {
          dashVehCache = r.data?.vehiculos || dashVehCache;
          const tabActivo = document.querySelector('.dash-ftab.active');
          const tipo = tabActivo?.id?.replace('dash-ftab-', '') || 'rojo';
          filterSem(tipo);
        }).catch(() => { })
      ).catch(() => { });
    }
  } catch (err) {
    document.getElementById('veh-grid').innerHTML =
      `<div class="grid-loading" style="color:var(--red)">Error: ${err.message}</div>`;
  }
}

async function cargarInsights(periodoParam) {
  // Si no viene periodo, usar el del input o el mes actual
  const inputEl = document.getElementById('ins-periodo');
  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}`;

  // Determinar qué periodo usar
  let periodo = periodoParam || (inputEl?.value) || mesActual;

  // Si se llamó sin argumento (init o botón Hoy), resetear input al mes actual
  if (!periodoParam && inputEl) {
    inputEl.value = mesActual;
    periodo = mesActual;
  }
  // Si viene periodo desde el input onchange, sincronizar
  if (periodoParam && inputEl && periodoParam !== 'init') {
    inputEl.value = periodoParam;
  }

  // Label legible del periodo para los subtítulos
  const [anio, mes] = periodo.split('-');
  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const labelPeriodo = `${MESES[parseInt(mes)-1]} ${anio}`;
  const esMesActual  = periodo === mesActual;
  const labelSub     = esMesActual ? 'Este mes' : labelPeriodo;

  // Mostrar loading
  ['ins-veh','ins-rep','ins-tec'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '…';
  });

  try {
    const res = await api('GET', `/salud-financiera/insights?periodo=${periodo}`);
    // El backend devuelve { data: { vehiculoMasCostoso, ... } }
    const i = res.data ?? res;

    if (i?.vehiculoMasCostoso) {
      document.getElementById('ins-veh').textContent = `${i.vehiculoMasCostoso.placa} · ${i.vehiculoMasCostoso.marca}`;
      const v = i.vehiculoMasCostoso.variacionPct;
      document.getElementById('ins-veh-s').textContent =
        `$${fmt(i.vehiculoMasCostoso.costoTotal)}` +
        (v != null ? ` (${v > 0 ? '+' : ''}${Number(v).toFixed(1)}%)` : '') +
        ` · ${labelSub}`;
    } else {
      document.getElementById('ins-veh').textContent = 'Sin datos';
      document.getElementById('ins-veh-s').textContent = labelSub;
    }

    if (i?.tecnicoMasActivo) {
      document.getElementById('ins-tec').textContent = i.tecnicoMasActivo.nombre;
      document.getElementById('ins-tec-s').textContent = `${i.tecnicoMasActivo.otCerradas} órdenes · ${labelSub}`;
    } else {
      document.getElementById('ins-tec').textContent = 'Sin datos';
      document.getElementById('ins-tec-s').textContent = labelSub;
    }

    if (i?.repuestoMasUsado) {
      document.getElementById('ins-rep').textContent = i.repuestoMasUsado.nombre;
      document.getElementById('ins-rep-s').textContent = `${i.repuestoMasUsado.cantidad} unidades · ${labelSub}`;
    } else {
      document.getElementById('ins-rep').textContent = 'Sin datos';
      document.getElementById('ins-rep-s').textContent = labelSub;
    }
  } catch(e) {
    console.error('[Insights] ERROR:', e.message);
    ['ins-veh','ins-rep','ins-tec'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '—';
    });
  }
}

const _dashPag = { page: 1, pageSize: 10, lista: [] };

function renderGrid(lista) {
  _dashPag.lista = lista;
  _dashPag.page = 1;
  _renderGridPage();
}

function _dashPagGo(page) {
  _dashPag.page = page;
  _renderGridPage();
}

function _renderGridPage() {
  const { page, pageSize, lista } = _dashPag;
  const g = document.getElementById('veh-grid');
  const total = lista.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const slice = lista.slice(start, start + pageSize);

  if (!total) { g.innerHTML = '<div class="grid-loading">Sin vehículos</div>'; _clearDashPagBar(); return; }

  const semLabel = { verde: 'Operativo', amarillo: 'Proximo', rojo: 'Urgente' };
  const rows = slice.map(v => {
    const s = v.estadoSemaforo || 'verde';
    const dias = v.diasEstimados != null
      ? (v.diasEstimados <= 0 ? '<span style="color:var(--red);font-weight:600">Vencido</span>' : '~' + v.diasEstimados + ' dias')
      : '-';
    return '<tr style="cursor:pointer" onclick="abrirDetalleVehiculo(' + v.vehiculoId + ')">' +
      '<td><strong>' + v.placa + '</strong></td>' +
      '<td>' + v.marca + ' ' + v.modelo + ' &middot; ' + v.anio + '</td>' +
      '<td>' + fmt(v.kmActual) + ' km</td>' +
      '<td>' + (v.kmPorDia != null ? Number(v.kmPorDia).toFixed(1) + ' km' : '-') + '</td>' +
      '<td><span class="veh-sem-badge ' + s + '">' + (semLabel[s] || s) + '</span></td>' +
      '<td>' + (v.alertasActivas > 0 ? '<span style="color:var(--red);font-weight:600">' + v.alertasActivas + '</span>' : '0') + '</td>' +
      '<td>' + dias + '</td>' +
      '</tr>';
  }).join('');
  g.innerHTML = '<table class="data-table" style="width:100%"><thead><tr>' +
    '<th>Placa</th><th>Vehiculo</th><th>Km actual</th><th>Km/dia est.</th><th>Estado</th><th>Alertas</th><th>Proximo mant.</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table>';

  // Barra de paginación del dashboard
  const bar = document.getElementById('pag-dash');
  if (!bar) return;
  if (totalPages <= 1) { bar.innerHTML = ''; return; }
  const btn = (label, p, disabled, active) =>
    `<button class="pag-btn${active ? ' active' : ''}${disabled ? ' disabled' : ''}"
      ${disabled ? 'disabled' : `onclick="_dashPagGo(${p})"`}>${label}</button>`;
  const from = start + 1, to = Math.min(start + pageSize, total);
  const range = new Set([1, totalPages, page, page-1, page+1].filter(p => p >= 1 && p <= totalPages));
  const sorted = [...range].sort((a,b) => a-b);
  let pages = ''; let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) pages += `<span class="pag-ellipsis">…</span>`;
    pages += btn(p, p, false, p === page);
    prev = p;
  }
  bar.innerHTML = `<span class="pag-info">${from}–${to} de ${total}</span>
    <div class="pag-controls">${btn('‹', page-1, page===1, false)}${pages}${btn('›', page+1, page===totalPages, false)}</div>`;
}

function _clearDashPagBar() {
  const bar = document.getElementById('pag-dash');
  if (bar) bar.innerHTML = '';
}

function filterSem(tipo) {
  document.querySelectorAll('.dash-ftab').forEach(b => b.classList.remove('active'));
  const tab = document.getElementById('dash-ftab-' + tipo);
  if (tab) tab.classList.add('active');
  renderGrid(dashVehCache.filter(v => v.estadoSemaforo === tipo));
}

// ══════════════════════════════════════════════════
// DETALLE VEHÍCULO
// ══════════════════════════════════════════════════
async function abrirDetalleVehiculo(id) {
  document.getElementById('mdv-title').textContent = 'Cargando…';
  document.getElementById('mdv-body').innerHTML = '<div class="td-loading">Cargando…</div>';
  openModal('m-det-veh');
  try {
    const { data: d } = await api('GET', `/dashboard/vehiculos/${id}`);
    const v = d.vehiculo;
    document.getElementById('mdv-title').textContent = `${v.placa} — ${v.marca} ${v.modelo}`;
    let html = `<div class="detalle-section"><h4>Datos del vehículo</h4>
      <div class="detalle-grid">
        <div class="dg-item"><span class="dg-label">Placa</span><span class="dg-val">${v.placa}</span></div>
        <div class="dg-item"><span class="dg-label">Marca / Modelo</span><span class="dg-val">${v.marca} ${v.modelo}</span></div>
        <div class="dg-item"><span class="dg-label">Año</span><span class="dg-val">${v.anio}</span></div>
        <div class="dg-item"><span class="dg-label">Km actual</span><span class="dg-val">${fmt(v.kmActual)} km</span></div>
        <div class="dg-item"><span class="dg-label">Semáforo</span><span class="dg-val"><span class="veh-sem-badge ${v.estadoSemaforo}">${v.estadoSemaforo}</span></span></div>
        <div class="dg-item"><span class="dg-label">Km/día est.</span><span class="dg-val">${v.kmPorDia ? Number(v.kmPorDia).toFixed(1) : '—'}</span></div>
      </div>
      <div style="margin-top:15px">
        <button id="btn-gestionar-docs" class="btn-primary btn-sm" onclick="abrirGestionDocumentos(${id},'${v.placa}')">Gestionar Documentos Legales</button>
      </div></div>`;
    if (d.alertas?.length)
      html += `<div class="detalle-section"><h4>Alertas activas (${d.alertas.length})</h4>
        <div class="alertas-list-modal">${d.alertas.map(a => `
          <div class="alert-item ${a.tipoAlerta}">
            <span class="alert-icon">${iconAlerta(a.tipoAlerta)}</span>
            <div class="alert-body"><div class="alert-msg">${a.mensaje}</div><div class="alert-meta">${fmtFecha(a.generadaEn)}</div></div>
            <button class="btn-ghost btn-sm" onclick="marcarLeida(${id},${a.id},this)">✓ Leída</button>
          </div>`).join('')}</div></div>`;
    if (d.planes?.length)
      html += `<div class="detalle-section"><h4>Planes de mantenimiento</h4>
        <table class="data-table"><thead><tr><th>Plan</th><th>Ciclo</th><th>Km próximo</th><th>Km restantes</th><th>Fecha próxima</th></tr></thead>
        <tbody>${d.planes.map(p => `<tr>
          <td>${p.nombre}</td><td>${p.tipoCiclo}</td>
          <td>${p.kmProximo ? fmt(p.kmProximo) + ' km' : '—'}</td>
          <td>${p.kmRestantes !== null ? (p.kmRestantes <= 0 ? '<span style="color:var(--red);font-weight:600">¡Vencido!</span>' : fmt(p.kmRestantes) + ' km') : '—'}</td>
          <td>${fmtFecha(p.fechaProxima)}</td></tr>`).join('')}</tbody></table></div>`;
    if (d.documentos?.length)
      html += `<div id="mdv-docs-section"><div class="detalle-section"><h4>Documentos legales</h4>
        <table class="data-table"><thead><tr><th>Tipo</th><th>Vence</th><th>Días restantes</th><th>Estado</th></tr></thead>
        <tbody>${d.documentos.map(doc => `<tr>
          <td>${doc.tipo === 'RevisionTM' ? 'RTM' : doc.tipo}</td><td>${fmtFecha(doc.fechaVencimiento)}</td><td>${doc.diasRestantes}</td>
          <td>${doc.vencido ? '<span style="color:var(--red);font-weight:600"><i class="fa-solid fa-circle-exclamation"></i> Vencido</span>' : doc.diasRestantes <= 7 ? '<span style="color:#c23228;font-weight:600"><i class="fa-solid fa-triangle-exclamation"></i> Urgente</span>' : doc.diasRestantes <= 15 ? '<span style="color:#a07a00;font-weight:600"><i class="fa-solid fa-clock"></i> Por vencer</span>' : '<span style="color:var(--green)"><i class="fa-solid fa-check-circle"></i> Vigente</span>'}</td></tr>`).join('')}</tbody></table></div></div>`;
    else
      html += `<div id="mdv-docs-section"></div>`;
    document.getElementById('mdv-body').innerHTML = html;
  } catch (err) {
    document.getElementById('mdv-body').innerHTML =
      `<div class="td-loading" style="color:var(--red)">Error: ${err.message}</div>`;
  }
}

// ── Gestión de Documentos ─────────────────────────
let docVehiculoId = null;

function abrirGestionDocumentos(id, placa) {
  docVehiculoId = id;

  // Mostrar/ocultar el formulario inline dentro del modal
  let form = document.getElementById('docs-form-inline');
  if (form) {
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
    return;
  }

  // Crear el formulario justo después del botón
  const btn = document.getElementById('btn-gestionar-docs');
  form = document.createElement('div');
  form.id = 'docs-form-inline';
  form.style.cssText = 'margin-top:14px;padding:16px;background:var(--bg);border-radius:var(--r12);border:1px solid var(--border);';
  form.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div class="field-group" style="margin-bottom:0">
        <label>Tipo de documento</label>
        <select id="mdoc-tipo">
          <option value="SOAT">SOAT</option>
          <option value="RevisionTM">Tecnomecánica</option>
        </select>
      </div>
      <div class="field-group" style="margin-bottom:0">
        <label>Fecha de vencimiento</label>
        <input type="date" id="mdoc-fecha"/>
      </div>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn-primary btn-sm" onclick="guardarDocumento()">Guardar documento</button>
      <button class="btn-outline btn-sm" onclick="document.getElementById('docs-form-inline').style.display='none'">Cancelar</button>
    </div>
  `;
  btn.insertAdjacentElement('afterend', form);
}

async function cargarListaDocumentos() {
  try {
    const res = await api('GET', `/vehiculos/${docVehiculoId}/documentos`);
    const docs = Array.isArray(res) ? res : (res.data || []);
    const container = document.getElementById('mdoc-lista');
    if (!container) return;

    if (!docs.length) {
      container.innerHTML = `
        <div class="detalle-section">
          <h4>Documentos actuales</h4>
          <div class="ba-empty">Sin documentos registrados.</div>
        </div>`;
      return;
    }

    container.innerHTML = `
      <div class="detalle-section">
        <h4>Documentos actuales</h4>
        <table class="data-table">
          <thead><tr><th>Tipo</th><th>Vence</th><th>Días restantes</th><th>Estado</th></tr></thead>
          <tbody>
            ${docs.map(d => {
              const partes = d.fechaVencimiento.split('T')[0].split('-');
              const vence = new Date(+partes[0], +partes[1] - 1, +partes[2]);
              const hoyD = new Date();
              const hoy  = new Date(hoyD.getFullYear(), hoyD.getMonth(), hoyD.getDate());
              const diff = Math.round((vence - hoy) / (1000 * 60 * 60 * 24));
              const badge = diff < 0 ? 'rojo' : diff <= 15 ? 'amarillo' : 'verde';
              const label = diff < 0
                ? `Vencido hace ${Math.abs(diff)} día(s)`
                : diff === 0 ? 'Vence hoy'
                : diff <= 30 ? `Vence en ${diff} días`
                : 'Vigente';
              const tipo = d.tipo === 'RevisionTM' ? 'Tecnomecánica' : d.tipo;
              return `<tr>
                <td><strong>${tipo}</strong></td>
                <td>${fmtFecha(d.fechaVencimiento)}</td>
                <td>${diff < 0 ? `<span style="color:var(--red);font-weight:600">${diff}</span>` : diff}</td>
                <td><span class="veh-sem-badge ${badge}">${label}</span></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) {
    const container = document.getElementById('mdoc-lista');
    if (container) container.innerHTML =
      `<p style="color:var(--red);padding:12px">Error: ${err.message}</p>`;
  }
}

async function guardarDocumento() {
  const tipo = document.getElementById('mdoc-tipo').value;
  const fecha = document.getElementById('mdoc-fecha').value;

  if (!fecha) { toast('Selecciona una fecha de vencimiento', 'error'); return; }

  try {
    try {
      await api('POST', `/vehiculos/${docVehiculoId}/documentos`, { tipo, fechaVencimiento: fecha });
    } catch (e) {
      await api('PATCH', `/vehiculos/${docVehiculoId}/documentos/${tipo}`, { fechaVencimiento: fecha });
    }

    toast('Documento guardado ✓', 'success');
    // Limpiar fecha tras guardar
    const fechaEl = document.getElementById('mdoc-fecha');
    if (fechaEl) fechaEl.value = '';
    // Refrescar la tabla de documentos legales dentro del modal
    await refrescarDocsEnModal();

    // Evaluar alertas automáticamente tras actualizar fecha
    try {
      await api('POST', `/vehiculos/${docVehiculoId}/alertas/evaluar`);
    } catch (e) {
      console.warn('Error en evaluación automática:', e);
    }

    cargarDashboard();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// Refresca solo la sección de documentos legales dentro del modal abierto
async function refrescarDocsEnModal() {
  if (!docVehiculoId) return;
  try {
    const res = await api('GET', `/vehiculos/${docVehiculoId}/documentos`);
    const docs = Array.isArray(res) ? res : (res.data || []);
    const sec = document.getElementById('mdv-docs-section');
    if (!sec) return;
    if (!docs.length) { sec.innerHTML = ''; return; }
    sec.innerHTML = `<div class="detalle-section"><h4>Documentos legales</h4>
      <table class="data-table"><thead><tr><th>Tipo</th><th>Vence</th><th>Días restantes</th><th>Estado</th></tr></thead>
      <tbody>${docs.map(doc => {
        const partes = doc.fechaVencimiento.split('T')[0].split('-');
        const vence = new Date(+partes[0], +partes[1]-1, +partes[2]);
        const hoy = new Date(); hoy.setHours(0,0,0,0);
        const diff = Math.round((vence - hoy) / 86400000);
        const estado = doc.vencido
          ? '<span style="color:var(--red);font-weight:600">Vencido</span>'
          : diff <= 7  ? '<span style="color:#c23228;font-weight:600">Urgente</span>'
          : diff <= 15 ? '<span style="color:#a07a00;font-weight:600">Por vencer</span>'
          : '<span style="color:var(--green)">Vigente</span>';
        return `<tr>
          <td>${doc.tipo === 'RevisionTM' ? 'Tecnomecánica' : doc.tipo}</td>
          <td>${fmtFecha(doc.fechaVencimiento)}</td>
          <td>${diff}</td>
          <td>${estado}</td>
        </tr>`;
      }).join('')}</tbody></table></div>`;
  } catch(e) { console.warn('No se pudo refrescar docs:', e); }
}

async function marcarLeida(vehiculoId, alertaId, btn) {
  try {
    await api('PATCH', `/vehiculos/${vehiculoId}/alertas/${alertaId}/leer`);
    btn.closest('.alert-item').classList.add('alert-leida');
    btn.disabled = true;
    toast('Alerta marcada como leída', 'success');
    cargarDashboard();
    // Recargar listado si está abierto en la vista de alertas
    const pageAlertas = document.getElementById('page-alertas');
    if (pageAlertas?.classList.contains('active')) {
      cargarAlertas();
    }
  } catch (err) { toast(err.message, 'error'); }
}

// ══════════════════════════════════════════════════
// VEHÍCULOS + FILTROS
// ══════════════════════════════════════════════════
// PAGINACIÓN — motor genérico
// ══════════════════════════════════════════════════
const _pag = {};  // estado por sección: { page, pageSize, total, lista, renderFn }

function pagInit(sec, lista, renderFn, pageSize = 15) {
  _pag[sec] = { page: 1, pageSize, lista, renderFn };
  pagRender(sec);
}

function pagRender(sec) {
  const s = _pag[sec];
  if (!s) return;
  const total = s.lista.length;
  const totalPages = Math.max(1, Math.ceil(total / s.pageSize));
  if (s.page > totalPages) s.page = totalPages;
  const start = (s.page - 1) * s.pageSize;
  const slice = s.lista.slice(start, start + s.pageSize);
  s.renderFn(slice);
  _renderPagBar(sec, s.page, totalPages, total, start + 1, Math.min(start + s.pageSize, total));
}

function pagGo(sec, page) {
  if (!_pag[sec]) return;
  _pag[sec].page = page;
  pagRender(sec);
}

function _renderPagBar(sec, page, totalPages, total, from, to) {
  const bar = document.getElementById(`pag-${sec}`);
  if (!bar) return;
  if (total === 0) { bar.innerHTML = ''; return; }

  const btn = (label, p, disabled, active) =>
    `<button class="pag-btn${active ? ' active' : ''}${disabled ? ' disabled' : ''}"
      ${disabled ? 'disabled' : `onclick="pagGo('${sec}',${p})"`}>${label}</button>`;

  let pages = '';
  // Siempre mostrar: primera, última, actual ±1, con ... intermedios
  const range = new Set([1, totalPages, page, page - 1, page + 1].filter(p => p >= 1 && p <= totalPages));
  const sorted = [...range].sort((a, b) => a - b);
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) pages += `<span class="pag-ellipsis">…</span>`;
    pages += btn(p, p, false, p === page);
    prev = p;
  }

  bar.innerHTML = `
    <span class="pag-info">${from}–${to} de ${total}</span>
    <div class="pag-controls">
      ${btn('‹', page - 1, page === 1, false)}
      ${pages}
      ${btn('›', page + 1, page === totalPages, false)}
    </div>`;
}

// ══════════════════════════════════════════════════
async function cargarVehiculos() {
  try {
    const res = await api('GET', '/vehiculos');
    vehCache = Array.isArray(res) ? res : (res.data || []);
    aplicarFiltrosVeh();
    poblarSelVehiculos();
    poblarSelVehFiltros();
    // Activar búsqueda en todos los selects de vehículos
    setTimeout(initVehicleSearchables, 0);
  } catch { }
}

function aplicarFiltrosVeh() {
  const q = (document.getElementById('fv-q')?.value || '').toLowerCase();
  const sem = document.getElementById('fv-sem')?.value || '';
  const anioMn = +document.getElementById('fv-anio-min')?.value || 0;
  const anioMx = +document.getElementById('fv-anio-max')?.value || 9999;
  const kmMin = +document.getElementById('fv-km-min')?.value || 0;

  const res = vehCache.filter(v => {
    if (q && !`${v.placa} ${v.marca} ${v.modelo}`.toLowerCase().includes(q)) return false;
    if (sem && v.estadoSemaforo !== sem) return false;
    if (anioMn && v.anio < anioMn) return false;
    if (anioMx < 9999 && v.anio > anioMx) return false;
    if (kmMin && v.kmActual < kmMin) return false;
    return true;
  });

  pagInit('veh', res, renderTablaVehiculos);
  const s = document.getElementById('fv-summary');
  if (s) s.innerHTML = res.length !== vehCache.length
    ? `Mostrando <strong>${res.length}</strong> de ${vehCache.length} vehículos` : '';
}

function limpiarFiltrosVeh() {
  ['fv-q', 'fv-anio-min', 'fv-anio-max', 'fv-km-min'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const sem = document.getElementById('fv-sem'); if (sem) sem.value = '';
  aplicarFiltrosVeh();
}

function renderTablaVehiculos(lista) {
  const tb = document.getElementById('tb-veh');
  if (!tb) return;
  if (!lista.length) { tb.innerHTML = '<tr><td colspan="6" class="td-loading">Sin vehículos con estos filtros</td></tr>'; return; }
  tb.innerHTML = lista.map(v => `<tr>
    <td><strong>${v.placa}</strong></td>
    <td>${v.marca} ${v.modelo}</td>
    <td>${v.anio}</td>
    <td>${fmt(v.kmActual)} km</td>
    <td><span class="veh-sem-badge ${v.estadoSemaforo}">${v.estadoSemaforo}</span></td>
    <td><div class="action-btns">
      <button class="btn-ghost btn-sm" onclick="abrirDetalleVehiculo(${v.id})">Ver</button>
      <button class="btn-primary btn-sm" onclick="abrirDrawerEditarVehiculo(${v.id})">Editar</button>
      <button class="btn-danger btn-sm" onclick="eliminarVehiculo(${v.id})">Eliminar</button>
    </div></td></tr>`).join('');
}

function poblarSelVehiculos() {
  ['ord-veh', 'rep-vehiculo', 'planes-veh-sel', 'plan-veh-sel'].forEach(id => {
    const s = document.getElementById(id);
    if (!s) return;
    const def = (id === 'rep-vehiculo' || id === 'planes-veh-sel') ? '<option value="">Todos los vehículos</option>' : '<option value="">— Seleccione —</option>';
    s.innerHTML = def + vehCache.map(v => `<option value="${v.id}">${v.placa} — ${v.marca} ${v.modelo}</option>`).join('');
  });
}

function poblarSelVehFiltros() {
  const s = document.getElementById('fa-vehiculo');
  if (!s) return;
  s.innerHTML = '<option value="">Todos los vehículos</option>' +
    vehCache.map(v => `<option value="${v.id}">${v.placa}</option>`).join('');
}

document.getElementById('f-vehiculo').addEventListener('submit', async e => {
  e.preventDefault();
  const b = Object.fromEntries(new FormData(e.target));
  
  b.anio = +b.anio; b.kmActual = 0; b.capacidad = +b.capacidad;
  try {
    const res = await api('POST', '/vehiculos', b);
    toast('Vehículo creado exitosamente', 'success');
    closeModal('m-vehiculo'); e.target.reset();
    cargarVehiculos(); cargarDashboard();
  } catch (err) { toast(err.message, 'error'); }
});

async function eliminarVehiculo(id) {
  const _v = vehCache.find(x => x.id === id);
  if (!await fcConfirmEliminar(_v?.placa || 'este vehículo', 'vehículo')) return;
  try {
    await api('DELETE', `/vehiculos/${id}`);
    toast('Vehículo eliminado', 'success');
    cargarVehiculos(); cargarDashboard();
  } catch (err) { toast(err.message, 'error'); }
}

// ══════════════════════════════════════════════════
// ÓRDENES + FILTROS
// ══════════════════════════════════════════════════
async function cargarOrdenes() {
  try {
    const res = await api('GET', '/ordenes');
    ordCache = res.data || res || [];
    aplicarFiltrosOrd();
  } catch { }
}

function aplicarFiltrosOrd() {
  const q = (document.getElementById('fo-q')?.value || '').toLowerCase();
  const estado = document.getElementById('fo-estado')?.value || '';
  const tecnico = document.getElementById('fo-tecnico')?.value || '';
  const desde = document.getElementById('fo-desde')?.value || '';
  const hasta = document.getElementById('fo-hasta')?.value || '';
  const costoMin = +document.getElementById('fo-costo-min')?.value || 0;
  const costoMax = +document.getElementById('fo-costo-max')?.value || Infinity;

  const res = ordCache.filter(o => {
    if (q && !`${o.vehiculo?.placa || ''} ${o.tecnico?.nombre || ''} ${o.id}`.toLowerCase().includes(q)) return false;
    if (estado && o.estado !== estado) return false;
    if (tecnico && String(o.tecnico?.id) !== tecnico) return false;
    if (desde && o.fechaApertura < desde) return false;
    if (hasta && o.fechaApertura > hasta) return false;
    const costo = o.costoTotal || 0;
    if (costoMin && costo < costoMin) return false;
    if (costoMax < Infinity && costo > costoMax) return false;
    return true;
  });

  pagInit('ord', res, renderTablaOrdenes);
  const s = document.getElementById('fo-summary');
  if (s) s.innerHTML = res.length !== ordCache.length
    ? `Mostrando <strong>${res.length}</strong> de ${ordCache.length} órdenes` : '';
}

function limpiarFiltrosOrd() {
  ['fo-q', 'fo-desde', 'fo-hasta', 'fo-costo-min', 'fo-costo-max'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  ['fo-estado', 'fo-tecnico'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  aplicarFiltrosOrd();
}

/**
 * Determina el tipo de plan de una orden.
 * - Si tiene plan asociado → Preventivo (fue generada por un plan de mantenimiento)
 * - Sin plan               → Correctivo (intervención directa)
 * SRP: única responsabilidad — derivar la etiqueta de plan a partir de la orden.
 */
function etiquetaPlan(orden) {
  return orden?.plan?.nombre || (orden?.planId ? 'Preventivo' : 'Correctivo');
}

function renderTablaOrdenes(lista) {
  const tb = document.getElementById('tb-ord');
  if (!tb) return;
  if (!lista.length) { tb.innerHTML = '<tr><td colspan="8" class="td-loading">Sin órdenes con estos filtros</td></tr>'; return; }
  tb.innerHTML = lista.map(o => {
    const est = (o.estado || '').toLowerCase().replace(' ', '-');
    const plan = etiquetaPlan(o);
    const esPrev = plan !== 'Correctivo';
    return `<tr>
      <td>#${o.id}</td>
      <td>${o.vehiculo?.placa || '—'}</td>
      <td>${o.tecnico?.nombre || '—'}</td>
      <td><span class="badge-plan ${esPrev ? 'preventivo' : 'correctivo'}">${plan}</span></td>
      <td>${fmtFecha(o.fechaApertura)}</td>
      <td><span class="badge-estado ${est}">${o.estado}</span></td>
      <td>$${fmt(o.costoTotal || 0)}</td>
      <td><div class="action-btns">
        <button class="btn-ghost btn-sm" onclick="abrirDetalleOrden(${o.id})">Ver</button>
        ${o.estado !== 'Cerrada' && o.estado !== 'Cancelada' ? `<button class="btn-warning btn-sm" onclick="cancelarOrden(${o.id})">Cancelar</button>` : ''}
        <button class="btn-danger btn-sm" onclick="eliminarOrden(${o.id})">Eliminar</button>
      </div></td></tr>`;
  }).join('');
}

async function abrirDetalleOrden(id) {
  document.getElementById('mdo-title').textContent = `Orden #${id}`;
  document.getElementById('mdo-body').innerHTML = '<div class="td-loading">Cargando…</div>';
  openModal('m-det-ord');
  try {
    const res = await api('GET', `/ordenes/${id}`);
    const o = res.data ?? res;

    const est = (o.estado || '').toLowerCase().replace(' ', '-');
    const plan = etiquetaPlan(o);
    const esPrev = plan !== 'Correctivo';
    // FIX NaN: subtotal de PostgreSQL llega como string numeric → parseFloat
    const costoRepuestos = (o.repuestos || []).reduce((s, r) => s + (parseFloat(r.subtotal) || (r.cantidad * r.precioUnitario) || 0), 0);
    let html = `<div class="detalle-section"><h4>Datos de la orden</h4>
      <div class="detalle-grid">
        <div class="dg-item"><span class="dg-label">Vehículo</span><span class="dg-val">${o.vehiculo?.placa || '—'}</span></div>
        <div class="dg-item"><span class="dg-label">Técnico</span><span class="dg-val">${o.tecnico?.nombre || '—'}</span></div>
        <div class="dg-item"><span class="dg-label">Plan</span><span class="dg-val"><span class="badge-plan ${esPrev ? 'preventivo' : 'correctivo'}">${plan}</span></span></div>
        <div class="dg-item"><span class="dg-label">Estado</span><span class="dg-val"><span class="badge-estado ${est}">${o.estado}</span></span></div>
        <div class="dg-item"><span class="dg-label">Apertura</span><span class="dg-val">${fmtFecha(o.fechaApertura)}</span></div>
        <div class="dg-item"><span class="dg-label">Cierre</span><span class="dg-val">${o.fechaCierre ? fmtFecha(o.fechaCierre) : '—'}</span></div>
        <div class="dg-item"><span class="dg-label">Mano de obra</span><span class="dg-val">$${fmt(o.costoManoObra || 0)}</span></div>
        <div class="dg-item"><span class="dg-label">Repuestos</span><span class="dg-val">$${fmt(costoRepuestos)}</span></div>
        <div class="dg-item"><span class="dg-label">Costo total</span><span class="dg-val">$${fmt(o.costoTotal || 0)}</span></div>
      </div>
      ${o.descripcion ? `<p style="margin-top:10px;font-size:13px;color:var(--text-md)">${o.descripcion}</p>` : ''}
    </div>`;
    if (o.repuestos?.length)
      html += `<div class="detalle-section"><h4>Repuestos (${o.repuestos.length})</h4>
        <table class="data-table"><thead><tr><th>Repuesto</th><th>Cantidad</th><th>Precio unit.</th><th>Subtotal</th></tr></thead>
        <tbody>${o.repuestos.map(r => {
        const sub = parseFloat(r.subtotal) || (r.cantidad * r.precioUnitario) || 0;
        return `<tr>
            <td>${r.nombreRepuesto}</td><td>${r.cantidad}</td>
            <td>$${fmt(r.precioUnitario)}</td><td>$${fmt(sub)}</td></tr>`;
      }).join('')}
        <tr style="background:var(--slate-50);font-weight:600">
          <td colspan="3" style="text-align:right;padding-right:12px">Total repuestos:</td>
          <td>$${fmt(costoRepuestos)}</td>
        </tr></tbody></table></div>`;

    document.getElementById('mdo-body').innerHTML = html;
  } catch (err) {
    document.getElementById('mdo-body').innerHTML =
      `<div class="td-loading" style="color:var(--red)">Error: ${err.message}</div>`;
  }
}

function renderFotosOrdenAdmin(galeria) {
  const antes = galeria.antes || [];
  const despues = galeria.despues || [];
  const fotos = [...antes, ...despues];
  if (!fotos.length) return '<div class="td-loading" style="padding:18px!important">Sin fotos asociadas</div>';
  return `<div class="galeria-grid">${fotos.map(f => {
    const etiqueta = f.tipoFoto === 'antes' ? '🔵 ANTES' : f.tipoFoto === 'despues' ? '🟢 DESPUÉS' : (f.tipoFoto || '').toUpperCase();
    return `
    <div class="galeria-item">
      <img src="${apiAssetUrl(f.url)}" alt="Foto evidencia" onerror="this.parentElement.style.display='none'" onclick="abrirFoto(this.src)" style="cursor:pointer"/>
      <div class="galeria-meta">${etiqueta} · ${fmtFechaHora(f.tomadaEn)} · ${Math.round((f.tamanoBytes || 0) / 1024)} KB</div>
    </div>`;
  }).join('')}</div>`;
}

function fmtFechaHora(str) {
  if (!str) return '—';
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

async function cancelarOrden(id) {
  if (!confirm('Cancelar la orden #' + id + '? Esta accion no se puede deshacer.')) return;
  try {
    await api('PATCH', '/ordenes/' + id + '/estado', { estado: 'Cancelada' });
    toast('Orden #' + id + ' cancelada', 'success');
    cargarOrdenes(); cargarDashboard();
  } catch (err) { toast('Error al cancelar: ' + err.message, 'error'); }
}

async function eliminarOrden(id) {
  if (!await fcConfirmEliminar(`orden #${id}`, 'orden')) return;
  try {
    await api('DELETE', `/ordenes/${id}`);
    toast(`Orden #${id} eliminada`, 'success');
    cargarOrdenes(); cargarDashboard();
  } catch (err) { toast(err.message, 'error'); }
}

document.getElementById('f-orden').addEventListener('submit', async e => {
  e.preventDefault();
  // Temporarily enable ord-veh select so FormData includes it
  const vehSelect = document.getElementById('ord-veh');
  const wasDisabled = vehSelect.disabled;
  vehSelect.disabled = false;

  const b = Object.fromEntries(new FormData(e.target));

  if (wasDisabled) vehSelect.disabled = true;

  b.vehiculoId = +b.vehiculoId; b.tecnicoId = +b.tecnicoId;
  if (b.planId) b.planId = +b.planId;
  else delete b.planId;
  // FIX: el admin NO ingresa costo de mano de obra — eso solo lo sabe el técnico.
  // Se crea la orden con costoManoObra = 0 por defecto.
  b.costoManoObra = 0;
  delete b.costoManoObra_admin; // limpiar por si hay campo residual
  if (!b.vehiculoId || !b.tecnicoId) { toast('Selecciona vehículo y técnico', 'error'); return; }
  try {
    const res = await api('POST', '/ordenes', b);
    if (res && res.reprogramada) {
      toast(`La fecha solicitada no estaba disponible. El mantenimiento fue programado para el ${res.fechaOrden} debido a la asignación del vehículo.`, 'warning');
    } else {
      toast('Orden creada — el técnico asignado registrará los costos', 'success');
    }
    closeModal('m-orden'); e.target.reset(); 
    document.getElementById('group-ord-plan').style.display = 'none';
    document.getElementById('ord-plan').removeAttribute('required');
    vehSelect.disabled = false;
    cargarOrdenes();
  } catch (err) { toast(err.message, 'error'); }
});

let planesOrdenCache = [];

document.getElementById('ord-tipo').addEventListener('change', async e => {
  const tipo = e.target.value;
  const planGroup = document.getElementById('group-ord-plan');
  const planSelect = document.getElementById('ord-plan');
  const vehSelect = document.getElementById('ord-veh');
  
  if (tipo === 'Preventivo') {
    planGroup.style.display = 'block';
    planSelect.setAttribute('required', 'required');
    vehSelect.value = '';
    vehSelect.disabled = true;
    await cargarTodosLosPlanesParaOrden();
  } else {
    planGroup.style.display = 'none';
    planSelect.removeAttribute('required');
    planSelect.value = '';
    vehSelect.value = '';
    vehSelect.disabled = false;
  }
});

document.getElementById('ord-plan').addEventListener('change', e => {
  const planId = +e.target.value;
  const vehSelect = document.getElementById('ord-veh');
  
  if (planId) {
    const plan = planesOrdenCache.find(p => p.id === planId);
    if (plan) {
      vehSelect.value = plan.vehiculoId;
    } else {
      vehSelect.value = '';
    }
  } else {
    vehSelect.value = '';
  }
});

async function cargarTodosLosPlanesParaOrden() {
  const select = document.getElementById('ord-plan');
  if (!select) return;
  select.innerHTML = '<option value="">— Cargando planes… —</option>';
  try {
    if (!vehCache || !vehCache.length) {
      const r = await api('GET', '/vehiculos');
      vehCache = Array.isArray(r) ? r : (r.data || []);
    }
    const vehiculos = vehCache || [];
    const resultados = await Promise.all(
      vehiculos.map(v =>
        api('GET', `/vehiculos/${v.id}/planes`)
          .then(r => (r.data ?? r).map(p => ({ ...p, vehiculoId: v.id, vehiculoPlaca: v.placa })))
          .catch(() => [])
      )
    );
    planesOrdenCache = resultados.flat();
    select.innerHTML = '<option value="">— Seleccione plan —</option>' +
      planesOrdenCache.map(p => `<option value="${p.id}">${p.nombre} (${p.vehiculoPlaca})</option>`).join('');
  } catch (err) {
    select.innerHTML = '<option value="">— Error al cargar planes —</option>';
    toast('Error al cargar planes: ' + err.message, 'error');
  }
}

// ══════════════════════════════════════════════════
// USUARIOS + FILTROS
// ══════════════════════════════════════════════════
async function cargarUsuarios() {
  try {
    const res = await api('GET', '/usuarios');
    usrCache = res.data || res || [];
    aplicarFiltrosUsr();
    poblarSelTecnicos();
    poblarSelTecnicosFiltros();
  } catch { }
}

function aplicarFiltrosUsr() {
  const q = (document.getElementById('fu-q')?.value || '').toLowerCase();
  const rol = document.getElementById('fu-rol')?.value || '';
  const activo = document.getElementById('fu-activo')?.value || '';

  const res = usrCache.filter(u => {
    if (q && !`${u.nombre} ${u.correo}`.toLowerCase().includes(q)) return false;
    if (rol && u.rol !== rol) return false;
    if (activo === '1' && !u.activo) return false;
    if (activo === '0' && u.activo) return false;
    return true;
  });

  pagInit('usr', res, renderTablaUsuarios);
  const s = document.getElementById('fu-summary');
  if (s) s.innerHTML = res.length !== usrCache.length
    ? `Mostrando <strong>${res.length}</strong> de ${usrCache.length} usuarios` : '';
}

function limpiarFiltrosUsr() {
  ['fu-q'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  ['fu-rol', 'fu-activo'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  aplicarFiltrosUsr();
}

function poblarSelTecnicos() {
  const sel = document.getElementById('ord-tec');
  if (!sel) return;
  const tecs = usrCache.filter(u => u.rol === 'Tecnico' && u.activo !== false);
  sel.innerHTML = '<option value="">— Seleccione un técnico —</option>' +
    tecs.map(u => `<option value="${u.id}">${u.nombre}</option>`).join('');
}

function poblarSelTecnicosFiltros() {
  ['fo-tecnico', 'rep-tecnico'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const def = id === 'rep-tecnico' ? '<option value="">Todos los técnicos</option>' : '<option value="">Todos</option>';
    sel.innerHTML = def + usrCache.filter(u => u.rol === 'Tecnico')
      .map(u => `<option value="${u.id}">${u.nombre}</option>`).join('');
  });
}

function renderTablaUsuarios(lista) {
  const tb = document.getElementById('tb-usr');
  if (!tb) return;
  if (!lista.length) { tb.innerHTML = '<tr><td colspan="5" class="td-loading">Sin usuarios con estos filtros</td></tr>'; return; }
  tb.innerHTML = lista.map(u => {
    const rc = u.rol === 'Administrador' ? 'admin' : u.rol === 'Tecnico' ? 'tecnico' : 'conductor';
    return `<tr>
      <td>${u.nombre}</td><td>${u.correo}</td>
      <td><span class="veh-sem-badge ${rc}">${u.rol}</span></td>
      <td>${u.activo ? '<span style="color:var(--green);font-weight:600">Activo</span>' : '<span style="color:var(--red)">Inactivo</span>'}</td>
      <td><div class="action-btns">
        <button class="btn-primary btn-sm" onclick="abrirDrawerEditarUsuario(${u.id})">Editar</button>
        <button class="btn-ghost btn-sm" onclick="toggleUsuario(${u.id},${u.activo})">${u.activo ? 'Desactivar' : 'Activar'}</button>
      </div></td>
    </tr>`;
  }).join('');
}

async function toggleUsuario(id, activo) {
  try {
    await api('PATCH', `/usuarios/${id}`, { activo: !activo });
    toast('Usuario actualizado', 'success'); cargarUsuarios();
  } catch (err) { toast(err.message, 'error'); }
}

document.getElementById('f-usuario').addEventListener('submit', async e => {
  e.preventDefault();
  const b = Object.fromEntries(new FormData(e.target));
  try {
    await api('POST', '/usuarios', b);
    toast('Usuario creado', 'success');
    closeModal('m-usuario'); e.target.reset(); cargarUsuarios();
  } catch (err) { toast(err.message, 'error'); }
});

// ══════════════════════════════════════════════════
// ALERTAS + FILTROS
// ══════════════════════════════════════════════════
function iconAlerta(tipo) {
  const iconos = {
    documento_vencido:    '🔴',
    documento_7dias:      '🟠',
    documento_15dias:     '🟡',
    documento_30dias:     '🟡',
    mantenimiento_vencido:'🔧',
    mantenimiento_proximo:'🛠️',
    orden_nueva:          '📋',
  };
  return iconos[tipo] || '🔔';
}

async function cargarAlertas() {
  const c = document.getElementById('alertas-list');
  if (!c) return;
  c.innerHTML = '<div class="td-loading">Cargando alertas…</div>';
  try {
    let vehs = vehCache.length ? vehCache : dashVehCache;
    if (!vehs.length) {
      const r = await api('GET', '/dashboard');
      vehs = r.data?.vehiculos || [];
    }
    alertasCache = [];
    for (const v of vehs) {
      const vId = v.vehiculoId || v.id;
      try {
        const r = await api('GET', `/vehiculos/${vId}/alertas?soloNoLeidas=false`);
        (r.data || []).forEach(a => alertasCache.push({ ...a, placa: v.placa, vehiculoId: vId }));
      } catch { }
    }
    aplicarFiltrosAlertas();
    // Actualizar el panel de notificaciones con la lista completa
    if (typeof fcAdminLoadNotifications === 'function') {
      fcAdminLoadNotifications(alertasCache);
    }
  } catch (err) {
    c.innerHTML = `<div class="td-loading">Error: ${err.message}</div>`;
  }
}

function aplicarFiltrosAlertas() {
  const tipo = document.getElementById('fa-tipo')?.value || '';
  const categoria = document.getElementById('fa-categoria')?.value || '';
  const vehId = document.getElementById('fa-vehiculo')?.value || '';
  const gravedad = document.getElementById('fa-gravedad')?.value || '';
  const orden = document.getElementById('fa-orden')?.value || 'fecha_desc';
  const c = document.getElementById('alertas-list');
  if (!c) return;

  const tiposDocumento = new Set(['documento_vencido', 'documento_7dias', 'documento_15dias', 'documento_30dias']);
  const tiposReparacion = new Set(['mantenimiento_vencido', 'mantenimiento_proximo', 'orden_nueva']);
  const criticos = new Set(['mantenimiento_vencido', 'documento_vencido']);
  const altos = new Set(['documento_7dias']);
  const medios = new Set(['mantenimiento_proximo', 'documento_30dias', 'documento_15dias']);

  let res = [...alertasCache];
  if (tipo) res = res.filter(a => a.tipoAlerta === tipo);
  if (categoria === 'documentos') res = res.filter(a => tiposDocumento.has(a.tipoAlerta));
  if (categoria === 'reparaciones') res = res.filter(a => tiposReparacion.has(a.tipoAlerta));
  if (vehId) res = res.filter(a => String(a.vehiculoId) === vehId);
  if (gravedad === 'critica') res = res.filter(a => criticos.has(a.tipoAlerta));
  if (gravedad === 'alta') res = res.filter(a => altos.has(a.tipoAlerta));
  if (gravedad === 'media') res = res.filter(a => medios.has(a.tipoAlerta));

  if (orden === 'fecha_asc') res.sort((a, b) => new Date(a.generadaEn) - new Date(b.generadaEn));
  if (orden === 'fecha_desc') res.sort((a, b) => new Date(b.generadaEn) - new Date(a.generadaEn));
  if (orden === 'tipo') res.sort((a, b) => a.tipoAlerta.localeCompare(b.tipoAlerta));

  const s = document.getElementById('fa-summary');
  if (s) s.innerHTML = res.length !== alertasCache.length
    ? `Mostrando <strong>${res.length}</strong> de ${alertasCache.length} alertas` : '';

  c.innerHTML = res.length
    ? res.map(a => `
      <div class="alert-item ${a.tipoAlerta}${a.leida ? ' alert-leida' : ''}">
        <span class="alert-icon">${iconAlerta(a.tipoAlerta)}</span>
        <div class="alert-body">
          <div class="alert-msg">${a.mensaje}</div>
          <div class="alert-meta">Vehículo: <strong>${a.placa}</strong> · ${fmtFecha(a.generadaEn)}${a.leida ? ' <span style="color:#999;font-size:11px;">✓ Leída</span>' : ''}</div>
        </div>
      </div>`).join('')
    : '<div class="td-loading"> Sin alertas con estos filtros</div>';
}

function limpiarFiltrosAlertas() {
  ['fa-tipo', 'fa-categoria', 'fa-vehiculo', 'fa-gravedad'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const ord = document.getElementById('fa-orden'); if (ord) ord.value = 'fecha_desc';
  aplicarFiltrosAlertas();
}

// ══════════════════════════════════════════════════
// REPORTES + FILTROS
// ══════════════════════════════════════════════════
function setPeriodoRapido(periodo) {
  setPeriodoReporte(periodo, null);
}

function setPeriodoReporte(periodo, el) {
  if (el) {
    document.querySelectorAll('#rep-periodo-rapido .ftab').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
  }

  // Personalizado: solo mostrar/ocultar fechas, no lanzar reporte
  const desdeWrap = document.getElementById('rep-desde-wrap');
  const hastaWrap = document.getElementById('rep-hasta-wrap');
  if (periodo === 'personalizado') {
    if (desdeWrap) desdeWrap.style.display = '';
    if (hastaWrap) hastaWrap.style.display = '';
    return;
  }
  // En períodos automáticos las fechas siguen visibles (prerellenas)
  if (desdeWrap) desdeWrap.style.display = '';
  if (hastaWrap) hastaWrap.style.display = '';

  const hoy = new Date();
  const hasta = hoy.toISOString().split('T')[0];
  let desde = '';

  if (periodo === 'hoy') {
    desde = hasta;
  } else if (periodo === 'semana') {
    const d = new Date(hoy);
    const diaSemana = d.getDay();
    const diasDesdeLunes = diaSemana === 0 ? 6 : diaSemana - 1;
    d.setDate(d.getDate() - diasDesdeLunes);
    desde = d.toISOString().split('T')[0];
  } else if (periodo === 'mes') {
    desde = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`;
  } else if (periodo === 'trimestre') {
    const d = new Date(hoy);
    d.setMonth(d.getMonth() - 3);
    desde = d.toISOString().split('T')[0];
  } else if (periodo === 'anio') {
    desde = `${hoy.getFullYear()}-01-01`;
  }

  if (desde) {
    document.getElementById('rep-desde').value = desde;
    document.getElementById('rep-hasta').value = hasta;
    cargarReporte();
  }
}

function limpiarFiltrosReporte() {
  ['rep-desde', 'rep-hasta', 'rep-q'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  ['rep-vehiculo', 'rep-tecnico', 'rep-periodo-rapido', 'rep-ord-col'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('metricas-row').style.display = 'none';
  const tb = document.getElementById('tb-rep');
  if (tb) tb.innerHTML = '<tr><td colspan="9" class="td-loading">Usa los filtros para generar un reporte</td></tr>';
  document.getElementById('rep-sub-filtros').style.display = 'none';
  reporteCache = [];
}

async function cargarReporte() {
  const desde = document.getElementById('rep-desde')?.value || '';
  const hasta  = document.getElementById('rep-hasta')?.value  || '';

  // Solo usamos fechas para el fetch (rangos grandes reducen payload)
  let url = '/reportes/costos?';
  if (desde) url += `fechaDesde=${desde}&`;
  if (hasta) url += `fechaHasta=${hasta}&`;

  const tb = document.getElementById('tb-rep');
  tb.innerHTML = '<tr><td colspan="10" class="td-loading">Generando reporte…</td></tr>';

  try {
    const { data: d } = await api('GET', url);
    reporteCache = d.detalle || [];
    // Guardamos métricas base para recalcular tras filtros locales
    window._repMetricasBase = d.metricas;
    aplicarFiltrosLocales();
  } catch (err) { toast(err.message, 'error'); }
}

function aplicarFiltrosLocales() {
  const vehiculoId = document.getElementById('rep-vehiculo')?.value || '';
  const tecnicoId  = document.getElementById('rep-tecnico')?.value  || '';
  const estado     = document.getElementById('fo-estado-rep')?.value || '';
  const q          = (document.getElementById('rep-q')?.value || '').toLowerCase();

  let lista = [...reporteCache];

  if (vehiculoId) lista = lista.filter(r => String(r.vehiculoId || r.vehiculo?.id || '') === String(vehiculoId));
  if (tecnicoId)  lista = lista.filter(r => String(r.tecnicoId  || r.tecnico?.id  || '') === String(tecnicoId));
  if (estado)     lista = lista.filter(r => (r.estado || '').toLowerCase() === estado.toLowerCase());
  if (q)          lista = lista.filter(r =>
    (r.placa || '').toLowerCase().includes(q) ||
    (r.tecnicoNombre || '').toLowerCase().includes(q) ||
    String(r.ordenId).includes(q));

  // Ordenar
  const col = document.getElementById('rep-ord-col')?.value || '';
  if (col === 'fecha_asc')  lista.sort((a,b) => (a.fechaApertura||'').localeCompare(b.fechaApertura||''));
  if (col === 'fecha_desc') lista.sort((a,b) => (b.fechaApertura||'').localeCompare(a.fechaApertura||''));
  if (col === 'costo_asc')  lista.sort((a,b) => a.costoTotal - b.costoTotal);
  if (col === 'costo_desc') lista.sort((a,b) => b.costoTotal - a.costoTotal);

  // Recalcular métricas sobre la lista filtrada
  const costoTotal    = lista.reduce((s,r) => s + (r.costoTotal || 0), 0);
  const costoPromedio = lista.length ? Math.round(costoTotal / lista.length) : 0;
  const numInter      = lista.length;
  const ordUnicas     = new Set(lista.map(r => r.ordenId)).size;

  document.getElementById('metricas-row').style.display = lista.length || reporteCache.length ? 'grid' : 'none';
  document.getElementById('met-total').textContent = `$${fmt(costoTotal)}`;
  document.getElementById('met-prom').textContent  = `$${fmt(costoPromedio)}`;
  document.getElementById('met-num').textContent   = numInter;
  const metOrd = document.getElementById('met-ord');
  if (metOrd) metOrd.textContent = ordUnicas;

  const tituloTabla = document.getElementById('rep-table-title');
  if (tituloTabla) tituloTabla.textContent = `Resultados (${lista.length} órdenes)`;

  const s = document.getElementById('rep-summary');
  if (s) s.innerHTML = lista.length !== reporteCache.length && reporteCache.length
    ? `Mostrando <strong>${lista.length}</strong> de ${reporteCache.length}` : '';

  document.getElementById('rep-sub-filtros').style.display = reporteCache.length ? 'flex' : 'none';
  renderTablaReporte(lista);
  renderGraficasReporte(lista);
}

function filtrarResultadosReporte() { aplicarFiltrosLocales(); }
function ordenarResultadosReporte()  { aplicarFiltrosLocales(); }

async function exportarReporteExcel() {
  // 1. Primero cargar/actualizar datos
  await cargarReporte();

  const lista = reporteCache;
  if (!lista || lista.length === 0) {
    toast('No hay datos para exportar. Aplica un filtro primero.', 'error');
    return;
  }

  if (typeof XLSX === 'undefined') {
    toast('La librería de Excel no está cargada aún. Intenta de nuevo en un momento.', 'error');
    return;
  }

  // 2. Construir filas
  const filas = lista.map(r => ({
    '# OT':        r.ordenId,
    'Vehículo':    r.placa || '—',
    'Técnico':     r.tecnicoNombre || '—',
    'Apertura':    r.fechaApertura ? new Date(r.fechaApertura).toLocaleDateString('es-CO') : '—',
    'M. Obra':     r.costoManoObra  || 0,
    'Repuestos':   r.costoRepuestos || 0,
    'Total':       r.costoTotal     || 0,
    'Estado':      r.estado         || '',
  }));

  // 3. Hoja principal con datos
  const ws = XLSX.utils.json_to_sheet(filas);

  // Ancho de columnas
  ws['!cols'] = [
    { wch: 8 }, { wch: 12 }, { wch: 22 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }
  ];

  // 4. Hoja resumen de métricas
  const desde  = document.getElementById('rep-desde')?.value || '';
  const hasta  = document.getElementById('rep-hasta')?.value || '';
  const costoTotal    = lista.reduce((s, r) => s + (r.costoTotal || 0), 0);
  const costoPromedio = lista.length ? Math.round(costoTotal / lista.length) : 0;
  const resumen = [
    { Métrica: 'Período desde', Valor: desde || 'Todos' },
    { Métrica: 'Período hasta', Valor: hasta  || 'Todos' },
    { Métrica: 'Total costos',  Valor: costoTotal },
    { Métrica: 'Costo promedio',Valor: costoPromedio },
    { Métrica: 'Intervenciones',Valor: lista.length },
    { Métrica: 'Órdenes únicas',Valor: new Set(lista.map(r => r.ordenId)).size },
  ];
  const wsRes = XLSX.utils.json_to_sheet(resumen);
  wsRes['!cols'] = [{ wch: 20 }, { wch: 18 }];

  // 5. Workbook y descarga
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws,    'Detalle');
  XLSX.utils.book_append_sheet(wb, wsRes, 'Resumen');

  const fecha = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `reporte-costos-${fecha}.xlsx`);
  toast('Excel generado correctamente', 'success');
}

function renderTablaReporte(lista) {
  pagInit('rep', lista, _renderFilasReporte, 10);
}

function _renderFilasReporte(slice) {
  const tb = document.getElementById('tb-rep');
  if (!tb) return;
  tb.innerHTML = slice.length
    ? slice.map(r => `<tr>
        <td><strong>#${r.ordenId}</strong></td>
        <td><strong>${r.placa}</strong></td>
        <td>${r.tecnicoNombre}</td>
        <td>${fmtFecha(r.fechaApertura)}</td>
        <td>$${fmt(r.costoManoObra)}</td>
        <td>$${fmt(r.costoRepuestos)}</td>
        <td><strong>$${fmt(r.costoTotal)}</strong></td>
        <td>${r.estado ? `<span class="badge-estado ${r.estado==='Cerrada'?'cerrada':r.estado==='Abierta'?'abierta':r.estado==='Cancelada'?'cancelada':'en-proceso'}">${r.estado}</span>` : ''}</td>
        <td><button class="btn-ghost btn-sm" onclick="abrirDetalleOrden(${r.ordenId})">Ver detalle</button></td>
      </tr>`).join('')
    : '<tr><td colspan="9" class="td-loading">Sin resultados</td></tr>';
}

// ── Gráficas de reportes ───────────────────────────
let _repChartVeh = null;
let _repChartTiempo = null;
let _repChartDist = null;

function renderGraficasReporte(lista) {
  const seccion = document.getElementById('rep-charts-section');
  if (!lista || lista.length === 0) {
    if (seccion) seccion.style.display = 'none';
    return;
  }
  if (seccion) seccion.style.display = 'block';

  // ── Gráfica 1: Costo por vehículo (barras) ────────
  const mapaVeh = {};
  lista.forEach(r => {
    const key = r.placa || 'Sin placa';
    mapaVeh[key] = (mapaVeh[key] || 0) + (r.costoTotal || 0);
  });
  const vehEntradas = Object.entries(mapaVeh).sort((a,b) => b[1] - a[1]).slice(0, 12);
  const vehLabels = vehEntradas.map(e => e[0]);
  const vehValues = vehEntradas.map(e => e[1]);

  const ctxVeh = document.getElementById('rep-chart-vehiculo');
  if (ctxVeh) {
    if (_repChartVeh) { _repChartVeh.destroy(); _repChartVeh = null; }
    const palette = ['#1a56db','#3b82f6','#60a5fa','#93c5fd','#0b1f45','#0f2857',
                     '#10b981','#34d399','#f59e0b','#ef4444','#8b5cf6','#ec4899'];
    _repChartVeh = new Chart(ctxVeh, {
      type: 'bar',
      data: {
        labels: vehLabels,
        datasets: [{
          data: vehValues,
          backgroundColor: vehLabels.map((_, i) => palette[i % palette.length] + 'cc'),
          borderColor:     vehLabels.map((_, i) => palette[i % palette.length]),
          borderWidth: 1.5,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0b1f45', padding: 10,
            callbacks: { label: c => '  $ ' + c.parsed.y.toLocaleString('es-CO') }
          }
        },
        scales: {
          x: { grid: { display: false }, border: { display: false },
               ticks: { font: { family: 'Outfit', size: 11 }, color: '#9ca3af', maxRotation: 35 } },
          y: { grid: { color: '#f0f2f7' }, border: { display: false },
               ticks: { font: { family: 'Outfit', size: 11 }, color: '#9ca3af',
                        callback: v => v >= 1000000 ? '$'+(v/1000000).toFixed(1)+'M' : v >= 1000 ? '$'+(v/1000).toFixed(0)+'K' : '$'+v } }
        }
      }
    });
  }

  // ── Gráfica 2: Evolución de costos en el tiempo ───
  const fechas = lista.map(r => r.fechaApertura).filter(Boolean).sort();
  const primerFecha = new Date(fechas[0]);
  const ultimaFecha = new Date(fechas[fechas.length - 1]);
  const diffDias = (ultimaFecha - primerFecha) / 86400000;
  const agruparPor = diffDias <= 60 ? 'semana' : 'mes';

  const mapaTiempo = {};
  lista.forEach(r => {
    if (!r.fechaApertura) return;
    const d = new Date(r.fechaApertura);
    let key;
    if (agruparPor === 'semana') {
      const dia = d.getDay();
      const lunes = new Date(d);
      lunes.setDate(d.getDate() - (dia === 0 ? 6 : dia - 1));
      key = lunes.toISOString().split('T')[0];
    } else {
      key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    }
    mapaTiempo[key] = (mapaTiempo[key] || 0) + (r.costoTotal || 0);
  });
  const tiempoEntradas = Object.entries(mapaTiempo).sort((a,b) => a[0].localeCompare(b[0]));
  const tiempoLabels = tiempoEntradas.map(e => {
    if (agruparPor === 'mes') {
      const [y, m] = e[0].split('-');
      return ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][+m-1] + ' ' + y.slice(2);
    }
    return e[0].slice(5);
  });
  const tiempoValues = tiempoEntradas.map(e => e[1]);

  const ctxTiempo = document.getElementById('rep-chart-tiempo');
  if (ctxTiempo) {
    if (_repChartTiempo) { _repChartTiempo.destroy(); _repChartTiempo = null; }
    const gradCtx2 = ctxTiempo.getContext('2d');
    const grad2 = gradCtx2.createLinearGradient(0, 0, 0, 240);
    grad2.addColorStop(0, 'rgba(16,185,129,0.22)');
    grad2.addColorStop(1, 'rgba(16,185,129,0.00)');
    _repChartTiempo = new Chart(ctxTiempo, {
      type: 'line',
      data: {
        labels: tiempoLabels,
        datasets: [{
          data: tiempoValues,
          borderColor: '#10b981',
          borderWidth: 2.5,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#10b981',
          pointBorderWidth: 2,
          pointRadius: 4, pointHoverRadius: 6,
          fill: true, backgroundColor: grad2, tension: 0.4
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0b1f45', padding: 10,
            callbacks: { label: c => '  $ ' + c.parsed.y.toLocaleString('es-CO') }
          }
        },
        scales: {
          x: { grid: { display: false }, border: { display: false },
               ticks: { font: { family: 'Outfit', size: 11 }, color: '#9ca3af' } },
          y: { grid: { color: '#f0f2f7' }, border: { display: false },
               ticks: { font: { family: 'Outfit', size: 11 }, color: '#9ca3af',
                        callback: v => v >= 1000000 ? '$'+(v/1000000).toFixed(1)+'M' : v >= 1000 ? '$'+(v/1000).toFixed(0)+'K' : '$'+v } }
        }
      }
    });
  }

  // ── Gráfica 3: Distribución de costos (donut) ────
  const totalMO  = lista.reduce((s, r) => s + (r.costoManoObra  || 0), 0);
  const totalRep = lista.reduce((s, r) => s + (r.costoRepuestos || 0), 0);
  const totalOtr = lista.reduce((s, r) => s + (r.costoOtros     || 0), 0);
  const totalServ = lista.reduce((s, r) => s + (r.costoServicio  || 0), 0);
  const totalDist = totalMO + totalRep + totalOtr + totalServ || 1;

  const distCats = [
    { label: 'Repuestos',   value: totalRep,  color: '#1a56db' },
    { label: 'Mano de obra',value: totalMO,   color: '#f97316' },
    { label: 'Servicios',   value: totalServ, color: '#10b981' },
    { label: 'Otros',       value: totalOtr,  color: '#8b5cf6' },
  ].filter(c => c.value > 0);

  const ctxDist = document.getElementById('rep-chart-dist');
  const legendEl = document.getElementById('rep-donut-legend');
  if (ctxDist) {
    if (_repChartDist) { _repChartDist.destroy(); _repChartDist = null; }
    _repChartDist = new Chart(ctxDist, {
      type: 'doughnut',
      data: {
        labels: distCats.map(c => c.label),
        datasets: [{
          data: distCats.map(c => c.value),
          backgroundColor: distCats.map(c => c.color),
          borderWidth: 0,
          hoverOffset: 6,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0b1f45', padding: 10,
            callbacks: {
              label: c => {
                const pct = ((c.parsed / totalDist) * 100).toFixed(1);
                return `  ${c.label}: $${c.parsed.toLocaleString('es-CO')} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }
  if (legendEl) {
    legendEl.innerHTML = distCats.map(c => {
      const pct  = Math.round((c.value / totalDist) * 100);
      const amt  = '$' + c.value.toLocaleString('es-CO');
      return `<li class="rep-donut-item">
        <span class="rep-donut-dot" style="background:${c.color}"></span>
        <span class="rep-donut-label">${c.label}</span>
        <span class="rep-donut-pct">${pct}%</span>
        <span class="rep-donut-amt">${amt}</span>
      </li>`;
    }).join('');
  }
}

// ══════════════════════════════════════════════════
// ASIGNACIONES + FILTROS
// ══════════════════════════════════════════════════
async function cargarAsignaciones() {
  const tb = document.getElementById('tb-asig');
  if (tb) tb.innerHTML = '<tr><td colspan="7" class="td-loading">Cargando…</td></tr>';
  try {
    const res = await api('GET', '/asignaciones');
    asigCache = Array.isArray(res) ? res : (res?.data || []);
    pagInit('asig', asigCache, _renderRowsAsig);
    poblarSelectsAsignacion();
  } catch (err) {
    if (tb) tb.innerHTML = `<tr><td colspan="7" class="td-loading" style="color:var(--red)">Error: ${err.message}</td></tr>`;
  }
}

function filtrarAsignaciones(q) {
  const turno = document.getElementById('fa-turno')?.value || '';
  const estado = document.getElementById('fa-asig-estado')?.value || '';
  const desde = document.getElementById('fa-asig-desde')?.value || '';
  const t = (q || '').toLowerCase();

  const res = asigCache.filter(a => {
    if (t && !(a.vehiculo?.placa || '').toLowerCase().includes(t) && !(a.conductor?.nombre || '').toLowerCase().includes(t)) return false;
    if (turno && a.turno !== turno) return false;
    if (estado === '1' && !a.activo) return false;
    if (estado === '0' && a.activo) return false;
    if (desde && a.fechaInicio < desde) return false;
    return true;
  });
  pagInit('asig', res, _renderRowsAsig);
}

function renderTablaAsignaciones(lista) { pagInit('asig', lista, _renderRowsAsig); }

function _renderRowsAsig(lista) {
  const tb = document.getElementById('tb-asig');
  if (!tb) return;
  tb.innerHTML = lista.length ? lista.map(a => `<tr>
    <td><strong>${a.vehiculo?.placa || '—'}</strong><br><span style="font-size:11px;color:var(--text-lt)">${a.vehiculo?.marca || ''} ${a.vehiculo?.modelo || ''}</span></td>
    <td>${a.conductor?.nombre || '—'}</td>
    <td><span class="badge-estado abierta">${TURNO_LABEL[a.turno] || a.turno}</span></td>
    <td>${fmtFecha(a.fechaInicio)}</td>
    <td>${a.fechaFin ? fmtFecha(a.fechaFin) : '<span style="color:var(--text-lt)">Indefinida</span>'}</td>
    <td><span class="badge-estado ${a.activo ? 'en-proceso' : 'cerrada'}">${a.activo ? 'Activa' : 'Finalizada'}</span></td>
    <td><div class="action-btns">
      <button class="btn-ghost btn-sm" onclick="abrirDrawerEditarAsignacion(${a.id})">Editar</button>
      ${a.activo ? `<button class="btn-danger btn-sm" onclick="finalizarAsignacion(${a.id})">Finalizar</button>` : '<span style="color:var(--text-lt);font-size:12px">Finalizada</span>'}
    </div></td>
  </tr>`).join('') : '<tr><td colspan="7" class="td-loading">Sin asignaciones</td></tr>';
}

async function poblarSelectsAsignacion() {
  // Si los cachés aún no tienen datos, consultar la API directamente
  if (!vehCache.length) {
    try { const r = await api('GET', '/vehiculos'); vehCache = Array.isArray(r) ? r : (r.data || []); } catch {}
  }
  if (!usrCache.length) {
    try { const r = await api('GET', '/usuarios'); usrCache = Array.isArray(r) ? r : (r.data || []); } catch {}
  }
  const sv = document.getElementById('asig-veh');
  if (sv) sv.innerHTML = '<option value="">— Seleccione —</option>' +
    vehCache.map(v => `<option value="${v.id}">${v.placa} — ${v.marca} ${v.modelo}</option>`).join('');
  const sc = document.getElementById('asig-con');
  if (sc) sc.innerHTML = '<option value="">— Seleccione —</option>' +
    usrCache.filter(u => u.rol === 'Conductor')
      .map(u => `<option value="${u.id}">${u.nombre}</option>`).join('');
}

async function finalizarAsignacion(id) {
  if (!await fcConfirmFinalizar(`la asignación #${id}`)) return;
  try {
    await api('PATCH', `/asignaciones/${id}/desactivar`);
    toast('Asignación finalizada', 'success');
    cargarAsignaciones();
  } catch (err) { toast(err.message, 'error'); }
}

document.getElementById('f-asignacion').addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = {
    vehiculoId: +fd.get('vehiculoId'),
    conductorId: +fd.get('conductorId'),
    turno: fd.get('turno'),
    fechaInicio: fd.get('fechaInicio'),
    fechaFin: fd.get('fechaFin') || undefined,
    observaciones: fd.get('observaciones') || undefined,
  };

  // ── Validación Frontend (Preventiva) ──
  const solapada = asigCache.find(a => {
    if (!a.activo) return false;
    const aIni = a.fechaInicio, aFin = a.fechaFin || a.fechaInicio;
    const bIni = body.fechaInicio, bFin = body.fechaFin || body.fechaInicio;
    const haySolape = (aIni <= bFin && aFin >= bIni);
    if (!haySolape) return false;

    if (a.conductor?.id === body.conductorId) {
      if (a.turno === 'completo' || body.turno === 'completo' || a.turno === body.turno) return true;
    }
    if (a.vehiculo?.id === body.vehiculoId) {
      if (a.turno === 'completo' || body.turno === 'completo' || a.turno === body.turno) return true;
    }
    return false;
  });
  if (solapada) {
    toast(`Conflicto: Pedro ya está ocupado o el vehículo ya tiene turno en esas fechas (${solapada.turno} en ${solapada.vehiculo?.placa || ''})`, 'error');
    return;
  }
  try {
    await api('POST', '/asignaciones', body);
    toast('Asignación creada', 'success');
    closeModal('m-asignacion'); e.target.reset(); cargarAsignaciones();
  } catch (err) { toast(err.message, 'error'); }
});

// ══════════════════════════════════════════════════
// KILOMETRAJE Y GALERÍA
// ══════════════════════════════════════════════════
// abrirKilometraje — reemplazada por versión con registro (ver abajo)

async function abrirGaleria(ordenId) {
  document.getElementById('mgal-title').textContent = `Galería — Orden #${ordenId}`;
  document.getElementById('mgal-body').innerHTML = '<div class="td-loading">Cargando…</div>';
  openModal('m-galeria');
  try {
    const res = await api('GET', `/ordenes/${ordenId}/fotos`);
    const galeria = res?.data ?? res;
    if (!galeria?.total) {
      document.getElementById('mgal-body').innerHTML = '<div class="td-loading">📷 Sin fotos en esta orden</div>';
      return;
    }
    const renderFotos = (arr, label) => {
      if (!arr?.length) return `<div class="detalle-section"><h4>${label}</h4><p style="color:var(--text-lt);font-size:13px">Sin fotos</p></div>`;
      return `<div class="detalle-section"><h4>${label} (${arr.length})</h4>
        <div class="galeria-grid">${arr.map(f => `
          <div class="galeria-item">
            <img src="${apiAssetUrl(f.url)}" alt="Foto" onerror="this.parentElement.style.display='none'" onclick="abrirFoto(this.src)"/>
            <div class="galeria-meta">${fmtFechaHora(f.tomadaEn)} · ${Math.round((f.tamanoBytes || 0) / 1024)} KB</div>
          </div>`).join('')}
        </div></div>`;
    };
    document.getElementById('mgal-body').innerHTML =
      renderFotos(galeria.antes, 'Antes de la reparación') +
      renderFotos(galeria.despues, 'Después de la reparación');
  } catch (err) {
    document.getElementById('mgal-body').innerHTML = `<div class="td-loading" style="color:var(--red)">Error: ${err.message}</div>`;
  }
}

function abrirFoto(src) {
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out';
  ov.innerHTML = `<img src="${src}" style="max-width:90vw;max-height:90vh;border-radius:8px;box-shadow:0 8px 40px rgba(0,0,0,.5)"/>`;
  ov.onclick = () => ov.remove();
  document.body.appendChild(ov);
}
// ══════════════════════════════════════════════════════════════════════════════
// 1. PROYECCIONES — /prediccion/flota
// ══════════════════════════════════════════════════════════════════════════════

// predCache ya declarado arriba

async function cargarPredicciones() {
  document.getElementById('pred-lista').innerHTML = '<div class="td-loading">Cargando…</div>';
  try {
    const { data } = await api('GET', '/prediccion/flota');
    predCache = data;
    actualizarContadoresPrediccion();
    filtrarPredicciones();
  } catch (err) {
    document.getElementById('pred-lista').innerHTML =
      `<div class="td-loading" style="color:var(--red)">Error: ${err.message}</div>`;
  }
}

function actualizarContadoresPrediccion() {
  const cnt = { rojo: 0, amarillo: 0, verde: 0, gris: 0 };
  predCache.forEach(p => cnt[p.colorUrgencia ?? 'gris']++);
  document.getElementById('pred-cnt-r').textContent = cnt.rojo;
  document.getElementById('pred-cnt-a').textContent = cnt.amarillo;
  document.getElementById('pred-cnt-v').textContent = cnt.verde;
  document.getElementById('pred-cnt-g').textContent = cnt.gris;
  // Actualizar hero card con datos reales
  const hr = document.getElementById('pred-hero-r'); if(hr) hr.textContent = cnt.rojo;
  const ha = document.getElementById('pred-hero-a'); if(ha) ha.textContent = cnt.amarillo;
  const hv = document.getElementById('pred-hero-v'); if(hv) hv.textContent = cnt.verde;
}

function filtrarPredicciones() {
  const filtro = document.getElementById('pred-filtro').value;
  const buscar = (document.getElementById('pred-buscar').value || '').toLowerCase();
  let lista = predCache.filter(p => {
    const color = p.colorUrgencia ?? 'gris';
    if (filtro && color !== filtro) return false;
    if (buscar) {
      const placa = (p.vehiculo?.placa || '').toLowerCase();
      const plan = (p.planNombre || '').toLowerCase();
      if (!placa.includes(buscar) && !plan.includes(buscar)) return false;
    }
    return true;
  });
  renderPredicciones(lista);
}

function renderPredicciones(lista) {
  const el = document.getElementById('pred-lista');
  if (!lista.length) {
    el.innerHTML = '<div class="td-loading">No hay proyecciones para mostrar.</div>';
    return;
  }
  el.innerHTML = lista.map(p => {
    const color = p.colorUrgencia ?? 'gris';
    const placa = p.vehiculo?.placa ?? '—';
    const marca = p.vehiculo?.marca ?? '';
    const modelo = p.vehiculo?.modelo ?? '';
    const kmDia = p.kmPorDia != null ? `${Number(p.kmPorDia).toFixed(1)} km/día` : '—';
    const dias = p.diasEstimados != null ? `${p.diasEstimados} días` : '—';
    const fecha = p.fechaEstimada ?? '—';
    const plan = p.planNombre ?? 'Sin plan urgente';
    const msg = p.mensaje ?? '';
    return `
    <div class="pred-tl-item ${color}">
      <div class="pred-tl-placa">${placa}</div>
      <div class="pred-tl-plan">
        <div style="font-size:12px;color:var(--text-lt)">${marca} ${modelo}</div>
        <div style="font-size:13px;font-weight:500;margin-top:2px">${plan}</div>
        ${msg ? `<div style="font-size:11px;color:var(--text-lt);margin-top:1px">${msg}</div>` : ''}
      </div>
      <div style="text-align:center;min-width:72px">
        <div style="font-size:11px;color:var(--text-lt)">Km/día</div>
        <div style="font-size:13px;font-weight:600">${kmDia}</div>
      </div>
      <div style="text-align:center;min-width:72px">
        <div style="font-size:11px;color:var(--text-lt)">Faltan</div>
        <div style="font-size:13px;font-weight:600">${dias}</div>
      </div>
      <div style="text-align:center;min-width:90px">
        <div style="font-size:11px;color:var(--text-lt)">Fecha est.</div>
        <div style="font-size:13px;font-weight:600">${fecha}</div>
      </div>
      <div><span class="pred-badge ${color}">${color}</span></div>
      <button class="btn-ghost btn-sm" onclick="recalcularVehiculo(${p.vehiculo?.id})">↻</button>
    </div>`;
  }).join('');
}

async function recalcularVehiculo(vehiculoId) {
  if (!vehiculoId) return;
  try {
    toast('Recalculando…', 'info');
    await api('POST', `/prediccion/vehiculos/${vehiculoId}/recalcular`);
    await cargarPredicciones();
    toast('Predicción actualizada', 'success');
  } catch (err) { toast(err.message, 'error'); }
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. UMBRALES — /alertas/umbrales  +  evaluar
// ══════════════════════════════════════════════════════════════════════════════

async function cargarUmbrales() {
  try {
    const { data } = await api('GET', '/alertas/umbrales');
    document.getElementById('umb-km-actual').textContent = `${data.km} km`;
    document.getElementById('umb-dias-actual').textContent = `${data.dias} días`;
    document.getElementById('umb-km').value = data.km;
    document.getElementById('umb-dias').value = data.dias;
  } catch (err) { toast('Error al cargar umbrales: ' + err.message, 'error'); }
}

async function guardarUmbrales() {
  const km = parseInt(document.getElementById('umb-km').value);
  const dias = parseInt(document.getElementById('umb-dias').value);
  if (!km || km < 1 || !dias || dias < 1) {
    toast('Ingresa valores válidos (> 0)', 'error'); return;
  }
  try {
    const { data } = await api('PUT', '/alertas/umbrales', { km, dias });
    document.getElementById('umb-km-actual').textContent = `${data.km} km`;
    document.getElementById('umb-dias-actual').textContent = `${data.dias} días`;
    toast('Umbrales guardados', 'success');
  } catch (err) { toast(err.message, 'error'); }
}

async function evaluarVehiculo() {
  const vehiculoId = document.getElementById('umb-evaluar-veh').value;
  if (!vehiculoId) { toast('Selecciona un vehículo', 'error'); return; }
  const resEl = document.getElementById('umb-evaluar-res');
  resEl.textContent = 'Evaluando…';
  try {
    const { data } = await api('POST', `/vehiculos/${vehiculoId}/alertas/evaluar`);
    resEl.innerHTML =
      `<span style="color:var(--green);font-weight:600">✓ Evaluación completada</span> — ` +
      `${data.total_generadas} alerta(s) generada(s) ` +
      `(mantenimiento: ${data.alertas_mantenimiento.length}, ` +
      `documentos: ${data.alertas_documentos.length})`;
  } catch (err) {
    resEl.innerHTML = `<span style="color:var(--red)">${err.message}</span>`;
  }
}

function poblarSelectUmbralVehiculos() {
  const sel = document.getElementById('umb-evaluar-veh');
  if (!sel || !sel.options.length || sel.options.length === 1) {
    (vehCache || []).forEach(v => {
      const o = document.createElement('option');
      o.value = v.id; o.textContent = `${v.placa} — ${v.marca} ${v.modelo}`;
      sel.appendChild(o);
    });
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. REGISTRO KILÓMETROS — POST /vehiculos/:id/kilometraje
// ══════════════════════════════════════════════════════════════════════════════

async function abrirKilometraje(vehiculoId, placa) {
  document.getElementById('mkm-title').textContent = `Kilometraje — ${placa}`;
  document.getElementById('mkm-body').innerHTML = '<div class="td-loading">Cargando…</div>';
  openModal('m-kilometraje');
  try {
    const res = await api('GET', `/vehiculos/${vehiculoId}/kilometraje`);
    const historial = res.data ?? res;
    let html = `
      <div class="km-reg-form">
        <div class="field-group">
          <label>Nuevo odómetro (km)</label>
          <input type="number" id="km-nuevo-val" min="1" placeholder="Ej. 125000"/>
        </div>
        <div class="field-group">
          <label>Momento</label>
          <select id="km-nuevo-momento">
            <option value="inicio">Inicio de ruta</option>
            <option value="fin">Fin de ruta</option>
          </select>
        </div>
        <button class="btn-primary" onclick="registrarKm(${vehiculoId})">Registrar</button>
      </div>
      <hr style="border:none;border-top:1px solid var(--slate-200);margin:14px 0"/>
      <h4 style="font-size:13px;font-weight:600;margin-bottom:10px">Historial de registros</h4>`;
    if (!historial.length) {
      html += '<div class="td-loading">Sin registros aún.</div>';
    } else {
      html += `<table class="data-table"><thead><tr>
        <th>Km registrado</th><th>Momento</th><th>Conductor</th><th>Fecha</th>
      </tr></thead><tbody>` +
        historial.map(r => `<tr>
        <td><strong>${fmt(r.kmValor)} km</strong></td>
        <td>${r.momento ?? '—'}</td>
        <td>${r.conductor?.nombre ?? '—'}</td>
        <td>${fmtFecha(r.registradoEn ?? r.createdAt)}</td>
      </tr>`).join('') + '</tbody></table>';
    }
    document.getElementById('mkm-body').innerHTML = html;
  } catch (err) {
    document.getElementById('mkm-body').innerHTML =
      `<div class="td-loading" style="color:var(--red)">Error: ${err.message}</div>`;
  }
}

async function registrarKm(vehiculoId) {
  const kmValor = parseInt(document.getElementById('km-nuevo-val').value);
  const momento = document.getElementById('km-nuevo-momento').value;
  if (!kmValor || kmValor < 1) { toast('Ingresa un km válido', 'error'); return; }
  try {
    await api('POST', `/vehiculos/${vehiculoId}/kilometraje`, { kmValor, momento });
    toast('Km registrado correctamente', 'success');
    const placa = document.getElementById('mkm-title').textContent.split('— ')[1] || '';
    await abrirKilometraje(vehiculoId, placa);
    cargarDashboard();
  } catch (err) { toast(err.message, 'error'); }
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. PLANES DE MANTENIMIENTO — /vehiculos/:id/planes
// ══════════════════════════════════════════════════════════════════════════════

// planesCache ya declarado arriba

async function cargarPlanes() {
  const vehiculoId = document.getElementById('planes-veh-sel')?.value;
  const tbody = document.getElementById('tb-planes');
  tbody.innerHTML = '<tr><td colspan="9" class="td-loading">Cargando…</td></tr>';
  try {
    if (vehiculoId) {
      const res = await api('GET', `/vehiculos/${vehiculoId}/planes`);
      planesCache = (res.data ?? res).map(p => ({ ...p, vehiculoId: +vehiculoId }));
    } else {
      // Cargar planes de todos los vehículos en paralelo
      const vehiculos = vehCache || [];
      const resultados = await Promise.all(
        vehiculos.map(v =>
          api('GET', `/vehiculos/${v.id}/planes`)
            .then(r => (r.data ?? r).map(p => ({ ...p, _placa: v.placa, _marca: v.marca, _modelo: v.modelo })))
            .catch(() => [])
        )
      );
      planesCache = resultados.flat();
    }
    filtrarPlanes();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="9" class="td-loading" style="color:var(--red)">${err.message}</td></tr>`;
  }
}

function filtrarPlanes() {
  const buscar = (document.getElementById('planes-buscar')?.value || '').toLowerCase();
  const lista = planesCache.filter(p => {
    if (!buscar) return true;
    return (p.nombre || '').toLowerCase().includes(buscar) ||
      (p._placa || p.vehiculo?.placa || '').toLowerCase().includes(buscar);
  });
  pagInit('plan', lista, renderTablaPlanes);
}

function renderTablaPlanes(lista) {
  const tbody = document.getElementById('tb-planes');
  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="td-loading">Sin planes registrados.</td></tr>';
    return;
  }
  tbody.innerHTML = lista.map(p => {
    const placa = p._placa || p.vehiculo?.placa || '—';
    const marca = p._marca || p.vehiculo?.marca || '';
    const modelo = p._modelo || p.vehiculo?.modelo || '';
    const ciclo = p.tipoCiclo || '—';
    const intKm = p.intervaloKm != null ? `${fmt(p.intervaloKm)} km` : '—';
    const intD = p.intervaloDias != null ? `${p.intervaloDias} días` : '—';
    const proxKm = p.kmProximo != null ? `${fmt(p.kmProximo)} km` : '—';
    const proxF = fmtFecha(p.fechaProxima);
    const vid = p.vehiculoId || p.vehiculo?.id;
    return `<tr>
      <td><strong>${placa}</strong><br><span style="font-size:11px;color:var(--text-lt)">${marca} ${modelo}</span></td>
      <td>${p.nombre}</td>
      <td><span class="ciclo-badge ${ciclo}">${ciclo}</span></td>
      <td>${intKm}</td>
      <td>${intD}</td>
      <td>${proxKm}</td>
      <td>${proxF}</td>
      <td><span class="veh-sem-badge verde">Activo</span></td>
      <td><div class="action-btns">
        <button class="btn-primary btn-sm" onclick="abrirDrawerEditarPlan(${p.id},${vid})">Editar</button>
        <button class="btn-danger btn-sm" onclick="desactivarPlan(${p.id},${vid})">Desactivar</button>
      </div></td>
    </tr>`;
  }).join('');
}

async function desactivarPlan(planId, vehiculoId) {
  const _p = planesCache.find(x => x.id === planId);
  if (!await fcConfirmDesactivar(_p?.nombre || 'este plan')) return;
  try {
    await api('DELETE', `/vehiculos/${vehiculoId}/planes/${planId}`);
    toast('Plan desactivado', 'success');
    cargarPlanes();
  } catch (err) { toast(err.message, 'error'); }
}

function actualizarCamposPlan() {
  const tipo = document.getElementById('plan-tipo').value;
  const campoKm = document.getElementById('campo-km');
  const campoDias = document.getElementById('campo-dias');
  const inputKm = campoKm.querySelector('input');
  const inputDias = campoDias.querySelector('input');
  campoKm.style.display = (tipo === 'km' || tipo === 'combinado') ? 'block' : 'none';
  campoDias.style.display = (tipo === 'dias' || tipo === 'combinado') ? 'block' : 'none';
  inputKm.required = (tipo === 'km' || tipo === 'combinado');
  inputDias.required = (tipo === 'dias' || tipo === 'combinado');
}

async function crearPlan(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const vid = fd.get('vehiculoId');
  if (!vid) { toast('Selecciona un vehículo', 'error'); return; }
  const body = {
    nombre: fd.get('nombre'),
    tipoCiclo: fd.get('tipoCiclo'),
  };
  const ik = parseInt(fd.get('intervaloKm'));
  const id = parseInt(fd.get('intervaloDias'));
  if (!isNaN(ik) && ik > 0) body.intervaloKm = ik;
  if (!isNaN(id) && id > 0) body.intervaloDias = id;
  try {
    await api('POST', `/vehiculos/${vid}/planes`, body);
    toast('Plan creado correctamente', 'success');
    closeModal('m-plan');
    e.target.reset();
    actualizarCamposPlan();
    cargarPlanes();
  } catch (err) { toast(err.message, 'error'); }
}

function poblarSelectsPlanes() {
  ['planes-veh-sel', 'plan-veh-sel'].forEach(selId => {
    const sel = document.getElementById(selId);
    if (!sel) return;
    // Conservar primera opción
    while (sel.options.length > 1) sel.remove(1);
    (vehCache || []).forEach(v => {
      const o = document.createElement('option');
      o.value = v.id; o.textContent = `${v.placa} — ${v.marca} ${v.modelo}`;
      sel.appendChild(o);
    });
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// Hook: extender showPage para cargar datos de las nuevas secciones
// ══════════════════════════════════════════════════════════════════════════════

const _showPageOrig = showPage;
showPage = function (id, title) {
  _showPageOrig(id, title);
  if (id === 'predicciones') cargarPredicciones();
  if (id === 'umbrales') { cargarUmbrales(); poblarSelectUmbralVehiculos(); }
  if (id === 'planes') { poblarSelectsPlanes(); cargarPlanes(); }
  if (id === 'novedades') { setTimeout(function(){ if (typeof initAdminNovedades === 'function') initAdminNovedades(); }, 150); }
};
// (popup de alertas urgentes movido a notifications.js → fcMostrarPopupUrgentes)

// ══════════════════════════════════════════════════
// PESTAÑAS DE PROYECCIONES
// ══════════════════════════════════════════════════
function switchPredTab(tabId, btn) {
  // Ocultar todos los contenidos de pestaña
  document.querySelectorAll('.pred-tab-content').forEach(el => {
    el.style.display = 'none';
  });
  
  // Quitar la clase active de todos los botones de pestaña
  if (btn) {
    const tabsContainer = btn.parentElement;
    tabsContainer.querySelectorAll('.ftab').forEach(b => {
      b.classList.remove('active');
    });
    // Agregar la clase active al botón clickeado
    btn.classList.add('active');
  }
  
  // Mostrar el contenido de la pestaña seleccionada
  const activeContent = document.getElementById('tab-pred-' + tabId);
  if (activeContent) {
    activeContent.style.display = 'block';
  }
}
// ══════════════════════════════════════════════════════════════════════════════
// DRAWER — Panel lateral de edición (desliza desde la derecha, no modal)
// ══════════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function inyectarDrawer() {
  if (document.getElementById('fc-drawer')) return;
  const style = document.createElement('style');
  style.textContent = `
    #fc-drawer-overlay { position:fixed;inset:0;background:rgba(12,31,61,.35);z-index:1100;opacity:0;pointer-events:none;transition:opacity .25s; }
    #fc-drawer-overlay.open { opacity:1;pointer-events:all; }
    #fc-drawer { position:fixed;top:0;right:0;height:100%;width:420px;max-width:95vw;background:var(--white);
      box-shadow:-6px 0 32px rgba(12,31,61,.18);z-index:1101;transform:translateX(100%);
      transition:transform .28s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column; }
    #fc-drawer.open { transform:translateX(0); }
    #fc-drawer-header { display:flex;align-items:center;justify-content:space-between;
      padding:20px 24px;border-bottom:1.5px solid var(--slate-200);flex-shrink:0; }
    #fc-drawer-title { font-size:16px;font-weight:700;color:var(--blue-900); }
    #fc-drawer-close { background:none;border:none;cursor:pointer;font-size:22px;color:var(--text-lt);line-height:1;padding:4px; }
    #fc-drawer-body { flex:1;overflow-y:auto;padding:24px; }
    #fc-drawer-body .field-group { margin-bottom:16px; }
    #fc-drawer-body label { display:block;font-size:13px;font-weight:600;color:var(--text-md);margin-bottom:6px; }
    #fc-drawer-body input, #fc-drawer-body select, #fc-drawer-body textarea {
      width:100%;padding:9px 12px;border:1.5px solid var(--slate-200);border-radius:var(--r8);
      font-size:14px;font-family:inherit;outline:none;transition:border-color .2s; }
    #fc-drawer-body input:focus, #fc-drawer-body select:focus { border-color:var(--blue-500); }
    #fc-drawer-footer { padding:16px 24px;border-top:1.5px solid var(--slate-200);display:flex;gap:10px;flex-shrink:0; }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'fc-drawer-overlay';
  overlay.onclick = cerrarDrawer;

  const drawer = document.createElement('div');
  drawer.id = 'fc-drawer';
  drawer.innerHTML = `
    <div id="fc-drawer-header">
      <span id="fc-drawer-title">Editar</span>
      <button id="fc-drawer-close" onclick="cerrarDrawer()">✕</button>
    </div>
    <div id="fc-drawer-body"></div>
    <div id="fc-drawer-footer">
      <button class="btn-primary" id="fc-drawer-save">Guardar cambios</button>
      <button class="btn-ghost" onclick="cerrarDrawer()">Cancelar</button>
    </div>`;
  document.body.appendChild(overlay);
  document.body.appendChild(drawer);
});

function abrirDrawer(titulo, bodyHtml, onSave) {
  // Si el drawer aún no fue inyectado (DOM no listo), esperar un tick
  if (!document.getElementById('fc-drawer')) {
    setTimeout(() => abrirDrawer(titulo, bodyHtml, onSave), 80);
    return;
  }
  document.getElementById('fc-drawer-title').textContent = titulo;
  document.getElementById('fc-drawer-body').innerHTML = bodyHtml;
  const btn = document.getElementById('fc-drawer-save');
  btn.onclick = onSave;
  document.getElementById('fc-drawer-overlay').classList.add('open');
  document.getElementById('fc-drawer').classList.add('open');
}

function cerrarDrawer() {
  document.getElementById('fc-drawer-overlay').classList.remove('open');
  document.getElementById('fc-drawer').classList.remove('open');
}

// ── Editar Vehículo ──────────────────────────────────────────────────────────
async function abrirDrawerEditarVehiculo(id) {
  try {
    toast('Cargando datos del vehículo…', 'info');
    const res = await api('GET', '/vehiculos/' + id);
    const v = res.data ?? res;
    if (!v) return;

    const docSoat = v.documentos?.find(d => d.tipo === 'SOAT');
    const docTM = v.documentos?.find(d => d.tipo === 'RevisionTM');
    const venceSoatVal = docSoat ? docSoat.fechaVencimiento.split('T')[0] : '';
    const venceTMVal = docTM ? docTM.fechaVencimiento.split('T')[0] : '';

    abrirDrawer('Editar vehículo — ' + v.placa, `
      <div class="field-group"><label>Placa</label><input id="dr-placa" value="${v.placa}"/></div>
      <div class="field-group"><label>Marca</label><input id="dr-marca" value="${v.marca}"/></div>
      <div class="field-group"><label>Modelo</label><input id="dr-modelo" value="${v.modelo}"/></div>
      <div class="field-group"><label>Año</label><input id="dr-anio" type="number" value="${v.anio}"/></div>
      <div class="field-group"><label>Capacidad pasajeros</label><input id="dr-cap" type="number" value="${v.capacidad || ''}"/></div>
      <div class="field-group"><label>N° Motor</label><input id="dr-motor" value="${v.numMotor || ''}"/></div>
      <div class="field-group"><label>N° Chasis</label><input id="dr-chasis" value="${v.numChasis || ''}"/></div>
      <div class="field-group"><label>Km actual</label><input id="dr-km" type="number" value="${v.kmActual}"/></div>
      <div class="field-group"><label>Vencimiento SOAT</label><input id="dr-vsoat" type="date" value="${venceSoatVal}"/></div>
      <div class="field-group"><label>Vencimiento Tecnomecánica</label><input id="dr-vtm" type="date" value="${venceTMVal}"/></div>
    `, async () => {
      const body = {
        placa: document.getElementById('dr-placa').value.trim(),
        marca: document.getElementById('dr-marca').value.trim(),
        modelo: document.getElementById('dr-modelo').value.trim(),
        anio: +document.getElementById('dr-anio').value,
        capacidad: +document.getElementById('dr-cap').value || undefined,
        numMotor: document.getElementById('dr-motor').value.trim() || undefined,
        numChasis: document.getElementById('dr-chasis').value.trim() || undefined,
        kmActual: +document.getElementById('dr-km').value,
        venceSoat: document.getElementById('dr-vsoat').value || undefined,
        venceTecnomecanica: document.getElementById('dr-vtm').value || undefined,
      };
      try {
        await api('PATCH', '/vehiculos/' + id, body);
        toast('Vehículo actualizado', 'success');
        cerrarDrawer();
        cargarVehiculos(); cargarDashboard();
      } catch(err) { toast(err.message, 'error'); }
    });
  } catch (err) {
    toast('Error al cargar datos del vehículo: ' + err.message, 'error');
  }
}

// ── Editar Usuario ───────────────────────────────────────────────────────────
function abrirDrawerEditarUsuario(id) {
  const u = usrCache.find(x => x.id === id);
  if (!u) return;
  abrirDrawer('Editar usuario — ' + u.nombre, `
    <div class="field-group"><label>Nombre</label><input id="dr-nombre" value="${u.nombre}"/></div>
    <div class="field-group" style="background:var(--slate-50);border-radius:8px;padding:10px 12px">
      <label style="color:var(--text-lt)">Correo (no editable)</label>
      <div style="font-size:14px;color:var(--text-md);margin-top:2px">${u.correo}</div>
    </div>
    <div class="field-group"><label>Rol</label>
      <select id="dr-rol">
        <option value="Administrador" ${u.rol==='Administrador'?'selected':''}>Administrador</option>
        <option value="Tecnico" ${u.rol==='Tecnico'?'selected':''}>Tecnico</option>
        <option value="Conductor" ${u.rol==='Conductor'?'selected':''}>Conductor</option>
      </select></div>
    <div class="field-group"><label>Nueva contraseña (min. 8 caracteres, dejar vacío para no cambiar)</label>
      <input id="dr-pass" type="password" placeholder="••••••••" minlength="8"/></div>
  `, async () => {
    const nombre = document.getElementById('dr-nombre').value.trim();
    const rol    = document.getElementById('dr-rol').value;
    const pass   = document.getElementById('dr-pass').value;
    if (!nombre) { toast('El nombre es obligatorio', 'error'); return; }
    if (pass && pass.length < 8) { toast('La contrasena debe tener minimo 8 caracteres', 'error'); return; }
    // UpdateUsuarioDto solo acepta: nombre, rol, contrasena, activo
    // NO acepta correo (whitelist:true lo rechaza)
    const body = { nombre, rol };
    if (pass) body.contrasena = pass;
    try {
      await api('PATCH', '/usuarios/' + id, body);
      toast('Usuario actualizado', 'success');
      cerrarDrawer();
      cargarUsuarios();
    } catch(err) { toast(err.message, 'error'); }
  });
}

// ── Editar Plan ──────────────────────────────────────────────────────────────
function abrirDrawerEditarPlan(planId, vehiculoId) {
  const p = planesCache.find(x => x.id === planId);
  if (!p) return;
  abrirDrawer('Editar plan — ' + p.nombre, `
    <div class="field-group"><label>Nombre del plan</label><input id="dr-pnombre" value="${p.nombre}"/></div>
    <div class="field-group"><label>Tipo de ciclo</label>
      <select id="dr-pciclo">
        <option value="km" ${p.tipoCiclo==='km'?'selected':''}>Por kilometraje</option>
        <option value="dias" ${p.tipoCiclo==='dias'?'selected':''}>Por dias</option>
        <option value="combinado" ${p.tipoCiclo==='combinado'?'selected':''}>Combinado</option>
      </select></div>
    <div class="field-group"><label>Intervalo Km (dejar vacío si no aplica)</label>
      <input id="dr-pkm" type="number" value="${p.intervaloKm || ''}"/></div>
    <div class="field-group"><label>Intervalo Días (dejar vacío si no aplica)</label>
      <input id="dr-pdias" type="number" value="${p.intervaloDias || ''}"/></div>
  `, async () => {
    const body = { nombre: document.getElementById('dr-pnombre').value.trim(), tipoCiclo: document.getElementById('dr-pciclo').value };
    const ik = parseInt(document.getElementById('dr-pkm').value);
    const id_ = parseInt(document.getElementById('dr-pdias').value);
    if (!isNaN(ik) && ik > 0) body.intervaloKm = ik; else body.intervaloKm = null;
    if (!isNaN(id_) && id_ > 0) body.intervaloDias = id_; else body.intervaloDias = null;
    try {
      await api('PATCH', '/vehiculos/' + vehiculoId + '/planes/' + planId, body);
      toast('Plan actualizado', 'success');
      cerrarDrawer();
      cargarPlanes();
    } catch(err) { toast(err.message, 'error'); }
  });
}

// ── Editar Asignación ────────────────────────────────────────────────────────
async function abrirDrawerEditarAsignacion(id) {
  try {
    toast('Cargando datos de la asignación…', 'info');
    const res = await api('GET', '/asignaciones/' + id);
    const a = res.data ?? res;
    if (!a) return;

    // Poblar dropdowns con datos del caché
    const vehs = vehCache || [];
    const conductors = usrCache.filter(u => u.rol === 'Conductor' && u.activo !== false) || [];

    const optVehs = vehs.map(v => 
      `<option value="${v.id}" ${v.id === a.vehiculo?.id ? 'selected' : ''}>${v.placa} — ${v.marca} ${v.modelo}</option>`
    ).join('');

    const optConds = conductors.map(u => 
      `<option value="${u.id}" ${u.id === a.conductor?.id ? 'selected' : ''}>${u.nombre}</option>`
    ).join('');

    const fIni = a.fechaInicio ? a.fechaInicio.split('T')[0] : '';
    const fFin = a.fechaFin ? a.fechaFin.split('T')[0] : '';

    abrirDrawer('Editar asignación #' + id, `
      <div class="field-group"><label>Vehículo *</label>
        <select id="dr-asig-veh" required>${optVehs}</select>
      </div>
      <div class="field-group"><label>Conductor *</label>
        <select id="dr-asig-con" required>${optConds}</select>
      </div>
      <div class="field-group"><label>Turno *</label>
        <select id="dr-asig-turno" required>
          <option value="completo" ${a.turno === 'completo' ? 'selected' : ''}>Completo</option>
          <option value="manana" ${a.turno === 'manana' ? 'selected' : ''}>Mañana</option>
          <option value="tarde" ${a.turno === 'tarde' ? 'selected' : ''}>Tarde</option>
          <option value="noche" ${a.turno === 'noche' ? 'selected' : ''}>Noche</option>
        </select>
      </div>
      <div class="field-group"><label>Fecha inicio *</label>
        <input id="dr-asig-ini" type="date" value="${fIni}" required/>
      </div>
      <div class="field-group"><label>Fecha fin</label>
        <input id="dr-asig-fin" type="date" value="${fFin}"/>
      </div>
      <div class="field-group"><label>Estado</label>
        <select id="dr-asig-activo">
          <option value="true" ${a.activo ? 'selected' : ''}>Activa</option>
          <option value="false" ${!a.activo ? 'selected' : ''}>Finalizada</option>
        </select>
      </div>
      <div class="field-group"><label>Observaciones</label>
        <textarea id="dr-asig-obs" rows="2">${a.observaciones || ''}</textarea>
      </div>
    `, async () => {
      const body = {
        vehiculoId: +document.getElementById('dr-asig-veh').value,
        conductorId: +document.getElementById('dr-asig-con').value,
        turno: document.getElementById('dr-asig-turno').value,
        fechaInicio: document.getElementById('dr-asig-ini').value,
        fechaFin: document.getElementById('dr-asig-fin').value || null,
        activo: document.getElementById('dr-asig-activo').value === 'true',
        observaciones: document.getElementById('dr-asig-obs').value.trim() || null,
      };

      try {
        await api('PATCH', '/asignaciones/' + id, body);
        toast('Asignación actualizada exitosamente', 'success');
        cerrarDrawer();
        cargarAsignaciones();
      } catch(err) { toast(err.message, 'error'); }
    });
  } catch (err) {
    toast('Error al cargar datos de la asignación: ' + err.message, 'error');
  }
}
// ═══════════════════════════════════════════════════════════════════════════
// GALERÍA DE VEHÍCULOS
// ═══════════════════════════════════════════════════════════════════════════
let galeriaCache = [];

async function cargarGaleria() {
  const grid = document.getElementById('galeria-vehiculos');
  if (!grid) return;
  grid.innerHTML = '<div class="td-loading">Cargando galería…</div>';
  try {
    // Asegurar vehículos y órdenes en cache
    let vehs = vehCache.length ? vehCache : [];
    if (!vehs.length) {
      const r = await api('GET', '/vehiculos');
      vehs = Array.isArray(r) ? r : (r.data || []);
    }
    if (!ordCache.length) await cargarOrdenes();

    galeriaCache = vehs.map(v => {
      // BUG FIX: filtrar por vehiculo.id OR vehiculoId correctamente
      const ords = ordCache.filter(o =>
        (o.vehiculo?.id ?? o.vehiculoId) === v.id
      );
      const fechaUltima = ords.length
        ? ords.map(o => o.fechaApertura).sort().slice(-1)[0]
        : null;
      return {
        vehiculoId: v.id,
        placa:  v.placa,
        marca:  v.marca,
        modelo: v.modelo,
        anio:   v.anio,
        ordIds: ords.map(o => o.id),
        fechaUltima,
      };
    })
    // Solo mostrar vehículos que tienen al menos 1 orden
    .filter(v => v.ordIds.length > 0);

    if (!galeriaCache.length) {
      grid.innerHTML = '<div class="td-loading">No hay vehículos con reparaciones registradas</div>';
      return;
    }

    filtrarGaleria();
    initParticles();
    _cargarConteoFotosGaleria();
  } catch(err) {
    grid.innerHTML = '<div class="td-loading" style="color:var(--red)">Error: ' + err.message + '</div>';
  }
}

// Carga en 2do plano el conteo de fotos por vehículo (no bloquea el render inicial)
async function _cargarConteoFotosGaleria() {
  const resultados = await Promise.allSettled(
    galeriaCache.map(async v => {
      const counts = await Promise.allSettled(
        v.ordIds.map(id => api('GET', '/ordenes/' + id + '/fotos').then(r => (r?.data ?? r)?.total ?? 0))
      );
      const total = counts.reduce((s, c) => s + (c.status === 'fulfilled' ? c.value : 0), 0);
      return { vehiculoId: v.vehiculoId, total };
    })
  );
  resultados.forEach(r => {
    if (r.status !== 'fulfilled') return;
    const v = galeriaCache.find(x => x.vehiculoId === r.value.vehiculoId);
    if (v) v.totalFotos = r.value.total;
  });
  // Re-render solo si seguimos en la página de galería
  const tbody = document.querySelector('#galeria-vehiculos .gal-table tbody');
  if (tbody) filtrarGaleria();
}

function filtrarGaleria() {
  const q     = (document.getElementById('gal-search')?.value || '').toLowerCase();
  const desde = document.getElementById('gal-desde')?.value || '';
  const hasta = document.getElementById('gal-hasta')?.value || '';

  let lista = galeriaCache;
  if (q) lista = lista.filter(v =>
    v.placa.toLowerCase().includes(q) ||
    (v.marca + ' ' + v.modelo).toLowerCase().includes(q)
  );
  if (desde) lista = lista.filter(v => v.fechaUltima && v.fechaUltima.slice(0, 10) >= desde);
  if (hasta) lista = lista.filter(v => v.fechaUltima && v.fechaUltima.slice(0, 10) <= hasta);

  const counter = document.getElementById('gal-counter');
  if (counter) counter.textContent = lista.length + ' vehículo' + (lista.length !== 1 ? 's' : '');
  pagInit('gal', lista, renderGaleria, 12);
}

// Llamado por los inputs Desde/Hasta del hero de Galería
function checkAutoFilterGaleria() { filtrarGaleria(); }

function limpiarFiltrosGaleria() {
  const s = document.getElementById('gal-search');
  const d = document.getElementById('gal-desde');
  const h = document.getElementById('gal-hasta');
  if (s) s.value = '';
  if (d) d.value = '';
  if (h) h.value = '';
  filtrarGaleria();
}

function renderGaleria(lista) {
  const grid = document.getElementById('galeria-vehiculos');
  if (!grid) return;
  if (!lista.length) {
    grid.innerHTML = '<div class="td-loading">Sin vehículos encontrados</div>';
    return;
  }
  grid.innerHTML = `
    <table class="data-table gal-table">
      <thead>
        <tr>
          <th></th>
          <th>Vehículo</th>
          <th>Placa</th>
          <th>Última reparación</th>
          <th>Reparaciones</th>
          <th>Fotos</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${lista.map((v, i) => {
          const reps = v.ordIds.length;
          return `
          <tr class="gal-veh-card" style="animation-delay:${i * 0.04}s"
              onclick="abrirGaleriaVehiculo(${v.vehiculoId},'${v.placa}','${v.marca} ${v.modelo} ${v.anio}')">
            <td class="gal-veh-chevron"><i class="fa-solid fa-truck"></i></td>
            <td><span class="gal-veh-placa">${v.marca} ${v.modelo} ${v.anio}</span></td>
            <td><span class="gal-veh-name">${v.placa}</span></td>
            <td>${v.fechaUltima ? fmtFecha(v.fechaUltima) : '—'}</td>
            <td>${reps}</td>
            <td>${v.totalFotos ?? '—'}</td>
            <td><button class="btn-outline btn-sm" onclick="event.stopPropagation();abrirGaleriaVehiculo(${v.vehiculoId},'${v.placa}','${v.marca} ${v.modelo} ${v.anio}')">Ver</button></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  grid.querySelectorAll('.gal-veh-card').forEach(c => obs.observe(c));
}

let mgalvCache = []; // todas las órdenes con fotos del vehículo abierto en el modal

async function abrirGaleriaVehiculo(vehiculoId, placa, nombre) {
  const modal = document.getElementById('m-galeria-veh');
  if (!modal) return;
  document.getElementById('mgalv-title').textContent = placa + ' · ' + nombre;
  const body = document.getElementById('mgalv-body');
  body.innerHTML = '<div class="td-loading">Cargando fotos…</div>';
  modal.style.display = 'flex';
  requestAnimationFrame(() => modal.classList.add('open'));

  // Reiniciar filtros de fecha del modal cada vez que se abre un vehículo nuevo
  const dDesde = document.getElementById('mgalv-desde');
  const dHasta = document.getElementById('mgalv-hasta');
  if (dDesde) dDesde.value = '';
  if (dHasta) dHasta.value = '';

  try {
    // Filtrado robusto igual que en cargarGaleria
    const ords = ordCache.filter(o =>
      (o.vehiculo?.id ?? o.vehiculoId) === vehiculoId
    );
    if (!ords.length) {
      mgalvCache = [];
      body.innerHTML = '<div class="td-loading">Sin órdenes de reparación para este vehículo</div>';
      return;
    }

    const fotosResultados = await Promise.allSettled(
      ords.map(o =>
        api('GET', '/ordenes/' + o.id + '/fotos')
          .then(r => ({ ordenId: o.id, fecha: o.fechaApertura, data: r?.data ?? r }))
      )
    );

    mgalvCache = fotosResultados
      .filter(r => r.status === 'fulfilled' && (r.value.data?.total ?? 0) > 0)
      .map(r => r.value);

    renderModalGaleria(mgalvCache);
  } catch (err) {
    mgalvCache = [];
    body.innerHTML = `<div class="td-loading" style="color:var(--red)">Error: ${err.message}</div>`;
  }
}

// Aplica el rango Desde/Hasta sobre mgalvCache y vuelve a pintar
function checkAutoFilterModalGaleria() {
  const desde = document.getElementById('mgalv-desde')?.value || '';
  const hasta = document.getElementById('mgalv-hasta')?.value || '';

  let lista = mgalvCache;
  if (desde) lista = lista.filter(item => item.fecha && item.fecha.slice(0, 10) >= desde);
  if (hasta) lista = lista.filter(item => item.fecha && item.fecha.slice(0, 10) <= hasta);

  renderModalGaleria(lista);
}

function limpiarFiltrosModalGaleria() {
  const d = document.getElementById('mgalv-desde');
  const h = document.getElementById('mgalv-hasta');
  if (d) d.value = '';
  if (h) h.value = '';
  renderModalGaleria(mgalvCache);
}

function renderModalGaleria(conFotos) {
  const body = document.getElementById('mgalv-body');
  if (!body) return;

  if (!mgalvCache.length) {
    body.innerHTML = '<div class="td-loading"><i class="fa-solid fa-camera" style="margin-right:6px"></i>Sin fotos registradas para este vehículo</div>';
    return;
  }
  if (!conFotos.length) {
    body.innerHTML = '<div class="td-loading"><i class="fa-solid fa-calendar-xmark" style="margin-right:6px"></i>Sin reparaciones en ese rango de fechas</div>';
    return;
  }

  try {

    body.innerHTML = conFotos.map((item, i) => {
      const antes   = item.data.antes   || [];
      const despues = item.data.despues || [];
      const fotoHtml = (arr, alt) => arr.length
        ? arr.map(f => `
          <div class="ba-foto-wrap" onclick="abrirFoto('${apiAssetUrl(f.url)}')">
            <img src="${apiAssetUrl(f.url)}" alt="${alt}"
                 onerror="this.parentElement.style.display='none'"/>
            <div class="ba-foto-overlay">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
              </svg>
            </div>
          </div>`).join('')
        : '<div class="ba-empty">Sin fotos</div>';

      // Datos de la orden ya disponibles en cache global de órdenes
      const ord = ordCache.find(o => o.id === item.ordenId) || {};
      const est = (ord.estado || '').toLowerCase().replace(' ', '-');

      return `
      <div class="ba-orden-block" style="animation-delay:${i * 0.1}s">
        <div class="ba-orden-hdr">
          <div class="ba-orden-num">Orden #${item.ordenId}</div>
          <div class="ba-orden-fecha">${fmtFecha(item.fecha)}</div>
          <div class="ba-orden-count">${antes.length + despues.length} foto${antes.length + despues.length !== 1 ? 's' : ''}</div>
        </div>
        <div class="ba-orden-split">
          <div class="ba-orden-left">
            <div class="ba-info-title">Información de la reparación</div>
            <div class="ba-info-item"><span class="ba-info-label">Técnico</span><span class="ba-info-val">${ord.tecnico?.nombre || '—'}</span></div>
            <div class="ba-info-item"><span class="ba-info-label">Estado</span><span class="ba-info-val"><span class="badge-estado ${est}">${ord.estado || '—'}</span></span></div>
            <div class="ba-info-item ba-info-desc"><span class="ba-info-label">Descripción</span><span class="ba-info-val">${ord.descripcion || '—'}</span></div>
          </div>
          <div class="ba-orden-right">
            <div class="ba-cols">
              <div class="ba-col">
                <div class="ba-col-label antes">Antes de la reparación</div>
                <div class="ba-fotos-grid">${fotoHtml(antes, 'Antes')}</div>
              </div>
              <div class="ba-divider">
                <div class="ba-divider-line"></div>
                <div class="ba-divider-icon">→</div>
                <div class="ba-divider-line"></div>
              </div>
              <div class="ba-col">
                <div class="ba-col-label despues">Después de la reparación</div>
                <div class="ba-fotos-grid">${fotoHtml(despues, 'Después')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
    }).join('');

    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.05 });
    document.querySelectorAll('.ba-orden-block').forEach(b => obs.observe(b));

  } catch(err) {
    body.innerHTML = '<div class="td-loading" style="color:var(--red)">Error: ' + err.message + '</div>';
  }
}

function initParticles() {
  const c = document.getElementById('gal-particles');
  if (!c) return;
  c.innerHTML = Array.from({length: 18}, (_, i) =>
    `<div class="particle" style="left:${Math.random()*100}%;top:${Math.random()*100}%;animation-delay:${Math.random()*4}s;animation-duration:${3+Math.random()*4}s;width:${3+Math.random()*5}px;height:${3+Math.random()*5}px;opacity:${0.1+Math.random()*0.3}"></div>`
  ).join('');
}