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
    const easeIn = 1 - Math.exp(-dt / 28);   // snap into a circle
    const easeOutHv = 1 - Math.exp(-dt / 80); // relax back to semicircle
    const s = scrollProgress();
    const phaseA = 1 / 3;
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
      cell.h += (target - cell.h) * (target > cell.h ? easeIn : easeOutHv);
      if (Math.abs(target - cell.h) > 0.002) busy = true; else cell.h = target;
      const hv = cell.h * t;                                      // only when fully grown

      const circle = Math.min(cw, ch);
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
      st.borderRadius = rad.map((v) => lerp(lerp(DOT / 2, v, t), circle / 2, Math.min(1, hv * 2)) + 'px').join(' ');
      st.opacity = String(clamp(easeOut(lt) * 4) * vanish);
      st.transform = `translate(-50%,-50%)`;
    }
    // horizontal travel after the dot phase
    if (pinMq.matches) {
      const b = clamp((s - phaseA) / (1 - phaseA));
      track.style.transform = `translate3d(${-b * (track.scrollWidth - window.innerWidth)}px,0,0)`;
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
