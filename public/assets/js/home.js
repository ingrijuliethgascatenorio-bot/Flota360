/* ═══════════════════════════════════════════════
   home.js — FlotaControl 360 · Huila · v2
═══════════════════════════════════════════════ */

/* ── SESSION CHECK ── */
(function checkSession() {
  const t = localStorage.getItem('fc_token');
  const u = JSON.parse(localStorage.getItem('fc_usuario') || 'null');
  if (t && u) {
    const dest = { Administrador: 'admin.html', Tecnico: 'tecnico.html', Conductor: 'conductor.html' };
    window.location.href = dest[u.rol] || 'admin.html';
  }
})();

/* ── PRELOADER ── */
(function initPreloader() {
  const fill = document.getElementById('plFill');
  const text = document.getElementById('plText');
  const pl   = document.getElementById('preloader');
  if (!pl) return;
  const messages = ['Iniciando sistema...', 'Cargando módulos...', 'Conectando flota...', 'Listo para operar...'];
  let prog = 0, msgIdx = 0;
  const iv = setInterval(() => {
    prog += Math.random() * 16 + 8;
    if (prog >= 100) { prog = 100; clearInterval(iv); }
    if (fill) fill.style.width = prog + '%';
    const ni = Math.min(Math.floor(prog / 26), messages.length - 1);
    if (ni !== msgIdx && text) { msgIdx = ni; text.textContent = messages[msgIdx]; }
    if (prog >= 100) setTimeout(() => pl.classList.add('hide'), 350);
  }, 75);
})();

/* ── CURSOR ── */
(function initCursor() {
  const cur = document.getElementById('cursor');
  const tr  = document.getElementById('cursorTrail');
  if (!cur || !tr) return;
  let mx = 0, my = 0, tx = 0, ty = 0;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cur.style.left = mx + 'px'; cur.style.top = my + 'px';
  });
  (function animTrail() {
    tx += (mx - tx) * 0.13; ty += (my - ty) * 0.13;
    tr.style.left = tx + 'px'; tr.style.top = ty + 'px';
    requestAnimationFrame(animTrail);
  })();
  document.querySelectorAll('a,button,.feat-card,.stat-card,.role-card,.sf3-light').forEach(el => {
    el.addEventListener('mouseenter', () => { cur.style.transform = 'translate(-50%,-50%) scale(2.2)'; cur.style.background = 'rgba(42,127,212,0.45)'; });
    el.addEventListener('mouseleave', () => { cur.style.transform = 'translate(-50%,-50%) scale(1)'; cur.style.background = '#2a7fd4'; });
  });
})();

/* ── NAVBAR ── */
(function initNavbar() {
  const nav = document.getElementById('hn');
  if (!nav) return;
  let lastY = 0;
  nav.style.transition = 'all .35s ease';
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 36);
    if (y > lastY + 12 && y > 180) nav.style.transform = 'translateY(-100%)';
    else if (y < lastY - 5) nav.style.transform = 'translateY(0)';
    lastY = y;
  }, { passive: true });
})();

/* ── SMOOTH SCROLL ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const t = document.querySelector(a.getAttribute('href'));
    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ── PARTICLES ── */
(function initParticles() {
  const canvas = document.getElementById('particlesCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }
  resize();
  window.addEventListener('resize', resize, { passive: true });
  const pts = Array.from({ length: 55 }, () => ({
    x: Math.random() * canvas.width, y: Math.random() * canvas.height,
    r: Math.random() * 1.4 + 0.3,
    vx: (Math.random() - .5) * 0.35, vy: (Math.random() - .5) * 0.35,
    op: Math.random() * 0.4 + 0.08
  }));
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(42,127,212,${p.op})`; ctx.fill();
    });
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < 110) {
          ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = `rgba(42,127,212,${0.07 * (1 - d/110)})`; ctx.lineWidth = .7; ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ── 3D CARD TILT ── */
(function initTilt() {
  const w = document.getElementById('card3dWrapper');
  if (!w) return;
  w.addEventListener('mousemove', e => {
    const r = w.getBoundingClientRect();
    const dx = (e.clientX - r.left - r.width/2) / (r.width/2);
    const dy = (e.clientY - r.top  - r.height/2) / (r.height/2);
    w.style.animation = 'none';
    w.style.transform = `perspective(1100px) rotateY(${dx*11}deg) rotateX(${-dy*7}deg) translateZ(8px)`;
  });
  w.addEventListener('mouseleave', () => { w.style.animation = ''; w.style.transform = ''; });
})();

/* ── PARALLAX BG ── */
(function initParallax() {
  const bg = document.querySelector('.hero-bg-img');
  if (!bg) return;
  window.addEventListener('scroll', () => { bg.style.transform = `translateY(${window.scrollY * 0.22}px)`; }, { passive: true });
})();

/* ── COUNTER ANIMATION ── */
function animCounter(el, target, dur = 1700) {
  const start = performance.now();
  const update = now => {
    const t = Math.min((now - start) / dur, 1);
    const ease = 1 - Math.pow(1 - t, 4);
    el.textContent = Math.round(target * ease);
    if (t < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

/* ── INTERSECTION OBSERVER ── */
(function initObserver() {
  /* Reveal cards */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  document.querySelectorAll('.js-reveal').forEach(el => revealObs.observe(el));

  /* Hero counters */
  const cObs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { animCounter(e.target, +e.target.dataset.target, 1400); cObs.unobserve(e.target); } });
  }, { threshold: 0.5 });
  document.querySelectorAll('.counter').forEach(el => cObs.observe(el));
})();

/* ── CARRUSEL ── */
(function initCarousel() {
  const track    = document.getElementById('carTrack');
  const tabs     = document.querySelectorAll('.car-tab');
  const prevBtn  = document.getElementById('carPrev');
  const nextBtn  = document.getElementById('carNext');
  const urlText  = document.getElementById('carUrlText');
  const progress = document.getElementById('carProgress');
  const slides   = document.querySelectorAll('.car-slide');
  if (!track || !slides.length) return;

  const TOTAL     = slides.length;
  const AUTO_TIME = 4500;
  let current  = 0;
  let autoTimer = null;

  const urls = Array.from(slides).map(s => s.dataset.url || '');

  function goTo(idx, animate = true) {
    current = ((idx % TOTAL) + TOTAL) % TOTAL;
    if (!animate) track.style.transition = 'none';
    track.style.transform = `translateX(-${current * 100}%)`;
    if (!animate) requestAnimationFrame(() => { requestAnimationFrame(() => { track.style.transition = ''; }); });

    /* tabs */
    tabs.forEach((t, i) => t.classList.toggle('active', i === current));

    /* url bar */
    if (urlText) {
      urlText.style.opacity = '0';
      setTimeout(() => { urlText.textContent = urls[current]; urlText.style.opacity = '1'; }, 200);
    }

    /* progress bar */
    if (progress) progress.style.width = ((current + 1) / TOTAL * 100) + '%';
  }

  /* Auto-advance */
  function startAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current + 1), AUTO_TIME);
  }
  function resetAuto() { startAuto(); }

  /* Tabs */
  tabs.forEach(tab => {
    tab.addEventListener('click', () => { goTo(+tab.dataset.idx); resetAuto(); });
  });

  /* Arrows */
  if (prevBtn) prevBtn.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { goTo(current + 1); resetAuto(); });

  /* Keyboard */
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { goTo(current - 1); resetAuto(); }
    if (e.key === 'ArrowRight') { goTo(current + 1); resetAuto(); }
  });

  /* Touch/swipe */
  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { goTo(current + (diff > 0 ? 1 : -1)); resetAuto(); }
  });

  /* Pause on hover */
  track.closest('.car-browser')?.addEventListener('mouseenter', () => clearInterval(autoTimer));
  track.closest('.car-browser')?.addEventListener('mouseleave', startAuto);

  /* URL bar transition */
  if (urlText) urlText.style.transition = 'opacity .2s';

  goTo(0, false);
  startAuto();
})();

/* ── MOBILE MENU ── */
(function initMobile() {
  const btn   = document.getElementById('mobMenu');
  const links = document.getElementById('hnLinks');
  if (!btn || !links) return;
  let open = false;
  btn.addEventListener('click', () => {
    open = !open;
    if (open) {
      links.style.cssText = 'display:flex;flex-direction:column;position:fixed;top:68px;left:0;right:0;background:rgba(7,17,30,0.97);backdrop-filter:blur(18px);padding:20px 22px;gap:6px;border-bottom:1px solid rgba(255,255,255,0.07);z-index:490;';
      btn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    } else {
      links.style.cssText = '';
      btn.innerHTML = '<i class="fa-solid fa-bars"></i>';
    }
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 960 && open) { open = false; links.style.cssText = ''; btn.innerHTML = '<i class="fa-solid fa-bars"></i>'; } });
  /* Close on nav link click */
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    if (open) { open = false; links.style.cssText = ''; btn.innerHTML = '<i class="fa-solid fa-bars"></i>'; }
  }));
})();

/* ── 3D TILT ROLE CARDS ── */
(function initRoleTilt() {
  const cards = document.querySelectorAll('.role-card[data-tilt]');
  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const x  = (e.clientX - r.left) / r.width  - 0.5;
      const y  = (e.clientY - r.top)  / r.height - 0.5;
      const rotX = -(y * 18);
      const rotY =  (x * 18);
      const shine = card.querySelector('.rc-char-shine');
      card.style.transition = 'box-shadow .1s, border-color .1s';
      card.style.transform  = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.04,1.04,1.04)`;
      if (card.classList.contains('rc-admin'))
        card.style.boxShadow = `${-x*28}px ${-y*28}px 48px rgba(42,127,212,.32), 0 24px 60px rgba(0,0,0,.35)`;
      else if (card.classList.contains('rc-tech'))
        card.style.boxShadow = `${-x*28}px ${-y*28}px 48px rgba(192,112,64,.32), 0 24px 60px rgba(0,0,0,.35)`;
      else
        card.style.boxShadow = `${-x*28}px ${-y*28}px 48px rgba(26,170,106,.32), 0 24px 60px rgba(0,0,0,.35)`;
      if (shine) {
        shine.style.transform = `translateX(calc(-50% + ${x*30}px)) translateY(${y*10}px)`;
        shine.style.opacity   = '0.7';
      }
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform .55s cubic-bezier(.22,1,.36,1), box-shadow .55s';
      card.style.transform  = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
      card.style.boxShadow  = '';
      const shine = card.querySelector('.rc-char-shine');
      if (shine) { shine.style.transform = 'translateX(-50%)'; shine.style.opacity = ''; }
    });
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'box-shadow .1s, border-color .1s';
    });
  });
})();

/* ═══════════════════════════════════════════════════════════════
   ANIMACIONES PREMIUM — Tesla / Apple level
   Entrada cinematográfica, microinteracciones, parallax, stagger
═══════════════════════════════════════════════════════════════ */

/* ── SCROLL PROGRESS BAR ── */
(function initScrollProgress() {
  const bar = document.createElement('div');
  bar.id = 'scrollProgress';
  document.body.prepend(bar);
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (window.scrollY / max * 100) + '%';
  }, { passive: true });
})();

/* ── SECTION HEADERS — reveal elegante ── */
(function initHeaderReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const hdr = e.target;
      hdr.querySelectorAll('.sec-eyebrow, .sec-title, .sec-desc').forEach(el => {
        el.classList.add('anim-in');
      });
      obs.unobserve(hdr);
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.section-header').forEach(el => obs.observe(el));
})();

/* ── PARALLAX MULTI-CAPA en scroll ── */
(function initParallaxPremium() {
  const layers = [
    { sel: '.hero-bg-img',   speed: 0.22 },
    { sel: '.features::before', speed: 0 }, // manejado por CSS orbFloat
  ];
  const heroBg = document.querySelector('.hero-bg-img');
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (heroBg) heroBg.style.transform = `translateY(${y * 0.22}px)`;
  }, { passive: true });
})();

/* ── MOD-CARD 3D TILT SUAVE ── */
(function initCardTiltPremium() {
  document.querySelectorAll('.mod-card').forEach(card => {
    let raf;
    card.addEventListener('mousemove', e => {
      if (card.closest('#cflowTrack') && !card.classList.contains('card-active')) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r  = card.getBoundingClientRect();
        const x  = (e.clientX - r.left) / r.width  - 0.5;
        const y  = (e.clientY - r.top)  / r.height - 0.5;
        const tX = x * 7;
        const tY = -y * 5;
        card.style.transition = 'box-shadow 0.1s ease, border-color 0.1s ease';
        if (card.closest('#cflowTrack')) {
          card.style.transform  = `perspective(1000px) translate3d(0, 0, 30px) scale(1) rotateY(${tX}deg) rotateX(${tY}deg)`;
        } else {
          card.style.transform  = `translateY(-14px) scale(1.025) perspective(900px) rotateY(${tX}deg) rotateX(${tY}deg)`;
        }
      });
    });
    card.addEventListener('mouseleave', () => {
      cancelAnimationFrame(raf);
      card.style.transition = 'transform 0.55s cubic-bezier(0.16,1,0.3,1), box-shadow 0.55s, border-color 0.3s';
      if (card.closest('#cflowTrack')) {
        card.style.transform  = 'perspective(1000px) translate3d(0, 0, 30px) scale(1)';
      } else {
        card.style.transform  = '';
      }
    });
  });
})();

/* ── MOD-BTN RIPPLE ── */
(function initRipple() {
  document.querySelectorAll('.mod-btn, .btn-primary, .hn-cta').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const r = this.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(r.width, r.height) * 1.8;
      ripple.style.cssText = `
        position:absolute;
        width:${size}px;height:${size}px;
        left:${e.clientX - r.left - size/2}px;
        top:${e.clientY - r.top  - size/2}px;
        background:rgba(255,255,255,0.22);
        border-radius:50%;
        transform:scale(0);
        animation:rippleAnim 0.55s var(--ease-out-expo) forwards;
        pointer-events:none;
        z-index:99;
      `;
      if (!document.querySelector('#rippleStyle')) {
        const s = document.createElement('style');
        s.id = 'rippleStyle';
        s.textContent = '@keyframes rippleAnim{to{transform:scale(1);opacity:0}}';
        document.head.appendChild(s);
      }
      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 580);
    });
  });
})();

/* ── STAGGER DE LABELS DENTRO DE CADA CARD ── */
(function initCardInnerStagger() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const card = e.target;
      const items = card.querySelectorAll('.mod-provider, .mod-title, .mod-meta, .mod-bottom');
      items.forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(12px)';
        el.style.transition = `opacity 0.5s ease ${i * 0.07 + 0.1}s, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 0.07 + 0.1}s`;
        requestAnimationFrame(() => {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        });
      });
      obs.unobserve(card);
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.mod-card').forEach(c => obs.observe(c));
})();

/* ── PARALLAX SUTIL EN FEAT-GRID ── */
(function initFeatureParallax() {
  const cards = document.querySelectorAll('.mod-card');
  if (!cards.length) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    cards.forEach((card, i) => {
      const speed = (i % 2 === 0) ? 0.018 : -0.012;
      const rect  = card.getBoundingClientRect();
      if (rect.top < window.innerHeight + 200 && rect.bottom > -200) {
        card.style.setProperty('--parallax-y', `${(y - card.offsetTop) * speed}px`);
      }
    });
  }, { passive: true });
})();

/* ── CURSOR GLOW SOBRE CARDS ── */
(function initCardCursorGlow() {
  document.querySelectorAll('.mod-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      card.style.setProperty('--gx', x + 'px');
      card.style.setProperty('--gy', y + 'px');
      const bg = card.querySelector('.mod-card-bg');
      if (bg) {
        bg.style.background = `radial-gradient(280px circle at ${x}px ${y}px, var(--bg1, rgba(42,127,212,.18)), transparent 70%)`;
      }
    });
    card.addEventListener('mouseleave', () => {
      const bg = card.querySelector('.mod-card-bg');
      if (bg) bg.style.background = '';
    });
  });
})();

/* ── TITLE GLITCH EFFECT ── */
(function initGlitch() {
  const el = document.querySelector('.title-line2');
  if (!el) return;
  const orig = el.textContent;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  function glitch() {
    let iter = 0;
    const iv = setInterval(() => {
      el.textContent = orig.split('').map((c, i) => {
        if (c === ' ') return ' ';
        if (i < iter) return orig[i];
        return chars[Math.floor(Math.random() * chars.length)];
      }).join('');
      if (iter >= orig.length) { clearInterval(iv); el.textContent = orig; }
      iter += 0.6;
    }, 28);
  }
  setTimeout(glitch, 1100);
  setInterval(glitch, 9000);
})();

/* ── COVER FLOW CAROUSEL ── */
(function initCoverFlow() {
  const track = document.getElementById('cflowTrack');
  const cards = track ? Array.from(track.querySelectorAll('.mod-card')) : [];
  const prevBtn = document.getElementById('cflowPrev');
  const nextBtn = document.getElementById('cflowNext');
  const dotsContainer = document.getElementById('cflowDots');

  if (!track || cards.length === 0) return;

  let activeIndex = 2; // Center card (Alertas) active initially
  const totalCards = cards.length;

  // Create Dots
  dotsContainer.innerHTML = '';
  cards.forEach((_, idx) => {
    const dot = document.createElement('button');
    dot.className = `cflow-dot${idx === activeIndex ? ' active' : ''}`;
    dot.setAttribute('aria-label', `Ir a tarjeta ${idx + 1}`);
    dot.addEventListener('click', () => {
      activeIndex = idx;
      updateCoverFlow();
    });
    dotsContainer.appendChild(dot);
  });

  const dots = Array.from(dotsContainer.querySelectorAll('.cflow-dot'));

  function updateCoverFlow() {
    cards.forEach((card, idx) => {
      card.classList.remove('card-active', 'card-prev', 'card-next', 'card-far-prev', 'card-far-next', 'card-hidden');
      card.style.transform = ''; 

      if (idx === activeIndex) {
        card.classList.add('card-active');
      } else if (idx === activeIndex - 1) {
        card.classList.add('card-prev');
      } else if (idx === activeIndex + 1) {
        card.classList.add('card-next');
      } else if (idx < activeIndex - 1) {
        if (idx === activeIndex - 2) {
          card.classList.add('card-far-prev');
        } else {
          card.classList.add('card-hidden');
        }
      } else if (idx > activeIndex + 1) {
        if (idx === activeIndex + 2) {
          card.classList.add('card-far-next');
        } else {
          card.classList.add('card-hidden');
        }
      }
    });

    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === activeIndex);
    });
  }

  function goNext() {
    if (activeIndex < totalCards - 1) {
      activeIndex++;
      updateCoverFlow();
    }
  }

  function goPrev() {
    if (activeIndex > 0) {
      activeIndex--;
      updateCoverFlow();
    }
  }

  if (prevBtn) prevBtn.addEventListener('click', goPrev);
  if (nextBtn) nextBtn.addEventListener('click', goNext);

  document.addEventListener('keydown', e => {
    const rect = track.getBoundingClientRect();
    const inViewport = rect.top < window.innerHeight && rect.bottom > 0;
    if (inViewport) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
    }
  });

  let startX = 0;
  let isDragging = false;
  let dragDiff = 0;

  function dragStart(e) {
    startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    isDragging = true;
    dragDiff = 0;
  }

  function dragMove(e) {
    if (!isDragging) return;
    const currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    dragDiff = startX - currentX;
    
    if (Math.abs(dragDiff) < 150) {
      track.style.transform = `translateX(${-dragDiff * 0.3}px)`;
    }
  }

  function dragEnd() {
    if (!isDragging) return;
    isDragging = false;
    track.style.transform = ''; 

    if (Math.abs(dragDiff) > 50) {
      if (dragDiff > 0) {
        goNext();
      } else {
        goPrev();
      }
    }
  }

  track.addEventListener('mousedown', dragStart);
  window.addEventListener('mousemove', dragMove);
  window.addEventListener('mouseup', dragEnd);

  track.addEventListener('touchstart', dragStart, { passive: true });
  track.addEventListener('touchmove', dragMove, { passive: true });
  track.addEventListener('touchend', dragEnd);

  track.addEventListener('selectstart', e => e.preventDefault());

  cards.forEach(card => {
    card.addEventListener('click', e => {
      if (Math.abs(dragDiff) > 10) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  });

  updateCoverFlow();
})();