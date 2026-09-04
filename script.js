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
  initAllInternshipsModal();
  initAllCertsModal();
  initAllCocurrModal();
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
  initTimelineToggle();
  renderFlipCerts();
  initCertsToggle();
  renderCoCurricular();
  initCocurrToggle();

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

  // Scroll spy: dynamically highlight current section in navigation bar
  if (document.body.dataset.page !== 'home') return;

  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  if (!navLinks.length) return;

  const sectionDefs = [
    { id: 'home', el: document.getElementById('home') },
    { id: 'about', el: document.getElementById('about') },
    { id: 'projects', el: document.getElementById('projects') },
    { id: 'achievements', el: document.getElementById('achievements') },
    { id: 'certificates', el: document.getElementById('certificates') },
    { id: 'activities', el: document.getElementById('activities') },
    { id: 'contact', el: document.getElementById('contact') }
  ];

  const sections = sectionDefs.filter(s => s.el);

  function updateActiveNav() {
    const scrollY = window.scrollY || window.pageYOffset;
    const windowH = window.innerHeight;
    const docH = document.documentElement.scrollHeight;

    // If scrolled close to page bottom, activate contact
    if (scrollY + windowH >= docH - 100) {
      setActive('contact');
      return;
    }

    // Header offset threshold (middle/upper portion of screen)
    const threshold = scrollY + (windowH * 0.35);

    let activeId = 'home';
    for (let i = sections.length - 1; i >= 0; i--) {
      const s = sections[i];
      if (s.el.offsetTop <= threshold) {
        activeId = s.id;
        break;
      }
    }

    setActive(activeId);
  }

  function setActive(id) {
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === `#${id}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // Click on a nav link immediately sets active
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        setActive(href.substring(1));
      }
    });
  });

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  window.addEventListener('resize', updateActiveNav, { passive: true });
  updateActiveNav();
  setTimeout(updateActiveNav, 200);
  setTimeout(updateActiveNav, 800);
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
   Recent work strip (home) + full archive (work.html)
   -------------------------------------------------------------------------- */

function workCardHTML(project, index) {
  const caseId = `CASE-${String(index + 1).padStart(2, '0')}`;
  return `
    <button class="work-card reveal" data-modal-type="project" data-modal-id="${project.id}">
      <div class="work-card-id">${caseId} · ${project.date}${project.demo ? ' · <span class="live-badge">● LIVE</span>' : ''}</div>
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

let timelineExpanded = false;

function renderTimeline() {
  const mount = document.getElementById('internship-timeline');
  if (!mount) return;
  mount.innerHTML = SITE_DATA.internships.map((item, index) => {
    const isExtra = index >= 3;
    const docPills = (item.images || []).map((img, i) => {
      const label = img.label || 'Document';
      const lower = label.toLowerCase();
      let icon = 'fa-file-pdf';
      if (lower.includes('star')) icon = 'fa-star';
      else if (lower.includes('certificate')) icon = 'fa-award';
      else if (lower.includes('offer')) icon = 'fa-file-signature';
      else if (lower.includes('lor')) icon = 'fa-file-lines';

      return `
        <span class="tl-doc-pill" data-modal-type="internship" data-modal-id="${item.id}" data-target-doc="${i}">
          <i class="fas ${icon}"></i> ${escapeHTML(label)}
        </span>
      `;
    }).join('');

    return `
    <div class="tl-item reveal ${isExtra ? 'tl-item-extra' + (timelineExpanded ? '' : ' is-collapsed') : ''}">
      <span class="tl-node"></span>
      <button class="tl-trigger" data-modal-type="internship" data-modal-id="${item.id}">
        <div class="tl-org">${escapeHTML(item.org)}</div>
        <div class="tl-role">${escapeHTML(item.role)}${item.via ? ' · ' + escapeHTML(item.via) : ''}</div>
        <div class="tl-dates">${escapeHTML(item.dates)}</div>
        ${docPills ? `<div class="tl-doc-pills">${docPills}</div>` : ''}
      </button>
    </div>
  `;
  }).join('');
  attachModalTriggers(mount);
}

function initTimelineToggle() {
  const toggleBtn = document.getElementById('btn-timeline-toggle');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    timelineExpanded = !timelineExpanded;
    const extras = document.querySelectorAll('.tl-item-extra');
    const toggleLabel = document.getElementById('timeline-toggle-label');
    const toggleIcon = toggleBtn.querySelector('i');

    if (timelineExpanded) {
      extras.forEach((el, idx) => {
        el.classList.remove('is-collapsed');
        setTimeout(() => el.classList.add('is-visible'), idx * 70);
      });
      if (toggleLabel) toggleLabel.textContent = 'Show Less (Latest 3 only) ↑';
      if (toggleIcon) toggleIcon.className = 'fas fa-chevron-up';
    } else {
      extras.forEach(el => {
        el.classList.remove('is-visible');
        el.classList.add('is-collapsed');
      });
      const remainingCount = Math.max(0, SITE_DATA.internships.length - 3);
      if (toggleLabel) toggleLabel.textContent = `Show Remaining Internships (${remainingCount}) ↓`;
      if (toggleIcon) toggleIcon.className = 'fas fa-chevron-down';

      const thirdCard = document.querySelectorAll('.tl-item')[2];
      if (thirdCard) {
        thirdCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  });
}

/* --------------------------------------------------------------------------
   PDF.js Document Engine & Caching (Pure JavaScript)
   -------------------------------------------------------------------------- */

if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

const pdfDocCache = new Map();

function isPdf(url) {
  return typeof url === 'string' && url.trim().toLowerCase().endsWith('.pdf');
}

async function loadPdfDoc(url) {
  if (pdfDocCache.has(url)) {
    return pdfDocCache.get(url);
  }
  if (typeof pdfjsLib === 'undefined') {
    throw new Error('PDF.js library not loaded');
  }
  const loadingTask = pdfjsLib.getDocument(url);
  const doc = await loadingTask.promise;
  pdfDocCache.set(url, doc);
  return doc;
}

let activeModalRenderTask = null;

async function renderPdfPageToCanvas(pdfDoc, pageNum, canvas, targetWidth = 850) {
  if (activeModalRenderTask) {
    try {
      activeModalRenderTask.cancel();
    } catch (_) {}
    activeModalRenderTask = null;
  }

  const page = await pdfDoc.getPage(pageNum);
  const unscaled = page.getViewport({ scale: 1 });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const scale = targetWidth / unscaled.width;
  const viewport = page.getViewport({ scale: scale * dpr });

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.width = '100%';
  canvas.style.height = 'auto';

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const renderTask = page.render({
    canvasContext: ctx,
    viewport: viewport
  });
  activeModalRenderTask = renderTask;
  await renderTask.promise;
  activeModalRenderTask = null;
}

/* --------------------------------------------------------------------------
   Course certificates — flip cards with direct PDF preview (top 4 curated)
   -------------------------------------------------------------------------- */

let certsExpanded = false;

function renderFlipCerts() {
  const mount = document.getElementById('cert-flip-grid');
  if (!mount) return;
  mount.innerHTML = SITE_DATA.courseCertificates.map((c, idx) => {
    const isFilePdf = isPdf(c.image);
    const isExtra = idx >= 4;
    return `
    <button class="cc-flip reveal ${c.badgeClass || ''} ${isExtra ? 'cert-item-extra' + (certsExpanded ? '' : ' is-collapsed') : ''}" data-modal-type="coursecert" data-modal-id="${c.id}" aria-label="View ${escapeHTML(c.title)} certificate">
      <div class="cc-flip-inner">
        <div class="cc-face cc-face-front">
          <div>
            ${c.badge ? `<div class="badge-icon">${c.badge}</div>` : ''}
            <div class="cc-face-title">${escapeHTML(c.title)}</div>
            <div class="cc-face-issuer">${escapeHTML(c.issuer)}</div>
          </div>
          <div class="cc-face-hint">◇ verified — hover to preview</div>
        </div>
        <div class="cc-face cc-face-back" ${isFilePdf ? `data-pdf-src="${escapeHTML(c.image)}"` : ''}>
          ${isFilePdf 
            ? `<div class="cc-pdf-preview-box">
                 <div class="cc-pdf-loader">
                   <span class="cyber-spinner-sm"></span>
                   <span>&gt; loading preview...</span>
                 </div>
                 <canvas class="cc-pdf-canvas"></canvas>
               </div>` 
            : `<img src="${c.image}" alt="${escapeHTML(c.title)} certificate" loading="lazy">`}
        </div>
      </div>
    </button>
  `;
  }).join('');
  attachModalTriggers(mount);
  initFlipPdfThumbnails(mount);
}

function initCertsToggle() {
  const toggleBtn = document.getElementById('btn-certs-toggle');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    certsExpanded = !certsExpanded;
    const extras = document.querySelectorAll('.cert-item-extra');
    const toggleLabel = document.getElementById('certs-toggle-label');
    const toggleIcon = toggleBtn.querySelector('i');
    const mount = document.getElementById('cert-flip-grid');

    if (certsExpanded) {
      extras.forEach((el, idx) => {
        el.classList.remove('is-collapsed');
        setTimeout(() => el.classList.add('is-visible'), idx * 50);
      });
      if (mount) initFlipPdfThumbnails(mount);
      if (toggleLabel) toggleLabel.textContent = 'Show Less (Top 4 only) ↑';
      if (toggleIcon) toggleIcon.className = 'fas fa-chevron-up';
    } else {
      extras.forEach(el => {
        el.classList.remove('is-visible');
        el.classList.add('is-collapsed');
      });
      const remainingCount = Math.max(0, SITE_DATA.courseCertificates.length - 4);
      if (toggleLabel) toggleLabel.textContent = `Show Remaining Certificates (${remainingCount}) ↓`;
      if (toggleIcon) toggleIcon.className = 'fas fa-chevron-down';

      const fourthCard = document.querySelectorAll('.cc-flip')[3];
      if (fourthCard) {
        fourthCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  });
}

function initFlipPdfThumbnails(mount) {
  if (typeof pdfjsLib === 'undefined') return;
  const cards = mount.querySelectorAll('.cc-face-back[data-pdf-src]');
  if (!cards.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const card = entry.target;
        const pdfSrc = card.getAttribute('data-pdf-src');
        const canvas = card.querySelector('.cc-pdf-canvas');
        const loader = card.querySelector('.cc-pdf-loader');
        observer.unobserve(card);

        if (pdfSrc && canvas) {
          loadPdfDoc(pdfSrc)
            .then(doc => renderCardPdfThumbnail(doc, canvas))
            .then(() => {
              if (loader) loader.style.display = 'none';
              canvas.style.opacity = '1';
            })
            .catch(err => {
              console.warn('PDF thumbnail preview fallback for', pdfSrc, err);
              if (loader) loader.innerHTML = '<span class="cc-pdf-tag">📄 PDF CERTIFICATE</span>';
            });
        }
      }
    });
  }, { rootMargin: '150px' });

  cards.forEach(c => observer.observe(c));
}

async function renderCardPdfThumbnail(doc, canvas) {
  const page = await doc.getPage(1);
  const unscaled = page.getViewport({ scale: 1 });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const scale = 360 / unscaled.width;
  const viewport = page.getViewport({ scale: scale * dpr });

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.width = '100%';
  canvas.style.height = 'auto';

  const ctx = canvas.getContext('2d');
  await page.render({
    canvasContext: ctx,
    viewport: viewport
  }).promise;
}

/* --------------------------------------------------------------------------
   Co-curricular — achievement unlock badges (top 4 curated)
   -------------------------------------------------------------------------- */

let cocurrExpanded = false;

function renderCoCurricular() {
  const mount = document.getElementById('cocurr-grid');
  if (!mount) return;
  mount.innerHTML = SITE_DATA.coCurricular.map((item, idx) => {
    const isExtra = idx >= 4;
    return `
    <button class="cocurr-badge reveal ${item.badgeClass || ''} ${isExtra ? 'cocurr-item-extra' + (cocurrExpanded ? '' : ' is-collapsed') : ''}" data-modal-type="cocurricular" data-modal-id="${item.id}">
      <div class="badge-icon">${item.badge || '◆ achievement'}</div>
      <div class="badge-title">${escapeHTML(item.title)}</div>
      <div class="badge-issuer">${escapeHTML(item.issuer)}</div>
    </button>
  `;
  }).join('');

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

function initCocurrToggle() {
  const toggleBtn = document.getElementById('btn-cocurr-toggle');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    cocurrExpanded = !cocurrExpanded;
    const extras = document.querySelectorAll('.cocurr-item-extra');
    const toggleLabel = document.getElementById('cocurr-toggle-label');
    const toggleIcon = toggleBtn.querySelector('i');

    if (cocurrExpanded) {
      extras.forEach((el, idx) => {
        el.classList.remove('is-collapsed');
        setTimeout(() => {
          el.classList.add('is-visible');
          el.classList.add('is-unlocked');
        }, idx * 60);
      });
      if (toggleLabel) toggleLabel.textContent = 'Show Less (Top 4 only) ↑';
      if (toggleIcon) toggleIcon.className = 'fas fa-chevron-up';
    } else {
      extras.forEach(el => {
        el.classList.remove('is-visible');
        el.classList.add('is-collapsed');
      });
      const remainingCount = Math.max(0, SITE_DATA.coCurricular.length - 4);
      if (toggleLabel) toggleLabel.textContent = `Show Remaining Activities (${remainingCount}) ↓`;
      if (toggleIcon) toggleIcon.className = 'fas fa-chevron-down';

      const fourthCard = document.querySelectorAll('.cocurr-badge')[3];
      if (fourthCard) {
        fourthCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  });
}

/* --------------------------------------------------------------------------
   Shared modal system with multi-page PDF support & gallery
   -------------------------------------------------------------------------- */

let modalTypeTimer = null;
let currentGalleryRenderId = 0;
let galleryState = {
  images: [],
  index: 0,
  currentPdfDoc: null,
  currentPdfPage: 1,
  totalPdfPages: 1
};

function attachModalTriggers(scope) {
  scope.querySelectorAll('[data-modal-type]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetDoc = el.dataset.targetDoc !== undefined ? parseInt(el.dataset.targetDoc, 10) : 0;
      openModal(el.dataset.modalType, el.dataset.modalId, targetDoc);
    });
  });
}

function initModal() {
  const overlay = document.getElementById('shared-modal');
  if (!overlay) return;
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  overlay.querySelector('.modal-close')?.addEventListener('click', closeModal);

  // PDF page navigation buttons
  const pdfPrevBtn = overlay.querySelector('.modal-page-prev');
  const pdfNextBtn = overlay.querySelector('.modal-page-next');
  if (pdfPrevBtn) {
    pdfPrevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      pdfPagePrev();
    });
  }
  if (pdfNextBtn) {
    pdfNextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      pdfPageNext();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') {
      if (galleryState.currentPdfDoc && galleryState.totalPdfPages > 1) {
        pdfPagePrev();
      } else if (galleryState.images && galleryState.images.length > 1) {
        galleryPrev();
      }
    }
    if (e.key === 'ArrowRight') {
      if (galleryState.currentPdfDoc && galleryState.totalPdfPages > 1) {
        pdfPageNext();
      } else if (galleryState.images && galleryState.images.length > 1) {
        galleryNext();
      }
    }
  });
}

async function pdfPagePrev() {
  if (!galleryState.currentPdfDoc || galleryState.currentPdfPage <= 1) return;
  galleryState.currentPdfPage--;
  await updatePdfModalPage();
}

async function pdfPageNext() {
  if (!galleryState.currentPdfDoc || galleryState.currentPdfPage >= galleryState.totalPdfPages) return;
  galleryState.currentPdfPage++;
  await updatePdfModalPage();
}

async function updatePdfModalPage() {
  const overlay = document.getElementById('shared-modal');
  if (!overlay || !galleryState.currentPdfDoc) return;
  const canvas = overlay.querySelector('.modal-pdf-canvas');
  const curSpan = overlay.querySelector('.modal-current-page');
  const prevBtn = overlay.querySelector('.modal-page-prev');
  const nextBtn = overlay.querySelector('.modal-page-next');

  if (curSpan) curSpan.textContent = galleryState.currentPdfPage;
  if (prevBtn) prevBtn.disabled = galleryState.currentPdfPage <= 1;
  if (nextBtn) nextBtn.disabled = galleryState.currentPdfPage >= galleryState.totalPdfPages;

  if (canvas) {
    canvas.style.opacity = '0.35';
    await renderPdfPageToCanvas(galleryState.currentPdfDoc, galleryState.currentPdfPage, canvas, 850);
    canvas.style.opacity = '1';
  }
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

function renderDocTabs() {
  const overlay = document.getElementById('shared-modal');
  if (!overlay) return;
  const tabsContainer = overlay.querySelector('.modal-doc-tabs');
  if (!tabsContainer) return;

  const { images, index } = galleryState;

  if (!images || images.length === 0) {
    tabsContainer.style.display = 'none';
    tabsContainer.innerHTML = '';
    return;
  }

  tabsContainer.style.display = 'flex';
  tabsContainer.innerHTML = images.map((img, i) => {
    const isActive = i === index;
    const label = img.label || `Document ${i + 1}`;
    const lower = label.toLowerCase();
    let icon = 'fa-file-pdf';
    if (lower.includes('star')) icon = 'fa-star';
    else if (lower.includes('certificate')) icon = 'fa-award';
    else if (lower.includes('offer')) icon = 'fa-file-signature';
    else if (lower.includes('lor')) icon = 'fa-file-lines';
    else if (lower.includes('ceremony') || lower.includes('photo') || lower.includes('award')) icon = 'fa-camera';
    else if (lower.includes('achievement') || lower.includes('workshop')) icon = 'fa-medal';

    return `
      <button type="button" class="modal-doc-tab ${isActive ? 'is-active' : ''}" data-doc-index="${i}">
        <i class="fas ${icon}"></i>
        <span>${escapeHTML(label)}</span>
      </button>
    `;
  }).join('');

  tabsContainer.querySelectorAll('.modal-doc-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetIndex = parseInt(tab.dataset.docIndex, 10);
      if (targetIndex !== galleryState.index) {
        galleryState.index = targetIndex;
        renderDocTabs();
        updateGalleryImage();
      }
    });
  });
}

function setGallery(images, startIndex = 0) {
  const validIndex = Math.max(0, Math.min(startIndex, (images && images.length ? images.length - 1 : 0)));
  galleryState = {
    images: images || [],
    index: validIndex,
    currentPdfDoc: null,
    currentPdfPage: 1,
    totalPdfPages: 1
  };
  renderDocTabs();
  updateGalleryImage();
}

async function updateGalleryImage() {
  const overlay = document.getElementById('shared-modal');
  if (!overlay) return;

  const img = overlay.querySelector('.modal-img');
  const wrap = overlay.querySelector('.modal-img-wrap');
  const pdfWrap = overlay.querySelector('.modal-pdf-wrap');
  const pdfCanvas = overlay.querySelector('.modal-pdf-canvas');
  const pdfLoader = overlay.querySelector('.modal-pdf-loader');
  const pdfPager = overlay.querySelector('.modal-pdf-pager');
  const pdfCurPage = overlay.querySelector('.modal-current-page');
  const pdfTotPages = overlay.querySelector('.modal-total-pages');
  const pdfActionBtn = overlay.querySelector('.modal-pdf-action');

  const { images, index } = galleryState;

  if (!images || !images.length) {
    if (wrap) wrap.style.display = 'none';
    if (img) { img.style.display = 'none'; img.src = ''; }
    if (pdfWrap) pdfWrap.style.display = 'none';
    if (pdfActionBtn) pdfActionBtn.style.display = 'none';
    return;
  }

  wrap.style.display = 'block';
  const current = images[index];
  const isDocPdf = isPdf(current.src);

  const thisRenderId = ++currentGalleryRenderId;

  if (isDocPdf) {
    // PDF Mode
    if (pdfActionBtn) {
      pdfActionBtn.href = current.src;
      pdfActionBtn.style.display = 'inline-flex';
    }
    if (img) {
      img.style.display = 'none';
      img.src = '';
    }
    if (pdfWrap) pdfWrap.style.display = 'flex';
    if (pdfLoader) {
      pdfLoader.style.display = 'flex';
      pdfLoader.innerHTML = `<span class="cyber-spinner"></span> <span>&gt; decoding document stream...</span>`;
    }
    if (pdfCanvas) pdfCanvas.style.opacity = '0';
    if (pdfPager) pdfPager.style.display = 'none';

    try {
      const doc = await loadPdfDoc(current.src);
      if (thisRenderId !== currentGalleryRenderId) return;

      galleryState.currentPdfDoc = doc;
      galleryState.currentPdfPage = 1;
      galleryState.totalPdfPages = doc.numPages;

      if (pdfTotPages) pdfTotPages.textContent = doc.numPages;
      if (pdfCurPage) pdfCurPage.textContent = '1';

      if (doc.numPages > 1 && pdfPager) {
        pdfPager.style.display = 'flex';
        const prevBtn = overlay.querySelector('.modal-page-prev');
        const nextBtn = overlay.querySelector('.modal-page-next');
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = false;
      }

      await renderPdfPageToCanvas(doc, 1, pdfCanvas, 850);
      if (thisRenderId !== currentGalleryRenderId) return;

      if (pdfLoader) pdfLoader.style.display = 'none';
      if (pdfCanvas) pdfCanvas.style.opacity = '1';
    } catch (err) {
      console.error('Failed to load PDF in modal:', err);
      if (thisRenderId !== currentGalleryRenderId) return;
      if (pdfLoader) {
        pdfLoader.innerHTML = `<span style="color:var(--amber);">&gt; inline preview unavailable. Click below to open original PDF.</span>`;
      }
    }
  } else {
    // Image Mode
    if (pdfActionBtn) pdfActionBtn.style.display = 'none';
    if (pdfWrap) pdfWrap.style.display = 'none';
    galleryState.currentPdfDoc = null;

    if (img) {
      img.style.display = 'block';
      img.src = '';
      img.style.opacity = '0';
      img.onload = () => { if (thisRenderId === currentGalleryRenderId) img.style.opacity = '1'; };
      img.src = current.src;
      img.alt = current.label || '';
    }
  }
}

function galleryPrev() {
  if (galleryState.images.length < 2) return;
  galleryState.index = (galleryState.index - 1 + galleryState.images.length) % galleryState.images.length;
  renderDocTabs();
  updateGalleryImage();
}

function galleryNext() {
  if (galleryState.images.length < 2) return;
  galleryState.index = (galleryState.index + 1) % galleryState.images.length;
  renderDocTabs();
  updateGalleryImage();
}

function openModal(type, id, initialDocIndex = 0) {
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
  const modalBox = overlay.querySelector('.modal-box');
  if (modalBox) {
    let extraClass = item.badgeClass ? ' ' + item.badgeClass : '';
    if (!extraClass) {
      if (type === 'project') extraClass = ' badge-hackathon';
      else if (type === 'internship') extraClass = ' badge-blueteam';
    }
    modalBox.className = 'modal-box' + extraClass;
    modalBox.scrollTop = 0;
  }
  document.body.classList.add('modal-open');

  if (type === 'project') {
    eyebrow.textContent = 'PROJECT DOSSIER';
    title.textContent = item.title;
    meta.textContent = item.date;
    setGallery([], 0);
    tags.innerHTML = item.tech.map(t => `<span class="tag">${escapeHTML(t)}</span>`).join('');
    link.style.display = 'inline-flex';
    link.href = item.github;
    link.innerHTML = '↗ View on GitHub';

    const demoLink = overlay.querySelector('.modal-link-demo');
    if (demoLink) {
      if (item.demo) {
        demoLink.style.display = 'inline-flex';
        demoLink.href = item.demo;
        demoLink.innerHTML = '↗ View Live Demo';
      } else {
        demoLink.style.display = 'none';
      }
    }

    typeOutDescription(desc, item.description);
  } else if (type === 'internship') {
    eyebrow.textContent = 'INTERNSHIP RECORD';
    title.textContent = item.org;
    meta.textContent = `${item.role} · ${item.dates}`;
    setGallery(item.images || [], initialDocIndex);
    tags.innerHTML = item.tech.map(t => `<span class="tag">${escapeHTML(t)}</span>`).join('');
    link.style.display = 'none';
    typeOutDescription(desc, item.description);
  } else if (type === 'coursecert') {
    eyebrow.textContent = 'CERTIFICATE RECORD';
    title.textContent = item.title;
    meta.textContent = item.issuer;
    setGallery([{ src: item.image, label: item.badge ? item.badge.replace(/^[^\w]+/, '').trim() : 'Course Certificate' }], 0);
    tags.innerHTML = '';
    link.style.display = 'none';
    typeOutDescription(desc, item.description || '');
  } else if (type === 'cocurricular') {
    eyebrow.textContent = 'ACTIVITY LOG — WHAT I LEARNED';
    title.textContent = item.title;
    meta.textContent = item.issuer;
    const galleryDocs = (item.images && item.images.length)
      ? item.images
      : [{ src: item.image, label: item.badge ? item.badge.replace(/^[^\w]+/, '').trim() : 'Certificate' }];
    setGallery(galleryDocs, 0);
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

let returnToDirectory = null; // 'internships' | 'certs' | 'cocurr' | null

function closeModal() {
  const overlay = document.getElementById('shared-modal');
  if (!overlay) return;
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
  const modalBox = overlay.querySelector('.modal-box');
  if (modalBox) modalBox.className = 'modal-box';
  clearTimeout(modalTypeTimer);
  if (activeModalRenderTask) {
    try {
      activeModalRenderTask.cancel();
    } catch (_) {}
    activeModalRenderTask = null;
  }
  galleryState.currentPdfDoc = null;

  if (returnToDirectory === 'internships') {
    returnToDirectory = null;
    openAllInternshipsModal();
  } else if (returnToDirectory === 'certs') {
    returnToDirectory = null;
    openAllCertsModal();
  } else if (returnToDirectory === 'cocurr') {
    returnToDirectory = null;
    openAllCocurrModal();
  } else {
    document.body.classList.remove('modal-open');
  }
}

/* --------------------------------------------------------------------------
   All Internships Directory Popup Modal
   -------------------------------------------------------------------------- */

function openAllInternshipsModal() {
  const modal = document.getElementById('all-internships-modal');
  if (!modal) return;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  const modalBox = modal.querySelector('.modal-box');
  if (modalBox) modalBox.scrollTop = 0;
  const searchInput = document.getElementById('internship-search-input');
  if (searchInput) {
    searchInput.value = '';
    renderAllInternshipsCards('');
    setTimeout(() => searchInput.focus(), 80);
  }
}

function closeAllInternshipsModal() {
  const modal = document.getElementById('all-internships-modal');
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  if (!returnToDirectory) {
    document.body.classList.remove('modal-open');
  }
}

function renderAllInternshipsCards(filterQuery = '') {
  const container = document.getElementById('all-internships-list');
  const countBadge = document.getElementById('internships-count-badge');
  if (!container) return;

  const q = filterQuery.trim().toLowerCase();
  const filtered = SITE_DATA.internships.filter(item => {
    if (!q) return true;
    const matchOrg = (item.org || '').toLowerCase().includes(q);
    const matchRole = (item.role || '').toLowerCase().includes(q);
    const matchDesc = (item.description || '').toLowerCase().includes(q);
    const matchTech = (item.tech || []).some(t => t.toLowerCase().includes(q));
    return matchOrg || matchRole || matchDesc || matchTech;
  });

  if (countBadge) {
    countBadge.textContent = `${filtered.length} / ${SITE_DATA.internships.length} RECORDS`;
  }

  if (!filtered.length) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; color: var(--text-2); font-family: var(--font-mono); font-size: 0.9rem;">
        &gt; no internship records match "${escapeHTML(filterQuery)}". Try another query_
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const docPills = (item.images || []).map((img, i) => {
      const label = img.label || 'Document';
      const lower = label.toLowerCase();
      let icon = 'fa-file-pdf';
      if (lower.includes('star')) icon = 'fa-star';
      else if (lower.includes('certificate')) icon = 'fa-award';
      else if (lower.includes('offer')) icon = 'fa-file-signature';
      else if (lower.includes('lor')) icon = 'fa-file-lines';
      return `<span class="tl-doc-pill" data-doc-index="${i}"><i class="fas ${icon}"></i> ${escapeHTML(label)}</span>`;
    }).join('');

    const techTags = (item.tech || []).map(t => `<span class="tag">${escapeHTML(t)}</span>`).join('');

    return `
      <div class="all-internship-card" data-intern-id="${item.id}">
        <div class="aic-header">
          <div class="aic-org">${escapeHTML(item.org)}</div>
          <div class="aic-role">${escapeHTML(item.role)}${item.via ? ' · ' + escapeHTML(item.via) : ''}</div>
          <div class="aic-dates"><i class="far fa-calendar-alt"></i> ${escapeHTML(item.dates)}</div>
        </div>
        <p class="aic-desc">${escapeHTML(item.description)}</p>
        <div class="aic-footer">
          ${docPills ? `<div class="aic-doc-row">${docPills}</div>` : ''}
          ${techTags ? `<div class="aic-tech-row">${techTags}</div>` : ''}
          <div class="aic-action-btn">
            <span>Inspect Dossier &amp; Documents</span>
            <i class="fas fa-arrow-right"></i>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.all-internship-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const pill = e.target.closest('.tl-doc-pill');
      const internId = card.dataset.internId;
      let targetDoc = 0;
      if (pill && pill.dataset.docIndex !== undefined) {
        targetDoc = parseInt(pill.dataset.docIndex, 10);
      }
      returnToDirectory = 'internships';
      closeAllInternshipsModal();
      openModal('internship', internId, targetDoc);
    });
  });
}

function initAllInternshipsModal() {
  const topBtn = document.getElementById('btn-all-internships-top');
  const btmBtn = document.getElementById('btn-all-internships-bottom');
  const modal = document.getElementById('all-internships-modal');
  const closeBtn = document.getElementById('all-internships-close');
  const searchInput = document.getElementById('internship-search-input');

  if (topBtn) topBtn.addEventListener('click', openAllInternshipsModal);
  if (btmBtn) btmBtn.addEventListener('click', openAllInternshipsModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAllInternshipsModal();
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeAllInternshipsModal);

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderAllInternshipsCards(e.target.value);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) {
      closeAllInternshipsModal();
    }
  });

  renderAllInternshipsCards('');
}

/* --------------------------------------------------------------------------
   All Course Completion Certificates Directory Modal
   -------------------------------------------------------------------------- */

function openAllCertsModal() {
  const modal = document.getElementById('all-certs-modal');
  if (!modal) return;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  const modalBox = modal.querySelector('.modal-box');
  if (modalBox) modalBox.scrollTop = 0;
  const searchInput = document.getElementById('cert-search-input');
  if (searchInput) {
    searchInput.value = '';
    renderAllCertsCards('');
    setTimeout(() => searchInput.focus(), 80);
  }
}

function closeAllCertsModal() {
  const modal = document.getElementById('all-certs-modal');
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  if (!returnToDirectory) {
    document.body.classList.remove('modal-open');
  }
}

function renderAllCertsCards(filterQuery = '') {
  const container = document.getElementById('all-certs-list');
  const countBadge = document.getElementById('certs-count-badge');
  if (!container) return;

  const q = filterQuery.trim().toLowerCase();
  const filtered = SITE_DATA.courseCertificates.filter(item => {
    if (!q) return true;
    const matchTitle = (item.title || '').toLowerCase().includes(q);
    const matchIssuer = (item.issuer || '').toLowerCase().includes(q);
    const matchBadge = (item.badge || '').toLowerCase().includes(q);
    const matchDesc = (item.description || '').toLowerCase().includes(q);
    return matchTitle || matchIssuer || matchBadge || matchDesc;
  });

  if (countBadge) {
    countBadge.textContent = `${filtered.length} / ${SITE_DATA.courseCertificates.length} RECORDS`;
  }

  if (!filtered.length) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; color: var(--text-2); font-family: var(--font-mono); font-size: 0.9rem;">
        &gt; no certificate records match "${escapeHTML(filterQuery)}". Try another query_
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    return `
      <div class="all-internship-card all-cert-card ${item.badgeClass || ''}" data-cert-id="${item.id}">
        <div class="aic-header">
          ${item.badge ? `<div class="badge-icon" style="margin-bottom:6px;">${item.badge}</div>` : ''}
          <div class="aic-org">${escapeHTML(item.title)}</div>
          <div class="aic-role">${escapeHTML(item.issuer)}</div>
        </div>
        <p class="aic-desc">${escapeHTML(item.description || 'Verified course completion certificate credential.')}</p>
        <div class="aic-footer">
          <div class="aic-doc-row">
            <span class="tl-doc-pill"><i class="fas fa-file-pdf"></i> Certificate Credential</span>
          </div>
          <div class="aic-action-btn">
            <span>Inspect Certificate &amp; PDF</span>
            <i class="fas fa-arrow-right"></i>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.all-cert-card').forEach(card => {
    card.addEventListener('click', () => {
      const certId = card.dataset.certId;
      returnToDirectory = 'certs';
      closeAllCertsModal();
      openModal('coursecert', certId, 0);
    });
  });
}

function initAllCertsModal() {
  const topBtn = document.getElementById('btn-all-certs-top');
  const btmBtn = document.getElementById('btn-all-certs-bottom');
  const modal = document.getElementById('all-certs-modal');
  const closeBtn = document.getElementById('all-certs-close');
  const searchInput = document.getElementById('cert-search-input');

  if (topBtn) topBtn.addEventListener('click', openAllCertsModal);
  if (btmBtn) btmBtn.addEventListener('click', openAllCertsModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAllCertsModal();
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeAllCertsModal);

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderAllCertsCards(e.target.value);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) {
      closeAllCertsModal();
    }
  });

  renderAllCertsCards('');
}

/* --------------------------------------------------------------------------
   All Co-Curricular Activities Directory Modal
   -------------------------------------------------------------------------- */

function openAllCocurrModal() {
  const modal = document.getElementById('all-cocurr-modal');
  if (!modal) return;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  const modalBox = modal.querySelector('.modal-box');
  if (modalBox) modalBox.scrollTop = 0;
  const searchInput = document.getElementById('cocurr-search-input');
  if (searchInput) {
    searchInput.value = '';
    renderAllCocurrCards('');
    setTimeout(() => searchInput.focus(), 80);
  }
}

function closeAllCocurrModal() {
  const modal = document.getElementById('all-cocurr-modal');
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  if (!returnToDirectory) {
    document.body.classList.remove('modal-open');
  }
}

function renderAllCocurrCards(filterQuery = '') {
  const container = document.getElementById('all-cocurr-list');
  const countBadge = document.getElementById('cocurr-count-badge');
  if (!container) return;

  const q = filterQuery.trim().toLowerCase();
  const filtered = SITE_DATA.coCurricular.filter(item => {
    if (!q) return true;
    const matchTitle = (item.title || '').toLowerCase().includes(q);
    const matchIssuer = (item.issuer || '').toLowerCase().includes(q);
    const matchBadge = (item.badge || '').toLowerCase().includes(q);
    const matchLearned = (item.learned || '').toLowerCase().includes(q);
    return matchTitle || matchIssuer || matchBadge || matchLearned;
  });

  if (countBadge) {
    countBadge.textContent = `${filtered.length} / ${SITE_DATA.coCurricular.length} RECORDS`;
  }

  if (!filtered.length) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; color: var(--text-2); font-family: var(--font-mono); font-size: 0.9rem;">
        &gt; no activity records match "${escapeHTML(filterQuery)}". Try another query_
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const docCount = (item.images && item.images.length > 1) ? `${item.images.length} Documents` : 'Verified Credential';
    const isWinner = item.badgeClass === 'badge-winner';
    return `
      <div class="all-internship-card all-cocurr-card ${item.badgeClass || ''}" data-cocurr-id="${item.id}">
        <div class="aic-header">
          <div class="badge-icon" style="margin-bottom:6px;">${item.badge || '◆ achievement'}</div>
          <div class="aic-org">${escapeHTML(item.title)}</div>
          <div class="aic-role">${escapeHTML(item.issuer)}</div>
        </div>
        <p class="aic-desc">${escapeHTML(item.learned || '')}</p>
        <div class="aic-footer">
          <div class="aic-doc-row">
            <span class="tl-doc-pill"><i class="fas ${isWinner ? 'fa-award' : 'fa-file-pdf'}"></i> ${docCount}</span>
          </div>
          <div class="aic-action-btn">
            <span>Inspect Activity Dossier</span>
            <i class="fas fa-arrow-right"></i>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.all-cocurr-card').forEach(card => {
    card.addEventListener('click', () => {
      const cocurrId = card.dataset.cocurrId;
      returnToDirectory = 'cocurr';
      closeAllCocurrModal();
      openModal('cocurricular', cocurrId, 0);
    });
  });
}

function initAllCocurrModal() {
  const topBtn = document.getElementById('btn-all-cocurr-top');
  const btmBtn = document.getElementById('btn-all-cocurr-bottom');
  const modal = document.getElementById('all-cocurr-modal');
  const closeBtn = document.getElementById('all-cocurr-close');
  const searchInput = document.getElementById('cocurr-search-input');

  if (topBtn) topBtn.addEventListener('click', openAllCocurrModal);
  if (btmBtn) btmBtn.addEventListener('click', openAllCocurrModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAllCocurrModal();
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeAllCocurrModal);

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderAllCocurrCards(e.target.value);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) {
      closeAllCocurrModal();
    }
  });

  renderAllCocurrCards('');
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