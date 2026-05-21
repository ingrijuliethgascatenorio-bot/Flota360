/* ═══════════════════════════════════════════════════════════════════
   carga-masiva.js — Carga masiva de Usuarios y Buses + Exportación
   Agregar al final de admin.html:  <script src="carga-masiva.js"></script>
   NO modifica nada del código existente.
═══════════════════════════════════════════════════════════════════ */

// ─── SheetJS desde CDN (cargado dinámicamente si no está presente) ───────────
(function loadSheetJS() {
  if (window.XLSX) return;
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  document.head.appendChild(s);
})();

// ─── jsPDF + autoTable desde CDN ─────────────────────────────────────────────
(function loadJsPDF() {
  if (window.jspdf) return;
  const s1 = document.createElement('script');
  s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  document.head.appendChild(s1);
  s1.onload = () => {
    const s2 = document.createElement('script');
    s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';
    document.head.appendChild(s2);
  };
})();

// ══════════════════════════════════════════════════════════════════════════════
// PLANTILLAS EXCEL — descargables antes de hacer la carga
// ══════════════════════════════════════════════════════════════════════════════

function descargarPlantillaUsuarios() {
  const wb = XLSX.utils.book_new();
  const encabezados = [['nombre','correo','contrasena','rol']];
  const ejemplos = [
    ['Juan Pérez','juan@empresa.com','Pass1234!','Conductor'],
    ['Ana Torres','ana@empresa.com','Pass5678!','Tecnico'],
    ['Luis Gómez','luis@empresa.com','Admin123!','Administrador'],
  ];
  const ws = XLSX.utils.aoa_to_sheet([...encabezados, ...ejemplos]);

  ws['!cols'] = [{wch:22},{wch:28},{wch:18},{wch:16}];

  // Celda de ayuda
  XLSX.utils.sheet_add_aoa(ws, [
    [''],
    ['INSTRUCCIONES:'],
    ['• Roles válidos: Administrador | Tecnico | Conductor'],
    ['• No borrar la fila de encabezados (fila 1)'],
    ['• Correo debe ser único en el sistema'],
  ], { origin: 'F1' });

  XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
  XLSX.writeFile(wb, 'plantilla_usuarios.xlsx');
}

function descargarPlantillaBuses() {
  const wb = XLSX.utils.book_new();
  const encabezados = [['placa','marca','modelo','anio','kmActual','capacidad','numMotor','numChasis','venceSoat','venceTecnomecanica']];
  const ejemplos = [
    ['ABC123','Mercedes','Sprinter',2020,45000,20,'MOT-001','CHA-001','2026-12-31','2026-11-15'],
    ['XYZ789','Toyota','Coaster',2019,62000,30,'MOT-002','CHA-002','2027-01-20','2026-08-10'],
    ['QWE456','Ford','Transit',2021,30000,15,'MOT-003','CHA-003','2026-06-05','2026-05-20'],
  ];
  const ws = XLSX.utils.aoa_to_sheet([...encabezados, ...ejemplos]);

  ws['!cols'] = [{wch:10},{wch:14},{wch:14},{wch:6},{wch:12},{wch:12},{wch:14},{wch:14}];

  XLSX.utils.sheet_add_aoa(ws, [
    [''],
    ['INSTRUCCIONES:'],
    ['• Placa: mayúsculas, sin espacios ni guiones'],
    ['• Año: 1990 en adelante'],
    ['• KmActual: número entero ≥ 0'],
    ['• Capacidad: número de pasajeros'],
    ['• venceSoat / venceTecnomecanica: formato AAAA-MM-DD'],
  ], { origin: 'L1' });

  XLSX.utils.book_append_sheet(wb, ws, 'Buses');
  XLSX.writeFile(wb, 'plantilla_buses.xlsx');
}

// ══════════════════════════════════════════════════════════════════════════════
// PARSEO Y VALIDACIÓN
// ══════════════════════════════════════════════════════════════════════════════

const ROLES_VALIDOS = ['Administrador','Tecnico','Conductor'];

function parsearArchivoExcel(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        
        // Normalizar fechas (si vienen como objetos Date de JS)
        const normalized = rows.map(row => {
          ['venceSoat', 'venceTecnomecanica'].forEach(k => {
            if (row[k] instanceof Date) {
              row[k] = row[k].toISOString().split('T')[0];
            } else if (typeof row[k] === 'number') {
              // Manejar números de serie de Excel por si acaso
              const d = new Date((row[k] - 25569) * 86400 * 1000);
              row[k] = d.toISOString().split('T')[0];
            }
          });
          return row;
        });
        
        res(normalized);
      } catch (err) { rej(err); }
    };
    reader.onerror = () => rej(new Error('No se pudo leer el archivo'));
    reader.readAsArrayBuffer(file);
  });
}

function validarFilaUsuario(row, idx) {
  const errs = [];
  if (!row.nombre?.toString().trim())      errs.push('nombre requerido');
  if (!row.correo?.toString().trim())      errs.push('correo requerido');
  if (!row.contrasena?.toString().trim())  errs.push('contraseña requerida');
  const rol = row.rol?.toString().trim();
  if (!ROLES_VALIDOS.includes(rol))        errs.push(`rol inválido (${rol || 'vacío'})`);
  return errs.length ? `Fila ${idx + 2}: ${errs.join(', ')}` : null;
}

function validarFilaBus(row, idx) {
  const errs = [];
  if (!row.placa?.toString().trim())      errs.push('placa requerida');
  if (!row.marca?.toString().trim())      errs.push('marca requerida');
  if (!row.modelo?.toString().trim())     errs.push('modelo requerido');
  const anio = parseInt(row.anio);
  if (isNaN(anio) || anio < 1990)         errs.push('año inválido (mín 1990)');
  const km = parseInt(row.kmActual ?? 0);
  if (isNaN(km) || km < 0)               errs.push('kmActual inválido');
  const cap = parseInt(row.capacidad);
  if (isNaN(cap) || cap < 1)             errs.push('capacidad inválida');
  if (!row.numMotor?.toString().trim())   errs.push('numMotor requerido');
  if (!row.numChasis?.toString().trim())  errs.push('numChasis requerido');
  
  const vSoat = row.venceSoat?.toString().trim();
  const vTecno = row.venceTecnomecanica?.toString().trim();
  if (!vSoat) {
    errs.push('venceSoat requerido');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(vSoat)) {
    errs.push('venceSoat debe ser AAAA-MM-DD');
  }
  if (!vTecno) {
    errs.push('venceTecnomecanica requerido');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(vTecno)) {
    errs.push('venceTecnomecanica debe ser AAAA-MM-DD');
  }

  return errs.length ? `Fila ${idx + 2}: ${errs.join(', ')}` : null;
}

// ══════════════════════════════════════════════════════════════════════════════
// PREVISUALIZACIÓN DEL ARCHIVO
// ══════════════════════════════════════════════════════════════════════════════

let _cargaMasivaData   = [];   // filas parseadas listas para enviar
let _cargaMasivaTipo   = '';   // 'usuarios' | 'buses'
let _cargaMasivaErrores = [];

async function previsualizarCarga(tipo) {
  _cargaMasivaTipo = tipo;
  const inputId = tipo === 'usuarios' ? 'file-usuarios' : 'file-buses';
  const fileEl  = document.getElementById(inputId);
  const preview = document.getElementById('cm-preview');
  const btnEnviar = document.getElementById('btn-cm-enviar');

  if (!fileEl?.files?.length) { toast('Selecciona un archivo Excel primero', 'error'); return; }

  preview.innerHTML = '<div class="td-loading">Leyendo archivo…</div>';
  btnEnviar.style.display = 'none';

  try {
    const rows = await parsearArchivoExcel(fileEl.files[0]);
    if (!rows.length) { preview.innerHTML = '<p style="color:var(--red)">El archivo está vacío.</p>'; return; }

    // Validar
    const errores = rows.map((r, i) =>
      tipo === 'usuarios' ? validarFilaUsuario(r, i) : validarFilaBus(r, i)
    ).filter(Boolean);

    _cargaMasivaErrores = errores;
    _cargaMasivaData    = rows;

    let html = '';

    if (errores.length) {
      html += `<div class="cm-alerta cm-alerta-error">
        <strong>⚠️ Se encontraron ${errores.length} error(es). Corrígelos antes de continuar:</strong>
        <ul style="margin:6px 0 0 16px;font-size:12px">${errores.map(e => `<li>${e}</li>`).join('')}</ul>
      </div>`;
    }

    // Tabla de previsualización
    html += `<div class="cm-preview-info">
      <span>📄 <strong>${rows.length}</strong> registros encontrados</span>
      ${errores.length ? `<span style="color:var(--red)">❌ ${errores.length} con errores</span>` : '<span style="color:#15a362">✅ Todos válidos</span>'}
    </div>`;

    if (tipo === 'usuarios') {
      html += `<div class="table-wrap" style="max-height:300px;overflow-y:auto">
        <table class="data-table">
          <thead><tr><th>#</th><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th></tr></thead>
          <tbody>${rows.map((r, i) => {
            const err = validarFilaUsuario(r, i);
            return `<tr class="${err ? 'cm-row-error' : ''}">
              <td>${i+1}</td>
              <td>${r.nombre || '—'}</td>
              <td>${r.correo || '—'}</td>
              <td>${r.rol || '—'}</td>
              <td>${err ? `<span style="color:var(--red);font-size:11px">✗ ${err.split(': ')[1]}</span>` : '<span style="color:#15a362">✓</span>'}</td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>`;
    } else {
      html += `<div class="table-wrap" style="max-height:300px;overflow-y:auto">
        <table class="data-table">
          <thead><tr><th>#</th><th>Placa</th><th>Marca/Modelo</th><th>Año</th><th>Km</th><th>Estado</th></tr></thead>
          <tbody>${rows.map((r, i) => {
            const err = validarFilaBus(r, i);
            return `<tr class="${err ? 'cm-row-error' : ''}">
              <td>${i+1}</td>
              <td>${r.placa || '—'}</td>
              <td>${r.marca} ${r.modelo}</td>
              <td>${r.anio || '—'}</td>
              <td>${r.kmActual ?? '—'}</td>
              <td>${err ? `<span style="color:var(--red);font-size:11px">✗ ${err.split(': ')[1]}</span>` : '<span title="SOAT: '+r.venceSoat+', RTM: '+r.venceTecnomecanica+'" style="color:#15a362">✓</span>'}</td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>`;
    }

    preview.innerHTML = html;
    if (!errores.length) btnEnviar.style.display = 'inline-flex';

  } catch (err) {
    preview.innerHTML = `<p style="color:var(--red)">Error al leer el archivo: ${err.message}</p>`;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// ENVÍO MASIVO
// ══════════════════════════════════════════════════════════════════════════════

async function ejecutarCargaMasiva() {
  if (!_cargaMasivaData.length || _cargaMasivaErrores.length) return;

  const btnEnviar  = document.getElementById('btn-cm-enviar');
  const progressEl = document.getElementById('cm-progress');
  const barEl      = document.getElementById('cm-bar');
  const statusEl   = document.getElementById('cm-status');

  btnEnviar.disabled    = true;
  progressEl.style.display = 'block';

  const total    = _cargaMasivaData.length;
  let ok = 0, fail = 0;
  const failedRows = [];

  for (let i = 0; i < total; i++) {
    const row = _cargaMasivaData[i];
    const pct = Math.round(((i + 1) / total) * 100);
    barEl.style.width  = pct + '%';
    statusEl.textContent = `Procesando ${i + 1} de ${total}…`;

    try {
      if (_cargaMasivaTipo === 'usuarios') {
        await api('POST', '/usuarios', {
          nombre:    row.nombre.toString().trim(),
          correo:    row.correo.toString().trim(),
          contrasena: row.contrasena.toString().trim(),
          rol:       row.rol.toString().trim(),
        });
      } else {
        const res = await api('POST', '/vehiculos', {
          placa:     row.placa.toString().trim().toUpperCase(),
          marca:     row.marca.toString().trim(),
          modelo:    row.modelo.toString().trim(),
          anio:      parseInt(row.anio),
          kmActual:  parseInt(row.kmActual ?? 0),
          capacidad: parseInt(row.capacidad),
          numMotor:  row.numMotor.toString().trim(),
          numChasis: row.numChasis.toString().trim(),
          venceSoat: row.venceSoat.toString().trim(),
          venceTecnomecanica: row.venceTecnomecanica.toString().trim(),
        });
      }
      ok++;
    } catch (err) {
      fail++;
      failedRows.push({ fila: i + 2, dato: _cargaMasivaTipo === 'usuarios' ? row.correo : row.placa, error: err.message });
    }
  }

  // Resultado final
  barEl.style.width = '100%';
  statusEl.textContent = `Completado: ${ok} exitosos, ${fail} fallidos`;

  let resHtml = `<div class="cm-resultado">
    <span class="cm-res-ok">✅ ${ok} creados correctamente</span>
    ${fail ? `<span class="cm-res-fail">❌ ${fail} fallidos</span>` : ''}
  </div>`;

  if (failedRows.length) {
    resHtml += `<div class="cm-alerta cm-alerta-error" style="margin-top:8px">
      <strong>Registros que fallaron:</strong>
      <ul style="margin:6px 0 0 16px;font-size:12px">
        ${failedRows.map(f => `<li>Fila ${f.fila} (${f.dato}): ${f.error}</li>`).join('')}
      </ul>
    </div>`;
  }

  document.getElementById('cm-preview').innerHTML = resHtml;
  btnEnviar.disabled = false;

  if (ok > 0) {
    if (_cargaMasivaTipo === 'usuarios') {
      cargarUsuarios?.();
    } else {
      cargarVehiculos?.();
      cargarDashboard?.();
    }
    toast(`Carga masiva completada: ${ok} registros creados`, 'success');
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORTACIÓN A EXCEL
// ══════════════════════════════════════════════════════════════════════════════

function exportarExcel(tipo) {
  let datos = [], nombre = '', columnas = [], nombreHoja = '';

  if (tipo === 'usuarios') {
    datos     = (typeof usrCache !== 'undefined' ? usrCache : []);
    nombre    = 'reporte_usuarios';
    nombreHoja = 'Usuarios';
    columnas  = ['ID','Nombre','Correo','Rol','Activo'];
    datos     = datos.map(u => ({
      ID: u.id, Nombre: u.nombre, Correo: u.correo, Rol: u.rol,
      Activo: u.activo ? 'Sí' : 'No'
    }));
  } else if (tipo === 'buses') {
    datos     = (typeof vehCache !== 'undefined' ? vehCache : []);
    nombre    = 'reporte_buses';
    nombreHoja = 'Buses';
    columnas  = ['ID','Placa','Marca','Modelo','Año','Km Actual','Semáforo'];
    datos     = datos.map(v => ({
      ID: v.id, Placa: v.placa, Marca: v.marca, Modelo: v.modelo,
      'Año': v.anio, 'Km Actual': v.kmActual,
      'Semáforo': v.estadoSemaforo || '—'
    }));
  } else if (tipo === 'reportes') {
    datos     = (typeof reporteCache !== 'undefined' ? reporteCache : []);
    nombre    = 'reporte_ordenes';
    nombreHoja = 'Ordenes';
    columnas  = ['#OT','Vehiculo','Tecnico','Apertura','M. Obra','Repuestos','Total'];
    datos     = datos.map(o => ({
      '#OT': o.ordenId || o.id || '-',
      'Vehiculo': o.placa || o.vehiculo?.placa || '-',
      'Tecnico': o.tecnicoNombre || o.tecnico?.nombre || '-',
      'Apertura': (o.fechaApertura || '').split('T')[0] || '-',
      'M. Obra': o.costoManoObra || 0,
      'Repuestos': o.costoRepuestos || (o.repuestos || []).reduce((s,r) => s + Number(r.subtotal || 0), 0),
      'Total': o.costoTotal || 0,
    }));
  } else if (tipo === 'ranking') {
    datos     = (typeof rankingCache !== 'undefined' ? rankingCache : []);
    nombre    = 'reporte_ranking';
    nombreHoja = 'Ranking';
    columnas  = ['#','Placa','Marca','Modelo','Costo Total','Intervenciones','Nivel'];
    datos     = datos.map((v, i) => ({
      '#': i + 1,
      'Placa': v.placa,
      'Marca': v.marca || '—',
      'Modelo': v.modelo || '—',
      'Costo Total': v.costoTotal || 0,
      'Intervenciones': v.numOrdenes || 0,
      'Nivel': v.colorCosto || '—',
    }));
  }

  if (!datos.length) { toast('No hay datos para exportar', 'error'); return; }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(datos);

  // Ancho automático de columnas
  const maxWidths = columnas.map(c => ({wch: Math.max(c.length + 2, 12)}));
  ws['!cols'] = maxWidths;

  // Fila de metadatos al final
  const now = new Date().toLocaleString('es-CO');
  XLSX.utils.sheet_add_aoa(ws, [
    [],
    [`Generado: ${now}  |  FlotaControl 360`]
  ], { origin: -1 });

  XLSX.utils.book_append_sheet(wb, ws, nombreHoja);
  XLSX.writeFile(wb, `${nombre}_${new Date().toISOString().split('T')[0]}.xlsx`);
  toast('Archivo Excel descargado', 'success');
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORTACIÓN A PDF
// ══════════════════════════════════════════════════════════════════════════════

function exportarPDF(tipo) {
  if (!window.jspdf?.jsPDF) { toast('PDF aún cargando, intenta en un momento', 'error'); return; }
  const { jsPDF } = window.jspdf;

  let head = [], rows = [], titulo = '';

  if (tipo === 'usuarios') {
    titulo = 'Reporte de Usuarios';
    head   = [['ID','Nombre','Correo','Rol','Activo']];
    rows   = (usrCache || []).map(u => [u.id, u.nombre, u.correo, u.rol, u.activo ? 'Sí' : 'No']);
  } else if (tipo === 'buses') {
    titulo = 'Reporte de Buses / Vehículos';
    head   = [['Placa','Marca','Modelo','Año','Km Actual','Estado']];
    rows   = (vehCache || []).map(v => [v.placa, v.marca, v.modelo, v.anio, _fmt(v.kmActual), v.estadoSemaforo]);
  } else if (tipo === 'reportes') {
    titulo = 'Reporte de Ordenes de Trabajo';
    head   = [['#OT','Vehiculo','Tecnico','Apertura','M. Obra','Repuestos','Total']];
    rows   = (reporteCache || []).map(o => [
      '#' + (o.ordenId || o.id || '-'),
      o.placa || o.vehiculo?.placa || '-',
      o.tecnicoNombre || o.tecnico?.nombre || '-',
      (o.fechaApertura || '').split('T')[0],
      '$' + _fmt(o.costoManoObra || 0),
      '$' + _fmt(o.costoRepuestos || 0),
      '$' + _fmt(o.costoTotal || 0)
    ]);
  } else if (tipo === 'ranking') {
    titulo = 'Ranking de Flota';
    head   = [['#','Placa','Marca/Modelo','Costo Total','Intervenciones','Nivel']];
    rows   = (rankingCache || []).map((v, i) => [
      i + 1, v.placa, `${v.marca} ${v.modelo}`,
      '$' + _fmt(v.costoTotal || 0), v.numOrdenes || 0, v.colorCosto || '—'
    ]);
  }

  if (!rows.length) { toast('No hay datos para exportar', 'error'); return; }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Cabecera
  doc.setFillColor(29, 111, 196);
  doc.rect(0, 0, 297, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('FlotaControl 360°', 12, 12);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(titulo, 297 / 2, 12, { align: 'center' });
  doc.text(new Date().toLocaleDateString('es-CO'), 285, 12, { align: 'right' });

  doc.setTextColor(0, 0, 0);

  doc.autoTable({
    head,
    body: rows,
    startY: 24,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [29, 111, 196], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 248, 252] },
    margin: { left: 10, right: 10 },
  });

  // Pie
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount}`, 297 - 12, 205, { align: 'right' });
  }

  doc.save(`${tipo}_${new Date().toISOString().split('T')[0]}.pdf`);
  toast('PDF descargado', 'success');
}

function _fmt(n) {
  return Number(n || 0).toLocaleString('es-CO');
}

// ══════════════════════════════════════════════════════════════════════════════
// INYECCIÓN DE BOTONES EN LA UI
// ══════════════════════════════════════════════════════════════════════════════

// Se ejecuta después de que el DOM esté listo y showPage esté disponible
document.addEventListener('DOMContentLoaded', () => {

  // ── Botones en sección Vehículos ──────────────────────────────────────────
  const toolbarVeh = document.querySelector('#page-vehiculos .filter-bar');
  if (toolbarVeh) {
    const btnExcelBus = _crearBoton('⬇ Excel', 'btn-ghost', () => exportarExcel('buses'));
    const btnPdfBus   = _crearBoton('⬇ PDF', 'btn-ghost', () => exportarPDF('buses'));
    toolbarVeh.appendChild(btnExcelBus);
    toolbarVeh.appendChild(btnPdfBus);
  }

  // ── Botones en sección Usuarios ───────────────────────────────────────────
  const toolbarUsr = document.querySelector('#page-usuarios .filter-bar');
  if (toolbarUsr) {
    const btnExcelUsr = _crearBoton('⬇ Excel', 'btn-ghost', () => exportarExcel('usuarios'));
    const btnPdfUsr   = _crearBoton('⬇ PDF', 'btn-ghost', () => exportarPDF('usuarios'));
    toolbarUsr.appendChild(btnExcelUsr);
    toolbarUsr.appendChild(btnPdfUsr);
  }

  // ── Botones en sección Reportes ───────────────────────────────────────────
  const toolbarRep = document.querySelector('#page-reportes .filter-bar');
  if (toolbarRep) {
    const btnExcelRep = _crearBoton('⬇ Excel', 'btn-ghost', () => exportarExcel('reportes'));
    const btnPdfRep   = _crearBoton('⬇ PDF', 'btn-ghost', () => exportarPDF('reportes'));
    toolbarRep.appendChild(btnExcelRep);
    toolbarRep.appendChild(btnPdfRep);
  }

  // ── Botones en sección Ranking ─────────────────────────────────────────────
  const toolbarRank = document.querySelector('#page-ranking .filter-bar');
  if (toolbarRank) {
    const btnExcelRank = _crearBoton('⬇ Excel', 'btn-ghost', () => exportarExcel('ranking'));
    const btnPdfRank   = _crearBoton('⬇ PDF', 'btn-ghost', () => exportarPDF('ranking'));
    toolbarRank.appendChild(btnExcelRank);
    toolbarRank.appendChild(btnPdfRank);
  }

  // Inyectar estilos CSS de la funcionalidad
  _inyectarEstilos();
});

function _crearBoton(label, cls, onClick) {
  const b = document.createElement('button');
  b.className = cls;
  b.textContent = label;
  b.style.cssText = 'white-space:nowrap;flex-shrink:0;align-self:flex-end;padding:7px 14px';
  b.addEventListener('click', onClick);
  return b;
}

// ══════════════════════════════════════════════════════════════════════════════
// MODAL DE CARGA MASIVA
// ══════════════════════════════════════════════════════════════════════════════

function abrirModalCarga(tipo) {
  // Limpiar estado anterior
  _cargaMasivaData   = [];
  _cargaMasivaTipo   = tipo;
  _cargaMasivaErrores = [];

  const titulo  = tipo === 'usuarios' ? 'Carga masiva de Usuarios' : 'Carga masiva de Buses';
  const inputId = tipo === 'usuarios' ? 'file-usuarios' : 'file-buses';
  const plantillaFn = tipo === 'usuarios' ? 'descargarPlantillaUsuarios()' : 'descargarPlantillaBuses()';

  document.getElementById('cm-modal-title').textContent = titulo;
  document.getElementById('cm-file-section').innerHTML = `
    <div class="cm-section">
      <p style="font-size:13px;color:var(--text-lt);margin-bottom:10px">
        Descarga la plantilla, rellénala y súbela aquí.
        Los registros se crearán automáticamente en el sistema.
      </p>
      <button class="btn-ghost" style="margin-bottom:14px" onclick="${plantillaFn}">
        📥 Descargar plantilla Excel
      </button>
      <div class="field-group" style="margin-bottom:10px">
        <label style="font-size:11px;font-weight:600;color:var(--text-lt);text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:6px">
          Subir archivo (.xlsx)
        </label>
        <input type="file" id="${inputId}" accept=".xlsx,.xls"
          style="padding:7px;border:1.5px solid var(--slate-200);border-radius:8px;font-size:13px;width:100%;cursor:pointer"
          onchange="previsualizarCarga('${tipo}')"/>
      </div>
    </div>`;

  document.getElementById('cm-preview').innerHTML = '';
  document.getElementById('cm-progress').style.display = 'none';
  document.getElementById('cm-bar').style.width = '0%';
  document.getElementById('cm-status').textContent = '';
  document.getElementById('btn-cm-enviar').style.display = 'none';
  document.getElementById('btn-cm-enviar').disabled = false;

  openModal('m-carga-masiva');
}

// ══════════════════════════════════════════════════════════════════════════════
// INYECTAR MODAL Y ESTILOS EN EL DOM
// ══════════════════════════════════════════════════════════════════════════════

(function inyectarModal() {
  const modal = document.createElement('div');
  modal.id = 'm-carga-masiva';
  modal.className = 'modal-overlay';
  modal.setAttribute('onclick', "closeModalOutside(event,'m-carga-masiva')");
  modal.innerHTML = `
    <div class="modal-box modal-wide">
      <div class="modal-header">
        <h3 id="cm-modal-title">Carga masiva</h3>
        <button onclick="closeModal('m-carga-masiva')">✕</button>
      </div>
      <div style="padding:0 4px">
        <div id="cm-file-section"></div>
        <div id="cm-preview" style="margin-top:10px"></div>
        <div id="cm-progress" style="display:none;margin-top:14px">
          <div style="background:var(--slate-100);border-radius:99px;height:8px;overflow:hidden">
            <div id="cm-bar" style="background:var(--blue-500);height:100%;width:0%;transition:width .3s;border-radius:99px"></div>
          </div>
          <div id="cm-status" style="font-size:12px;color:var(--text-lt);margin-top:6px;text-align:center"></div>
        </div>
      </div>
      <div class="modal-footer" style="margin-top:16px">
        <button class="btn-ghost" onclick="closeModal('m-carga-masiva')">Cerrar</button>
        <button id="btn-cm-enviar" class="btn-primary" style="display:none" onclick="ejecutarCargaMasiva()">
          ✅ Confirmar e importar
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
})();

function _inyectarEstilos() {
  const style = document.createElement('style');
  style.textContent = `
    .cm-alerta{padding:10px 14px;border-radius:8px;font-size:13px;margin-bottom:8px}
    .cm-alerta-error{background:rgba(232,74,58,.08);border:1px solid rgba(232,74,58,.25);color:#b22}
    .cm-alerta-ok{background:rgba(34,192,122,.08);border:1px solid rgba(34,192,122,.25);color:#137}
    .cm-preview-info{display:flex;gap:16px;align-items:center;font-size:13px;margin-bottom:10px;
      padding:8px 12px;background:var(--slate-50);border-radius:8px;border:1px solid var(--slate-200)}
    .cm-row-error td{background:rgba(232,74,58,.04)}
    .cm-resultado{display:flex;gap:12px;font-size:14px;font-weight:600;padding:10px 0}
    .cm-res-ok{color:#15a362}
    .cm-res-fail{color:#c23228}
    .cm-section{padding-bottom:4px}
  `;
  document.head.appendChild(style);
}