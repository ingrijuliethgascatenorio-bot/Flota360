/* ═══════════════════════════════════════════════════════════════════════════════
   FLOTACONTROL 360 — reporte-mantenimiento-pdf.js
   Generador profesional de Ficha Técnica / Reporte de Mantenimiento en PDF (A4 Vertical)
   Reutiliza jsPDF 2.5.1 + jsPDF-AutoTable 3.8.2 para Conductor, Técnico y Admin.
═══════════════════════════════════════════════════════════════════════════════ */

(function initJsPDFLoader() {
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

/**
 * Espera hasta que jsPDF y autoTable estén disponibles en window.
 */
function asegurarJsPDF(timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    if (window.jspdf?.jsPDF) return resolve(window.jspdf.jsPDF);
    const start = Date.now();
    const iv = setInterval(() => {
      if (window.jspdf?.jsPDF) {
        clearInterval(iv);
        resolve(window.jspdf.jsPDF);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(iv);
        reject(new Error('No fue posible cargar el motor de generación de PDF.'));
      }
    }, 100);
  });
}

/**
 * Convierte una URL de imagen a DataURL (Base64) de forma segura.
 * Si falla la descarga o CORS, retorna null sin romper el PDF.
 */
function cargarImagenBase64(url, timeoutMs = 4000) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    let finalUrl = url;
    if (typeof apiAssetUrl === 'function') {
      finalUrl = apiAssetUrl(url);
    } else if (!url.startsWith('http') && !url.startsWith('data:')) {
      finalUrl = `/${url.replace(/^\/+/, '')}`;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';

    const timer = setTimeout(() => {
      resolve(null);
    }, timeoutMs);

    img.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve({
          dataUrl,
          width: canvas.width,
          height: canvas.height,
        });
      } catch (err) {
        console.warn('No se pudo convertir imagen a Base64:', err);
        resolve(null);
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };

    img.src = finalUrl;
  });
}

/**
 * Formateador de moneda es-CO.
 */
function _fmtMoney(n) {
  const num = parseFloat(n) || 0;
  return '$ ' + num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/**
 * Formateador de fecha legible en español.
 */
function _fmtDate(fechaStr) {
  if (!fechaStr) return 'No registrado';
  try {
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return fechaStr;
    return d.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return fechaStr;
  }
}

/**
 * FUNCIÓN PRINCIPAL: Genera y descarga el PDF de la orden de trabajo.
 * @param {Object} orden Objeto con todos los datos de la OT, vehículo, técnico, novedad, repuestos y fotos.
 */
window.generarReporteMantenimientoPDF = async function (orden) {
  if (!orden) {
    if (typeof toast === 'function') toast('No se recibieron datos de la orden.', 'error');
    return;
  }

  let jsPDFClass;
  try {
    jsPDFClass = await asegurarJsPDF();
  } catch (err) {
    if (typeof toast === 'function') toast(err.message, 'error');
    else alert(err.message);
    return;
  }

  if (typeof toast === 'function') {
    toast('Generando reporte PDF…', 'info');
  }

  try {
    const doc = new jsPDFClass({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // Colores corporativos
    const cNavy = [11, 31, 69];     // #0b1f45
    const cBlue = [26, 86, 219];    // #1a56db
    const cDark = [30, 41, 59];     // #1e293b
    const cMuted = [100, 116, 139]; // #64748b
    const cBgLight = [248, 250, 252]; // #f8fafc
    const cBorder = [226, 232, 240];  // #e2e8f0

    // ── 1. ENCABEZADO INSTITUCIONAL ──────────────────────────────────────────
    doc.setFillColor(...cNavy);
    doc.rect(margin, y, contentWidth, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('FLOTACONTROL 360', margin + 6, y + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(200, 220, 255);
    doc.text('SISTEMA DE GESTIÓN Y CONTROL DE FLOTA', margin + 6, y + 15);

    // Badge número de orden
    const otId = orden.id || 'N/D';
    doc.setFillColor(...cBlue);
    doc.roundedRect(pageWidth - margin - 50, y + 4, 44, 14, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(`ORDEN #${otId}`, pageWidth - margin - 28, y + 10, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`OT CERRADA`, pageWidth - margin - 28, y + 14.5, { align: 'center' });

    y += 26;

    // Título del reporte
    doc.setTextColor(...cNavy);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('REPORTE DE MANTENIMIENTO TÉCNICO', margin, y);

    const fechaGen = new Date().toLocaleDateString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...cMuted);
    doc.text(`Fecha de emisión: ${fechaGen}`, pageWidth - margin, y, { align: 'right' });

    y += 5;
    doc.setDrawColor(...cBlue);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    // ── 2. SECCIÓN VEHÍCULO & ORDEN (2 COLUMNAS) ────────────────────────────
    const colW = (contentWidth - 6) / 2;
    const v = orden.vehiculo || {};
    const t = orden.tecnico || {};
    const plan = orden.plan || null;
    const tipoMant = orden.tipoMantenimiento || (plan ? 'Preventivo' : 'Correctivo');

    // Caja Izquierda: Vehículo
    const boxH = 46;
    doc.setFillColor(...cBgLight);
    doc.setDrawColor(...cBorder);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, colW, boxH, 2, 2, 'FD');

    // Header Caja Vehículo
    doc.setFillColor(235, 243, 255);
    doc.roundedRect(margin, y, colW, 7, 2, 2, 'F');
    doc.setTextColor(...cNavy);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('INFORMACIÓN DEL VEHÍCULO', margin + 4, y + 5);

    let vy = y + 12;
    const _rowV = (label, val) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...cMuted);
      doc.text(label, margin + 4, vy);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...cDark);
      doc.text(String(val || 'No registrado'), margin + 34, vy);
      vy += 5;
    };

    _rowV('Placa:', v.placa || 'No registrada');
    _rowV('Marca / Modelo:', `${v.marca || ''} ${v.modelo || ''}`.trim() || 'No registrado');
    _rowV('Año / Capacidad:', `${v.anio || '—'} · ${v.capacidad ? v.capacidad + ' pas.' : '—'}`);
    _rowV('N° Motor:', v.numMotor || 'No registrado');
    _rowV('N° Chasis:', v.numChasis || 'No registrado');
    _rowV('Km Actual:', v.kmActual !== undefined && v.kmActual !== null ? `${v.kmActual.toLocaleString('es-CO')} km` : 'No registrado');

    // Caja Derecha: Orden de Trabajo
    const rx = margin + colW + 6;
    doc.setFillColor(...cBgLight);
    doc.roundedRect(rx, y, colW, boxH, 2, 2, 'FD');

    doc.setFillColor(235, 243, 255);
    doc.roundedRect(rx, y, colW, 7, 2, 2, 'F');
    doc.setTextColor(...cNavy);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('INFORMACIÓN DE LA ORDEN', rx + 4, y + 5);

    let oy = y + 12;
    const _rowO = (label, val) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...cMuted);
      doc.text(label, rx + 4, oy);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...cDark);
      doc.text(String(val || 'No registrado'), rx + 34, oy);
      oy += 5;
    };

    _rowO('Número OT:', `#${otId}`);
    _rowO('Tipo Mant.:', tipoMant);
    _rowO('Fecha Apertura:', _fmtDate(orden.fechaApertura));
    _rowO('Fecha Cierre:', _fmtDate(orden.fechaCierre));
    _rowO('Técnico Resp.:', t.nombre || 'No asignado');
    _rowO('Estado:', orden.estado || 'Cerrada');
    if (plan?.nombre) {
      _rowO('Plan Asociado:', plan.nombre);
    }

    y += boxH + 6;

    // ── 3. NOVEDAD REPORTADA (SI EXISTE) ────────────────────────────────────
    const nov = orden.novedad || null;
    if (nov) {
      doc.setFillColor(254, 249, 231); // Amarillo suave
      doc.setDrawColor(251, 191, 36);
      doc.setLineWidth(0.4);
      doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

      doc.setTextColor(146, 64, 14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(`NOVEDAD REPORTADA POR CONDUCTOR (ID #${nov.id || ''})`, margin + 4, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(120, 53, 15);
      doc.text(`Tipo: ${nov.tipoNovedad || 'No especificado'}  ·  Fecha Reporte: ${_fmtDate(nov.fechaReporte)}`, margin + 4, y + 9.5);

      doc.setFont('helvetica', 'italic');
      doc.setTextColor(60, 40, 10);
      const descNov = nov.descripcion ? `"${nov.descripcion}"` : 'Sin descripción';
      const linesNov = doc.splitTextToSize(descNov, contentWidth - 8);
      doc.text(linesNov.slice(0, 2), margin + 4, y + 14);

      y += 22;
    }

    // ── 4. DESCRIPCIÓN / TRABAJO REALIZADO ──────────────────────────────────
    doc.setFillColor(...cBgLight);
    doc.setDrawColor(...cBorder);
    doc.setLineWidth(0.3);

    const descText = (orden.descripcion || '').trim() || 'No registrado.';
    const descLines = doc.splitTextToSize(descText, contentWidth - 8);
    const descBoxH = Math.max(20, 11 + descLines.length * 4.5);

    doc.roundedRect(margin, y, contentWidth, descBoxH, 2, 2, 'FD');

    doc.setFillColor(235, 243, 255);
    doc.roundedRect(margin, y, contentWidth, 7, 2, 2, 'F');
    doc.setTextColor(...cNavy);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('DESCRIPCIÓN / TRABAJO REALIZADO', margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...cDark);
    doc.text(descLines, margin + 4, y + 11.5);

    y += descBoxH + 6;

    // ── 5. TABLA DE REPUESTOS UTILIZADOS ────────────────────────────────────
    const repuestos = orden.repuestos || [];
    let costoRepuestosCalc = 0;

    const tablaRows = repuestos.map((r, idx) => {
      const cant = Number(r.cantidad || 0);
      const pu = Number(r.precioUnitario || 0);
      const sub = Number(r.subtotal) || (cant * pu);
      costoRepuestosCalc += sub;
      return [
        String(idx + 1),
        r.nombreRepuesto || 'Repuesto',
        String(cant),
        _fmtMoney(pu),
        _fmtMoney(sub),
      ];
    });

    if (tablaRows.length === 0) {
      tablaRows.push(['—', 'Sin repuestos utilizados en esta orden', '0', '$ 0', '$ 0']);
    }

    doc.autoTable({
      startY: y,
      margin: { left: margin, right: margin },
      head: [['#', 'Repuesto / Material Utilizado', 'Cant.', 'Precio Unitario', 'Subtotal']],
      body: tablaRows,
      theme: 'grid',
      headStyles: {
        fillColor: cNavy,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'left',
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 16, halign: 'center' },
        3: { cellWidth: 32, halign: 'right' },
        4: { cellWidth: 34, halign: 'right' },
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: cDark,
        cellPadding: 2.2,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    y = doc.lastAutoTable.finalY + 4;

    // ── 6. RESUMEN FINANCIERO / COSTOS ──────────────────────────────────────
    const manoObra = Number(orden.costoManoObra || 0);
    const totalRepuestos = costoRepuestosCalc;
    const totalOrden = Number(orden.costoTotal) || (manoObra + totalRepuestos);

    // Verificar si queda espacio para los costos (necesita ~24mm), sino nueva página
    if (y + 28 > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    const cardCostosW = 90;
    const cardCostosX = pageWidth - margin - cardCostosW;

    doc.setFillColor(...cBgLight);
    doc.setDrawColor(...cBorder);
    doc.roundedRect(cardCostosX, y, cardCostosW, 24, 2, 2, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...cMuted);
    doc.text('Costo Mano de Obra:', cardCostosX + 4, y + 6);
    doc.setTextColor(...cDark);
    doc.text(_fmtMoney(manoObra), cardCostosX + cardCostosW - 4, y + 6, { align: 'right' });

    doc.setTextColor(...cMuted);
    doc.text('Costo Repuestos:', cardCostosX + 4, y + 11.5);
    doc.setTextColor(...cDark);
    doc.text(_fmtMoney(totalRepuestos), cardCostosX + cardCostosW - 4, y + 11.5, { align: 'right' });

    doc.setDrawColor(...cBlue);
    doc.setLineWidth(0.4);
    doc.line(cardCostosX + 4, y + 14.5, cardCostosX + cardCostosW - 4, y + 14.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...cBlue);
    doc.text('COSTO TOTAL:', cardCostosX + 4, y + 20);
    doc.setFontSize(9.5);
    doc.text(_fmtMoney(totalOrden), cardCostosX + cardCostosW - 4, y + 20, { align: 'right' });

    y += 30;

    // ── 7. EVIDENCIAS FOTOGRÁFICAS (ANTES Y DESPUÉS) ────────────────────────
    const fotosAntes = Array.isArray(orden.fotos?.antes)
      ? orden.fotos.antes
      : (Array.isArray(orden.fotos) ? orden.fotos.filter((f) => f.tipoFoto === 'antes') : []);

    const fotosDespues = Array.isArray(orden.fotos?.despues)
      ? orden.fotos.despues
      : (Array.isArray(orden.fotos) ? orden.fotos.filter((f) => f.tipoFoto === 'despues') : []);

    const totalFotos = fotosAntes.length + fotosDespues.length;

    if (totalFotos > 0) {
      if (y + 40 > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }

      doc.setFillColor(...cNavy);
      doc.rect(margin, y, contentWidth, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('REGISTRO FOTOGRÁFICO DE EVIDENCIAS', margin + 4, y + 4.2);
      y += 9;

      // Renderizar grupo de fotos
      const _renderGrupoFotos = async (titulo, listaFotos, colorDot) => {
        if (!listaFotos.length) return;

        if (y + 45 > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...cDark);
        doc.text(titulo, margin, y);
        y += 4;

        const maxPorFila = 3;
        const imgW = (contentWidth - (maxPorFila - 1) * 4) / maxPorFila;
        const imgH = 36;

        for (let i = 0; i < listaFotos.length; i++) {
          const f = listaFotos[i];
          const colIdx = i % maxPorFila;
          if (colIdx === 0 && i > 0) {
            y += imgH + 8;
            if (y + imgH > pageHeight - margin) {
              doc.addPage();
              y = margin;
            }
          }

          const imgX = margin + colIdx * (imgW + 4);

          // Marco de la imagen
          doc.setFillColor(245, 247, 250);
          doc.setDrawColor(...cBorder);
          doc.rect(imgX, y, imgW, imgH, 'FD');

          try {
            const imgData = await cargarImagenBase64(f.url);
            if (imgData?.dataUrl) {
              doc.addImage(imgData.dataUrl, 'JPEG', imgX + 1, y + 1, imgW - 2, imgH - 2, undefined, 'FAST');
            } else {
              doc.setFont('helvetica', 'italic');
              doc.setFontSize(7);
              doc.setTextColor(...cMuted);
              doc.text('[Evidencia no disponible]', imgX + imgW / 2, y + imgH / 2, { align: 'center' });
            }
          } catch {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(7);
            doc.setTextColor(...cMuted);
            doc.text('[Evidencia no disponible]', imgX + imgW / 2, y + imgH / 2, { align: 'center' });
          }

          // Pie de foto con fecha
          const fechaFoto = f.tomadaEn ? _fmtDate(f.tomadaEn) : '';
          if (fechaFoto) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.5);
            doc.setTextColor(...cMuted);
            doc.text(fechaFoto, imgX + imgW / 2, y + imgH + 3.2, { align: 'center' });
          }
        }

        y += imgH + 8;
      };

      if (fotosAntes.length > 0) {
        await _renderGrupoFotos('EVIDENCIAS — ANTES DE LA REPARACIÓN', fotosAntes, [234, 88, 12]);
      }
      if (fotosDespues.length > 0) {
        await _renderGrupoFotos('EVIDENCIAS — DESPUÉS DE LA REPARACIÓN', fotosDespues, [16, 185, 129]);
      }
    }

    // ── 8. PIE DE PÁGINA Y NUMERACIÓN EN TODAS LAS PÁGINAS ──────────────────
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);

      doc.setDrawColor(...cBorder);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...cMuted);
      doc.text('FlotaControl 360° — Sistema de Gestión y Mantenimiento de Flota', margin, pageHeight - 6.5);
      doc.text(`Página ${p} de ${totalPages}`, pageWidth - margin, pageHeight - 6.5, { align: 'right' });
    }

    // ── 9. GUARDAR ARCHIVO ──────────────────────────────────────────────────
    const fileName = `Reporte_Mantenimiento_OT_${otId}.pdf`;
    doc.save(fileName);

    if (typeof toast === 'function') {
      toast(`Reporte descargado: ${fileName}`, 'success');
    }
  } catch (err) {
    console.error('Error generando PDF de mantenimiento:', err);
    if (typeof toast === 'function') {
      toast('No fue posible generar el reporte.', 'error');
    } else {
      alert('No fue posible generar el reporte.');
    }
  }
};
