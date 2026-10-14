(() => {
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });


  // ---------- hero: dot → semicircle (load) / semicircle → dot (scroll) / horizontal pin ----------
  const pattern = document.getElementById('heroPattern');
  const hscroll = document.getElementById('hscroll');
  const track = document.getElementById('hscrollTrack');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pinMq = window.matchMedia('(min-width: 1025px)');
  const DOT = 14;                 // dot diameter (px)
  const ROWS = 3;
  const CELL_RATIO = 318.5 / 301.25; // Figma cell w/h
  const LOAD_MS = 900;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  let cells = [];
  let cols = 0, cw = 0, ch = 0;
  const t0 = performance.now();
  let loadDone = reduced;
  let raf = null;
  let pointer = null;             // viewport coords
  const canHover = window.matchMedia('(hover: hover)').matches;

  const build = () => {
    const w = pattern.clientWidth, h = pattern.clientHeight;
    ch = h / ROWS;
    cols = Math.max(2, Math.round(w / (ch * CELL_RATIO)));
    cw = w / cols;
    pattern.style.setProperty('--cols', cols);
    pattern.style.setProperty('--rows', ROWS);
    pattern.innerHTML = '';
    cells = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < cols; c++) {
        const li = document.createElement('li');
        const sp = document.createElement('span');
        const accent = r === 1 && c === 1;
        if (accent) li.classList.add('is-accent');
        li.appendChild(sp);
        pattern.appendChild(li);
        // type by column: 0 → right-round (D), 1 → bottom-round (U), 2 → top-round (∩)
        cells.push({ sp, r, c, type: c % 3, accent, h: 0 });
      }
    }
  };

  const scrollProgress = () => {
    if (!pinMq.matches || reduced) return 0;
    const range = hscroll.offsetHeight - window.innerHeight;
    const y = clamp(-hscroll.getBoundingClientRect().top, 0, range);
    return range ? y / range : 0;
  };

  let last = performance.now();
  const render = (now) => {
    raf = null;
    const dt = Math.min(100, Math.max(0, now - last)); last = now;
    const ease = 1 - Math.exp(-dt / 90);
    const s = scrollProgress();
    const phaseA = 0.22;
    const a = clamp(s / phaseA);                       // dot phase progress
    const elapsed = now - t0;
    const gate = canHover && pointer ? 1 - clamp(a * 8) : 0;
    const box = pattern.getBoundingClientRect();
    let busy = false;
    for (const cell of cells) {
      const delay = (cell.c * 55 + cell.r * 40);
      const lt = loadDone ? 1 : clamp((elapsed - delay) / LOAD_MS);
      if (lt < 1) busy = true;
      const q = clamp(a * 2.2 - (cell.c / cols) * 0.6);          // semicircle → dot (left → right)
      const w = clamp((a - 0.55) / 0.35 - (cell.c / cols) * 0.2); // dot → gone
      const t = Math.min(easeOut(lt), 1 - easeInOut(q));
      const vanish = 1 - easeInOut(w);

      // hover: only the cell under the pointer becomes a circle
      let target = 0;
      if (gate) {
        const x = pointer.x - box.left, y = pointer.y - box.top;
        if (x >= cell.c * cw && x < (cell.c + 1) * cw && y >= cell.r * ch && y < (cell.r + 1) * ch) target = gate;
      }
      cell.h += (target - cell.h) * ease;
      if (Math.abs(target - cell.h) > 0.002) busy = true; else cell.h = target;
      const hv = cell.h * t;                                      // only when fully grown

      const circle = Math.min(cw, ch) * 0.9;  // hovered circle sits slightly inside the cell
      const R = cell.type === 0 ? ch / 2 : cw / 2;
      const rad = [0, 0, 0, 0]; // tl tr br bl
      if (cell.type === 0) { rad[1] = R; rad[2] = R; }
      if (cell.type === 1) { rad[2] = R; rad[3] = R; }
      if (cell.type === 2) { rad[0] = R; rad[1] = R; }
      const wPx = lerp(lerp(DOT, cw, t), circle, hv) * lerp(1, .0, 1 - vanish);
      const hPx = lerp(lerp(DOT, ch, t), circle, hv) * lerp(1, .0, 1 - vanish);
      const st = cell.sp.style;
      st.width = wPx + 'px';
      st.height = hPx + 'px';
      st.borderRadius = rad.map((v) => lerp(lerp(DOT / 2, v, t), circle / 2, hv) + 'px').join(' ');
      st.opacity = String(clamp(easeOut(lt) * 4) * vanish);
      st.transform = `translate(-50%,-50%)`;
    }
    // horizontal travel with a hold on every screen: hero → [hold] → Direct → [hold] → Custom
    if (pinMq.matches) {
      const p1 = easeInOut(clamp((s - 0.22) / 0.16));
      const p2 = easeInOut(clamp((s - 0.58) / 0.16));
      track.style.transform = `translate3d(${-(p1 + p2) * window.innerWidth}px,0,0)`;
    } else {
      track.style.transform = '';
    }
    if (busy) raf = requestAnimationFrame(render); else loadDone = true;
  };
  const schedule = () => { if (!raf) raf = requestAnimationFrame(render); };

  if (pattern && hscroll && track) {
    build();
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', () => { build(); schedule(); });
    pinMq.addEventListener('change', schedule);
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      pointer = { x: e.clientX, y: e.clientY };
      schedule();
    }, { passive: true });
    document.addEventListener('pointerleave', () => { pointer = null; schedule(); });
  }

  // ---------- statement: scroll-driven text swap + images shooting up one by one ----------
  const stage = document.getElementById('statement');
  if (stage) {
    const texts = [...stage.querySelectorAll('.statement__text')];
    const imgs = [...stage.querySelectorAll('.statement__img')];
    const N = imgs.length;
    let sraf = null;
    const renderStage = () => {
      sraf = null;
      const range = stage.offsetHeight - window.innerHeight;
      const p = reduced ? 1 : clamp(-stage.getBoundingClientRect().top / range);
      const vh = window.innerHeight;
      const step = Math.min(N - 1, Math.floor(p * N * 0.999));
      texts.forEach((el, i) => {
        el.classList.toggle('is-active', i === step);
        el.classList.toggle('is-past', i < step);
      });
      imgs.forEach((el, i) => {
        // each image shoots from below the screen to above it, staggered along the scroll
        const start = i * 0.18, len = 0.45;
        const k = clamp((p - start) / len);
        const y = lerp(vh * 1.1, -vh * 1.1, k);
        el.style.transform = `translate3d(0,${y}px,0)`;
      });
    };
    const scheduleStage = () => { if (!sraf) sraf = requestAnimationFrame(renderStage); };
    renderStage();
    window.addEventListener('scroll', scheduleStage, { passive: true });
    window.addEventListener('resize', scheduleStage);
  }

  // ---------- impact: sticky, blur clears and list lines fill one by one while scrolling ----------
  const impact = document.getElementById('impact');
  if (impact) {
    const bg = document.getElementById('impactBg');
    const items = [...impact.querySelectorAll('.impact__list li')];
    let iraf = null;
    const renderImpact = () => {
      iraf = null;
      const range = impact.offsetHeight - window.innerHeight;
      const p = reduced ? 1 : clamp(-impact.getBoundingClientRect().top / range);
      bg.style.filter = `blur(${50 * (1 - easeInOut(clamp(p / 0.45)))}px)`;
      items.forEach((li, i) => {
        const a0 = 0.2 + i * 0.2;
        li.style.setProperty('--f', clamp((p - a0) / 0.2).toFixed(3));
      });
    };
    const scheduleImpact = () => { if (!iraf) iraf = requestAnimationFrame(renderImpact); };
    renderImpact();
    window.addEventListener('scroll', scheduleImpact, { passive: true });
    window.addEventListener('resize', scheduleImpact);
  }

  // map arrows are SMIL: pause them for reduced-motion
  if (reduced) document.querySelectorAll('.map__links').forEach((svg) => svg.pauseAnimations && svg.pauseAnimations());

  // ---------- custom cursor: blue dot + fading blue trail ----------
  if (canHover) {
    document.documentElement.classList.add('has-cursor');
    const dot = document.createElement('div');
    dot.className = 'cursor';
    const cv = document.createElement('canvas');
    cv.className = 'cursor-trail';
    document.body.append(cv, dot);
    const ctx = cv.getContext('2d');
    const LIFE = 450;                 // how long a trail point stays (ms)
    const COLOR = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#54b3ff';
    let pts = [];
    let cur = null;
    let trailRaf = null;
    const fit = () => {
      const r = window.devicePixelRatio || 1;
      cv.width = window.innerWidth * r; cv.height = window.innerHeight * r;
      ctx.setTransform(r, 0, 0, r, 0, 0);
    };
    fit();
    window.addEventListener('resize', fit);

    const draw = (now) => {
      trailRaf = null;
      ctx.clearRect(0, 0, cv.width, cv.height);
      pts = pts.filter((p) => now - p.t < LIFE);
      if (pts.length > 1) {
        // single opaque filled ribbon: full width at the cursor, tapering to a sharp point at the tail
        const n = pts.length, L = [], R = [];
        for (let i = 0; i < n; i++) {
          const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(n - 1, i + 1)];
          let dx = p1.x - p0.x, dy = p1.y - p0.y;
          const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
          const half = 1.5 * Math.max(0, 1 - (now - pts[i].t) / LIFE); // 3px max width
          L.push([pts[i].x - dy * half, pts[i].y + dx * half]);
          R.push([pts[i].x + dy * half, pts[i].y - dx * half]);
        }
        ctx.fillStyle = COLOR; ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(L[0][0], L[0][1]);
        for (let i = 1; i < n; i++) ctx.lineTo(L[i][0], L[i][1]);
        for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
        ctx.closePath();
        ctx.fill();
      }
      if (pts.length > 1) trailRaf = requestAnimationFrame(draw);
    };

    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      cur = { x: e.clientX, y: e.clientY };
      dot.style.transform = `translate(${cur.x}px,${cur.y}px) translate(-50%,-50%)`;
      dot.classList.add('is-on');
      if (!reduced) {
        pts.push({ x: cur.x, y: cur.y, t: performance.now() });
        if (!trailRaf) trailRaf = requestAnimationFrame(draw);
      }
    }, { passive: true });
    document.addEventListener('pointerleave', () => dot.classList.remove('is-on'));
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = document.querySelectorAll('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  targets.forEach((el) => io.observe(el));
})();
