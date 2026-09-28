/* ==========================================================================
   Nexus Global Holdings — homepage interactions (vanilla JS, no frameworks)
   Sections:
     1. Setup & helpers
     2. Navigation (scroll state, mobile menu, active link)
     3. Scroll reveals & counters
     4. Parallax
     5. Shared world data (dot-matrix land map)
     6. Hero globe (canvas)
     7. Global reach map (canvas)
     8. Card interactions (glow, tilt)
     9. Process timeline
    10. Testimonials slider
   ========================================================================== */

(() => {
  'use strict';

  /* ---------- 1. Setup & helpers ---------- */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  if (window.lucide) window.lucide.createIcons();
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 2. Navigation ---------- */
  const header = $('#site-header');
  const setHeaderState = () => {
    const scrolled = window.scrollY > 24;
    header.classList.toggle('bg-navy-950/85', scrolled);
    header.classList.toggle('backdrop-blur-xl', scrolled);
    header.classList.toggle('shadow-[0_1px_0_rgba(255,255,255,0.08)]', scrolled);
  };
  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });

  // Mobile menu
  const toggle = $('#menu-toggle');
  const menu = $('#mobile-menu');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) $('a', menu).focus({ preventScroll: true });
  };
  // Keep hidden menu links out of the tab order
  const syncMenuTabbing = () => $$('a', menu).forEach((a) => (a.tabIndex = menu.classList.contains('is-open') ? 0 : -1));
  syncMenuTabbing();
  toggle.addEventListener('click', () => { setMenu(!menu.classList.contains('is-open')); syncMenuTabbing(); });
  $$('a', menu).forEach((a) => a.addEventListener('click', () => { setMenu(false); syncMenuTabbing(); }));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); syncMenuTabbing(); toggle.focus(); }
  });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches) { setMenu(false); syncMenuTabbing(); } });

  // Active nav link based on the section in view
  const navLinks = $$('.nav-link');
  const navTargets = navLinks.map((l) => $(l.getAttribute('href'))).filter(Boolean);
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + entry.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navTargets.forEach((t) => navObserver.observe(t));

  /* ---------- 3. Scroll reveals & counters ---------- */
  const revealEls = $$('[data-reveal], [data-reveal-group]');
  if (reduceMotion) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  const animateCount = (el) => {
    const target = parseInt(el.dataset.count, 10);
    if (reduceMotion) { el.textContent = target; return; }
    const start = performance.now();
    const dur = 1400;
    const tick = (now) => {
      const t = clamp((now - start) / dur, 0, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const countObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((e) => { if (e.isIntersecting) { animateCount(e.target); obs.unobserve(e.target); } });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => countObserver.observe(el));

  /* ---------- 4. Parallax ---------- */
  const parallaxEls = $$('[data-parallax]');
  if (!reduceMotion && parallaxEls.length) {
    let ticking = false;
    const update = () => {
      const vh = window.innerHeight;
      parallaxEls.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const offset = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.parallax);
        el.style.transform = 'translate3d(0,' + (offset - r.height * 0.07) + 'px,0)';
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
    update();
  }

  /* ---------- 5. Shared world data ----------
     Land mask rasterised from Natural Earth (public domain) into a 120x52
     equirectangular grid, latitude 80°N to 58°S, packed as hex. */
  const MAP_W = 120, MAP_H = 52, LAT_TOP = 80, LAT_BOT = -58;
  const MAP_HEX = '00000057effff800e00000060000000000172400fff8000000c01fc02000000018bec07ff800000201fff610000180078bf83ff8000c0237ffffff8087fffcdfac3f80007f87f7ffffffff4fffffff1a3e0600ef7fffffffffff07fffff8841c0003dfffffffffffff0feffff03a040003c3ffffffffff300181fff83e000021dfffffffffe0c00400ffffbf8000701fffffffff80c000007fffbf80007ffffffffffff08000001ffffc40001ffffffffffff00000001ffffc00001fff7fffffffd00000001ffffa00000f7c77ffffff900000001ffff8000078b933fffffe000000001fffe000007057f3ffffe2000000001fffe000000f00fffffff26000000007ffc000007f00fffffff18000000007ff8000007fdffffffff80000000001f0800000fffef7fffff80000000000f0000001fffef8fffff0000000000060800001ffff7f1fffe0000000000072200001ffff7e0f9e0000000000003e000001ffffbc0f1f08000000000007000003ffffb8060708000000000001000003ffffc00603040000000000001f0001fffff80401100000000000003f8000fffff80004040000000000003fe00041fff00008200000000000003fe00001ffe00006e00000000000007ff00001ffc00006e08000000000007ffe0000ff80000229f000000000007fff0000ff800001003800000000003fff0000ff800000001400000000003fff00007f800000001000000000001ffe0000ffc80000039000000000000ffe0000ff98000007d8000000000007fe0000ff1000000ff8000000000007fc00007f3000003ffc10000000000ff000007e1000003ffe00000000000ff000007e0000003ffe00000000000fe000003c0000003ffe00000000000fc00000380000001c7e00000000000f80000000000000003c00000000001f80000000000000001802000000001e00000000000000000006000000000c00000000000000000004000000001c00000000000000000008000000001c00000000000000000000000000001880000000000000000000000000000c00000000000000000000000000000000000000000000000000';
  const landCells = [];
  (() => {
    let bits = '';
    for (const ch of MAP_HEX) bits += parseInt(ch, 16).toString(2).padStart(4, '0');
    for (let r = 0; r < MAP_H; r++) {
      for (let c = 0; c < MAP_W; c++) {
        if (bits[r * MAP_W + c] === '1') {
          landCells.push({
            r, c,
            lat: LAT_TOP - (r + 0.5) * (LAT_TOP - LAT_BOT) / MAP_H,
            lon: -180 + (c + 0.5) * 360 / MAP_W,
          });
        }
      }
    }
  })();

  // Helper: run a canvas loop only while it is on screen
  const whenVisible = (el, onChange) => {
    new IntersectionObserver(([e]) => onChange(e.isIntersecting), { threshold: 0 }).observe(el);
  };

  /* ---------- 6. Hero globe ---------- */
  const globeCanvas = $('#hero-globe');
  if (globeCanvas) {
    const ctx = globeCanvas.getContext('2d');
    const DEG = Math.PI / 180;
    const toVec = (lat, lon) => [Math.cos(lat * DEG) * Math.sin(lon * DEG), Math.sin(lat * DEG), Math.cos(lat * DEG) * Math.cos(lon * DEG)];
    const points = landCells.map((p) => toVec(p.lat, p.lon));

    // Illustrative connections between world regions (not office locations)
    const hubs = { lon: [51.5, -0.1], nyc: [40.7, -74], jhb: [-26.2, 28], dxb: [25.2, 55.3], sgp: [1.3, 103.8], sao: [-23.5, -46.6], syd: [-33.9, 151.2] };
    const arcs = [['lon', 'nyc'], ['lon', 'jhb'], ['dxb', 'sgp'], ['jhb', 'dxb'], ['sao', 'lon'], ['sgp', 'syd'], ['lon', 'dxb']]
      .map(([a, b], i) => ({ a: toVec(...hubs[a]), b: toVec(...hubs[b]), phase: i * 0.37 }));
    const hubVecs = Object.values(hubs).map((h) => toVec(...h));

    const slerp = (a, b, t) => {
      const d = Math.acos(clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1));
      if (d < 1e-6) return a;
      const s = Math.sin(d), wa = Math.sin((1 - t) * d) / s, wb = Math.sin(t * d) / s;
      return [a[0] * wa + b[0] * wb, a[1] * wa + b[1] * wb, a[2] * wa + b[2] * wb];
    };

    let size = 0, dpr = 1, rotY = -0.35, tilt = 0.3, targetTilt = 0.3, tiltX = 0, targetTiltX = 0, running = false, raf = 0;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = globeCanvas.clientWidth;
      globeCanvas.width = size * dpr; globeCanvas.height = size * dpr;
      draw(0);
    };

    const rotate = (v) => {
      // rotate around Y (spin), then around X (tilt), then a slight Z lean from pointer
      const cy = Math.cos(rotY), sy = Math.sin(rotY);
      let x = v[0] * cy + v[2] * sy, z = -v[0] * sy + v[2] * cy, y = v[1];
      const cx = Math.cos(tilt), sx = Math.sin(tilt);
      const y2 = y * cx - z * sx, z2 = y * sx + z * cx;
      const cz = Math.cos(tiltX), sz = Math.sin(tiltX);
      return [x * cz - y2 * sz, x * sz + y2 * cz, z2];
    };

    const draw = (time) => {
      const W = size * dpr, R = W * 0.4, cx = W / 2, cy = W / 2;
      ctx.clearRect(0, 0, W, W);

      // Atmosphere and sphere body
      const glow = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.35);
      glow.addColorStop(0, 'rgba(61,139,255,0.18)'); glow.addColorStop(1, 'rgba(61,139,255,0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, R * 1.35, 0, Math.PI * 2); ctx.fill();
      const body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
      body.addColorStop(0, '#16305A'); body.addColorStop(1, '#0A1628');
      ctx.fillStyle = body; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(156,196,255,0.25)'; ctx.lineWidth = 1 * dpr; ctx.stroke();

      // Land dots (front hemisphere only)
      const dot = Math.max(0.9, R / 190);
      for (let i = 0; i < points.length; i++) {
        const p = rotate(points[i]);
        if (p[2] <= 0) continue;
        ctx.fillStyle = 'rgba(156,196,255,' + (0.18 + p[2] * 0.72).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(cx + p[0] * R, cy - p[1] * R, dot * (0.7 + p[2] * 0.7) * dpr, 0, Math.PI * 2); ctx.fill();
      }

      // Arcs with a travelling highlight
      const SEG = 48;
      arcs.forEach((arc) => {
        const pts = [];
        for (let s = 0; s <= SEG; s++) {
          const t = s / SEG, v = slerp(arc.a, arc.b, t), lift = 1 + 0.14 * Math.sin(Math.PI * t);
          const p = rotate([v[0] * lift, v[1] * lift, v[2] * lift]);
          pts.push({ x: cx + p[0] * R, y: cy - p[1] * R, vis: p[2] > -0.15 });
        }
        ctx.lineWidth = 1.1 * dpr;
        ctx.strokeStyle = 'rgba(61,139,255,0.35)';
        ctx.beginPath();
        let pen = false;
        pts.forEach((p) => { if (p.vis) { pen ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); pen = true; } else pen = false; });
        ctx.stroke();

        const head = ((time / 4200 + arc.phase) % 1) * SEG;
        for (let s = Math.max(0, Math.floor(head) - 8); s < Math.floor(head); s++) {
          const a = pts[s], b = pts[s + 1];
          if (!a || !b || !a.vis || !b.vis) continue;
          ctx.strokeStyle = 'rgba(160,205,255,' + (1 - (head - s) / 8).toFixed(3) + ')';
          ctx.lineWidth = 2 * dpr;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      });

      // Hub markers
      hubVecs.forEach((v, i) => {
        const p = rotate(v);
        if (p[2] <= 0) return;
        const x = cx + p[0] * R, y = cy - p[1] * R;
        const pulse = (time / 2400 + i * 0.21) % 1;
        ctx.strokeStyle = 'rgba(61,139,255,' + (0.6 * (1 - pulse)).toFixed(3) + ')';
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath(); ctx.arc(x, y, (3 + pulse * 10) * dpr, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(x, y, 2.2 * dpr, 0, Math.PI * 2); ctx.fill();
      });
    };

    let last = 0;
    const loop = (t) => {
      const dt = last ? Math.min(t - last, 50) : 16; last = t;
      rotY += dt * 0.00009;
      tilt += (targetTilt - tilt) * 0.05;
      tiltX += (targetTiltX - tiltX) * 0.05;
      draw(t);
      raf = requestAnimationFrame(loop);
    };

    if (!reduceMotion && finePointer) {
      $('#home').addEventListener('pointermove', (e) => {
        const nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
        targetTilt = 0.3 + ny * 0.25; targetTiltX = nx * 0.12;
      });
    }

    window.addEventListener('resize', resize);
    resize();
    if (!reduceMotion) {
      whenVisible(globeCanvas, (vis) => {
        if (vis && !running) { running = true; last = 0; raf = requestAnimationFrame(loop); }
        else if (!vis && running) { running = false; cancelAnimationFrame(raf); }
      });
    }
  }

  /* ---------- 7. Global reach map ---------- */
  const mapCanvas = $('#world-map');
  if (mapCanvas) {
    const ctx = mapCanvas.getContext('2d');
    const tooltip = $('#map-tooltip');
    const regions = {
      na:    { name: 'North America', lat: 40, lon: -98 },
      latam: { name: 'Latin America', lat: -12, lon: -58 },
      eu:    { name: 'Europe',        lat: 49, lon: 10 },
      me:    { name: 'Middle East',   lat: 25, lon: 47 },
      af:    { name: 'Africa',        lat: -8, lon: 24 },
      apac:  { name: 'Asia Pacific',  lat: 12, lon: 112 },
    };
    const links = [['eu', 'na'], ['eu', 'af'], ['eu', 'me'], ['me', 'apac'], ['af', 'me'], ['na', 'latam'], ['latam', 'eu'], ['af', 'apac']];
    let active = null, W = 0, H = 0, dpr = 1, running = false, raf = 0;

    const project = (lat, lon) => ({ x: (lon + 180) / 360 * W, y: (LAT_TOP - lat) / (LAT_TOP - LAT_BOT) * H });

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = mapCanvas.clientWidth;
      const cssH = cssW * MAP_H / MAP_W;
      mapCanvas.style.height = cssH + 'px';
      W = cssW * dpr; H = cssH * dpr;
      mapCanvas.width = W; mapCanvas.height = H;
      draw(0);
    };

    const bez = (a, b, c, t) => ({ x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x, y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y });

    const draw = (time) => {
      ctx.clearRect(0, 0, W, H);
      const cell = W / MAP_W;
      const rDot = Math.max(1, cell * 0.28);

      ctx.fillStyle = 'rgba(11,26,46,0.22)';
      landCells.forEach((p) => {
        ctx.beginPath(); ctx.arc((p.c + 0.5) * cell, (p.r + 0.5) * cell * (H / W) * (MAP_W / MAP_H), rDot, 0, Math.PI * 2); ctx.fill();
      });

      links.forEach(([ka, kb], i) => {
        const a = project(regions[ka].lat, regions[ka].lon), b = project(regions[kb].lat, regions[kb].lon);
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        const c = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - dist * 0.28 };
        const on = !active || active === ka || active === kb;
        ctx.strokeStyle = on ? 'rgba(31,79,209,0.55)' : 'rgba(31,79,209,0.12)';
        ctx.lineWidth = (on && active ? 1.8 : 1.2) * dpr;
        ctx.setLineDash([4 * dpr, 5 * dpr]);
        ctx.lineDashOffset = reduceMotion ? 0 : -time / 60;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(c.x, c.y, b.x, b.y); ctx.stroke();
        ctx.setLineDash([]);
        if (on && !reduceMotion) {
          const t = ((time / 3600) + i * 0.17) % 1, p = bez(a, b, c, t);
          ctx.fillStyle = '#3D8BFF';
          ctx.beginPath(); ctx.arc(p.x, p.y, 2.6 * dpr, 0, Math.PI * 2); ctx.fill();
        }
      });

      Object.entries(regions).forEach(([key, r], i) => {
        const p = project(r.lat, r.lon);
        const isActive = active === key;
        const pulse = reduceMotion ? 0.5 : (time / 2600 + i * 0.19) % 1;
        ctx.fillStyle = 'rgba(31,79,209,' + (0.18 * (1 - pulse)).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, (6 + pulse * 18) * dpr, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(p.x, p.y, (isActive ? 8 : 6) * dpr, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = isActive ? '#3D8BFF' : '#1F4FD1';
        ctx.beginPath(); ctx.arc(p.x, p.y, (isActive ? 5 : 3.5) * dpr, 0, Math.PI * 2); ctx.fill();
      });
    };

    const setActive = (key) => {
      active = key;
      $$('.region-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.region === key)));
      if (key) {
        const p = project(regions[key].lat, regions[key].lon);
        tooltip.textContent = regions[key].name;
        tooltip.style.left = p.x / dpr + 'px';
        tooltip.style.top = p.y / dpr + 'px';
        tooltip.classList.remove('hidden');
      } else tooltip.classList.add('hidden');
      if (reduceMotion || !running) draw(performance.now());
    };

    $$('.region-btn').forEach((btn) => {
      btn.addEventListener('mouseenter', () => setActive(btn.dataset.region));
      btn.addEventListener('focus', () => setActive(btn.dataset.region));
      btn.addEventListener('click', () => setActive(active === btn.dataset.region ? null : btn.dataset.region));
      btn.addEventListener('mouseleave', () => setActive(null));
      btn.addEventListener('blur', () => setActive(null));
    });

    mapCanvas.addEventListener('pointermove', (e) => {
      const rect = mapCanvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * dpr, y = (e.clientY - rect.top) * dpr;
      let hit = null;
      Object.entries(regions).forEach(([k, r]) => {
        const p = project(r.lat, r.lon);
        if (Math.hypot(p.x - x, p.y - y) < 22 * dpr) hit = k;
      });
      if (hit !== active) setActive(hit);
      mapCanvas.style.cursor = hit ? 'pointer' : 'default';
    });
    mapCanvas.addEventListener('pointerleave', () => setActive(null));

    const loop = (t) => { draw(t); raf = requestAnimationFrame(loop); };
    window.addEventListener('resize', resize);
    resize();
    if (!reduceMotion) {
      whenVisible(mapCanvas, (vis) => {
        if (vis && !running) { running = true; raf = requestAnimationFrame(loop); }
        else if (!vis && running) { running = false; cancelAnimationFrame(raf); }
      });
    }
  }

  /* ---------- 8. Card interactions ---------- */
  // Mouse-follow glow border (regulatory cards)
  $$('.glow-wrap').forEach((wrap) => {
    wrap.addEventListener('pointermove', (e) => {
      $$('.glow-card', wrap).forEach((card) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', e.clientX - r.left + 'px');
        card.style.setProperty('--my', e.clientY - r.top + 'px');
      });
    });
  });

  // Subtle 3D tilt (technology cards) — desktop pointers only
  if (finePointer && !reduceMotion) {
    $$('[data-tilt]').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'rotateX(' + (-py * 6).toFixed(2) + 'deg) rotateY(' + (px * 6).toFixed(2) + 'deg) translateY(-4px)';
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  /* ---------- 9. Process timeline ---------- */
  const timeline = $('#timeline');
  if (timeline) {
    const steps = $$('.step', timeline);
    const updateTimeline = () => {
      const r = timeline.getBoundingClientRect(), vh = window.innerHeight;
      const p = reduceMotion ? 1 : clamp((vh * 0.8 - r.top) / (r.height + vh * 0.25), 0, 1);
      timeline.style.setProperty('--p', p.toFixed(3));
      steps.forEach((s, i) => s.classList.toggle('is-active', p >= i / steps.length + 0.02 || p === 1));
    };
    window.addEventListener('scroll', () => requestAnimationFrame(updateTimeline), { passive: true });
    window.addEventListener('resize', updateTimeline);
    updateTimeline();
  }

  /* ---------- 10. Testimonials slider ---------- */
  const slides = $$('#slides .slide');
  const dots = $$('.slide-dot');
  if (slides.length) {
    let index = 0, timer = null;
    const show = (i) => {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, n) => { s.classList.toggle('is-active', n === index); s.setAttribute('aria-hidden', String(n !== index)); });
      dots.forEach((d, n) => {
        d.setAttribute('aria-selected', String(n === index));
        d.classList.toggle('w-8', n === index); d.classList.toggle('w-4', n !== index);
        d.classList.toggle('bg-navy-900', n === index); d.classList.toggle('bg-navy-900/20', n !== index);
      });
    };
    const start = () => { if (!reduceMotion) { stop(); timer = setInterval(() => show(index + 1), 7000); } };
    const stop = () => clearInterval(timer);

    $('#next-slide').addEventListener('click', () => { show(index + 1); start(); });
    $('#prev-slide').addEventListener('click', () => { show(index - 1); start(); });
    dots.forEach((d, n) => d.addEventListener('click', () => { show(n); start(); }));

    const section = $('#testimonials');
    section.addEventListener('mouseenter', stop);
    section.addEventListener('mouseleave', start);
    section.addEventListener('focusin', stop);
    section.addEventListener('focusout', start);

    // Swipe on touch devices
    let x0 = null;
    const slidesEl = $('#slides');
    slidesEl.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    slidesEl.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) { show(index + (dx < 0 ? 1 : -1)); start(); }
      x0 = null;
    });

    show(0);
    start();
  }
})();
