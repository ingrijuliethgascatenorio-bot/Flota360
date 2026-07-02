/* ═══════════════════════════════════════════════════════════════════════
   notifications.js — Sistema de Notificaciones FLOTACONTROL
   ▸ Admin   → Panel estilo Facebook desktop (con dropdown y campana)
   ▸ Técnico → Notificaciones móvil estilo Instagram/Facebook
   ▸ Conductor → Notificaciones móvil estilo Instagram/Facebook
   ▸ Confirmaciones ricas con feedback visual para todos los usuarios
═══════════════════════════════════════════════════════════════════════ */

// ──────────────────────────────────────────────────────────────
// 0. INYECTAR ESTILOS BASE (se inyectan una sola vez)
// ──────────────────────────────────────────────────────────────
(function injectStyles() {
  if (document.getElementById('fc-notif-styles')) return;
  const st = document.createElement('style');
  st.id = 'fc-notif-styles';
  st.textContent = `
    /* ── Toast mejorado con icono ── */
    #fc-toast-wrap {
      position: fixed;
      bottom: 28px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10500;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      pointer-events: none;
    }
    .fc-toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 13px 20px;
      border-radius: 14px;
      font-size: 14px;
      font-weight: 500;
      color: #fff;
      background: #1a1a2e;
      box-shadow: 0 8px 32px rgba(0,0,0,.22);
      transform: translateY(60px) scale(.96);
      opacity: 0;
      transition: transform .35s cubic-bezier(.22,1,.36,1), opacity .3s;
      pointer-events: none;
      max-width: 360px;
      white-space: nowrap;
    }
    .fc-toast.show {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
    .fc-toast.success { background: linear-gradient(135deg,#0a5c35,#14a35a); }
    .fc-toast.error   { background: linear-gradient(135deg,#8b1a1a,#d93939); }
    .fc-toast.warning { background: linear-gradient(135deg,#7a4f00,#c47b00); }
    .fc-toast.info    { background: linear-gradient(135deg,#0c3478,#1a5ccc); }
    .fc-toast .fc-t-icon {
      font-size: 18px;
      flex-shrink: 0;
    }
    .fc-toast .fc-t-body { display: flex; flex-direction: column; gap: 1px; }
    .fc-toast .fc-t-title { font-weight: 700; font-size: 13.5px; }
    .fc-toast .fc-t-msg   { font-weight: 400; font-size: 12.5px; opacity: .85; }

    /* ── Confirmación rica (modal) ── */
    #fc-confirm-overlay {
      position: fixed; inset: 0;
      background: rgba(15, 25, 35, 0.4);
      backdrop-filter: blur(4px);
      z-index: 10600;
      display: flex; align-items: center; justify-content: center;
      animation: fcFadeIn .2s ease;
    }
    #fc-confirm-box {
      background: #fff;
      border-radius: 24px;
      width: min(400px, 92vw);
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0,0,0,0.15);
      padding: 32px 24px 24px;
      display: flex; flex-direction: column; align-items: center;
      animation: fcScaleIn .3s cubic-bezier(.34, 1.56, .64, 1);
    }
    .fc-confirm-icon-wrap {
      width: 80px; height: 80px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 38px; margin-bottom: 20px;
    }
    .fc-confirm-icon-wrap.danger  { background: #fff1f0; }
    .fc-confirm-icon-wrap.success { background: #f6ffed; }
    .fc-confirm-icon-wrap.warning { background: #fffbe6; }
    .fc-confirm-icon-wrap.info    { background: #e6f7ff; }

    #fc-confirm-title {
      font-size: 20px; font-weight: 800; color: #111;
      text-align: center; margin-bottom: 12px;
      font-family: 'Syne', sans-serif;
    }
    #fc-confirm-msg {
      text-align: center; font-size: 14px; color: #666;
      line-height: 1.6; margin-bottom: 32px;
      padding: 0 10px;
    }
    .fc-confirm-footer {
      display: flex; gap: 12px; width: 100%;
    }
    .fc-confirm-footer button {
      flex: 1; padding: 12px;
      border-radius: 12px; border: none;
      font-size: 14px; font-weight: 700;
      cursor: pointer; transition: all .2s;
    }
    .fc-c-cancel { background: #f0f2f5; color: #555; }
    .fc-c-cancel:hover { background: #e4e6e9; transform: translateY(-1px); }
    
    .fc-c-ok { color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .fc-c-ok.danger { background: linear-gradient(135deg, #ff4d4f, #f5222d); }
    .fc-c-ok.success { background: linear-gradient(135deg, #52c41a, #389e0d); }
    .fc-c-ok.warning { background: linear-gradient(135deg, #faad14, #d48806); }
    .fc-c-ok.info { background: linear-gradient(135deg, #1890ff, #096dd9); }
    .fc-c-ok:hover { transform: translateY(-1px); filter: brightness(1.05); }

    /* ── Panel notificaciones ADMIN (estilo Facebook desktop) ── */
    #fc-notif-panel {
      position: fixed; top: 64px; right: 20px;
      width: 360px; background: #fff;
      border-radius: 16px;
      box-shadow: 0 12px 48px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
      z-index: 9800; max-height: 85vh;
      display: flex; flex-direction: column;
      transform-origin: top right;
      transform: scale(.95); opacity: 0;
      transition: all .25s cubic-bezier(.22,1,.36,1);
      pointer-events: none;
    }
    #fc-notif-panel.open {
      transform: scale(1); opacity: 1; pointer-events: auto;
    }
    .fc-np-header {
      padding: 20px 20px 12px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .fc-np-title { font-size: 24px; font-weight: 800; color: #000; font-family: 'Syne', sans-serif; }
    .fc-btn-text {
      background: none; border: none; color: #0064d1;
      font-size: 13px; font-weight: 600; cursor: pointer;
      padding: 6px 10px; border-radius: 6px;
    }
    .fc-btn-text:hover { background: #f0f2f5; }

    .fc-np-tabs {
      display: flex; gap: 8px; padding: 0 16px 12px;
    }
    .fc-np-tab {
      padding: 8px 16px; border-radius: 20px;
      font-size: 14px; font-weight: 700; cursor: pointer;
      border: none; transition: all .2s;
      background: #f0f2f5; color: #65676b;
    }
    .fc-np-tab.active { background: #e7f3ff; color: #0064d1; }
    .fc-np-tab:hover:not(.active) { background: #e4e6e9; }

    .fc-np-list { overflow-y: auto; flex: 1; padding: 0 8px 12px; }
    .fc-np-section-label {
      font-size: 16px; font-weight: 800; color: #000;
      padding: 12px 12px 4px; font-family: 'Syne', sans-serif;
    }
    .fc-np-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px; border-radius: 12px;
      cursor: pointer; transition: background .2s;
      position: relative;
    }
    .fc-np-item:hover { background: #f2f2f2; }
    .fc-np-item.unread { background: #ebf5ff; }
    .fc-np-item.unread:hover { background: #e1efff; }

    .fc-np-avatar-wrap {
      width: 56px; height: 56px; position: relative; flex-shrink: 0;
    }
    .fc-np-avatar {
      width: 100%; height: 100%; border-radius: 50%;
      background: #f0f2f5; display: flex; align-items: center; justify-content: center;
      font-size: 24px;
    }
    .fc-np-badge {
      position: absolute; bottom: 0; right: 0;
      width: 24px; height: 24px; border-radius: 50%;
      border: 2px solid #fff; display: flex; align-items: center; justify-content: center;
      font-size: 12px; color: #fff;
    }
    .fc-np-badge.danger { background: #f02849; }
    .fc-np-badge.warning { background: #f7b928; color: #000; }
    .fc-np-badge.info { background: #1877f2; }
    .fc-np-badge.success { background: #45bd62; }

    .fc-np-body { flex: 1; min-width: 0; }
    .fc-np-msg { font-size: 14px; color: #050505; line-height: 1.3; }
    .fc-np-msg strong { font-weight: 700; }
    .fc-np-time { font-size: 12px; color: #65676b; margin-top: 2px; }
    .fc-np-time.unread { color: #0064d1; font-weight: 700; }

    .fc-np-dot {
      width: 12px; height: 12px; border-radius: 50%;
      background: #0064d1; flex-shrink: 0; margin-left: 4px;
    }
    .fc-np-empty {
      text-align: center; padding: 36px 20px;
      color: #888; font-size: 14px;
    }
    .fc-np-see-all {
      display: block; text-align: center;
      padding: 12px; font-size: 14px; font-weight: 700;
      color: #1877f2; cursor: pointer; margin: 0 8px;
      border-radius: 8px; transition: background .15s;
    }
    .fc-np-see-all:hover { background: #f0f2f5; }

    /* ── Botón campana admin ── */
    #fc-bell-btn {
      position: relative; cursor: pointer;
      background: #e4e6ea; border: none;
      width: 40px; height: 40px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; transition: background .15s;
    }
    #fc-bell-btn:hover { background: #d8dadf; }
    #fc-bell-count {
      position: absolute; top: -3px; right: -3px;
      background: #e84a3a; color: #fff;
      font-size: 11px; font-weight: 800;
      width: 18px; height: 18px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid #fff;
      display: none;
    }

    /* ── Notificaciones móvil estilo Instagram/Facebook ── */
    #fc-mobile-notif-container {
      position: fixed; top: 0; right: 0;
      width: 100%; max-width: 420px;
      z-index: 10400;
      padding: 12px;
      display: flex; flex-direction: column; gap: 10px;
      pointer-events: none;
    }
    .fc-mob-notif {
      display: flex; align-items: center; gap: 12px;
      background: rgba(30,30,40,.96);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 16px;
      padding: 14px 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,.32);
      pointer-events: auto;
      cursor: pointer;
      transform: translateX(120%);
      opacity: 0;
      transition: transform .4s cubic-bezier(.22,1,.36,1), opacity .3s;
    }
    .fc-mob-notif.show {
      transform: translateX(0);
      opacity: 1;
    }
    .fc-mob-notif.hiding {
      transform: translateX(110%);
      opacity: 0;
    }
    .fc-mob-notif-icon {
      width: 44px; height: 44px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; flex-shrink: 0;
    }
    .fc-mob-notif-icon.danger  { background: rgba(232,74,58,.25); }
    .fc-mob-notif-icon.warning { background: rgba(240,201,74,.25); }
    .fc-mob-notif-icon.success { background: rgba(34,192,122,.25); }
    .fc-mob-notif-icon.info    { background: rgba(24,119,242,.25); }
    .fc-mob-notif-body { flex: 1; min-width: 0; }
    .fc-mob-notif-app {
      font-size: 11px; font-weight: 700;
      color: rgba(255,255,255,.55); letter-spacing: .5px;
      text-transform: uppercase; margin-bottom: 1px;
    }
    .fc-mob-notif-title {
      font-size: 13.5px; font-weight: 700; color: #fff;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .fc-mob-notif-msg {
      font-size: 12.5px; color: rgba(255,255,255,.7);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .fc-mob-notif-time {
      font-size: 11px; color: rgba(255,255,255,.45);
      flex-shrink: 0; align-self: flex-start;
      margin-top: 2px;
    }
    .fc-mob-notif-dismiss {
      background: none; border: none; color: rgba(255,255,255,.5);
      font-size: 18px; cursor: pointer; padding: 4px;
      flex-shrink: 0; line-height: 1;
    }
    .fc-mob-notif-dismiss:hover { color: rgba(255,255,255,.9); }

    /* ── Badge de no leídas en items de nav móvil ── */
    .fc-nav-notif-badge {
      position: absolute; top: 6px; right: 6px;
      background: #e84a3a; color: #fff;
      font-size: 10px; font-weight: 800;
      width: 16px; height: 16px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid var(--bg, #fff);
    }

    /* ── Pulse de alerta urgente ── */
    @keyframes fcPulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(232,74,58,.5); }
      50%      { box-shadow: 0 0 0 8px rgba(232,74,58,0); }
    }
    .fc-pulse { animation: fcPulse 1.4s infinite; }

    @keyframes fcIn {
      from { opacity:0; transform: scale(.96); }
      to   { opacity:1; transform: scale(1); }
    }

    /* ── Chip de estado en footer de tarjetas ── */
    .fc-status-chip {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 5px 12px; border-radius: 20px;
      font-size: 12.5px; font-weight: 700; letter-spacing: .2px;
    }
    .fc-status-chip::before {
      content: ''; width: 7px; height: 7px; border-radius: 50%;
    }
    .fc-status-chip.success { background: #e6faf1; color: #0a7340; }
    .fc-status-chip.success::before { background: #22c07a; }
    .fc-status-chip.error   { background: #fff0f0; color: #9b2020; }
    .fc-status-chip.error::before   { background: #e84a3a; }
    .fc-status-chip.warning { background: #fffbea; color: #8a5e00; }
    .fc-status-chip.warning::before { background: #f0c94a; }
    .fc-status-chip.info    { background: #eef4ff; color: #1546a8; }
    .fc-status-chip.info::before    { background: #4285f4; }
  `;
  document.head.appendChild(st);

  // Contenedor de toasts enriquecidos
  if (!document.getElementById('fc-toast-wrap')) {
    const tw = document.createElement('div');
    tw.id = 'fc-toast-wrap';
    document.body.appendChild(tw);
  }

  // Contenedor de notificaciones móvil
  if (!document.getElementById('fc-mobile-notif-container')) {
    const mc = document.createElement('div');
    mc.id = 'fc-mobile-notif-container';
    document.body.appendChild(mc);
  }
})();

// ──────────────────────────────────────────────────────────────
// 1. TOAST ENRIQUECIDO (reemplaza el toast básico)
// ──────────────────────────────────────────────────────────────
const TOAST_ICONS = {
  success: '<i class="fa-solid fa-circle-check"></i>',
  error:   '<i class="fa-solid fa-circle-xmark"></i>',
  warning: '<i class="fa-solid fa-triangle-exclamation"></i>',
  info:    '<i class="fa-solid fa-circle-info"></i>',
};
const TOAST_TITLES = {
  success: '¡Listo!',
  error:   'Error',
  warning: 'Atención',
  info:    'Información',
};

let _toastQueue = [];
let _toastRunning = false;

/**
 * Muestra un toast enriquecido.
 * @param {string} msg       Mensaje principal
 * @param {string} type      'success' | 'error' | 'warning' | 'info'
 * @param {string} [title]   Título (opcional, usa el predeterminado si omite)
 * @param {number} [dur]     Duración en ms (defecto 3800)
 */
function fcToast(msg, type = 'info', title = '', dur = 3800) {
  _toastQueue.push({ msg, type, title: title || TOAST_TITLES[type] || 'Aviso', dur });
  if (!_toastRunning) _processToastQueue();
}

function _processToastQueue() {
  if (!_toastQueue.length) { _toastRunning = false; return; }
  _toastRunning = true;
  const { msg, type, title, dur } = _toastQueue.shift();
  const wrap = document.getElementById('fc-toast-wrap');
  if (!wrap) return;

  const el = document.createElement('div');
  el.className = `fc-toast ${type}`;
  el.innerHTML = `
    <span class="fc-t-icon">${TOAST_ICONS[type] || 'ℹ️'}</span>
    <div class="fc-t-body">
      <div class="fc-t-title">${title}</div>
      ${msg ? `<div class="fc-t-msg">${msg}</div>` : ''}
    </div>`;
  wrap.appendChild(el);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add('show'));
  });

  setTimeout(() => {
    el.classList.remove('show');
    el.style.transition = 'transform .3s, opacity .3s';
    el.style.transform = 'translateY(40px) scale(.95)';
    el.style.opacity = '0';
    setTimeout(() => {
      el.remove();
      setTimeout(_processToastQueue, 100);
    }, 350);
  }, dur);
}

// Retrocompatibilidad: sobreescribir la función toast() global existente
window.toast = function(msg, type = 'info') {
  fcToast(msg, type);
};

// ──────────────────────────────────────────────────────────────
// 2. CONFIRMACIÓN ENRIQUECIDA (reemplaza window.confirm)
// ──────────────────────────────────────────────────────────────
/**
 * Muestra un diálogo de confirmación estilo iOS/Material.
 * @returns {Promise<boolean>}
 */
function fcConfirm({
  title    = '¿Confirmar acción?',
  message  = '',
  okText   = 'Confirmar',
  cancelText = 'Cancelar',
  type     = 'danger',   // 'danger' | 'success' | 'warning' | 'info'
  icon     = '',
} = {}) {
  return new Promise(resolve => {
    const existing = document.getElementById('fc-confirm-overlay');
    if (existing) existing.remove();

    const icons = { danger:'<i class="fa-solid fa-trash"></i>', warning:'<i class="fa-solid fa-triangle-exclamation"></i>', success:'<i class="fa-solid fa-circle-check"></i>', info:'<i class="fa-solid fa-circle-info"></i>' };
    const ov = document.createElement('div');
    ov.id = 'fc-confirm-overlay';
    ov.innerHTML = `
      <div id="fc-confirm-box">
        <div class="fc-confirm-icon-wrap ${type}">
          <span>${icon || icons[type] || '<i class="fa-solid fa-question"></i>'}</span>
        </div>
        <div id="fc-confirm-title">${title}</div>
        ${message ? `<div id="fc-confirm-msg">${message}</div>` : ''}
        <div class="fc-confirm-footer">
          <button class="fc-c-cancel" id="fc-confirm-cancel">${cancelText}</button>
          <button class="fc-c-ok ${type}"  id="fc-confirm-ok">${okText}</button>
        </div>
      </div>`;

    document.body.appendChild(ov);

    ov.querySelector('#fc-confirm-ok').onclick = () => { ov.remove(); resolve(true); };
    ov.querySelector('#fc-confirm-cancel').onclick = () => { ov.remove(); resolve(false); };
    ov.onclick = (e) => { if (e.target === ov) { ov.remove(); resolve(false); } };
  });
}

// ──────────────────────────────────────────────────────────────
// 3. PANEL DE NOTIFICACIONES ADMIN (estilo Facebook desktop)
// ──────────────────────────────────────────────────────────────
const FC_ADMIN_PANEL = {
  items: [],
  tab: 'all', // 'all' | 'documentos' | 'mantenimientos'
  open: false,
  _verMas: 5, // cuántos mostrar inicialmente

  init() {
    // Solo se inicializa si hay elemento de topbar
    const topbar = document.querySelector('.topbar') || document.querySelector('header');
    if (!topbar) return;

    // Inyectar botón campana si no existe
    if (!document.getElementById('fc-bell-btn')) {
      const btn = document.createElement('button');
      btn.id = 'fc-bell-btn';
      btn.title = 'Notificaciones';
      btn.innerHTML = `<i class="fa-solid fa-bell"></i><span id="fc-bell-count"></span>`;
      btn.onclick = (e) => { e.stopPropagation(); FC_ADMIN_PANEL.toggle(); };
      // Intentar insertar antes del avatar de usuario
      const userArea = document.getElementById('topbar-user') ||
                       document.querySelector('.topbar-user') ||
                       topbar.lastElementChild;
      if (userArea) topbar.insertBefore(btn, userArea);
      else topbar.appendChild(btn);
    }

    // Crear panel
    if (!document.getElementById('fc-notif-panel')) {
      const panel = document.createElement('div');
      panel.id = 'fc-notif-panel';
      document.body.appendChild(panel);
    }

    // Cerrar al hacer click afuera
    document.addEventListener('click', (e) => {
      if (!document.getElementById('fc-notif-panel')?.contains(e.target) &&
          e.target.id !== 'fc-bell-btn') {
        FC_ADMIN_PANEL.close();
      }
    });
  },

  toggle() {
    this.open ? this.close() : this.openPanel();
  },

  openPanel() {
    this.open = true;
    this.render();
    document.getElementById('fc-notif-panel')?.classList.add('open');
  },

  close() {
    this.open = false;
    document.getElementById('fc-notif-panel')?.classList.remove('open');
  },

  /**
   * Agrega notificaciones al panel.
   * @param {Array} newItems  [{id, icon, msg, time, type, unread, placa, onClick}]
   */
  // ── Persistencia de leídas en localStorage ───────────────────────────
  _readKey() {
    try {
      const u = JSON.parse(localStorage.getItem('fc_usuario') || 'null');
      return `fc_read_${u?.id || 'guest'}`;
    } catch { return 'fc_read_guest'; }
  },
  _getReadIds() {
    try { return new Set(JSON.parse(localStorage.getItem(this._readKey()) || '[]')); }
    catch { return new Set(); }
  },
  _saveReadIds(set) {
    try { localStorage.setItem(this._readKey(), JSON.stringify([...set])); } catch {}
  },

  addItems(newItems) {
    // Deduplicar por id
    const readIds = this._getReadIds();
    newItems.forEach(item => {
      if (!this.items.find(i => i.id === item.id)) {
        // Si ya fue marcado como leído antes, respetarlo
        if (readIds.has(String(item.id))) item.unread = false;
        this.items.push(item);
      }
    });

    // Ordenar por fecha descendente (más recientes primero)
    this.items.sort((a, b) => new Date(b._date).getTime() - new Date(a._date).getTime());

    const unreadCount = this.items.filter(i => i.unread).length;
    const badge = document.getElementById('fc-bell-count');
    if (badge) {
      badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
      badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }

    // Pulsar el botón si hay urgentes
    const bellBtn = document.getElementById('fc-bell-btn');
    const hasUrgent = newItems.some(i => i.type === 'danger');
    if (bellBtn) {
      if (hasUrgent) bellBtn.classList.add('fc-pulse');
      else bellBtn.classList.remove('fc-pulse');
    }

    if (this.open) this.render();
  },

  markAllRead() {
    this.items.forEach(i => i.unread = false);
    // Persistir todos los IDs como leídos
    const readIds = this._getReadIds();
    this.items.forEach(i => readIds.add(String(i.id)));
    this._saveReadIds(readIds);
    const badge = document.getElementById('fc-bell-count');
    if (badge) badge.style.display = 'none';
    const bellBtn = document.getElementById('fc-bell-btn');
    if (bellBtn) bellBtn.classList.remove('fc-pulse');
    this.render();
    fcToast('Todas las notificaciones marcadas como leídas', 'success', '¡Listo!');
  },

  setTab(tab) {
    this.tab = tab;
    this._verMas = 5;
    this.render();
  },

  render() {
    const panel = document.getElementById('fc-notif-panel');
    if (!panel) return;

    // ── Tipos por categoría ──────────────────────────
    const TIPOS_DOC  = new Set(['documento_vencido','documento_7dias','documento_15dias','documento_30dias','SOAT_VENCIDO','SOAT_POR_VENCER','RTM_VENCIDA','RTM_POR_VENCER','SEGURO_VENCIDO','SEGURO_POR_VENCER']);
    const TIPOS_MANT = new Set(['mantenimiento_vencido','mantenimiento_proximo','KM_PROXIMO','KM_VENCIDO','DIAS_PROXIMO','DIAS_VENCIDO','PREVENTIVO','CORRECTIVO']);

    // ── Filtrar por tab ───────────────────────────────
    let lista = this.items;
    if (this.tab === 'documentos')     lista = this.items.filter(i => TIPOS_DOC.has(i._tipo));
    if (this.tab === 'mantenimientos') lista = this.items.filter(i => TIPOS_MANT.has(i._tipo));

    // ── Separar Hoy / Anteriores ──────────────────────
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const today = lista.filter(i => !i._date || new Date(i._date) >= hoy);
    const prev  = lista.filter(i => i._date && new Date(i._date) < hoy);

    // ── Limitar visibles con "Ver más" ────────────────
    const total    = lista.length;
    const visibles = lista.slice(0, this._verMas);
    const hayMas   = total > this._verMas;

    const renderItem = (item) => {
      const unreadClass = item.unread ? 'unread' : '';
      const dot = item.unread ? '<div class="fc-np-dot"></div>' : '';
      const badgeType = item.type || 'info';
      const badgeIcon = badgeType === 'danger'  ? '<i class="fa-solid fa-exclamation"></i>'
                      : badgeType === 'warning' ? '<i class="fa-solid fa-triangle-exclamation"></i>'
                      : badgeType === 'success' ? '<i class="fa-solid fa-check"></i>'
                      : '<i class="fa-solid fa-info"></i>';
      return `
        <div class="fc-np-item ${unreadClass}" data-id="${item.id}" onclick="FC_ADMIN_PANEL._clickItem('${item.id}')">
          <div class="fc-np-avatar-wrap">
            <div class="fc-np-avatar">${item.icon || '<i class="fa-solid fa-bell"></i>'}</div>
            <div class="fc-np-badge ${badgeType}">${badgeIcon}</div>
          </div>
          <div class="fc-np-body">
            <div class="fc-np-msg">${item.msg}</div>
            <div class="fc-np-time ${item.unread ? 'unread' : ''}">${item.time || 'Ahora'}</div>
          </div>
          ${dot}
        </div>`;
    };

    let html = `
      <div class="fc-np-header">
        <span class="fc-np-title">Notificaciones</span>
        <button class="fc-btn-text" onclick="event.stopPropagation();FC_ADMIN_PANEL.markAllRead()">Marcar como leídas</button>
      </div>
      <div class="fc-np-tabs">
        <button class="fc-np-tab ${this.tab==='all'?'active':''}"            onclick="event.stopPropagation();FC_ADMIN_PANEL.setTab('all')">Todas</button>
        <button class="fc-np-tab ${this.tab==='documentos'?'active':''}"     onclick="event.stopPropagation();FC_ADMIN_PANEL.setTab('documentos')">Documentos</button>
        <button class="fc-np-tab ${this.tab==='mantenimientos'?'active':''}" onclick="event.stopPropagation();FC_ADMIN_PANEL.setTab('mantenimientos')">Mantenimientos</button>
      </div>
      <div class="fc-np-list">`;

    if (!lista.length) {
      html += `<div class="fc-np-empty">✅<br>Sin notificaciones${this.tab !== 'all' ? ' en esta categoría' : ''}</div>`;
    } else {
      const visHoy  = visibles.filter(i => !i._date || new Date(i._date) >= hoy);
      const visPrev = visibles.filter(i => i._date && new Date(i._date) < hoy);
      if (visHoy.length)  { html += `<div class="fc-np-section-label">Hoy</div>`;        html += visHoy.map(renderItem).join(''); }
      if (visPrev.length) { html += `<div class="fc-np-section-label">Anteriores</div>`; html += visPrev.map(renderItem).join(''); }
    }

    html += `</div>`;

    if (hayMas) {
      html += `<div class="fc-np-footer">
        <div class="fc-np-see-all" onclick="event.stopPropagation();FC_ADMIN_PANEL._verMasItems()">
          Ver más (${total - this._verMas} restantes)
        </div>
      </div>`;
    }

    html += `<div class="fc-np-footer">
      <div class="fc-np-see-all" onclick="event.stopPropagation();FC_ADMIN_PANEL._irASeccionAlertas()">
        Ver todas las alertas
      </div>
    </div>`;

    panel.innerHTML = html;

    // Scroll suave al fondo si se acaba de expandir
    if (this._scrollDown) {
      const list = panel.querySelector('.fc-np-list');
      if (list) list.scrollTop = list.scrollHeight;
      this._scrollDown = false;
    }
  },

  _verMasItems() {
    this._verMas += 10;
    this._scrollDown = true;
    this.render();
  },

  _irASeccionAlertas() {
    this.close();
    if (typeof showPage === 'function') {
      showPage('alertas', 'Alertas');
    }
  },

  _clickItem(id) {
    const item = this.items.find(i => String(i.id) === String(id));
    if (!item) return;
    item.unread = false;
    // Persistir este ítem como leído
    const readIds = this._getReadIds();
    readIds.add(String(id));
    this._saveReadIds(readIds);
    if (typeof item.onClick === 'function') item.onClick();
    this.close();
    this.render();
  }
};

// ──────────────────────────────────────────────────────────────
// 4. NOTIFICACIONES MÓVIL (Conductor y Técnico — estilo Instagram)
// ──────────────────────────────────────────────────────────────
const FC_MOBILE_NOTIF = {
  pending: [],

  /**
   * Muestra una notificación tipo banner móvil
   * @param {object} opts
   *   icon    string emoji
   *   type    'danger'|'warning'|'success'|'info'
   *   app     string label (ej. "FlotaControl")
   *   title   string título breve
   *   msg     string cuerpo
   *   dur     number ms antes de cerrar (default 5000)
   *   onClick function callback al tap
   */
  show({ icon='<i class="fa-solid fa-bell"></i>', type='info', app='FlotaControl', title='', msg='', dur=5000, onClick=null } = {}) {
    const container = document.getElementById('fc-mobile-notif-container');
    if (!container) return;

    const el = document.createElement('div');
    el.className = 'fc-mob-notif';
    el.innerHTML = `
      <div class="fc-mob-notif-icon ${type}">${icon}</div>
      <div class="fc-mob-notif-body">
        <div class="fc-mob-notif-app">${app}</div>
        <div class="fc-mob-notif-title">${title}</div>
        ${msg ? `<div class="fc-mob-notif-msg">${msg}</div>` : ''}
      </div>
      <div class="fc-mob-notif-time">Ahora</div>
      <button class="fc-mob-notif-dismiss" onclick="FC_MOBILE_NOTIF.dismiss(this.closest('.fc-mob-notif'))">✕</button>`;

    if (onClick) {
      el.style.cursor = 'pointer';
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('fc-mob-notif-dismiss')) return;
        FC_MOBILE_NOTIF.dismiss(el);
        onClick();
      });
    }

    container.appendChild(el);

    // Animar entrada
    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add('show'));
    });

    // Auto-dismiss
    const timer = setTimeout(() => FC_MOBILE_NOTIF.dismiss(el), dur);
    el._timer = timer;
  },

  dismiss(el) {
    if (!el || !el.isConnected) return;
    clearTimeout(el._timer);
    el.classList.add('hiding');
    setTimeout(() => el.remove(), 400);
  },

  // Cola para mostrar múltiples con delay
  showQueue(items, delayBetween = 700) {
    items.forEach((item, idx) => {
      setTimeout(() => this.show(item), idx * delayBetween);
    });
  }
};

// ──────────────────────────────────────────────────────────────
// 5. FUNCIÓN HELPER PARA CARGAR ALERTAS Y MOSTRARLAS
// ──────────────────────────────────────────────────────────────

/**
 * Convierte alertas del sistema al formato de notificación
 */
function _alertaToNotifAdmin(alerta, placa, vehiculoId) {
  const tipo = alerta.tipoAlerta || '';
  const mapa = {
    mantenimiento_vencido: { icon:'<i class="fa-solid fa-wrench"></i>', type:'danger' },
    documento_vencido:     { icon:'<i class="fa-solid fa-file-lines"></i>', type:'danger' },
    documento_7dias:       { icon:'<i class="fa-solid fa-file-circle-exclamation"></i>', type:'danger' },
    mantenimiento_proximo: { icon:'<i class="fa-solid fa-wrench"></i>', type:'warning' },
    documento_30dias:      { icon:'<i class="fa-solid fa-file-lines"></i>', type:'info' },
    documento_15dias:      { icon:'<i class="fa-solid fa-file-circle-xmark"></i>', type:'warning' },
  };
  const cfg = mapa[tipo] || { icon:'<i class="fa-solid fa-bell"></i>', type:'info' };
  return {
    id: alerta.id,
    icon: cfg.icon,
    type: cfg.type,
    _tipo: tipo,
    msg: alerta.mensaje + (placa ? ` <strong>(${placa})</strong>` : ''),
    time: _relTime(alerta.generadaEn),
    unread: !alerta.leida,
    _date: alerta.generadaEn,
    onClick: async () => { 
      if (vehiculoId && !alerta.leida && typeof api === 'function') {
        try { await api('PATCH', `/vehiculos/${vehiculoId}/alertas/${alerta.id}/leer`); } catch(e){}
      }
      typeof showPage === 'function' && showPage('alertas', 'Alertas'); 
    }
  };
}

function _relTime(iso) {
  if (!iso) return 'Ahora';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 2) return 'Ahora';
  if (m < 60) return `${m} min`;
  if (h < 24) return `${h} h`;
  if (d < 7) return `${d} d`;
  return new Date(iso).toLocaleDateString('es-CO', { day:'numeric', month:'short' });
}

// ──────────────────────────────────────────────────────────────
// 6. AUTO-INIT: detectar rol y configurar el sistema adecuado
// ──────────────────────────────────────────────────────────────
(function autoInit() {
  const u = (() => {
    try { return JSON.parse(localStorage.getItem('fc_usuario') || 'null'); }
    catch { return null; }
  })();

  if (!u) return;

  if (u.rol === 'Administrador') {
    // Admin: panel desktop estilo Facebook
    document.addEventListener('DOMContentLoaded', () => {
      FC_ADMIN_PANEL.init();
    });
    // Si DOM ya cargó
    if (document.readyState !== 'loading') FC_ADMIN_PANEL.init();

  } else if (u.rol === 'Tecnico' || u.rol === 'Conductor') {
    // Móvil: notificaciones banner estilo Instagram
    // Se cargarán cuando el JS específico (tecnico.js / conductor.js) llame a las funciones
  }
})();

// ──────────────────────────────────────────────────────────────
// 7. INTEGRACIÓN CON FUNCIONES ADMIN EXISTENTES
// ──────────────────────────────────────────────────────────────

/**
 * Llamar desde app.js después de cargar alertas para poblar el panel.
 * @param {Array} items  Array de vehículos o array de alertas
 */
function fcAdminLoadNotifications(items) {
  const notifs = [];
  if (items && items.length > 0 && items[0].tipoAlerta) {
    items.forEach(a => {
      notifs.push(_alertaToNotifAdmin(a, a.placa, a.vehiculoId));
    });
  } else {
    (items || []).forEach(v => {
      (v.alertasDetalle || v.alertas || []).forEach(a => {
        notifs.push(_alertaToNotifAdmin(a, v.placa, v.vehiculoId || v.id));
      });
    });
  }
  if (notifs.length) FC_ADMIN_PANEL.addItems(notifs);
}

/**
 * Llamar desde tecnico.js o conductor.js para mostrar notificaciones banner.
 * @param {Array} alertas  [{tipoAlerta, mensaje, generadaEn, ...}]
 * @param {string} rol     'tecnico' | 'conductor'
 */
function fcMobileLoadNotifications(alertas, rol = 'tecnico') {
  const mapa = {
    mantenimiento_vencido: { icon:'<i class="fa-solid fa-circle-exclamation"></i>', type:'danger', title:'Mantenimiento vencido' },
    documento_vencido:     { icon:'<i class="fa-solid fa-file-circle-xmark"></i>', type:'danger', title:'Documento vencido' },
    documento_7dias:       { icon:'<i class="fa-solid fa-triangle-exclamation"></i>', type:'warning', title:'Documento por vencer' },
    mantenimiento_proximo: { icon:'<i class="fa-solid fa-wrench"></i>', type:'warning', title:'Mantenimiento próximo' },
    orden_nueva:           { icon:'<i class="fa-solid fa-clipboard-list"></i>', type:'info',    title:'Nueva orden asignada' },
    default:               { icon:'<i class="fa-solid fa-bell"></i>', type:'info',    title:'Notificación' },
  };

  const items = (alertas || []).map(a => {
    const cfg = mapa[a.tipoAlerta] || mapa.default;
    return {
      icon: cfg.icon,
      type: cfg.type,
      app: 'FlotaControl',
      title: cfg.title,
      msg: a.mensaje || a.msg || '',
      dur: cfg.type === 'danger' ? 7000 : 5000,
    };
  });

  if (items.length) FC_MOBILE_NOTIF.showQueue(items, 800);
}

// ──────────────────────────────────────────────────────────────
// 8. HELPERS PARA REEMPLAZAR confirm() NATIVO EN EL CÓDIGO EXISTENTE
//    Envolver funciones sensibles para usar fcConfirm
// ──────────────────────────────────────────────────────────────

/**
 * Confirmar eliminación de vehículo con diálogo rico
 */
async function fcConfirmEliminar(nombre, tipo = 'este elemento') {
  return fcConfirm({
    title: `¿Eliminar ${tipo}?`,
    message: `Esta acción eliminará <strong>${nombre}</strong> permanentemente y no se puede deshacer.`,
    okText: 'Sí, eliminar',
    cancelText: 'Cancelar',
    type: 'danger',
    icon: '<i class="fa-solid fa-trash"></i>',
  });
}

/**
 * Confirmar cancelación de orden
 */
async function fcConfirmCancelar(texto = 'esta orden') {
  return fcConfirm({
    title: '¿Cancelar orden?',
    message: `Se cambiará el estado de ${texto} a <strong>Cancelada</strong>.`,
    okText: 'Cancelar orden',
    cancelText: 'Volver',
    type: 'warning',
    icon: '<i class="fa-solid fa-ban"></i>',
  });
}

/**
 * Confirmar acción de finalizar asignación
 */
async function fcConfirmFinalizar(texto = 'esta asignación') {
  return fcConfirm({
    title: '¿Finalizar asignación?',
    message: `${texto} quedará registrada como <strong>Finalizada</strong>.`,
    okText: 'Finalizar',
    cancelText: 'Cancelar',
    type: 'warning',
    icon: '<i class="fa-solid fa-flag-checkered"></i>',
  });
}

/**
 * Confirmar desactivación de plan
 */
async function fcConfirmDesactivar(nombre = 'este plan') {
  return fcConfirm({
    title: '¿Desactivar plan?',
    message: `El plan <strong>${nombre}</strong> dejará de generar alertas automáticas.`,
    okText: 'Desactivar',
    cancelText: 'Cancelar',
    type: 'warning',
    icon: '<i class="fa-solid fa-pause"></i>',
  });
}

// ──────────────────────────────────────────────────────────────
// 9. POPUP DE BIENVENIDA ENRIQUECIDO (reemplaza mostrarPopupAlertasUrgentes)
// ──────────────────────────────────────────────────────────────

/**
 * Reemplaza el popup de alertas urgentes con versión más atractiva y útil.
 * Llama desde app.js en lugar de mostrarPopupAlertasUrgentes()
 */
async function fcMostrarPopupUrgentes(vehs) {
  const urgentes = [];
  (vehs || []).forEach(v => {
    (v.alertasDetalle || []).forEach(a => {
      if (a.tipoAlerta === 'documento_7dias' || a.tipoAlerta === 'documento_vencido') {
        urgentes.push({ ...a, placa: v.placa });
      }
    });
  });

  if (!urgentes.length) return;
  if (sessionStorage.getItem('fc_popup_shown')) return;
  sessionStorage.setItem('fc_popup_shown', '1');

  // Usar el fcConfirm pero con variante de info multi-alerta
  const count = urgentes.length;
  const shown = urgentes.slice(0, 3);
  const extra = count > 3 ? ` y ${count - 3} más` : '';

  const itemsHtml = shown.map(a => {
    const esVenc = a.tipoAlerta === 'documento_vencido';
    return `<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;
      background:${esVenc ? '#fff0f0' : '#fffbee'};
      border-left:4px solid ${esVenc ? '#e84a3a' : '#f0c94a'};
      border-radius:8px;margin-bottom:8px;font-size:13px;line-height:1.45">
      <span style="font-size:18px;flex-shrink:0">${esVenc ? '<i class="fa-solid fa-circle-xmark"></i>' : '<i class="fa-solid fa-circle-exclamation"></i>'}</span>
      <div>
        <div style="font-weight:600;color:#111">${a.mensaje}</div>
        <div style="font-size:12px;color:#888;margin-top:2px">Vehículo: ${a.placa}</div>
      </div>
    </div>`;
  }).join('');

  const confirmed = await fcConfirm({
    title: `${count} alerta${count > 1 ? 's' : ''} requieren atención`,
    message: `<div style="text-align:left;margin-top:4px">${itemsHtml}${extra ? `<div style="font-size:12px;color:#888;margin-top:6px;text-align:right">${extra} en la sección Alertas</div>` : ''}</div>`,
    okText: 'Ver alertas',
    cancelText: 'Entendido',
    type: 'danger',
    icon: '<i class="fa-solid fa-siren-on"></i>',
  });

  if (confirmed) {
    typeof showPage === 'function' && showPage('alertas', 'Alertas');
  }
}

// ──────────────────────────────────────────────────────────────
// 10. POPUP TÉCNICO ENRIQUECIDO
// ──────────────────────────────────────────────────────────────

/**
 * Llamar desde tecnico.js en lugar de mostrarPopupTecnico()
 * @param {Array} alertas  alertas del técnico
 * @param {Array} ordenes  órdenes abiertas del técnico
 */
function fcMostrarPopupTecnico(alertas, ordenes) {
  const mobItems = [];

  // Primero órdenes nuevas/abiertas
  const abiertas = (ordenes || []).filter(o => o.estado === 'Abierta');
  if (abiertas.length) {
    mobItems.push({
      icon: '<i class="fa-solid fa-clipboard-list"></i>',
      type: 'info',
      app: 'FlotaControl · Técnico',
      title: `${abiertas.length} orden${abiertas.length > 1 ? 'es' : ''} asignada${abiertas.length > 1 ? 's' : ''}`,
      msg: `Pendiente${abiertas.length > 1 ? 's' : ''}: ${abiertas.slice(0,2).map(o => `#${o.id}`).join(', ')}`,
      dur: 6000,
      onClick: () => typeof showPage === 'function' && showPage('ordenes', 'Mis Órdenes'),
    });
  }

  // Alertas de vehículos urgentes
  const urgent = (alertas || []).filter(a =>
    a.tipoAlerta === 'mantenimiento_vencido' || a.tipoAlerta === 'documento_vencido'
  );
  if (urgent.length) {
    mobItems.push({
      icon: '<i class="fa-solid fa-siren-on"></i>',
      type: 'danger',
      app: 'FlotaControl · Alertas',
      title: `${urgent.length} alerta${urgent.length > 1 ? 's' : ''} urgente${urgent.length > 1 ? 's' : ''}`,
      msg: urgent[0]?.mensaje?.substring(0, 60) + (urgent[0]?.mensaje?.length > 60 ? '…' : ''),
      dur: 7000,
      onClick: () => typeof showPage === 'function' && showPage('alertas', 'Alertas'),
    });
  }

  if (mobItems.length) {
    FC_MOBILE_NOTIF.showQueue(mobItems, 1000);
  }
}

/**
 * Llamar desde conductor.js al iniciar
 * @param {Array} vehs   vehículos asignados al conductor
 */
function fcMostrarPopupConductor(vehs) {
  const mobItems = [];

  const urgentes = (vehs || []).filter(v => v.estadoSemaforo === 'rojo');
  const amarillos = (vehs || []).filter(v => v.estadoSemaforo === 'amarillo');

  if (urgentes.length) {
    mobItems.push({
      icon: '<i class="fa-solid fa-siren-on"></i>',
      type: 'danger',
      app: 'FlotaControl · Conductor',
      title: `${urgentes.length} vehículo${urgentes.length > 1 ? 's' : ''} en estado urgente`,
      msg: `Placa${urgentes.length > 1 ? 's' : ''}: ${urgentes.map(v => v.placa).slice(0,2).join(', ')}`,
      dur: 7000,
    });
  }
  if (amarillos.length) {
    mobItems.push({
      icon: '<i class="fa-solid fa-triangle-exclamation"></i>',
      type: 'warning',
      app: 'FlotaControl · Conductor',
      title: `${amarillos.length} vehículo${amarillos.length > 1 ? 's' : ''} próximo a mantenimiento`,
      msg: 'Revisa el estado de tu flota asignada',
      dur: 5500,
    });
  }

  if (!mobItems.length) {
    mobItems.push({
      icon: '<i class="fa-solid fa-circle-check"></i>',
      type: 'success',
      app: 'FlotaControl · Conductor',
      title: '¡Todo en orden!',
      msg: 'Tus vehículos están operativos',
      dur: 4000,
    });
  }

  FC_MOBILE_NOTIF.showQueue(mobItems, 900);
}

// Exportar al scope global
window.FC_ADMIN_PANEL = FC_ADMIN_PANEL;
window.FC_MOBILE_NOTIF = FC_MOBILE_NOTIF;
window.fcToast = fcToast;
window.fcConfirm = fcConfirm;
window.fcConfirmEliminar = fcConfirmEliminar;
window.fcConfirmCancelar = fcConfirmCancelar;
window.fcConfirmFinalizar = fcConfirmFinalizar;
window.fcConfirmDesactivar = fcConfirmDesactivar;
window.fcAdminLoadNotifications = fcAdminLoadNotifications;
window.fcMobileLoadNotifications = fcMobileLoadNotifications;
window.fcMostrarPopupUrgentes = fcMostrarPopupUrgentes;
window.fcMostrarPopupTecnico = fcMostrarPopupTecnico;
window.fcMostrarPopupConductor = fcMostrarPopupConductor;
// ══════════════════════════════════════════════════
// BANNERS CONDUCTOR — adaptado a FC_MOBILE_NOTIF
// Llamado desde conductor.js al cargar vehículos
// ══════════════════════════════════════════════════
window._fcConductorBanners = function(vehs) {
  if (sessionStorage.getItem('fc_con_popup')) return;

  const rojos     = (vehs || []).filter(v => v.estadoSemaforo === 'rojo');
  const amarillos = (vehs || []).filter(v => v.estadoSemaforo === 'amarillo');
  const items     = [];

  if (rojos.length) {
    items.push({
      icon:  '<i class="fa-solid fa-siren-on"></i>',
      type:  'danger',
      title: `${rojos.length} vehículo${rojos.length > 1 ? 's' : ''} en estado urgente`,
      msg:   `Placa${rojos.length > 1 ? 's' : ''}: ${rojos.map(v => v.placa).slice(0, 2).join(', ')}`,
      dur:   7000,
    });
  }

  if (amarillos.length) {
    items.push({
      icon:  '<i class="fa-solid fa-triangle-exclamation"></i>',
      type:  'warning',
      title: `${amarillos.length} vehículo${amarillos.length > 1 ? 's' : ''} próximo a mantenimiento`,
      msg:   'Revisa el estado de tus vehículos asignados',
      dur:   5500,
    });
  }

  if (!items.length) {
    items.push({
      icon:  '<i class="fa-solid fa-circle-check"></i>',
      type:  'success',
      title: '¡Todo en orden!',
      msg:   'Tus vehículos están operativos',
      dur:   4000,
    });
  }

  sessionStorage.setItem('fc_con_popup', '1');
  FC_MOBILE_NOTIF.showQueue(items, 900);
};
window.fcConductorBanners = window._fcConductorBanners; // alias