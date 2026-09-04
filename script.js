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
  initAllProjectsModal();
  initAllInternshipsModal();
  initAllCertsModal();
  initAllCocurrModal();
  initContactForm();
  initPageTransitionLinks();
  initBackToTop();

  if (document.body.dataset.page === 'home') {
    renderRecentWork();
    renderSkills();
  }
  if (document.body.dataset.page === 'archive') {
    renderFullArchive();
  }

  renderTimeline();
  initTimelineToggle();
  initProjectsToggle();
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
    h = canvas.height = window.innerHeight;
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
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
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      links.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
    document.addEventListener('click', (e) => {
      if (links.classList.contains('open') && !links.contains(e.target) && !toggle.contains(e.target)) {
        links.classList.remove('open');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && links.classList.contains('open')) {
        links.classList.remove('open');
      }
    });
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

  const TYPE_SPEED = 140;
  const DELETE_SPEED = 70;
  const HOLD_MS = 2200;

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

const TECH_EMOJIS = {
  "python": "🐍", "html": "🌐", "css & bootstrap": "🎨", "css": "🎨", "bootstrap": "🎨", "bootstrap 5": "🎨",
  "javascript": "⚡", "networking": "📡", "basics of kali": "🐉", "kali": "🐉", "kali linux": "🐉",
  "git & github": "🐙", "git": "🐙", "github": "🐙", "nmap / zenmap": "🔍", "nmap": "🔍", "zenmap": "🔍",
  "wireshark": "🦈", "burpsuite": "🎯", "metasploit": "💥", "api security (owasp)": "🛡️",
  "portswigger": "🧪", "portswigger labs": "🧪", "flask": "🌶️", "opencv": "👁️", "pycryptodome": "🔐",
  "tkinter": "🖥️", "winreg": "🗃️", "pynput": "⌨️", "datetime": "⏱️", "sqlite": "🗄️", "sqlite3": "🗄️",
  "pandas": "🐼", "numpy": "🔢", "matplotlib": "📊", "csv file": "📄", "vapt": "🎯",
  "offensive security": "⚔️", "defensive security": "🛡️", "iso 27001": "📜", "wazuh": "🐺",
  "suricata": "🚨", "openvas": "🛡️", "mitre att&ck": "🗺️", "ctf": "🚩", "network security": "📡",
  "penetration testing": "🎯", "incident response": "🚨", "windows registry auditing": "🔍"
};

function renderTag(t) {
  if (!t) return '';
  const name = typeof t === 'object' ? t.name : String(t);
  const lower = name.toLowerCase().trim();
  const emoji = (typeof t === 'object' && t.emoji) ? t.emoji : (TECH_EMOJIS[lower] || '💻');
  return `<span class="tag"><span class="tag-emoji">${emoji}</span> <span class="tag-name">${escapeHTML(name)}</span></span>`;
}

function workCardHTML(project, index, extraClass = '') {
  const caseId = `CASE-${String(index + 1).padStart(2, '0')}`;
  const badgeText = project.badge || `⚡ Security Case Study`;
  return `
    <button class="work-card reveal ${project.badgeClass || 'badge-hackathon'}${extraClass ? ' ' + extraClass : ''}" data-modal-type="project" data-modal-id="${project.id}">
      <div class="badge-icon">${escapeHTML(badgeText)}</div>
      <div class="work-card-id">${caseId} · ${project.date}${project.demo ? ' · <span class="live-badge">● LIVE</span>' : ''}</div>
      <h4><span>${project.icon}</span>${escapeHTML(project.title)}</h4>
      <p>${escapeHTML(project.summary)}</p>
      <div class="tag-row">${project.tech.slice(0, 3).map(t => renderTag(t)).join('')}</div>
    </button>`;
}

let projectsExpanded = false;

function renderRecentWork() {
  const mount = document.getElementById('recent-work-grid');
  if (!mount) return;
  mount.innerHTML = SITE_DATA.projects.map((p, i) => {
    const isExtra = i >= 3;
    const extraClass = isExtra ? ('work-item-extra' + (projectsExpanded ? '' : ' is-collapsed')) : '';
    return workCardHTML(p, i, extraClass);
  }).join('');
  attachModalTriggers(mount);
}

function initProjectsToggle() {
  const toggleBtn = document.getElementById('btn-projects-toggle');
  if (!toggleBtn) return;

  const remainingCount = Math.max(0, SITE_DATA.projects.length - 3);
  const initialLabel = document.getElementById('projects-toggle-label');
  if (initialLabel && !projectsExpanded) {
    initialLabel.innerHTML = `Show Remaining (${remainingCount}) <span class="label-arrow">↓</span>`;
  }

  toggleBtn.addEventListener('click', () => {
    projectsExpanded = !projectsExpanded;
    const extras = document.querySelectorAll('.work-item-extra');
    const toggleLabel = document.getElementById('projects-toggle-label');
    const toggleIcon = toggleBtn.querySelector('i');

    if (projectsExpanded) {
      toggleBtn.classList.add('is-expanded');
      extras.forEach((el, idx) => {
        el.classList.remove('is-collapsed');
        setTimeout(() => el.classList.add('is-visible'), idx * 50);
      });
      if (toggleLabel) toggleLabel.innerHTML = 'Show Less <span class="label-arrow">↑</span>';
      if (toggleIcon) toggleIcon.className = 'fas fa-chevron-up toggle-arrow';
    } else {
      toggleBtn.classList.remove('is-expanded');
      extras.forEach(el => {
        el.classList.remove('is-visible');
        el.classList.add('is-collapsed');
      });
      const count = Math.max(0, SITE_DATA.projects.length - 3);
      if (toggleLabel) toggleLabel.innerHTML = `Show Remaining (${count}) <span class="label-arrow">↓</span>`;
      if (toggleIcon) toggleIcon.className = 'fas fa-chevron-down toggle-arrow';

      const thirdCard = document.querySelectorAll('#recent-work-grid .work-card')[2];
      if (thirdCard) {
        thirdCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  });
}

function renderSkills() {
  const mount = document.getElementById('skills-list');
  if (!mount) return;
  mount.innerHTML = SITE_DATA.skills.map(s => renderTag(s)).join('');
}

function renderFullArchive() {
  const mount = document.getElementById('archive-grid');
  if (!mount) return;
  const sorted = [...SITE_DATA.projects].sort((a, b) => b.date.localeCompare(a.date));
  mount.innerHTML = sorted.map((p, i) => workCardHTML(p, i)).join('');
  attachModalTriggers(mount);
  mount.querySelectorAll('.reveal').forEach((el, idx) => {
    setTimeout(() => el.classList.add('is-visible'), Math.min(idx * 40, 300));
  });
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

    const badgeText = item.badge || '💼 Verified Internship Role';

    return `
    <div class="tl-item reveal ${isExtra ? 'tl-item-extra' + (timelineExpanded ? '' : ' is-collapsed') : ''}">
      <span class="tl-node"></span>
      <button class="tl-trigger ${item.badgeClass || 'badge-blueteam'}" data-modal-type="internship" data-modal-id="${item.id}">
        <div class="badge-icon">${escapeHTML(badgeText)}</div>
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

  const remainingCount = Math.max(0, SITE_DATA.internships.length - 3);
  const initialLabel = document.getElementById('timeline-toggle-label');
  if (initialLabel && !timelineExpanded) {
    initialLabel.innerHTML = `Show Remaining (${remainingCount}) <span class="label-arrow">↓</span>`;
  }

  toggleBtn.addEventListener('click', () => {
    timelineExpanded = !timelineExpanded;
    const extras = document.querySelectorAll('.tl-item-extra');
    const toggleLabel = document.getElementById('timeline-toggle-label');
    const toggleIcon = toggleBtn.querySelector('i');

    if (timelineExpanded) {
      toggleBtn.classList.add('is-expanded');
      extras.forEach((el, idx) => {
        el.classList.remove('is-collapsed');
        setTimeout(() => el.classList.add('is-visible'), idx * 70);
      });
      if (toggleLabel) toggleLabel.innerHTML = 'Show Less <span class="label-arrow">↑</span>';
      if (toggleIcon) toggleIcon.className = 'fas fa-chevron-up toggle-arrow';
    } else {
      toggleBtn.classList.remove('is-expanded');
      extras.forEach(el => {
        el.classList.remove('is-visible');
        el.classList.add('is-collapsed');
      });
      const count = Math.max(0, SITE_DATA.internships.length - 3);
      if (toggleLabel) toggleLabel.innerHTML = `Show Remaining (${count}) <span class="label-arrow">↓</span>`;
      if (toggleIcon) toggleIcon.className = 'fas fa-chevron-down toggle-arrow';

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

  const remainingCount = Math.max(0, SITE_DATA.courseCertificates.length - 4);
  const initialLabel = document.getElementById('certs-toggle-label');
  if (initialLabel && !certsExpanded) {
    initialLabel.innerHTML = `Show Remaining (${remainingCount}) <span class="label-arrow">↓</span>`;
  }

  toggleBtn.addEventListener('click', () => {
    certsExpanded = !certsExpanded;
    const extras = document.querySelectorAll('.cert-item-extra');
    const toggleLabel = document.getElementById('certs-toggle-label');
    const toggleIcon = toggleBtn.querySelector('i');
    const mount = document.getElementById('cert-flip-grid');

    if (certsExpanded) {
      toggleBtn.classList.add('is-expanded');
      extras.forEach((el, idx) => {
        el.classList.remove('is-collapsed');
        setTimeout(() => el.classList.add('is-visible'), idx * 50);
      });
      if (mount) initFlipPdfThumbnails(mount);
      if (toggleLabel) toggleLabel.innerHTML = 'Show Less <span class="label-arrow">↑</span>';
      if (toggleIcon) toggleIcon.className = 'fas fa-chevron-up toggle-arrow';
    } else {
      toggleBtn.classList.remove('is-expanded');
      extras.forEach(el => {
        el.classList.remove('is-visible');
        el.classList.add('is-collapsed');
      });
      const count = Math.max(0, SITE_DATA.courseCertificates.length - 4);
      if (toggleLabel) toggleLabel.innerHTML = `Show Remaining (${count}) <span class="label-arrow">↓</span>`;
      if (toggleIcon) toggleIcon.className = 'fas fa-chevron-down toggle-arrow';

      const fourthCard = document.querySelectorAll('.cc-flip')[3];
      if (fourthCard) {
        fourthCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  });
}

let flipThumbnailsObserver = null;

async function renderCardThumbnailForCard(card) {
  if (!card) return;
  if (card.dataset.pdfStatus === 'rendered' || card.dataset.pdfStatus === 'rendering') return;

  const pdfSrc = card.getAttribute('data-pdf-src');
  const canvas = card.querySelector('.cc-pdf-canvas');
  const loader = card.querySelector('.cc-pdf-loader');
  if (!pdfSrc || !canvas) return;

  card.dataset.pdfStatus = 'rendering';

  try {
    const doc = await loadPdfDoc(pdfSrc);
    await renderCardPdfThumbnail(doc, canvas);
    card.dataset.pdfStatus = 'rendered';
    if (loader) loader.style.display = 'none';
    canvas.style.opacity = '1';
  } catch (err) {
    if (err?.name === 'RenderingCancelledException') return;
    console.warn('PDF thumbnail preview fallback for', pdfSrc, err);
    card.dataset.pdfStatus = 'error';
    if (loader) loader.innerHTML = '<span class="cc-pdf-tag">📄 PDF CERTIFICATE</span>';
  }
}

function initFlipPdfThumbnails(mount) {
  if (typeof pdfjsLib === 'undefined') return;

  if (!flipThumbnailsObserver) {
    flipThumbnailsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const card = entry.target;
          flipThumbnailsObserver.unobserve(card);
          renderCardThumbnailForCard(card);
        }
      });
    }, { rootMargin: '200px' });
  }

  const cards = mount.querySelectorAll('.cc-face-back[data-pdf-src]');
  cards.forEach(card => {
    if (!card.dataset.pdfStatus) {
      flipThumbnailsObserver.observe(card);
    }

    const btn = card.closest('.cc-flip');
    if (btn && !btn.dataset.hoverThumbInit) {
      btn.dataset.hoverThumbInit = 'true';
      const triggerRender = () => {
        if (flipThumbnailsObserver) flipThumbnailsObserver.unobserve(card);
        renderCardThumbnailForCard(card);
      };
      btn.addEventListener('mouseenter', triggerRender, { once: true });
      btn.addEventListener('focus', triggerRender, { once: true });
    }
  });
}

async function renderCardPdfThumbnail(doc, canvas) {
  if (canvas._renderTask) {
    try {
      canvas._renderTask.cancel();
    } catch (_) {}
    canvas._renderTask = null;
  }

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
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const renderTask = page.render({
    canvasContext: ctx,
    viewport: viewport
  });
  canvas._renderTask = renderTask;
  await renderTask.promise;
  canvas._renderTask = null;
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

  const remainingCount = Math.max(0, SITE_DATA.coCurricular.length - 4);
  const initialLabel = document.getElementById('cocurr-toggle-label');
  if (initialLabel && !cocurrExpanded) {
    initialLabel.innerHTML = `Show Remaining (${remainingCount}) <span class="label-arrow">↓</span>`;
  }

  toggleBtn.addEventListener('click', () => {
    cocurrExpanded = !cocurrExpanded;
    const extras = document.querySelectorAll('.cocurr-item-extra');
    const toggleLabel = document.getElementById('cocurr-toggle-label');
    const toggleIcon = toggleBtn.querySelector('i');

    if (cocurrExpanded) {
      toggleBtn.classList.add('is-expanded');
      extras.forEach((el, idx) => {
        el.classList.remove('is-collapsed');
        setTimeout(() => {
          el.classList.add('is-visible');
          el.classList.add('is-unlocked');
        }, idx * 60);
      });
      if (toggleLabel) toggleLabel.innerHTML = 'Show Less <span class="label-arrow">↑</span>';
      if (toggleIcon) toggleIcon.className = 'fas fa-chevron-up toggle-arrow';
    } else {
      toggleBtn.classList.remove('is-expanded');
      extras.forEach(el => {
        el.classList.remove('is-visible');
        el.classList.add('is-collapsed');
      });
      const count = Math.max(0, SITE_DATA.coCurricular.length - 4);
      if (toggleLabel) toggleLabel.innerHTML = `Show Remaining (${count}) <span class="label-arrow">↓</span>`;
      if (toggleIcon) toggleIcon.className = 'fas fa-chevron-down toggle-arrow';

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
    if (e.target === overlay) {
      closeModal();
      return;
    }
    const prevBtn = e.target.closest('.modal-nav-prev, .modal-nav-prev-btm, #modal-btn-prev-btm');
    if (prevBtn) {
      e.preventDefault();
      e.stopPropagation();
      navigateModalPrev();
      return;
    }
    const nextBtn = e.target.closest('.modal-nav-next, .modal-nav-next-btm, #modal-btn-next-btm');
    if (nextBtn) {
      e.preventDefault();
      e.stopPropagation();
      navigateModalNext();
      return;
    }
    const closeBtn = e.target.closest('.modal-close, .modal-link-dismiss');
    if (closeBtn) {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
      return;
    }
  });
  overlay.querySelectorAll('.modal-close, .modal-link-dismiss').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });

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

  // Prev / Next record navigation buttons
  overlay.querySelectorAll('.modal-nav-prev, .modal-nav-prev-btm, #modal-btn-prev-btm').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      navigateModalPrev();
    });
  });
  overlay.querySelectorAll('.modal-nav-next, .modal-nav-next-btm, #modal-btn-next-btm').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      navigateModalNext();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') {
      if (galleryState.currentPdfDoc && galleryState.totalPdfPages > 1) {
        pdfPagePrev();
      } else {
        navigateModalPrev();
      }
    }
    if (e.key === 'ArrowRight') {
      if (galleryState.currentPdfDoc && galleryState.totalPdfPages > 1) {
        pdfPageNext();
      } else {
        navigateModalNext();
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

/* --------------------------------------------------------------------------
   Modal Record Navigation Context (Prev / Next & Counter)
   -------------------------------------------------------------------------- */

let currentModalContext = {
  type: null,
  id: null,
  index: 0,
  list: []
};

function getListForType(type) {
  if (type === 'project') return SITE_DATA.projects || [];
  if (type === 'internship') return SITE_DATA.internships || [];
  if (type === 'coursecert') return SITE_DATA.courseCertificates || [];
  if (type === 'cocurricular') return SITE_DATA.coCurricular || [];
  return [];
}

function updateModalNavUI() {
  const overlay = document.getElementById('shared-modal');
  if (!overlay) return;

  const { type, index, list } = currentModalContext;
  const navGroup = overlay.querySelector('.modal-nav-group');
  const btmNav = overlay.querySelector('.modal-bottom-nav');
  const counter = overlay.querySelector('#modal-nav-counter');
  const prevBtnBtm = overlay.querySelector('#modal-btn-prev-btm');
  const nextBtnBtm = overlay.querySelector('#modal-btn-next-btm');

  if (!list || list.length <= 1) {
    if (navGroup) navGroup.style.display = 'none';
    if (btmNav) btmNav.style.display = 'none';
    return;
  }

  if (navGroup) navGroup.style.display = 'inline-flex';
  if (btmNav) btmNav.style.display = 'flex';

  let typeName = 'ENTRY';
  let singular = 'Entry';
  if (type === 'project') { typeName = 'PROJECT'; singular = 'Dossier'; }
  else if (type === 'internship') { typeName = 'INTERNSHIP'; singular = 'Role'; }
  else if (type === 'coursecert') { typeName = 'CERTIFICATE'; singular = 'Certificate'; }
  else if (type === 'cocurricular') { typeName = 'ACTIVITY'; singular = 'Activity'; }

  if (counter) {
    counter.textContent = `${typeName} ${String(index + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;
  }

  if (prevBtnBtm) {
    prevBtnBtm.innerHTML = `<i class="fas fa-arrow-left"></i> Previous ${singular}`;
  }
  if (nextBtnBtm) {
    nextBtnBtm.innerHTML = `Next ${singular} <i class="fas fa-arrow-right"></i>`;
  }
}

function navigateModalPrev() {
  const { type, index, list } = currentModalContext;
  if (!list || list.length <= 1) return;
  const newIndex = (index - 1 + list.length) % list.length;
  const prevItem = list[newIndex];
  if (prevItem) {
    openModal(type, prevItem.id, 0);
  }
}

function navigateModalNext() {
  const { type, index, list } = currentModalContext;
  if (!list || list.length <= 1) return;
  const newIndex = (index + 1) % list.length;
  const nextItem = list[newIndex];
  if (nextItem) {
    openModal(type, nextItem.id, 0);
  }
}

function switchDirectoryModal(targetDir) {
  closeAllProjectsModal();
  closeAllInternshipsModal();
  closeAllCertsModal();
  closeAllCocurrModal();
  if (targetDir === 'projects') {
    openAllProjectsModal();
  } else if (targetDir === 'internships') {
    openAllInternshipsModal();
  } else if (targetDir === 'certs') {
    openAllCertsModal();
  } else if (targetDir === 'cocurr') {
    openAllCocurrModal();
  }
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
      pdfActionBtn.href = sanitizeUrl(current.src);
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

  const list = getListForType(type);
  const foundIndex = list.findIndex(i => i.id === id);
  currentModalContext = {
    type,
    id,
    index: foundIndex >= 0 ? foundIndex : 0,
    list
  };
  updateModalNavUI();

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
    title.innerHTML = `${item.icon ? `<span class="modal-title-emoji">${item.icon}</span>` : ''}<span>${escapeHTML(item.title)}</span>`;
    meta.textContent = item.date;
    setGallery([], 0);
    tags.innerHTML = item.tech.map(t => renderTag(t)).join('');
    link.style.display = 'inline-flex';
    link.href = sanitizeUrl(item.github);
    link.innerHTML = '↗ View on GitHub';

    const demoLink = overlay.querySelector('.modal-link-demo');
    if (demoLink) {
      if (item.demo) {
        demoLink.style.display = 'inline-flex';
        demoLink.href = sanitizeUrl(item.demo);
        demoLink.innerHTML = '↗ View Live Demo';
      } else {
        demoLink.style.display = 'none';
      }
    }

    typeOutDescription(desc, item.description);
  } else if (type === 'internship') {
    eyebrow.textContent = 'INTERNSHIP RECORD';
    const orgEmoji = item.badge ? item.badge.split(' ')[0] : '💼';
    title.innerHTML = `<span class="modal-title-emoji">${orgEmoji}</span><span>${escapeHTML(item.org)}</span>`;
    meta.textContent = `${item.role} · ${item.dates}`;
    setGallery(item.images || [], initialDocIndex);
    tags.innerHTML = item.tech.map(t => renderTag(t)).join('');
    link.style.display = 'none';
    typeOutDescription(desc, item.description);
  } else if (type === 'coursecert') {
    eyebrow.textContent = 'CERTIFICATE RECORD';
    const certEmoji = item.badge ? item.badge.split(' ')[0] : '📜';
    title.innerHTML = `<span class="modal-title-emoji">${certEmoji}</span><span>${escapeHTML(item.title)}</span>`;
    meta.textContent = item.issuer;
    setGallery([{ src: item.image, label: item.badge ? item.badge.replace(/^[^\w]+/, '').trim() : 'Course Certificate' }], 0);
    tags.innerHTML = '';
    link.style.display = 'none';
    typeOutDescription(desc, item.description || '');
  } else if (type === 'cocurricular') {
    eyebrow.textContent = 'ACTIVITY LOG — WHAT I LEARNED';
    const actEmoji = item.badge ? item.badge.split(' ')[0] : '🏆';
    title.innerHTML = `<span class="modal-title-emoji">${actEmoji}</span><span>${escapeHTML(item.title)}</span>`;
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
      i++;
      modalTypeTimer = setTimeout(tick, 22);
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

  if (returnToDirectory === 'projects') {
    returnToDirectory = null;
    openAllProjectsModal();
  } else if (returnToDirectory === 'internships') {
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
   All Projects Directory Popup Modal
   -------------------------------------------------------------------------- */

function openAllProjectsModal() {
  const modal = document.getElementById('all-projects-modal');
  if (!modal) return;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  const modalBox = modal.querySelector('.modal-box');
  if (modalBox) modalBox.scrollTop = 0;
  const searchInput = document.getElementById('project-search-input');
  if (searchInput) {
    searchInput.value = '';
    renderAllProjectsCards('');
    setTimeout(() => searchInput.focus(), 80);
  }
}

function closeAllProjectsModal() {
  const modal = document.getElementById('all-projects-modal');
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  if (!returnToDirectory) {
    document.body.classList.remove('modal-open');
  }
}

function renderAllProjectsCards(filterQuery = '') {
  const container = document.getElementById('all-projects-list');
  const countBadge = document.getElementById('projects-count-badge');
  if (!container) return;

  const q = filterQuery.trim().toLowerCase();
  const filtered = SITE_DATA.projects.filter(item => {
    if (!q) return true;
    const matchTitle = (item.title || '').toLowerCase().includes(q);
    const matchSummary = (item.summary || '').toLowerCase().includes(q);
    const matchDesc = (item.description || '').toLowerCase().includes(q);
    const matchTech = (item.tech || []).some(t => t.toLowerCase().includes(q));
    const matchBadge = (item.badge || '').toLowerCase().includes(q);
    return matchTitle || matchSummary || matchDesc || matchTech || matchBadge;
  });

  if (countBadge) {
    countBadge.textContent = `${filtered.length} / ${SITE_DATA.projects.length} RECORDS`;
  }

  if (!filtered.length) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; color: var(--text-2); font-family: var(--font-mono); font-size: 0.9rem;">
        &gt; no project dossiers match "${escapeHTML(filterQuery)}". Try another query_
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const techTags = (item.tech || []).slice(0, 4).map(t => renderTag(t)).join('');

    return `
      <div class="all-internship-card ${item.badgeClass || 'badge-hackathon'}" data-project-id="${item.id}">
        <div class="aic-header">
          ${item.badge ? `<div class="badge-icon" style="margin-bottom:8px;">${item.badge}</div>` : ''}
          <div class="aic-org"><span>${item.icon || '💻'}</span> ${escapeHTML(item.title)}</div>
          <div class="aic-role">${escapeHTML(item.date)}${item.demo ? ' · <span class="live-badge">● LIVE DEMO</span>' : ''}</div>
          <div class="aic-dates"><i class="fab fa-github"></i> Open Source Repository</div>
        </div>
        <p class="aic-desc">${escapeHTML(item.summary)}</p>
        <div class="aic-footer">
          <div class="aic-tech-row">${techTags}</div>
          <div class="aic-action-btn">
            <span>Inspect Project Dossier</span>
            <i class="fas fa-arrow-right"></i>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.all-internship-card').forEach(card => {
    card.addEventListener('click', () => {
      const projectId = card.dataset.projectId;
      returnToDirectory = 'projects';
      closeAllProjectsModal();
      openModal('project', projectId, 0);
    });
  });
}

function initAllProjectsModal() {
  const modal = document.getElementById('all-projects-modal');
  if (!modal) return;
  const topBtn = document.getElementById('btn-all-projects-top');
  const btmBtn = document.getElementById('btn-all-projects-bottom');
  const closeBtn = document.getElementById('all-projects-close');
  const footerCloseBtn = document.getElementById('btn-close-projects-footer');
  const searchInput = document.getElementById('project-search-input');

  if (topBtn) topBtn.addEventListener('click', openAllProjectsModal);
  if (btmBtn) btmBtn.addEventListener('click', openAllProjectsModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeAllProjectsModal();
  });

  if (closeBtn) closeBtn.addEventListener('click', closeAllProjectsModal);
  if (footerCloseBtn) footerCloseBtn.addEventListener('click', closeAllProjectsModal);

  modal.querySelectorAll('.modal-dir-tab[data-switch-dir]').forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.stopPropagation();
      switchDirectoryModal(tab.dataset.switchDir);
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderAllProjectsCards(e.target.value);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeAllProjectsModal();
    }
  });

  renderAllProjectsCards('');
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

    const techTags = (item.tech || []).map(t => renderTag(t)).join('');

    return `
      <div class="all-internship-card ${item.badgeClass || ''}" data-intern-id="${item.id}">
        <div class="aic-header">
          ${item.badge ? `<div class="badge-icon" style="margin-bottom:8px;">${item.badge}</div>` : ''}
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
  const modal = document.getElementById('all-internships-modal');
  if (!modal) return;
  const topBtn = document.getElementById('btn-all-internships-top');
  const btmBtn = document.getElementById('btn-all-internships-bottom');
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
  const footerCloseBtn = document.getElementById('btn-close-internships-footer');
  if (footerCloseBtn) footerCloseBtn.addEventListener('click', closeAllInternshipsModal);

  modal.querySelectorAll('.modal-dir-tab[data-switch-dir]').forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.stopPropagation();
      switchDirectoryModal(tab.dataset.switchDir);
    });
  });

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
  const modal = document.getElementById('all-certs-modal');
  if (!modal) return;
  const topBtn = document.getElementById('btn-all-certs-top');
  const btmBtn = document.getElementById('btn-all-certs-bottom');
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
  const footerCloseBtn = document.getElementById('btn-close-certs-footer');
  if (footerCloseBtn) footerCloseBtn.addEventListener('click', closeAllCertsModal);

  modal.querySelectorAll('.modal-dir-tab[data-switch-dir]').forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.stopPropagation();
      switchDirectoryModal(tab.dataset.switchDir);
    });
  });

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
  const modal = document.getElementById('all-cocurr-modal');
  if (!modal) return;
  const topBtn = document.getElementById('btn-all-cocurr-top');
  const btmBtn = document.getElementById('btn-all-cocurr-bottom');
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
  const footerCloseBtn = document.getElementById('btn-close-cocurr-footer');
  if (footerCloseBtn) footerCloseBtn.addEventListener('click', closeAllCocurrModal);

  modal.querySelectorAll('.modal-dir-tab[data-switch-dir]').forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.stopPropagation();
      switchDirectoryModal(tab.dataset.switchDir);
    });
  });

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
   Contact form (Formspree with honeypot, anti-abuse firewall, fake email
   filtering, rate limiting, and terminal security challenge)
   -------------------------------------------------------------------------- */

const BANNED_PATTERNS = [
  // Hindi / Hinglish abuse, slurs & troll patterns
  /\b(chutiya|chutiye|chutye|chootiya|choot|chut|bhenchod|benchod|banchod|behenchod|bc|mc|madarchod|madarjaat|maderchod|gandu|gaand|gand|lodu|lauda|laude|lawda|lawde|bhosadi|bhosdike|bhosadike|harami|kamine|kutta|kamina|saale|sala|randi|rndi|tatte|tatto|tatton|bhadwe|bhadva)\b/i,
  /\b(baap\s+ko|tere\s+baap|chal\s+naa|apne\s+baap|teri\s+maa|teri\s+behen)\b/i,
  // English vulgarity, harassment & insults
  /\b(fuck|fucker|fucking|fck|fuk|shit|bullshit|bitch|bastard|asshole|dick|cock|pussy|whore|slut|retard|stfu|dumbass|moron)\b/i
];

function containsAbuse(text) {
  if (!text) return false;
  // Normalize common leetspeak substitutions
  const clean = text.toLowerCase().replace(/[@$!01345]/g, c => ({ '@':'a', '$':'s', '!':'i', '0':'o', '1':'i', '3':'e', '4':'a', '5':'s' }[c] || c));
  return BANNED_PATTERNS.some(regex => regex.test(clean));
}

function isGibberishOrTroll(text) {
  if (!text) return false;
  const clean = text.toLowerCase().trim();

  // 1. Stretched character repetition e.g. "hoooooooooooo", "heeeeee", "aaaaaa"
  if (/(.)\1{3,}/i.test(clean)) return true;

  // 2. Repeated laughter or syllable patterns e.g. "heee heee hee", "ha ha ha", "ho ho ho", "lol lol lol"
  if (/(?:^|\s)(he+|ha+|ho+|hi+|hue+|ja+|lol+)(?:\s+(he+|ha+|ho+|hi+|hue+|ja+|lol+)){1,}(?:\s|$)/i.test(clean)) {
    return true;
  }

  // 3. Syllables looped without spaces e.g. "hehehe", "hahaha", "hohoho", "huehuehue", "lololol"
  if (/(he){2,}|(ha){2,}|(ho){2,}|(hi){2,}|(ja){2,}|(lol){2,}|(hue){2,}/i.test(clean.replace(/\s+/g, ''))) {
    return true;
  }

  // 4. Consecutive repeated words e.g. "word word word"
  if (/\b([a-zA-Z0-9]+)\s+\1\s+\1\b/i.test(clean)) return true;

  // 5. Internet troll laughter keywords
  if (/\b(hehe+|haha+|hoho+|hihi+|huehue+|jaja+|lolol+|rofl+|lmao+|lmfao+)\b/i.test(clean)) return true;

  // 6. Low character entropy / repetitive character pool over length 8+
  const stripped = clean.replace(/[^a-z0-9]/gi, '');
  if (stripped.length >= 8) {
    const uniqueChars = new Set(stripped.split('')).size;
    if (uniqueChars <= 3) return true;
  }

  // 7. Keyboard mash: 6+ consonants in a row with no vowels
  if (/[bcdfghjklmnpqrstvwxyz]{6,}/i.test(clean)) return true;

  // 8. Keyboard row sequences
  if (/(asdfgh|qwerty|zxcvbn|123456)/i.test(clean)) return true;

  return false;
}

function isSuspiciousEmail(email) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return true;
  const parts = email.toLowerCase().split('@');
  if (parts.length !== 2) return true;
  const [local, domain] = parts;

  // Troll local parts (e.g., hehehehehe, marzimeri, hoooo, fake, spam)
  if (/^(he+|ha+|ho+|hi+|hue+|jaja+|marzimeri|nobody|spam|trash|fake|test|dummy|random|anon|noname|admin|user)[0-9_.-]*$/i.test(local)) {
    return true;
  }

  // Obvious repeated substrings or excessive character repetition
  if (/(.)\1{3,}/.test(local)) return true;
  if (/(he){2,}|(ha){2,}|(ho){2,}|(ja){2,}|(lol){2,}/.test(local)) return true;

  // Low entropy in local part
  const localLetters = local.replace(/[^a-z0-9]/g, '');
  if (localLetters.length >= 6 && new Set(localLetters.split('')).size <= 2) {
    return true;
  }

  // Common disposable / throwaway domains
  const disposableDomains = [
    'tempmail.com', 'throwawaymail.com', 'mailinator.com', 'guerrillamail.com',
    '10minutemail.com', 'sharklasers.com', 'yopmail.com', 'getnada.com',
    'trashmail.com', 'temp-mail.org', 'dispostable.com', 'fakemailgenerator.com',
    'burnermail.io', 'dropmail.me', 'mohmal.com'
  ];
  if (disposableDomains.some(d => domain === d || domain.endsWith('.' + d))) {
    return true;
  }

  const tld = domain.split('.').pop();
  if (!tld || tld.length < 2) return true;

  return false;
}

function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const status = document.getElementById('formStatus');
  const btnSubmit = document.getElementById('btn-term-submit') || form.querySelector('button[type="submit"]');

  const inputName = form.querySelector('#name');
  const inputEmail = form.querySelector('#email');
  const inputSubject = form.querySelector('#subject');
  const inputMessage = form.querySelector('#message');

  const errName = document.getElementById('err-name');
  const errEmail = document.getElementById('err-email');
  const errSubject = document.getElementById('err-subject');
  const errMessage = document.getElementById('err-message');
  const msgCharCounter = document.getElementById('msg-char-counter');

  function showHudStatus(type, title, message) {
    if (!status) return;
    const icons = {
      err: 'fa-shield-halved',
      warn: 'fa-hourglass-half',
      ok: 'fa-circle-check',
      busy: 'fa-circle-notch'
    };
    const iconClass = icons[type] || 'fa-circle-info';
    const spinClass = type === 'busy' ? ' fa-spin' : '';

    status.innerHTML = `
      <div class="form-status-hud hud-${type}">
        <div class="hud-icon"><i class="fas ${iconClass}${spinClass}"></i></div>
        <div class="hud-content">
          <div class="hud-header">[${escapeHTML(title)}]</div>
          <div class="hud-msg">${escapeHTML(message)}</div>
        </div>
      </div>
    `;
  }

  function clearAllFieldErrors() {
    [inputName, inputEmail, inputSubject, inputMessage].forEach(input => {
      if (input) input.classList.remove('is-invalid');
    });
    [errName, errEmail, errSubject, errMessage].forEach(errEl => {
      if (errEl) {
        errEl.classList.remove('is-visible');
        errEl.innerHTML = '';
      }
    });
  }

  function setFieldError(inputEl, errEl, message) {
    if (inputEl) {
      inputEl.classList.remove('is-invalid');
      void inputEl.offsetWidth; // re-trigger animation
      inputEl.classList.add('is-invalid');
      inputEl.focus();
    }
    if (errEl) {
      errEl.innerHTML = `<i class="fas fa-triangle-exclamation"></i> <span>$ err: ${escapeHTML(message)}</span>`;
      errEl.classList.add('is-visible');
    }
  }

  // Live character counter for message
  const MIN_MSG_CHARS = 15;
  function updateCharCounter() {
    if (!inputMessage || !msgCharCounter) return;
    const len = inputMessage.value.trim().length;
    if (len === 0) {
      msgCharCounter.textContent = `0 / ${MIN_MSG_CHARS} chars min`;
      msgCharCounter.className = 'term-char-counter';
    } else if (len < MIN_MSG_CHARS) {
      msgCharCounter.textContent = `${len} / ${MIN_MSG_CHARS} chars (${MIN_MSG_CHARS - len} needed)`;
      msgCharCounter.className = 'term-char-counter is-low';
    } else {
      msgCharCounter.textContent = `✓ ${len} chars (valid)`;
      msgCharCounter.className = 'term-char-counter is-valid';
    }
  }

  if (inputMessage) {
    inputMessage.addEventListener('input', () => {
      updateCharCounter();
      if (inputMessage.classList.contains('is-invalid')) {
        inputMessage.classList.remove('is-invalid');
        if (errMessage) errMessage.classList.remove('is-visible');
      }
    });
  }

  // Clear field errors as user types in inputs
  [
    [inputName, errName],
    [inputEmail, errEmail],
    [inputSubject, errSubject]
  ].forEach(([input, errEl]) => {
    if (input) {
      input.addEventListener('input', () => {
        if (input.classList.contains('is-invalid')) {
          input.classList.remove('is-invalid');
          if (errEl) errEl.classList.remove('is-visible');
        }
      });
    }
  });

  updateCharCounter();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllFieldErrors();

    // 1. Honeypot check for automated spam bots
    const gotcha = form.querySelector('input[name="_gotcha"]');
    if (gotcha && gotcha.value.trim() !== '') {
      showHudStatus('ok', 'PAYLOAD DELIVERED', 'Your message has been processed successfully.');
      form.reset();
      updateCharCounter();
      return;
    }

    // 2. Client-side Rate Limiting (90 second cooldown between submissions)
    const COOLDOWN_MS = 90 * 1000;
    const lastSubmitTime = parseInt(localStorage.getItem('portfolio_last_submit_ts') || '0', 10);
    const now = Date.now();
    if (now - lastSubmitTime < COOLDOWN_MS) {
      const waitSec = Math.ceil((COOLDOWN_MS - (now - lastSubmitTime)) / 1000);
      showHudStatus('warn', 'TRANSMISSION THROTTLED', `Rate limit active. Please wait ${waitSec}s before transmitting another message.`);
      return;
    }

    const name = inputName?.value?.trim() || '';
    const email = inputEmail?.value?.trim() || '';
    const subject = inputSubject?.value?.trim() || '';
    const message = inputMessage?.value?.trim() || '';

    // 3. Sender Name Validation
    if (!name) {
      setFieldError(inputName, errName, 'Name field cannot be blank.');
      showHudStatus('err', 'FIELD REQUIRED', 'Please specify your name before transmitting.');
      return;
    }
    if (containsAbuse(name)) {
      setFieldError(inputName, errName, 'Inappropriate or abusive name detected.');
      showHudStatus('err', 'SECURITY FIREWALL', 'Inappropriate sender name detected. Transmission blocked.');
      return;
    }
    if (isGibberishOrTroll(name)) {
      setFieldError(inputName, errName, 'Repetitive laughter or gibberish name detected.');
      showHudStatus('warn', 'SPAM FILTER BLOCKED', 'Repetitive laughter or gibberish detected in sender name.');
      return;
    }
    if (name.length < 2 || /^[^a-zA-Z\s]+$/.test(name) || /^(test|asdf|qwerty|none|na|xyz|admin)$/i.test(name)) {
      setFieldError(inputName, errName, 'Please enter a genuine name (min 2 letters).');
      showHudStatus('err', 'VALIDATION ERROR', 'Sender name must be at least 2 characters.');
      return;
    }

    // 4. Email Validation
    if (!email) {
      setFieldError(inputEmail, errEmail, 'Email address is required for a response.');
      showHudStatus('err', 'FIELD REQUIRED', 'Please provide an email address so I can get back to you.');
      return;
    }
    if (containsAbuse(email)) {
      setFieldError(inputEmail, errEmail, 'Inappropriate content in email address.');
      showHudStatus('err', 'SECURITY FIREWALL', 'Inappropriate email address detected. Transmission blocked.');
      return;
    }
    if (isSuspiciousEmail(email) || isGibberishOrTroll(email.split('@')[0])) {
      setFieldError(inputEmail, errEmail, 'Please provide a valid, verifiable email (e.g. name@domain.com).');
      showHudStatus('err', 'VERIFICATION FAILED', 'Disposable, repetitive, or fake emails are rejected.');
      return;
    }

    // 5. Subject Validation
    if (!subject) {
      setFieldError(inputSubject, errSubject, 'Subject field is required.');
      showHudStatus('err', 'FIELD REQUIRED', 'Please provide a reason or subject for your inquiry.');
      return;
    }
    if (containsAbuse(subject)) {
      setFieldError(inputSubject, errSubject, 'Inappropriate language in subject.');
      showHudStatus('err', 'SECURITY FIREWALL', 'Offensive content detected in subject line. Transmission blocked.');
      return;
    }
    if (isGibberishOrTroll(subject)) {
      setFieldError(inputSubject, errSubject, 'Repetitive laughter or gibberish detected in subject.');
      showHudStatus('warn', 'SPAM FILTER BLOCKED', 'Repetitive laughter, stretched sounds, or spam detected in subject.');
      return;
    }
    if (subject.length < 3) {
      setFieldError(inputSubject, errSubject, 'Subject must contain at least 3 characters.');
      showHudStatus('err', 'VALIDATION ERROR', 'Subject is too brief.');
      return;
    }

    // 6. Message Validation
    if (!message) {
      setFieldError(inputMessage, errMessage, 'Message body cannot be empty.');
      showHudStatus('err', 'FIELD REQUIRED', 'Please type your message in the message area.');
      return;
    }
    if (containsAbuse(message)) {
      setFieldError(inputMessage, errMessage, 'Inappropriate or abusive language detected.');
      showHudStatus('err', 'SECURITY FIREWALL', 'Offensive content detected in message body. Transmission blocked.');
      return;
    }
    if (isGibberishOrTroll(message)) {
      setFieldError(inputMessage, errMessage, 'Repetitive laughter, sound stretching, or spam detected.');
      showHudStatus('warn', 'SPAM FILTER BLOCKED', 'Repetitive laughter, sound stretching (e.g. hoooo/heeee), or gibberish detected. Please write a genuine inquiry.');
      return;
    }
    if (message.length < MIN_MSG_CHARS) {
      setFieldError(inputMessage, errMessage, `Please use at least ${MIN_MSG_CHARS} characters (currently using ${message.length} chars, need ${MIN_MSG_CHARS - message.length} more).`);
      showHudStatus('err', 'VALIDATION ERROR', `Inquiry is too brief (${message.length}/${MIN_MSG_CHARS} min chars). Please provide more details.`);
      return;
    }
    if (/^(.)\1{8,}$/.test(message.replace(/\s+/g, ''))) {
      setFieldError(inputMessage, errMessage, 'Repetitive character sequence detected.');
      showHudStatus('err', 'VALIDATION ERROR', 'Repetitive text detected. Please enter a genuine inquiry.');
      return;
    }

    // 7. Transmission to Formspree
    showHudStatus('busy', 'ENCRYPTING & TRANSMITTING', 'Dispatching secure payload to server...');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = 'Transmitting... <i class="fas fa-spinner fa-spin"></i>';
    }

    try {
      const formData = new FormData(form);

      const res = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' }
      });

      if (res.ok) {
        localStorage.setItem('portfolio_last_submit_ts', Date.now().toString());
        showHudStatus('ok', 'PAYLOAD DELIVERED', 'Your message has been securely sent to Aman. I will get back to you shortly!');
        form.reset();
        updateCharCounter();
      } else {
        const data = await res.json().catch(() => null);
        if (data && data.errors && data.errors.length) {
          throw new Error(data.errors.map(err => err.message).join(', '));
        }
        throw new Error('failed');
      }
    } catch (err) {
      console.warn('Form submission error:', err);
      const userMsg = err?.message && err.message !== 'failed'
        ? err.message
        : 'Failed to reach endpoint. Please email directly at amangour5488@gmail.com.';
      showHudStatus('err', 'TRANSMISSION ERROR', userMsg);
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = './send_message.sh <i class="fas fa-paper-plane"></i>';
      }
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
      const safeHref = sanitizeUrl(href);
      if (safeHref === '#') return;
      e.preventDefault();
      if (el) el.classList.add('is-active');
      setTimeout(() => { window.location.href = safeHref; }, 320);
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

function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '#';
  const trimmed = url.trim();
  if (/^(https?:|mailto:|tel:|\/|\.\/|\.\.\/|#)/i.test(trimmed)) {
    return trimmed;
  }
  return '#';
}

/* --------------------------------------------------------------------------
   Floating Back to Top Button (~/top)
   -------------------------------------------------------------------------- */

function initBackToTop() {
  const btn = document.getElementById('btn-back-to-top');
  if (!btn) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (window.scrollY > 350) {
          btn.classList.add('is-visible');
        } else {
          btn.classList.remove('is-visible');
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/* --------------------------------------------------------------------------
   Cyber HUD Toast Notification System
   -------------------------------------------------------------------------- */

let cyberToastTimer = null;

function showCyberToast(htmlContent, duration = 3000) {
  const toast = document.getElementById('cyber-toast');
  if (!toast) return;

  toast.innerHTML = htmlContent;
  toast.classList.add('show');

  if (cyberToastTimer) clearTimeout(cyberToastTimer);

  cyberToastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}