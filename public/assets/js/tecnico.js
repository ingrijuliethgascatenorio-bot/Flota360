const usuario = requireRole('Tecnico');
if (!usuario) throw new Error('stop');

/**
 * Determina el tipo de plan de una orden.
 * Preventivo → tiene plan asociado (generada por plan de mantenimiento del admin).
 * Correctivo → sin plan (intervención directa).
 * Declarada aquí y en app.js para mantener independencia de archivos (no hay módulos compartidos en este contexto).
 */
function etiquetaPlan(orden) {
  return orden?.plan?.nombre || (orden?.planId ? 'Preventivo' : 'Correctivo');
}

let misOrdenes    = [];
let vehTec        = [];
let repuestosTemp = [];   // repuestos en formulario activo
let fotosTemp     = [];   // fotos adjuntas (File[])
let ordenEditId   = null; // id de la orden en edición

(function init() {
  const ini = usuario.nombre.charAt(0).toUpperCase();
  const d   = new Date();
  const h   = d.getHours();
  document.getElementById('av').textContent        = ini;
  document.getElementById('av2').textContent       = ini;
  document.getElementById('u-name').textContent    = usuario.nombre;
  document.getElementById('u-title').textContent   = usuario.nombre;
  document.getElementById('dash-date').textContent = d.toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'});
  document.getElementById('greeting').textContent  = h<12?'Buenos días,':h<18?'Buenas tardes,':'Buenas noches,';

  cargarMisOrdenes();
  cargarVehiculos();
  cargarAlertasDash();
  // Popup de notificación al ingresar (via notifications.js)
  setTimeout(async () => {
    await asegurarOrdenesTecnico();
    let alertasTec = [];
    try {
      const ra = await api('GET', '/alertas');
      alertasTec = ra.data || ra || [];
    } catch {}
    fcMostrarPopupTecnico(alertasTec, misOrdenes);
  }, 1400);
})();

function showPage(id, title) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // Sincronizar top nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`nav-${id}`)?.classList.add('active');
  // Sincronizar bottom nav (circulo azul) sin importar desde donde se llame
  document.querySelectorAll('.t-bn-item').forEach(b => b.classList.remove('active'));
  document.getElementById(`bn-${id}`)?.classList.add('active');

  document.getElementById(`page-${id}`)?.classList.add('active');
  document.getElementById('page-title').textContent = title;
  if (id === 'alertas') cargarAlertasFull();
}

function ordenesPendientesComoAlertas() {
  return (misOrdenes || [])
    .filter(o => o.estado === 'Abierta')
    .map(o => ({
      tipoAlerta: 'orden_nueva',
      mensaje: `Orden #${o.id} asignada: ${o.descripcion || 'Sin descripcion'}`,
      placa: o.vehiculo?.placa || o.placa || 'N/D',
      generadaEn: o.createdAt || o.fechaApertura || new Date().toISOString(),
      ordenId: o.id,
    }));
}

async function asegurarOrdenesTecnico() {
  if (misOrdenes.length) return;
  const res = await api('GET', '/ordenes');
  const todas = res.data || res || [];
  misOrdenes = todas.filter(o => o.tecnico?.id === usuario.id || o.tecnicoId === usuario.id);
}

// ═══════════════════════════════════════════════
// ÓRDENES DEL TÉCNICO
// ═══════════════════════════════════════════════

// ── Paginación órdenes activas ────────────────
const ORD_PER_PAGE = 10;
let ordPagActual   = 1;
let ordListaActual = [];

async function cargarMisOrdenes() {
  try {
    const res   = await api('GET', '/ordenes');
    const todas = res.data || res || [];
    misOrdenes  = todas.filter(o => o.tecnico?.id === usuario.id || o.tecnicoId === usuario.id);

    // Resumen del día
    document.getElementById('cnt-total').textContent       = misOrdenes.length;
    document.getElementById('cnt-pendientes').textContent  = misOrdenes.filter(o => o.estado === 'Abierta').length;
    document.getElementById('cnt-proceso').textContent     = misOrdenes.filter(o => o.estado === 'En proceso').length;
    document.getElementById('cnt-finalizadas').textContent = misOrdenes.filter(o => o.estado === 'Cerrada').length;

    // Dashboard: órdenes activas (abiertas + en proceso), máx 5
    const activas = misOrdenes.filter(o => o.estado === 'Abierta' || o.estado === 'En proceso');
    _renderOrdenesActivasDash(activas.slice(0, 5));

    // Tabla principal: solo activas, con paginación
    renderMisOrdenes(activas, 'tb-mis-ord');

    // Gráfica de gastos mensuales
    drawMonthlyChart();
  } catch (err) {
    const cont = document.getElementById('dash-ordenes-activas');
    if (cont) cont.innerHTML = `<div class="td-loading" style="color:var(--red)">Error: ${err.message}</div>`;
  }
}

// ── Lista compacta "Órdenes activas" del dashboard ──────────────────
function _renderOrdenesActivasDash(lista) {
  const cont = document.getElementById('dash-ordenes-activas');
  if (!cont) return;
  if (!lista.length) {
    cont.innerHTML = `
      <div class="ai-empty ai-empty-sm">
        <div class="ai-empty-icon"><i class="fa-solid fa-circle-check"></i></div>
        <div class="ai-empty-title">Sin órdenes activas</div>
      </div>`;
    return;
  }
  cont.innerHTML = lista.map(o => {
    const est = (o.estado || '').toLowerCase().replace(' ', '-');
    return `
    <div class="dol-item" onclick="abrirDetalleOrden(${o.id})">
      <div class="dol-icon"><i class="fa-solid fa-car"></i></div>
      <div class="dol-info">
        <div class="dol-plate">${o.vehiculo?.placa || '—'}</div>
        <div class="dol-meta">${etiquetaPlan(o)} · <span class="dol-estado ${est}">${o.estado}</span></div>
      </div>
      <div class="dol-right">
        <div class="dol-date">${fmtFecha(o.fechaApertura)}</div>
        <i class="fa-solid fa-chevron-right"></i>
      </div>
    </div>`;
  }).join('');
}

// Render con paginación (tabla principal)
function renderMisOrdenes(lista, tbId) {
  ordListaActual = lista;
  ordPagActual   = 1;
  _renderOrdPag();
}

function _ordenFila(o) {
  const est = (o.estado||'').toLowerCase().replace(' ', '-');
  let acciones = '';
  if (o.estado === 'Abierta') {
    acciones = `
      <button class="btn-ghost btn-sm" onclick="abrirFotosAntesEIniciar(${o.id})"><i class="fa-solid fa-play"></i> Iniciar</button>`;
  } else if (o.estado === 'En proceso') {
    acciones = `
      <button class="btn-ghost btn-sm" style="color:var(--green)" onclick="abrirCostosYCerrar(${o.id})"><i class="fa-solid fa-check"></i> Cerrar</button>`;
  }
  return `<tr>
    <td data-label="#">#${o.id}</td>
    <td data-label="Vehículo">${o.vehiculo?.placa||'—'}</td>
    <td data-label="Plan">${etiquetaPlan(o)}</td>
    <td data-label="Apertura">${fmtFecha(o.fechaApertura)}</td>
    <td data-label="Estado"><span class="badge-estado ${est}">${o.estado}</span></td>
    <td data-label="Costo">$${fmt(o.costoTotal||0)}</td>
    <td data-label="Acciones"><div class="action-btns">
      <button class="btn-ghost btn-sm" onclick="abrirDetalleOrden(${o.id})">Ver</button>
      ${acciones}
    </div></td></tr>`;
}

function _renderOrdPag() {
  const tb    = document.getElementById('tb-mis-ord');
  const total = ordListaActual.length;
  const pages = Math.max(1, Math.ceil(total / ORD_PER_PAGE));
  ordPagActual = Math.min(Math.max(1, ordPagActual), pages);
  if (!tb) return;

  if (!total) {
    tb.innerHTML = `<tr><td colspan="7" class="td-loading">Sin órdenes pendientes</td></tr>`;
    _renderPagTec(0, 1, 0);
    return;
  }

  const desde  = (ordPagActual - 1) * ORD_PER_PAGE;
  tb.innerHTML = ordListaActual.slice(desde, desde + ORD_PER_PAGE).map(o => _ordenFila(o)).join('');
  _renderPagTec(total, pages, ordPagActual);
}

function _renderPagTec(total, pages, current) {
  let cont = document.getElementById('t-ord-pagination');
  if (!cont) {
    const sc = document.querySelector('#page-ordenes .t-section-card');
    if (!sc) return;
    cont = document.createElement('div');
    cont.id = 't-ord-pagination';
    cont.className = 't-pagination';
    sc.appendChild(cont);
  }
  if (pages <= 1) { cont.innerHTML = ''; return; }

  const desde = (current - 1) * ORD_PER_PAGE + 1;
  const hasta = Math.min(current * ORD_PER_PAGE, total);
  const nums  = _tPagNums(current, pages);
  const btns  = nums.map(n =>
    n === '…'
      ? `<span class="t-pag-dots">…</span>`
      : `<button class="t-pag-btn${n===current?' active':''}" onclick="ordPagActual=${n};_renderOrdPag()">${n}</button>`
  ).join('');

  cont.innerHTML = `
    <div class="t-pag-inner">
      <button class="t-pag-btn" onclick="ordPagActual--;_renderOrdPag()" ${current===1?'disabled':''}>‹</button>
      ${btns}
      <button class="t-pag-btn" onclick="ordPagActual++;_renderOrdPag()" ${current===pages?'disabled':''}>›</button>
      <span class="t-pag-info">${desde}–${hasta} de ${total}</span>
    </div>`;
}

function _tPagNums(cur, total) {
  if (total <= 7) return Array.from({length:total}, (_, i) => i + 1);
  const s = new Set([1, total, cur, cur-1, cur+1].filter(n => n >= 1 && n <= total));
  const arr = [...s].sort((a, b) => a - b);
  const res = [];
  arr.forEach((n, i) => { if (i && n - arr[i-1] > 1) res.push('…'); res.push(n); });
  return res;
}

function filtrarMisOrdenes() {
  const q   = document.getElementById('search-mis').value.toLowerCase();
  const est = document.getElementById('filtro-estado-ord').value;
  // Base: solo activas
  let lista = misOrdenes.filter(o => o.estado === 'Abierta' || o.estado === 'En proceso');
  if (q)   lista = lista.filter(o => (o.vehiculo?.placa||'').toLowerCase().includes(q) || String(o.id).includes(q));
  if (est) lista = lista.filter(o => o.estado === est);
  ordPagActual = 1;
  renderMisOrdenes(lista, 'tb-mis-ord');
}

async function cambiarEstado(id, estado) {
  if (!estado) return;
  try {
    await api('PATCH', `/ordenes/${id}/estado`, { estado });
    toast(`Orden #${id} → ${estado}`, 'success');
    cargarMisOrdenes();
  } catch (err) { toast(err.message, 'error'); }
}

async function cambiarEstadoConfirm(id, estado) {
  const msg = estado === 'Cerrada'
    ? `¿Cerrar la orden #${id}? Asegúrate de haber registrado costos y fotos.`
    : `¿Iniciar la orden #${id}? Pasará a "En proceso".`;
  const tipo = estado === 'Cerrada' ? 'warning' : 'info';
  const confirmado = await fcConfirm({
    title: estado === 'Cerrada' ? '¿Cerrar orden?' : '¿Iniciar orden?',
    message: msg,
    okText: estado === 'Cerrada' ? '<i class="fa-solid fa-check"></i> Cerrar' : '<i class="fa-solid fa-play"></i> Iniciar',
    cancelText: 'Cancelar',
    type: tipo,
    icon: estado === 'Cerrada' ? '<i class="fa-solid fa-flag-checkered"></i>' : '<i class="fa-solid fa-play"></i>',
  });
  if (!confirmado) return;
  await cambiarEstado(id, estado);
}

// ═══════════════════════════════════════════════
// FOTOS ANTES (orden Abierta)
// ═══════════════════════════════════════════════
// INICIAR ORDEN — pide fotos ANTES y cambia a "En proceso" al guardar
// ═══════════════════════════════════════════════
async function abrirFotosAntesEIniciar(id) {
  ordenEditId = id;
  fotosTemp   = [];

  document.getElementById('fc-title').innerHTML = `Orden #${id} — <i class="fa-solid fa-camera"></i> Fotos ANTES de iniciar`;

  // Ocultar sección costos/repuestos — solo fotos al iniciar
  const secCostos = document.getElementById('fc-seccion-costos');
  if (secCostos) secCostos.style.display = 'none';

  // Fijar tipo en 'antes' y ocultar el selector
  const tipoEl = document.getElementById('fc-tipo-foto');
  if (tipoEl) {
    tipoEl.value = 'antes';
    const fg = tipoEl.closest('.field-group');
    if (fg) fg.style.display = 'none';
  }

  // Texto del botón guardar
  const btn = document.getElementById('btn-guardar-costos');
  if (btn) btn.innerHTML = '<i class="fa-solid fa-play"></i> Guardar fotos e Iniciar';

  // Modo para que guardarCostos sepa qué hacer al terminar
  document.getElementById('m-form-costos').dataset.modo = 'iniciar';

  renderFotosPrev();
  openModal('m-form-costos');
}

// ═══════════════════════════════════════════════
// CERRAR ORDEN — pide costos + fotos DESPUÉS y cierra automáticamente
// ═══════════════════════════════════════════════
async function abrirCostosYCerrar(id) {
  ordenEditId   = id;
  repuestosTemp = [];
  fotosTemp     = [];

  document.getElementById('fc-title').innerHTML = `Orden #${id} — <i class="fa-solid fa-money-bill-wave"></i> Costos y fotos para cerrar`;

  // Mostrar sección costos
  const secCostos = document.getElementById('fc-seccion-costos');
  if (secCostos) secCostos.style.display = '';

  // Fijar tipo en 'despues' y ocultar el selector
  const tipoEl = document.getElementById('fc-tipo-foto');
  if (tipoEl) {
    tipoEl.value = 'despues';
    const fg = tipoEl.closest('.field-group');
    if (fg) fg.style.display = 'none';
  }

  // Texto del botón guardar
  const btn = document.getElementById('btn-guardar-costos');
  if (btn) btn.innerHTML = '<i class="fa-solid fa-check"></i> Guardar y Cerrar orden';

  // Modo para que guardarCostos sepa qué hacer al terminar
  document.getElementById('m-form-costos').dataset.modo = 'cerrar';

  document.getElementById('fc-mano-obra').value   = '';
  document.getElementById('fc-descripcion').value = '';
  document.getElementById('rep-nombre').value     = '';
  document.getElementById('rep-cantidad').value   = '';
  document.getElementById('rep-precio').value     = '';
  renderRepuestos();
  renderFotosPrev();
  openModal('m-form-costos');

  // Pre-cargar datos existentes
  try {
    const res = await api('GET', `/ordenes/${id}`);
    const o   = res.data || res;
    if (o.costoManoObra) document.getElementById('fc-mano-obra').value = o.costoManoObra;
    if (o.descripcion)   document.getElementById('fc-descripcion').value = o.descripcion;
    if (o.repuestos?.length) {
      repuestosTemp = o.repuestos.map(r => ({
        nombre: r.nombreRepuesto, cantidad: r.cantidad, precio: r.precioUnitario
      }));
      renderRepuestos();
    }
    recalcularTotal();
  } catch {}
}

function agregarRepuesto() {
  const nombre   = document.getElementById('rep-nombre').value.trim();
  const cantidad = parseFloat(document.getElementById('rep-cantidad').value) || 0;
  const precio   = parseFloat(document.getElementById('rep-precio').value) || 0;

  if (!nombre)       { toast('Ingresa el nombre del repuesto', 'error'); return; }
  if (cantidad <= 0) { toast('Cantidad debe ser mayor a 0', 'error'); return; }
  if (precio <= 0)   { toast('Precio debe ser mayor a 0', 'error'); return; }

  repuestosTemp.push({ nombre, cantidad, precio });
  document.getElementById('rep-nombre').value   = '';
  document.getElementById('rep-cantidad').value = '';
  document.getElementById('rep-precio').value   = '';
  renderRepuestos();
  recalcularTotal();
}

function eliminarRepuesto(idx) {
  repuestosTemp.splice(idx, 1);
  renderRepuestos();
  recalcularTotal();
}

function renderRepuestos() {
  const tb = document.getElementById('tb-repuestos');
  if (!tb) return;
  if (!repuestosTemp.length) {
    tb.innerHTML = '<tr><td colspan="5" class="td-loading" style="font-size:12px">Sin repuestos agregados</td></tr>';
    return;
  }
  tb.innerHTML = repuestosTemp.map((r, i) => `
    <tr>
      <td data-label="Repuesto">${r.nombre}</td>
      <td data-label="Cant.">${r.cantidad}</td>
      <td data-label="Precio unit.">$${fmt(r.precio)}</td>
      <td data-label="Subtotal">$${fmt(r.cantidad * r.precio)}</td>
      <td data-label=""><button class="btn-ghost btn-sm" onclick="eliminarRepuesto(${i})" style="color:var(--red);padding:2px 8px">✕ Quitar</button></td>
    </tr>`).join('');
}

function recalcularTotal() {
  const manoObra    = parseFloat(document.getElementById('fc-mano-obra').value) || 0;
  const subRepuestos = repuestosTemp.reduce((s, r) => s + r.cantidad * r.precio, 0);
  const total        = manoObra + subRepuestos;
  const el = document.getElementById('fc-total-preview');
  if (el) el.textContent = '$' + fmt(total);
}

// ── Gestión de fotos ──────────────────────────
function agregarFotos(input) {
  const archivos = Array.from(input.files);
  for (const f of archivos) {
    if (fotosTemp.length >= 5) { toast('Máximo 5 fotos por orden', 'error'); break; }
    if (!f.type.match(/image\/(jpeg|png)/)) { toast(f.name + ': solo JPG/PNG', 'error'); continue; }
    const totalBytes = fotosTemp.reduce((s, x) => s + x.size, 0) + f.size;
    if (totalBytes > 10 * 1024 * 1024) { toast('Límite de 10 MB total alcanzado', 'error'); break; }
    fotosTemp.push(f);
  }
  input.value = '';
  renderFotosPrev();
}

function eliminarFoto(idx) {
  fotosTemp.splice(idx, 1);
  renderFotosPrev();
}

function renderFotosPrev() {
  const c = document.getElementById('fotos-preview');
  if (!c) return;
  if (!fotosTemp.length) {
    c.innerHTML = '<div class="fotos-empty"><i class="fa-solid fa-camera"></i> Sin fotos adjuntas — máx. 5 fotos JPG/PNG (10 MB total)</div>';
    return;
  }
  c.innerHTML = fotosTemp.map((f, i) => {
    const url = URL.createObjectURL(f);
    return `<div class="foto-thumb">
      <img src="${url}" alt="${f.name}" onclick="verFotoGrande('${url}','${f.name}')"/>
      <button class="foto-del" onclick="eliminarFoto(${i})">✕</button>
      <div class="foto-name">${f.name.length > 18 ? f.name.substring(0,16)+'…' : f.name}</div>
    </div>`;
  }).join('');
}

function verFotoGrande(url, nombre) {
  document.getElementById('foto-grande-img').src           = url;
  document.getElementById('foto-grande-nombre').textContent = nombre;
  openModal('m-foto-grande');
}

// ── Guardar costos y fotos ────────────────────
async function guardarCostos() {
  if (!ordenEditId) return;

  const modal    = document.getElementById('m-form-costos');
  const modo     = modal.dataset.modo || 'costos'; // 'iniciar' | 'cerrar' | 'costos'
  const tipoFoto = document.getElementById('fc-tipo-foto').value;

  // Validacion: fotos obligatorias
  if (fotosTemp.length === 0) {
    const labelFoto = modo === 'iniciar'
      ? 'Debes agregar al menos una foto del ANTES de la reparacion para iniciar.'
      : 'Debes agregar al menos una foto del DESPUES de la reparacion para cerrar la orden.';
    toast(labelFoto, 'error');
    return;
  }

  // Validacion extra al cerrar: mano de obra obligatoria
  if (modo === 'cerrar') {
    const manoObraVal = parseFloat(document.getElementById('fc-mano-obra').value) || 0;
    if (manoObraVal <= 0) {
      toast('Debes ingresar el costo de mano de obra antes de cerrar la orden.', 'error');
      return;
    }
  }

  const manoObra    = parseFloat(document.getElementById('fc-mano-obra').value) || 0;
  const descripcion = document.getElementById('fc-descripcion').value.trim();

  const btn = document.getElementById('btn-guardar-costos');
  btn.disabled    = true;
  btn.textContent = 'Guardando…';

  try {
    // 1) Costos, descripcion y repuestos (solo en modo cerrar o costos)
    if (modo !== 'iniciar') {
      await api('PATCH', `/ordenes/${ordenEditId}/costos`, {
        costoManoObra: manoObra,
        descripcion,
        repuestos: repuestosTemp.map(r => ({
          nombreRepuesto: r.nombre,
          cantidad: r.cantidad,
          precioUnitario: r.precio
        }))
      });
    }

    // 2) Fotos (multipart) - siempre hay al menos una (validado arriba)
    const fd = new FormData();
    fotosTemp.forEach(f => fd.append('files', f));
    fd.append('tipoFoto', tipoFoto);
    await apiForm('POST', `/ordenes/${ordenEditId}/fotos`, fd);

    // 3) Cambio de estado automatico segun modo
    if (modo === 'iniciar') {
      await api('PATCH', `/ordenes/${ordenEditId}/estado`, { estado: 'En proceso' });
      toast(`Orden #${ordenEditId} iniciada`, 'success');
    } else if (modo === 'cerrar') {
      await api('PATCH', `/ordenes/${ordenEditId}/estado`, { estado: 'Cerrada' });
      toast(`Orden #${ordenEditId} cerrada`, 'success');
    } else {
      toast('Guardado correctamente', 'success');
    }

    closeModal('m-form-costos');
    cargarMisOrdenes();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Guardar';
    delete modal.dataset.modo;
  }
}

// ═══════════════════════════════════════════════
// DETALLE ORDEN
// ═══════════════════════════════════════════════
async function abrirDetalleOrden(id) {
  document.getElementById('mdo-title').textContent = `Orden #${id}`;
  document.getElementById('mdo-body').innerHTML    = '<div class="td-loading">Cargando…</div>';
  openModal('m-det-ord');
  try {
    const res = await api('GET', `/ordenes/${id}`);
    const o   = res.data || res;
    const est = (o.estado||'').toLowerCase().replace(' ','-');

    let html = `<div class="detalle-section"><h4>Datos de la orden</h4>
      <div class="detalle-grid">
        <div class="dg-item"><span class="dg-label">Vehículo</span><span class="dg-val">${o.vehiculo?.placa||'—'}</span></div>
        <div class="dg-item"><span class="dg-label">Estado</span><span class="dg-val"><span class="badge-estado ${est}">${o.estado}</span></span></div>
        <div class="dg-item"><span class="dg-label">Apertura</span><span class="dg-val">${fmtFecha(o.fechaApertura)}</span></div>
        <div class="dg-item"><span class="dg-label">Mano de obra</span><span class="dg-val">$${fmt(o.costoManoObra||0)}</span></div>
        <div class="dg-item"><span class="dg-label">Costo total</span><span class="dg-val" style="font-weight:700;color:var(--blue-700);font-size:15px">$${fmt(o.costoTotal||0)}</span></div>
        <div class="dg-item"><span class="dg-label">Plan</span><span class="dg-val">${etiquetaPlan(o)}</span></div>
      </div>
      ${o.descripcion ? `<div style="margin-top:10px;background:var(--slate-50);padding:10px 14px;border-radius:8px;font-size:13px;color:var(--text-md)">${o.descripcion}</div>` : ''}
    </div>`;

    // Repuestos
    if (o.repuestos?.length) {
      const totalRep = o.repuestos.reduce((s, r) => s + (parseFloat(r.subtotal) || (r.cantidad * r.precioUnitario) || 0), 0);
      html += `<div class="detalle-section"><h4>Repuestos (${o.repuestos.length})</h4>
        <table class="data-table"><thead><tr><th>Repuesto</th><th>Cant.</th><th>Precio unit.</th><th>Subtotal</th></tr></thead>
        <tbody>${o.repuestos.map(r => {
          const sub = parseFloat(r.subtotal) || (r.cantidad * r.precioUnitario) || 0;
          return `<tr>
            <td data-label="Repuesto">${r.nombreRepuesto}</td>
            <td data-label="Cant.">${r.cantidad}</td>
            <td data-label="Precio unit.">$${fmt(r.precioUnitario)}</td>
            <td data-label="Subtotal">$${fmt(sub)}</td></tr>`;
        }).join('')}
          <tr style="background:var(--slate-50);font-weight:600">
            <td colspan="3" style="text-align:right;padding-right:12px">Total repuestos:</td>
            <td>$${fmt(totalRep)}</td>
          </tr>
        </tbody></table></div>`;
    } else {
      html += `<div class="detalle-section"><h4>Repuestos</h4><p style="font-size:13px;color:var(--text-lt)">Sin repuestos registrados.</p></div>`;
    }

    // Galería de fotos — se carga aparte para no depender de la relación eager
    let fotos = o.fotos || [];
    if (!fotos.length) {
      try {
        const fRes = await api('GET', `/ordenes/${id}/fotos`);
        const gal  = fRes.data || fRes;
        console.log('GAL:', gal);
        fotos = [...(gal.antes || []), ...(gal.despues || [])];
      } catch {}
    }

    if (fotos.length) {
      html += `<div class="detalle-section"><h4><i class="fa-solid fa-images"></i> Galería (${fotos.length} fotos)</h4>
        <div class="galeria-grid">${fotos.map(f => {
          const url = apiAssetUrl(f.url);
          const etiqueta = f.tipoFoto === 'antes' ? '🔵 ANTES' : f.tipoFoto === 'despues' ? '🟢 DESPUÉS' : (f.tipoFoto||'FOTO').toUpperCase();
          return `
          <div class="galeria-item" onclick="window.open('${url}','_blank')" style="cursor:pointer;position:relative">
            <img src="${url}" alt="Foto" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
            <div style="display:none;height:100px;background:var(--slate-100);align-items:center;justify-content:center;font-size:11px;color:var(--text-lt);text-align:center;padding:10px">
              ⚠️ Archivo no encontrado en VPS
            </div>
            <div class="galeria-caption">${etiqueta} · ${fmtFecha(f.tomadaEn)}</div>
          </div>`;
        }).join('')}</div></div>`;
    } else {
      html += `<div class="detalle-section"><h4><i class="fa-solid fa-images"></i> Galería de fotos</h4><p style="font-size:13px;color:var(--text-lt)">Sin fotos adjuntas.</p></div>`;
    }

    window._ordenDetalleTecnicoActual = o;
    html += `<div style="padding:14px 0;border-top:1.5px solid var(--slate-100);display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between">
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        ${o.estado === 'Abierta' ? `<button class="btn-ghost btn-sm" onclick="closeModal('m-det-ord');abrirFotosAntesEIniciar(${id})"><i class="fa-solid fa-play"></i> Iniciar (requiere foto ANTES)</button>` : ''}
        ${o.estado === 'En proceso' ? `<button class="btn-ghost btn-sm" style="color:var(--green)" onclick="closeModal('m-det-ord');abrirCostosYCerrar(${id})"><i class="fa-solid fa-check"></i> Cerrar (requiere costos y foto DESPUÉS)</button>` : ''}
      </div>
      <button class="btn-primary btn-sm" onclick="window.generarReporteMantenimientoPDF(window._ordenDetalleTecnicoActual)" style="display:inline-flex;align-items:center;gap:6px">
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        Descargar reporte PDF
      </button>
    </div>`;

    document.getElementById('mdo-body').innerHTML = html;
  } catch (err) {
    document.getElementById('mdo-body').innerHTML = `<div class="td-loading" style="color:var(--red)">Error: ${err.message}</div>`;
  }
}

// ═══════════════════════════════════════════════
// VEHÍCULOS (solo lectura)
// ═══════════════════════════════════════════════
async function cargarVehiculos() {
  try {
    const res = await api('GET', '/dashboard');
    vehTec    = res.data?.vehiculos || [];
    renderVehiculosTec(vehTec);
  } catch {}
}

function renderVehiculosTec(lista) {
  const g = document.getElementById('veh-grid-tec');
  if (!g) return;
  g.innerHTML = lista.length ? lista.map(v => {
    const s = v.estadoSemaforo || 'verde';
    return `<div class="veh-card ${s}" onclick="abrirDetalleVehiculo(${v.vehiculoId})">
      <div class="veh-header">
        <div><div class="veh-placa">${v.placa}</div><div class="veh-marca">${v.marca} ${v.modelo}</div></div>
        <span class="veh-sem-badge ${s}">${s}</span>
      </div>
      <div class="veh-stats">
        <div class="veh-stat-item"><span class="vst-label">Km actual</span><span class="vst-val">${fmt(v.kmActual)} km</span></div>
        <div class="veh-stat-item"><span class="vst-label">Alertas activas</span><span class="vst-val">${v.alertasActivas||0}</span></div>
      </div>
      ${v.alertasActivas > 0 ? `<div class="veh-alerts"><i class="fa-solid fa-bell"></i> ${v.alertasActivas} alerta(s)</div>` : ''}
    </div>`;
  }).join('') : '<div class="grid-loading">Sin vehículos</div>';
}

function filtrarVehiculosTec() {
  const q = document.getElementById('search-veh-t').value.toLowerCase();
  renderVehiculosTec(vehTec.filter(v =>
    v.placa.toLowerCase().includes(q) || v.marca.toLowerCase().includes(q)));
}

async function abrirDetalleVehiculo(id) {
  document.getElementById('mdv-title').textContent = 'Cargando…';
  document.getElementById('mdv-body').innerHTML    = '<div class="td-loading">Cargando…</div>';
  openModal('m-det-veh');
  try {
    const { data: d } = await api('GET', `/dashboard/vehiculos/${id}`);
    const v = d.vehiculo;
    document.getElementById('mdv-title').textContent = `${v.placa} — ${v.marca} ${v.modelo}`;
    let html = `<div class="detalle-section"><h4>Datos</h4>
      <div class="detalle-grid">
        <div class="dg-item"><span class="dg-label">Placa</span><span class="dg-val">${v.placa}</span></div>
        <div class="dg-item"><span class="dg-label">Marca / Modelo</span><span class="dg-val">${v.marca} ${v.modelo}</span></div>
        <div class="dg-item"><span class="dg-label">Km actual</span><span class="dg-val">${fmt(v.kmActual)} km</span></div>
        <div class="dg-item"><span class="dg-label">Estado</span><span class="dg-val"><span class="veh-sem-badge ${v.estadoSemaforo}">${v.estadoSemaforo}</span></span></div>
      </div></div>`;
    if (d.alertas?.length)
      html += `<div class="detalle-section"><h4>Alertas (${d.alertas.length})</h4>
        <div class="alertas-list-modal">${d.alertas.map(a => `
          <div class="alert-item ${a.tipoAlerta}">
            <span class="alert-icon">${iconAlerta(a.tipoAlerta)}</span>
            <div class="alert-body"><div class="alert-msg">${a.mensaje}</div></div>
          </div>`).join('')}</div></div>`;
    if (d.planes?.length)
      html += `<div class="detalle-section"><h4><i class="fa-solid fa-wrench"></i> Planes de mantenimiento</h4>
        <table class="data-table"><thead><tr><th>Plan</th><th>Ciclo</th><th>Km restantes</th><th>Fecha próxima</th></tr></thead>
        <tbody>${d.planes.map(p => `<tr>
          <td>${p.nombre}</td><td>${p.tipoCiclo}</td>
          <td>${p.kmRestantes !== null ? (p.kmRestantes <= 0 ? '<span style="color:var(--red);font-weight:600">¡Vencido!</span>' : fmt(p.kmRestantes)+' km') : '—'}</td>
          <td>${p.fechaProxima||'—'}</td></tr>`).join('')}</tbody></table></div>`;

    if (d.documentos?.length)
      html += `<div class="detalle-section"><h4><i class="fa-solid fa-file-lines"></i> Documentos Legales</h4>
        <div class="docs-grid-tec">${d.documentos.map(doc => {
          const icon = doc.tipo === 'SOAT' ? '<i class="fa-solid fa-shield-halved"></i>' : '<i class="fa-solid fa-screwdriver-wrench"></i>';
          const badge = doc.vencido ? 'badge-red' : (doc.diasRestantes < 15 ? 'badge-yellow' : 'badge-green');
          return `
          <div class="doc-tec-card ${doc.vencido ? 'vencido' : ''}">
            <div class="doc-tec-icon">${icon}</div>
            <div class="doc-tec-info">
              <div class="doc-tec-name">${doc.tipo}</div>
              <div class="doc-tec-date">Vence: ${fmtFecha(doc.fechaVencimiento)}</div>
            </div>
            <span class="doc-tec-status ${badge}">${doc.vencido ? 'Vencido' : doc.diasRestantes + ' días'}</span>
          </div>`;
        }).join('')}</div></div>`;
    document.getElementById('mdv-body').innerHTML = html;
  } catch (err) {
    document.getElementById('mdv-body').innerHTML = `<div class="td-loading" style="color:var(--red)">Error: ${err.message}</div>`;
  }
}

// ═══════════════════════════════════════════════
// HELPERS DE ALERTAS
// ═══════════════════════════════════════════════

// Metadatos visuales por tipo de alerta
function _alertaMeta(tipo) {
  const map = {
    orden_nueva:           { color:'blue',   bg:'#e8f0fe', border:'#1a56db', label:'Nueva orden',       emoji:'<i class="fa-solid fa-clipboard-list"></i>' },
    mantenimiento_proximo: { color:'yellow', bg:'#fef9e7', border:'#f59e0b', label:'Mantenimiento',     emoji:'<i class="fa-solid fa-wrench"></i>' },
    mantenimiento_vencido: { color:'red',    bg:'#fff0f0', border:'#ef4444', label:'¡Vencido!',         emoji:'<i class="fa-solid fa-siren-on"></i>' },
  };
  return map[tipo] || { color:'blue', bg:'#e8f0fe', border:'#1a56db', label:'Alerta', emoji:'<i class="fa-solid fa-bell"></i>' };
}

// Tiempo relativo tipo "hace 2 horas"
function _tiempoRelativo(str) {
  if (!str) return '';
  const diff = Date.now() - new Date(str).getTime();
  const min  = Math.floor(diff / 60000);
  if (min < 1)   return 'Ahora mismo';
  if (min < 60)  return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24)    return `Hace ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1)   return 'Ayer';
  if (d < 7)     return `Hace ${d} días`;
  return fmtFecha(str);
}

// Nivel de prioridad para la tarjeta del dashboard
function _prioridadAlerta(tipo) {
  if (tipo === 'orden_nueva') return 'Nueva orden';
  if (tipo === 'mantenimiento_vencido') return 'Alta prioridad';
  return 'Requiere atención';
}

// ── Card compacta para DASHBOARD (scroll horizontal) ─────────────
function _renderAlertaDash(a) {
  const m   = _alertaMeta(a.tipoAlerta);
  const fullMsg = a.mensaje;

  // Categoría corta para la tarjeta
  let shortDesc = fullMsg;
  const matchComillas = fullMsg.match(/"([^"]+)"/);
  if (matchComillas) {
    shortDesc = matchComillas[1];
  } else if (fullMsg.startsWith('Orden #')) {
    const partes = fullMsg.split(': ');
    if (partes.length > 1) shortDesc = partes.slice(1).join(': ');
  } else {
    if (fullMsg.includes('SOAT')) shortDesc = 'SOAT';
    else if (fullMsg.includes('Tecnomecánica') || fullMsg.includes('TM') || fullMsg.includes('Revisión')) shortDesc = 'Tecnomecánica';
  }

  return `
  <div class="ai-dash-card" onclick="${a.ordenId ? `abrirDetalleOrden(${a.ordenId})` : ''}">
    <div class="ai-dash-card-icon" style="color:${m.border};background:${m.bg}">${m.emoji}</div>
    <div class="ai-dash-card-plate">${a.placa || 'N/D'}</div>
    <div class="ai-dash-card-cat">${shortDesc}</div>
    <span class="ai-dash-card-badge" style="color:${m.border};background:${m.bg}">${_prioridadAlerta(a.tipoAlerta)}</span>
  </div>`;
}

// ── Card feed para SECCIÓN ALERTAS ───────────────
function _renderAlertaFeed(a) {
  const m = _alertaMeta(a.tipoAlerta);
  let desc = a.mensaje;
  if (desc.startsWith('Orden #')) {
    const partes = desc.split(': ');
    if (partes.length > 1) desc = partes.slice(1).join(': ');
  }

  return `
  <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--slate-100); cursor: pointer; transition: background 0.2s; background: #fff;" onmouseover="this.style.background='var(--slate-50)'" onmouseout="this.style.background='#fff'" onclick="${a.ordenId ? `abrirDetalleOrden(${a.ordenId})` : ''}">
    <div style="display: flex; align-items: center; gap: 16px;">
      <div style="color: ${m.border}; font-size: 18px; display: flex; align-items: center; justify-content: center; width: 28px;">
        ${m.emoji}
      </div>
      <div>
        <div style="font-weight: 600; font-size: 15px; color: var(--navy); line-height: 1.3;">${desc}</div>
        <div style="font-size: 13px; color: var(--text-lt); margin-top: 3px; display: flex; gap: 8px; align-items: center;">
          <span>🚗 ${a.placa || 'N/D'}</span>
          <span style="color: var(--slate-300)">•</span>
          <span>${_tiempoRelativo(a.generadaEn)}</span>
        </div>
      </div>
    </div>
    <div style="text-align: right;">
      <span style="font-size: 11px; font-weight: 700; color: ${m.border}; background: ${m.bg}; padding: 4px 10px; border-radius: 99px; white-space: nowrap;">${m.label}</span>
    </div>
  </div>`;
}

// ── Recopilar todas las alertas ───────────────────
async function _recopilarAlertas(vehs) {
  let todas = ordenesPendientesComoAlertas();
  vehs.forEach(v => {
    if (v.alertasDetalle?.length) {
      v.alertasDetalle
        .filter(a => !a.tipoAlerta?.startsWith('documento_'))
        .forEach(a => todas.push({ ...a, placa: v.placa }));
    }
  });
  todas.sort((a, b) => new Date(b.generadaEn) - new Date(a.generadaEn));
  return todas;
}

// ═══════════════════════════════════════════════
// ALERTAS FULL — sección feed estilo Facebook
// ═══════════════════════════════════════════════
async function cargarAlertasFull() {
  const c = document.getElementById('alertas-full');
  if (!c) return;
  c.innerHTML = '<div class="td-loading">Cargando alertas…</div>';
  try {
    await asegurarOrdenesTecnico();
    if (!vehTec.length) {
      const r = await api('GET', '/dashboard');
      vehTec  = r.data?.vehiculos || [];
    }
    const todas = await _recopilarAlertas(vehTec);
    if (!todas.length) {
      c.innerHTML = `
        <div class="ai-empty">
          <div class="ai-empty-icon"><i class="fa-solid fa-circle-check"></i></div>
          <div class="ai-empty-title">Todo en orden</div>
          <div class="ai-empty-sub">No hay alertas activas en este momento</div>
        </div>`;
      return;
    }
    c.innerHTML = `<div class="ai-feed-list">${todas.map(a => _renderAlertaFeed(a)).join('')}</div>`;
  } catch (err) {
    c.innerHTML = `<div class="td-loading" style="color:var(--red)">Error: ${err.message}</div>`;
  }
}

// ═══════════════════════════════════════════════
// ALERTAS DASH — cards compactas en dashboard
// ═══════════════════════════════════════════════
async function cargarAlertasDash() {
  const c = document.getElementById('alertas-dash');
  if (!c) return;
  try {
    await asegurarOrdenesTecnico();
    const r    = await api('GET', '/dashboard');
    const vehs = r.data?.vehiculos || [];
    vehTec = vehs; // guardar para reusar en cargarAlertasFull
    const todas = await _recopilarAlertas(vehs);
    const urgentes = todas.slice(0, 6);

    if (!urgentes.length) {
      c.innerHTML = `
        <div class="ai-empty ai-empty-sm">
          <div class="ai-empty-icon"><i class="fa-solid fa-circle-check"></i></div>
          <div class="ai-empty-title">Sin alertas urgentes</div>
        </div>`;
    } else {
      c.innerHTML = `<div class="ai-dash-list">${urgentes.map(a => _renderAlertaDash(a)).join('')}</div>`;
    }

    // Alimentar panel de notificaciones (FC_ADMIN_PANEL) — SOLO órdenes de trabajo
    // (se excluyen alertas de mantenimiento y de documentos del vehículo)
    if (typeof FC_ADMIN_PANEL !== 'undefined' && typeof FC_ADMIN_PANEL.addItems === 'function') {
      const soloOrdenes = todas.filter(a => a.tipoAlerta === 'orden_nueva');
      const notifItems = soloOrdenes.map((a, idx) => ({
        id: a.ordenId ? `ord-${a.ordenId}` : `orden-${idx}`,
        icon: '<i class="fa-solid fa-clipboard-list"></i>',
        type: 'info',
        msg: a.mensaje + (a.placa ? ` <strong>(${a.placa})</strong>` : ''),
        time: typeof _tiempoRelativo === 'function' ? _tiempoRelativo(a.generadaEn) : 'Ahora',
        unread: true,
        _date: a.generadaEn,
        onClick: () => showPage('ordenes', 'Mis Órdenes'),
      }));
      if (notifItems.length) FC_ADMIN_PANEL.addItems(notifItems);
    }

    // Contador de notificaciones en el menú inferior (botón "Alertas")
    const bnBadge = document.getElementById('bn-alertas-count');
    if (bnBadge) {
      if (todas.length > 0) {
        bnBadge.textContent = todas.length > 99 ? '99+' : todas.length;
        bnBadge.style.display = 'flex';
      } else {
        bnBadge.style.display = 'none';
      }
    }
  } catch (err) {
    c.innerHTML = `<div class="td-loading">Error cargando alertas</div>`;
  }
}
// (popup al ingresar movido a notifications.js → fcMostrarPopupTecnico)

// ═══════════════════════════════════════════════
// GRÁFICA GASTOS MENSUALES
// ═══════════════════════════════════════════════
function drawMonthlyChart(meses = 6) {
  const ctx = document.getElementById('tec-monthly-chart');
  if (!ctx) return;

  // Filtrar órdenes cerradas (reparaciones completadas)
  const cerradas = misOrdenes.filter(o => o.estado === 'Cerrada');

  // Nombres cortos de meses en español
  const mesesNombres = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const ultimosMeses = [];
  const hoy = new Date();

  // Generar los últimos N meses en orden cronológico
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    ultimosMeses.push({
      year:  d.getFullYear(),
      month: d.getMonth(),
      label: mesesNombres[d.getMonth()],
      total: 0
    });
  }

  // Agrupar costos reales por mes
  cerradas.forEach(o => {
    const fechaStr = o.fechaCierre || o.createdAt || o.fechaApertura;
    if (!fechaStr) return;
    const date = new Date(fechaStr);
    const y = date.getFullYear();
    const m = date.getMonth();
    const mesData = ultimosMeses.find(item => item.year === y && item.month === m);
    if (mesData) {
      const costo = parseFloat(o.costoTotal);
      mesData.total += isNaN(costo) ? 0 : costo;
    }
  });

  const labels = ultimosMeses.map(item => item.label);
  const values = ultimosMeses.map(item => item.total);

  // Actualizar título de la sección según el período elegido
  const tituloEl = document.getElementById('gastos-chart-title');
  if (tituloEl) tituloEl.textContent = `Gastos últimos ${meses} meses`;

  // Destruir gráfica anterior si existe para evitar superposiciones
  if (window.tecChartInstance) {
    window.tecChartInstance.destroy();
    window.tecChartInstance = null;
  }

  // Crear la gráfica con Chart.js
  window.tecChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Gastos de Reparación ($)',
        data: values,
        backgroundColor: 'rgba(26, 86, 219, 0.15)',
        borderColor: 'rgba(26, 86, 219, 1)',
        borderWidth: 2,
        borderRadius: 6,
        barThickness: 24
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return 'Total: $' + context.raw.toLocaleString('es-CO');
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: {
            callback: function(value) {
              return '$' + value.toLocaleString('es-CO');
            }
          }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

// ════════════════════════════════════════════════════════════════
// Lógica de UI movida desde el <script> inline de tecnico.html
// (bottom nav, init, Mis Reparaciones con paginación, patch showPage)
// ════════════════════════════════════════════════════════════════
// ── Bottom nav ──────────────────────────────────────────────────────────
function bnNav(id, title, el) {
  document.querySelectorAll('.t-bn-item').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  showPage(id, title);
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('nav-' + id)?.classList.add('active');
}

// ── Init ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  if (typeof FC_ADMIN_PANEL !== 'undefined') FC_ADMIN_PANEL.init?.();
  else setTimeout(() => { if (typeof FC_ADMIN_PANEL !== 'undefined') FC_ADMIN_PANEL.init?.(); }, 100);

  document.addEventListener('click', function (e) {
    const wrap = document.querySelector('.t-avatar-wrap');
    if (wrap && !wrap.contains(e.target)) wrap.classList.remove('open');
  });
});

// ── Mis reparaciones (historial de órdenes cerradas) ───────────────────
const REP_PER_PAGE = 10;
let repPagActual = 1;
let repListaActual = [];

async function cargarMisReparaciones() {
  const tb = document.getElementById('tb-mis-reps');
  if (!tb) return;
  try {
    let ords = (typeof misOrdenes !== 'undefined' && misOrdenes.length)
      ? misOrdenes
      : await (async () => {
          const u = typeof getUsuario === 'function' ? getUsuario() : (typeof usuario !== 'undefined' ? usuario : {id:null});
          const res = await api('GET', '/ordenes');
          const todas = res.data || res || [];
          return todas.filter(o => o.tecnico?.id === u.id || o.tecnicoId === u.id);
        })();
    const cerradas = ords.filter(o => o.estado === 'Cerrada');
    repListaActual = cerradas;
    repPagActual   = 1;
    _renderRepPag();
  } catch (err) {
    tb.innerHTML = `<tr><td colspan="7" class="td-loading" style="color:var(--red)">Error: ${err.message}</td></tr>`;
  }
}

function _renderRepPag() {
  const tb     = document.getElementById('tb-mis-reps');
  const total  = repListaActual.length;
  const pages  = Math.max(1, Math.ceil(total / REP_PER_PAGE));
  repPagActual = Math.min(Math.max(1, repPagActual), pages);

  if (!tb) return;
  if (!total) {
    tb.innerHTML = '<tr><td colspan="7" class="td-loading">Sin reparaciones cerradas aún</td></tr>';
    _renderRepPagCtrl(0, 1, 0);
    return;
  }

  const desde  = (repPagActual - 1) * REP_PER_PAGE;
  const pagina = repListaActual.slice(desde, desde + REP_PER_PAGE);
  const fmtFechaLocal = d => d ? new Date(d).toLocaleDateString('es-CO') : '—';
  const fmtNum = n => Number(n || 0).toLocaleString('es-CO');

  tb.innerHTML = pagina.map((o, i) => {
    const veh = _vehIconRep(o.vehiculo?.marca, o.vehiculo?.modelo, desde + i);
    return `<tr>
    <td class="rep-veh-icon-cell"><div class="rep-veh-icon ${veh.color}"><i class="fa-solid ${veh.icon}"></i></div></td>
    <td data-label="Vehículo">${o.vehiculo?.marca||'—'} ${o.vehiculo?.modelo||''}</td>
    <td data-label="Placa"><strong>${o.vehiculo?.placa||'—'}</strong></td>
    <td data-label="Fecha">${fmtFechaLocal(o.fechaCierre||o.fechaApertura)}</td>
    <td data-label="Estado"><span class="badge-estado cerrada">Cerrada</span></td>
    <td data-label="Costo total">$${fmtNum(o.costoTotal||0)}</td>
    <td data-label="Acciones"><button class="btn-ghost btn-sm" onclick="abrirDetalleOrden(${o.id})">Ver</button></td>
  </tr>`;
  }).join('');

  _renderRepPagCtrl(total, pages, repPagActual);
}

// Icono + color por tipo de vehículo (ciclo de paleta para variedad visual)
function _vehIconRep(marca, modelo, idx) {
  const m = `${marca||''} ${modelo||''}`.toLowerCase();
  const palette = ['blue', 'orange', 'purple', 'teal', 'slate'];
  let icon = 'fa-truck';
  if (/bus|coaster|busscar/.test(m)) icon = 'fa-bus';
  else if (/hilux|pickup|pick-up|d-?max|frontier|ranger|amarok/.test(m)) icon = 'fa-truck-pickup';
  else if (/\bnkr\b|\bnpr\b|cargo|\bhr\b/.test(m)) icon = 'fa-truck-front';
  return { icon, color: palette[idx % palette.length] };
}

function _renderRepPagCtrl(total, pages, current) {
  let cont = document.getElementById('t-rep-pagination');
  if (!cont) {
    const sc = document.querySelector('#page-vehiculos .t-section-card');
    if (!sc) return;
    cont = document.createElement('div');
    cont.id        = 't-rep-pagination';
    cont.className = 't-pagination';
    sc.appendChild(cont);
  }
  if (pages <= 1) { cont.innerHTML = ''; return; }
  const desde = (current - 1) * REP_PER_PAGE + 1;
  const hasta = Math.min(current * REP_PER_PAGE, total);
  const nums  = _rPagNums(current, pages);
  const btns  = nums.map(n => {
    if (n === '…') return `<span class="t-pag-dots">…</span>`;
    return `<button class="t-pag-btn${n===current?' active':''}" onclick="repPagActual=${n};_renderRepPag()">${n}</button>`;
  }).join('');
  cont.innerHTML = `
    <div class="t-pag-inner">
      <button class="t-pag-btn" onclick="repPagActual--;_renderRepPag()" ${current===1?'disabled':''}>‹</button>
      ${btns}
      <button class="t-pag-btn" onclick="repPagActual++;_renderRepPag()" ${current===pages?'disabled':''}>›</button>
      <span class="t-pag-info">${desde}–${hasta} de ${total}</span>
    </div>`;
}

function _rPagNums(cur, total) {
  if (total <= 7) return Array.from({length:total}, (_,i) => i+1);
  const s   = new Set([1, total, cur, cur-1, cur+1].filter(n => n >= 1 && n <= total));
  const arr = [...s].sort((a,b) => a-b);
  const res = [];
  arr.forEach((n,i) => {
    if (i && n - arr[i-1] > 1) res.push('…');
    res.push(n);
  });
  return res;
}

// ── Patch showPage para cargar reparaciones ────────────────────────────
const _tOrigShow = window.showPage;
window.showPage = function (id, title) {
  if (typeof _tOrigShow === 'function') _tOrigShow(id, title);
  if (id === 'vehiculos') setTimeout(cargarMisReparaciones, 200);
};