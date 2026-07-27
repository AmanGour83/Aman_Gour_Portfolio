/* ==========================================================================
   script.js — boot sequence, network canvas, live stats, shared modal system,
   dynamic rendering of internships / certificates / achievements from data.js
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  runBootSequence();
  initMatrixRain();
  initMeshNetwork();
  initNav();
  initHeroTyping();
  initHeroPhoto();
  initModal();
  initContactForm();
  initPageTransitionLinks();

  if (document.body.dataset.page === 'home') {
    renderRecentWork();
    renderSkills();
  }
  if (document.body.dataset.page === 'archive') {
    renderFullArchive();
  }

  renderTimeline();
  renderFlipCerts();
  renderCoCurricular();
  loadGitHubStats();
  loadTryHackMeStats();

  // Must run last: it scans the page for .reveal elements, and most of
  // those are created by the render* calls above. Running this any
  // earlier means it finds nothing to watch and those elements stay
  // permanently hidden (opacity: 0).
  initScrollReveal();
});

/* --------------------------------------------------------------------------
   Boot sequence — once per session
   -------------------------------------------------------------------------- */

function runBootSequence() {
  const overlay = document.getElementById('boot-overlay');
  if (!overlay) return;

  if (sessionStorage.getItem('booted')) {
    overlay.remove();
    return;
  }

  const dismiss = () => {
    overlay.classList.add('hidden');
    sessionStorage.setItem('booted', '1');
    setTimeout(() => overlay.remove(), 450);
  };

  overlay.addEventListener('click', dismiss);
  setTimeout(dismiss, 2000);
}

/* --------------------------------------------------------------------------
   Network canvas — signature visual motif (node-link schematic)
   -------------------------------------------------------------------------- */

function initMeshNetwork() {
  const canvas = document.getElementById('mesh-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, nodes;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mouse = { x: -9999, y: -9999, active: false };
  const MOUSE_REACH = 170;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    const count = Math.max(28, Math.min(70, Math.floor((w * h) / 22000)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.6 + 1
    }));
  }

  function step() {
    ctx.clearRect(0, 0, w, h);

    for (const n of nodes) {
      if (!reduceMotion) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      // Gentle pull toward the cursor so a web visibly forms around it.
      if (mouse.active) {
        const dx = mouse.x - n.x, dy = mouse.y - n.y;
        const d = Math.hypot(dx, dy);
        if (d < MOUSE_REACH && d > 0.01) {
          const pull = (1 - d / MOUSE_REACH) * 0.06;
          n.x += dx * pull * 0.05;
          n.y += dy * pull * 0.05;
        }
      }
    }

    // Ambient node-to-node connections.
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 140) {
          ctx.strokeStyle = `rgba(79, 216, 255, ${0.49 * (1 - d / 140)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // Cursor connections — the mesh that follows the pointer.
    if (mouse.active) {
      for (const n of nodes) {
        const d = Math.hypot(mouse.x - n.x, mouse.y - n.y);
        if (d < MOUSE_REACH) {
          ctx.strokeStyle = `rgba(79, 217, 255, ${0.99 * (1 - d / MOUSE_REACH)})`;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y); ctx.lineTo(n.x, n.y);
          ctx.stroke();
        }
      }
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(79, 217, 255, 0.83)';
      ctx.fill();
    }

    for (const n of nodes) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(79, 217, 255, 0.83)';
      ctx.fill();
    }

    requestAnimationFrame(step);
  }

  resize();
  step();
  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
  });
  window.addEventListener('mouseleave', () => { mouse.active = false; });
  document.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; mouse.active = true;
    }
  }, { passive: true });
}

/* --------------------------------------------------------------------------
   Matrix rain — full page, scrolls with content, sits behind the grid
   -------------------------------------------------------------------------- */

function initMatrixRain() {
  const canvas = document.getElementById('matrix-rain');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const glyphs = 'アイウエオカキクケコサシスセソ0123456789ABCDEF$#@%&+=';
  const fontSize = 16;
  let columns, drops, w, h;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = document.documentElement.scrollHeight;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    columns = Math.floor(w / fontSize);
    drops = Array.from({ length: columns }, () => Math.random() * (h / fontSize));
  }

  function step() {
    ctx.fillStyle = 'rgba(7, 11, 16, 0.06)';
    ctx.fillRect(0, 0, w, h);
    ctx.font = `${fontSize}px monospace`;
    for (let i = 0; i < columns; i++) {
      const char = glyphs[Math.floor(Math.random() * glyphs.length)];
      const x = i * fontSize;
      const y = drops[i] * fontSize;
      ctx.fillStyle = Math.random() < 0.02 ? 'rgba(200, 255, 230, 0.85)' : 'rgba(57, 255, 138, 0.55)';
      ctx.fillText(char, x, y);
      if (y > h && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
    if (!reduceMotion) requestAnimationFrame(step);
  }

  resize();
  // Dynamic sections (projects/timeline/certs) render moments after this
  // runs, and images loading can also change document height — re-measure
  // shortly after and again on full load so the canvas isn't left short.
  setTimeout(resize, 300);
  window.addEventListener('load', resize);
  if (reduceMotion) {
    // Draw a single static-looking frame instead of animating.
    for (let f = 0; f < 40; f++) step();
  } else {
    step();
  }
  window.addEventListener('resize', resize);
}

/* --------------------------------------------------------------------------
   Nav — mobile toggle + active section highlight
   -------------------------------------------------------------------------- */

function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  }
}

/* --------------------------------------------------------------------------
   Hero photo — trigger the glitch-in once the image is actually loaded
   -------------------------------------------------------------------------- */

function initHeroPhoto() {
  const frame = document.getElementById('heroPhotoFrame');
  if (!frame) return;
  const img = frame.querySelector('img');
  const reveal = () => frame.classList.add('is-loaded');
  if (img.complete) reveal();
  else img.addEventListener('load', reveal, { once: true });
}

/* --------------------------------------------------------------------------
   Hero typing effect
   -------------------------------------------------------------------------- */

function initHeroTyping() {
  const el = document.querySelector('.typing-target');
  if (!el) return;

  const phrases = (SITE_DATA.profile.typingPhrases && SITE_DATA.profile.typingPhrases.length)
    ? SITE_DATA.profile.typingPhrases
    : [SITE_DATA.profile.name];

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) { el.textContent = phrases[0]; return; }

  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  const TYPE_SPEED = 90;
  const DELETE_SPEED = 45;
  const HOLD_MS = 1600;

  (function tick() {
    const current = phrases[phraseIndex];

    if (isDeleting) {
      charIndex--;
      el.textContent = current.slice(0, charIndex);
    } else {
      charIndex++;
      el.textContent = current.slice(0, charIndex);
    }

    if (!isDeleting && charIndex === current.length) {
      setTimeout(() => { isDeleting = true; tick(); }, HOLD_MS);
      return;
    }
    if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
    }

    setTimeout(tick, isDeleting ? DELETE_SPEED : TYPE_SPEED);
  })();
}

/* --------------------------------------------------------------------------
   Scroll reveal
   -------------------------------------------------------------------------- */

function initScrollReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  items.forEach(i => io.observe(i));
}

/* --------------------------------------------------------------------------
   Count-up numbers
   -------------------------------------------------------------------------- */

function countUp(el, target, duration = 1100) {
  const start = performance.now();
  const from = 0;
  function frame(now) {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (target - from) * eased).toLocaleString();
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* --------------------------------------------------------------------------
   Live stats — GitHub (Netlify Function) + TryHackMe (static JSON)
   -------------------------------------------------------------------------- */

async function loadGitHubStats() {
  const repoEl = document.getElementById('stat-repos');
  const starEl = document.getElementById('stat-stars');
  if (!repoEl && !starEl) return;
  try {
    const res = await fetch('/.netlify/functions/github-stats');
    if (!res.ok) throw new Error('bad response');
    const data = await res.json();
    if (repoEl && typeof data.publicRepos === 'number') {
      repoEl.closest('.stat')?.classList.remove('is-loading');
      countUp(repoEl, data.publicRepos);
    }
    if (starEl && typeof data.totalStars === 'number') {
      starEl.closest('.stat')?.classList.remove('is-loading');
      countUp(starEl, data.totalStars);
    }
  } catch (err) {
    [repoEl, starEl].forEach(el => {
      if (!el) return;
      el.closest('.stat')?.classList.remove('is-loading');
      el.closest('.stat')?.classList.add('is-stale');
      el.textContent = '—';
    });
  }
}

async function loadTryHackMeStats() {
  const rankEl = document.getElementById('stat-thm-rank');
  const roomsEl = document.getElementById('stat-thm-rooms');
  if (!rankEl && !roomsEl) return;
  try {
    const res = await fetch('thm-stats.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('missing');
    const data = await res.json();
    // Graceful fallback: if the scrape marked itself stale, still show the
    // last cached numbers rather than blank UI — just flag it visually.
    // The committed seed file ships with nulls until the first scheduled
    // scrape runs, so treat null the same as "no data yet".
    if (rankEl) {
      rankEl.closest('.stat')?.classList.remove('is-loading');
      rankEl.textContent = (data.rank === null || typeof data.rank === 'undefined') ? '—' : data.rank;
    }
    if (roomsEl) {
      roomsEl.closest('.stat')?.classList.remove('is-loading');
      if (typeof data.roomsCompleted === 'number') {
        countUp(roomsEl, data.roomsCompleted);
      } else {
        roomsEl.textContent = '—';
      }
    }
    if (data.stale) {
      [rankEl, roomsEl].forEach(el => el?.closest('.stat')?.classList.add('is-stale'));
    }
  } catch (err) {
    [rankEl, roomsEl].forEach(el => {
      if (!el) return;
      el.closest('.stat')?.classList.remove('is-loading');
      el.closest('.stat')?.classList.add('is-stale');
      el.textContent = '—';
    });
  }
}

/* --------------------------------------------------------------------------
   Recent work strip (home) + full archive (work.html)
   -------------------------------------------------------------------------- */

function workCardHTML(project, index) {
  const caseId = `CASE-${String(index + 1).padStart(2, '0')}`;
  return `
    <button class="work-card reveal" data-modal-type="project" data-modal-id="${project.id}">
      <div class="work-card-id">${caseId} · ${project.date}</div>
      <h4><span>${project.icon}</span>${escapeHTML(project.title)}</h4>
      <p>${escapeHTML(project.summary)}</p>
      <div class="tag-row">${project.tech.slice(0, 3).map(t => `<span class="tag">${escapeHTML(t)}</span>`).join('')}</div>
    </button>`;
}

function renderRecentWork() {
  const mount = document.getElementById('recent-work-grid');
  if (!mount) return;
  const recent = SITE_DATA.projects.filter(p => p.recent);
  mount.innerHTML = recent.map((p, i) => workCardHTML(p, i)).join('');
  attachModalTriggers(mount);
}

function renderSkills() {
  const mount = document.getElementById('skills-list');
  if (!mount) return;
  mount.innerHTML = SITE_DATA.skills.map(s => `<span class="tag">${escapeHTML(s)}</span>`).join('');
}

function renderFullArchive() {
  const mount = document.getElementById('archive-grid');
  if (!mount) return;
  const sorted = [...SITE_DATA.projects].sort((a, b) => b.date.localeCompare(a.date));
  mount.innerHTML = sorted.map((p, i) => workCardHTML(p, i)).join('');
  attachModalTriggers(mount);
}

/* --------------------------------------------------------------------------
   Internship timeline
   -------------------------------------------------------------------------- */

function renderTimeline() {
  const mount = document.getElementById('internship-timeline');
  if (!mount) return;
  mount.innerHTML = SITE_DATA.internships.map(item => `
    <div class="tl-item reveal">
      <span class="tl-node"></span>
      <button class="tl-trigger" data-modal-type="internship" data-modal-id="${item.id}">
        <div class="tl-org">${escapeHTML(item.org)}</div>
        <div class="tl-role">${escapeHTML(item.role)}${item.via ? ' · ' + escapeHTML(item.via) : ''}</div>
        <div class="tl-dates">${escapeHTML(item.dates)}</div>
      </button>
    </div>
  `).join('');
  attachModalTriggers(mount);
}

/* --------------------------------------------------------------------------
   Course certificates — flip cards
   -------------------------------------------------------------------------- */

function renderFlipCerts() {
  const mount = document.getElementById('cert-flip-grid');
  if (!mount) return;
  mount.innerHTML = SITE_DATA.courseCertificates.map(c => `
    <button class="cc-flip reveal" data-modal-type="coursecert" data-modal-id="${c.id}" aria-label="View ${escapeHTML(c.title)} certificate">
      <div class="cc-flip-inner">
        <div class="cc-face cc-face-front">
          <div>
            <div class="cc-face-title">${escapeHTML(c.title)}</div>
            <div class="cc-face-issuer">${escapeHTML(c.issuer)}</div>
          </div>
          <div class="cc-face-hint">◇ verified — hover to preview</div>
        </div>
        <div class="cc-face cc-face-back">
          <img src="${c.image}" alt="${escapeHTML(c.title)} certificate" loading="lazy">
        </div>
      </div>
    </button>
  `).join('');
  attachModalTriggers(mount);
}

/* --------------------------------------------------------------------------
   Co-curricular — achievement unlock badges
   -------------------------------------------------------------------------- */

function renderCoCurricular() {
  const mount = document.getElementById('cocurr-grid');
  if (!mount) return;
  mount.innerHTML = SITE_DATA.coCurricular.map(item => `
    <button class="cocurr-badge reveal" data-modal-type="cocurricular" data-modal-id="${item.id}">
      <div class="badge-icon">◆ achievement</div>
      <div class="badge-title">${escapeHTML(item.title)}</div>
      <div class="badge-issuer">${escapeHTML(item.issuer)}</div>
    </button>
  `).join('');

  attachModalTriggers(mount);

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('is-unlocked'), 120);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.35 });
  mount.querySelectorAll('.cocurr-badge').forEach(b => io.observe(b));
}

/* --------------------------------------------------------------------------
   Shared modal system
   -------------------------------------------------------------------------- */

let modalTypeTimer = null;
let galleryState = { images: [], index: 0 };

function attachModalTriggers(scope) {
  scope.querySelectorAll('[data-modal-type]').forEach(el => {
    el.addEventListener('click', () => openModal(el.dataset.modalType, el.dataset.modalId));
  });
}

function initModal() {
  const overlay = document.getElementById('shared-modal');
  if (!overlay) return;
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  overlay.querySelector('.modal-close')?.addEventListener('click', closeModal);
  overlay.querySelector('.modal-nav-prev')?.addEventListener('click', galleryPrev);
  overlay.querySelector('.modal-nav-next')?.addEventListener('click', galleryNext);
  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') galleryPrev();
    if (e.key === 'ArrowRight') galleryNext();
  });
}

function findItem(type, id) {
  const map = {
    project: SITE_DATA.projects,
    internship: SITE_DATA.internships,
    coursecert: SITE_DATA.courseCertificates,
    cocurricular: SITE_DATA.coCurricular
  };
  return (map[type] || []).find(i => i.id === id);
}

function setGallery(images) {
  galleryState = { images: images || [], index: 0 };
  updateGalleryImage();
}

function updateGalleryImage() {
  const overlay = document.getElementById('shared-modal');
  if (!overlay) return;
  const img = overlay.querySelector('.modal-img');
  const wrap = overlay.querySelector('.modal-img-wrap');
  const nav = overlay.querySelector('.modal-img-nav');
  const counter = overlay.querySelector('.modal-img-counter');
  const { images, index } = galleryState;

  if (!images.length) {
    wrap.style.display = 'none';
    return;
  }
  wrap.style.display = 'block';
  const current = images[index];
  img.src = current.src;
  img.alt = current.label || '';
  nav.style.display = images.length > 1 ? 'flex' : 'none';
  counter.textContent = images.length > 1
    ? `${current.label ? escapeHTML(current.label) + ' · ' : ''}${index + 1} / ${images.length}`
    : (current.label || '');
}

function galleryPrev() {
  if (galleryState.images.length < 2) return;
  galleryState.index = (galleryState.index - 1 + galleryState.images.length) % galleryState.images.length;
  updateGalleryImage();
}

function galleryNext() {
  if (galleryState.images.length < 2) return;
  galleryState.index = (galleryState.index + 1) % galleryState.images.length;
  updateGalleryImage();
}

function openModal(type, id) {
  const item = findItem(type, id);
  if (!item) return;
  const overlay = document.getElementById('shared-modal');
  if (!overlay) return;

  const eyebrow = overlay.querySelector('.modal-eyebrow');
  const title = overlay.querySelector('.modal-title');
  const meta = overlay.querySelector('.modal-meta');
  const desc = overlay.querySelector('.modal-desc');
  const tags = overlay.querySelector('.modal-tags');
  const link = overlay.querySelector('.modal-link');

  if (type === 'project') {
    eyebrow.textContent = 'PROJECT DOSSIER';
    title.textContent = item.title;
    meta.textContent = item.date;
    setGallery([]);
    tags.innerHTML = item.tech.map(t => `<span class="tag">${escapeHTML(t)}</span>`).join('');
    link.style.display = 'inline-flex';
    link.href = item.github;
    link.innerHTML = '↗ View on GitHub';
    typeOutDescription(desc, item.description);
  } else if (type === 'internship') {
    eyebrow.textContent = 'INTERNSHIP RECORD';
    title.textContent = item.org;
    meta.textContent = `${item.role} · ${item.dates}`;
    setGallery(item.images || []);
    tags.innerHTML = item.tech.map(t => `<span class="tag">${escapeHTML(t)}</span>`).join('');
    link.style.display = 'none';
    typeOutDescription(desc, item.description);
  } else if (type === 'coursecert') {
    eyebrow.textContent = 'CERTIFICATE RECORD';
    title.textContent = item.title;
    meta.textContent = item.issuer;
    setGallery([{ src: item.image, label: 'Certificate' }]);
    tags.innerHTML = '';
    link.style.display = 'none';
    typeOutDescription(desc, item.description || '');
  } else if (type === 'cocurricular') {
    eyebrow.textContent = 'ACTIVITY LOG — WHAT I LEARNED';
    title.textContent = item.title;
    meta.textContent = item.issuer;
    setGallery([{ src: item.image, label: 'Certificate' }]);
    tags.innerHTML = '';
    link.style.display = 'none';
    typeOutDescription(desc, item.learned || '');
  }

  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
  overlay.querySelector('.modal-close')?.focus();
}

function typeOutDescription(el, text) {
  clearTimeout(modalTypeTimer);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) { el.textContent = text; return; }
  el.innerHTML = '<span class="caret"></span>';
  let i = 0;
  (function tick() {
    if (i <= text.length) {
      el.innerHTML = escapeHTML(text.slice(0, i)) + '<span class="caret"></span>';
      i += 2;
      modalTypeTimer = setTimeout(tick, 12);
    } else {
      el.textContent = text;
    }
  })();
}

function closeModal() {
  const overlay = document.getElementById('shared-modal');
  if (!overlay) return;
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
  clearTimeout(modalTypeTimer);
}

/* --------------------------------------------------------------------------
   Contact form (Formspree, submitted via fetch to avoid a full page reload)
   -------------------------------------------------------------------------- */

function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const status = document.getElementById('formStatus');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = 'Transmitting...';
    status.className = 'form-status';
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      if (res.ok) {
        status.textContent = '✓ Message sent — I\'ll get back to you soon.';
        status.className = 'form-status ok';
        form.reset();
      } else {
        throw new Error('failed');
      }
    } catch (err) {
      status.textContent = '✗ Something went wrong — please email me directly instead.';
      status.className = 'form-status err';
    }
  });
}

/* --------------------------------------------------------------------------
   Page transition for home <-> archive navigation
   -------------------------------------------------------------------------- */

function initPageTransitionLinks() {
  const el = document.getElementById('page-transition');
  document.querySelectorAll('[data-page-transition]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      e.preventDefault();
      if (el) el.classList.add('is-active');
      setTimeout(() => { window.location.href = href; }, 320);
    });
  });
}

/* --------------------------------------------------------------------------
   Utility
   -------------------------------------------------------------------------- */

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}