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

  const build = () => {
    const w = pattern.clientWidth, h = pattern.clientHeight;
    ch = h / 4;
    cols = Math.max(2, Math.round(w / (ch * CELL_RATIO)));
    cw = w / cols;
    pattern.style.setProperty('--cols', cols);
    pattern.innerHTML = '';
    cells = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < cols; c++) {
        const li = document.createElement('li');
        const sp = document.createElement('span');
        if (r === 1 && c === 1) li.classList.add('is-accent');
        li.appendChild(sp);
        pattern.appendChild(li);
        // type by column: 0 → right-round (D), 1 → bottom-round (U), 2 → top-round (∩)
        cells.push({ sp, r, c, type: c % 3 });
      }
    }
  };

  const scrollProgress = () => {
    if (!pinMq.matches || reduced) return 0;
    const range = hscroll.offsetHeight - window.innerHeight;
    const y = clamp(-hscroll.getBoundingClientRect().top, 0, range);
    return range ? y / range : 0;
  };

  const render = (now) => {
    raf = null;
    const s = scrollProgress();
    const phaseA = 1 / 3;
    const a = clamp(s / phaseA);                       // dot-collapse progress
    const elapsed = now - t0;
    let loading = false;
    for (const cell of cells) {
      const delay = (cell.c * 55 + cell.r * 40);
      const lt = loadDone ? 1 : clamp((elapsed - delay) / LOAD_MS);
      if (lt < 1) loading = true;
      const q = clamp(a * 1.6 - (cell.c / cols) * 0.6);  // staggered left → right
      const t = Math.min(easeOut(lt), 1 - easeInOut(q));
      const R = cell.type === 0 ? ch / 2 : cw / 2;
      const rad = [0, 0, 0, 0]; // tl tr br bl
      if (cell.type === 0) { rad[1] = R; rad[2] = R; }
      if (cell.type === 1) { rad[2] = R; rad[3] = R; }
      if (cell.type === 2) { rad[0] = R; rad[1] = R; }
      const st = cell.sp.style;
      st.width = lerp(DOT, cw, t) + 'px';
      st.height = lerp(DOT, ch, t) + 'px';
      st.borderRadius = rad.map((v) => lerp(DOT / 2, v, t) + 'px').join(' ');
      st.opacity = String(clamp(easeOut(lt) * 4));
    }
    // horizontal travel after the dot phase
    if (pinMq.matches) {
      const b = clamp((s - phaseA) / (1 - phaseA));
      track.style.transform = `translate3d(${-b * (track.scrollWidth - window.innerWidth)}px,0,0)`;
    } else {
      track.style.transform = '';
    }
    if (loading) raf = requestAnimationFrame(render); else loadDone = true;
  };
  const schedule = () => { if (!raf) raf = requestAnimationFrame(render); };

  if (pattern && hscroll && track) {
    build();
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', () => { build(); schedule(); });
    pinMq.addEventListener('change', schedule);
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
