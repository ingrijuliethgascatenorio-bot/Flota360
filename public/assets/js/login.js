/* ═══════════════════════════════════════
   login.js — Autenticación y redirect por rol
═══════════════════════════════════════ */

// Si ya tiene sesión, redirigir directo
(function checkSession() {
  const u = getUsuario();
  const t = getToken();
  if (t && u) {
    const dest = {
      Administrador: '/pages/admin.html',
      Tecnico:       '/pages/tecnico.html',
      Conductor:     '/pages/conductor.html',
    };
    window.location.href = dest[u.rol] || '/pages/admin.html';
  }
})();

document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn   = document.getElementById('btn-login');
  const errEl = document.getElementById('login-error');
  const correo = document.getElementById('inp-correo').value.trim();
  const pass   = document.getElementById('inp-pass').value;

  btn.querySelector('span').style.display       = 'none';
  btn.querySelector('.btn-loader').style.display = 'block';
  btn.disabled     = true;
  errEl.style.display = 'none';

  try {
    const res     = await api('POST', '/auth/login', { correo, contrasena: pass });
    // El backend devuelve { accessToken, usuario }
    const token   = res.accessToken   || res.data?.token   || res.token   || res.access_token;
    const usuario = res.usuario       || res.data?.usuario || res.user;

    if (!token || !usuario) throw new Error('Respuesta inesperada del servidor');

    saveSession(token, usuario);  // redirige automáticamente
  } catch (err) {
    errEl.textContent   = err.message || 'Credenciales inválidas';
    errEl.style.display = 'block';
  } finally {
    btn.querySelector('span').style.display       = 'block';
    btn.querySelector('.btn-loader').style.display = 'none';
    btn.disabled = false;
  }
});