/* Lane: 10 core areas (ob-). Option D (the wheel) only. A, B and C need no script.
   Everything here is an enhancement: with script off, the segments are jump links beside the full list,
   and on phones the list reads alone.
   With script, at every width, the segments become tabs and the list becomes one panel. Hover only highlights (CSS);
   click, focus, the arrow keys, Home, End, Space and Enter choose, so moving the mouse from the ring to the panel never
   changes it. Under 600px the ring is drawn compact: the viewBox is trimmed to the ring and the titles live in the panel. */
(() => {
  const phone = window.matchMedia('(max-width: 599.98px)');
  const stacked = window.matchMedia('(max-width: 1099.98px)');
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ours = (s) => /^areas-|^what-i-do$/.test(s.id);
  const FULL = '-359 -216 718 432'; // the ring plus every title
  const RING = '-184 -184 368 368'; // the ring alone (outer radius 170, plus the 10-unit step-out of the chosen segment)

  [...document.querySelectorAll('section[data-ob-wheel]')].filter(ours).forEach((root) => {
    const svg = root.querySelector('.ob-wheel__svg');
    const group = root.querySelector('.ob-wheel__segs');
    const segs = [...root.querySelectorAll('.ob-wheel__seg')];
    const panel = root.querySelector('.ob-wheel__panel');
    const list = root.querySelector('.ob-wheel__list');
    const items = [...root.querySelectorAll('.ob-wheel__item')];
    const nav = root.querySelector('.ob-wheel__nav');
    const prev = root.querySelector('.ob-wheel__btn--prev');
    const next = root.querySelector('.ob-wheel__btn--next');
    const hub = root.querySelector('.ob-wheel__hubnum');
    if (!svg || !group || !panel || !list || segs.length !== items.length) return;

    let cur = 0;

    segs.forEach((s, i) => { s.id = items[i].id + '-tab'; });

    function select(i, focus) {
      cur = (i + segs.length) % segs.length;
      segs.forEach((s, k) => {
        const on = k === cur;
        s.classList.toggle('ob-is-active', on);
        s.setAttribute('aria-selected', String(on));
        s.setAttribute('tabindex', on ? '0' : '-1');
      });
      items.forEach((it, k) => it.classList.toggle('ob-is-active', k === cur));
      if (hub) hub.textContent = String(cur + 1).padStart(2, '0');
      if (focus) segs[cur].focus({ preventScroll: true }); // reveal() does the one scroll
    }

    // One scroll, never two. The chosen segment must stay in view below the page's fixed bar (WCAG 2.4.11).
    // Stacked layout (dial above panel): also show as much of the panel as that allows. If the segment and the
    // whole panel fit the window, this is the smallest scroll that shows both; if not, the segment sits just
    // under the bar and the panel runs off the bottom. The target is absolute, so a second call is a no-op.
    function reveal() {
      const bar = document.querySelector('.nav, .gx-bar'); // the live page's nav, or the gallery's bar
      // 8px of air, plus room for the chosen segment's step out of the ring (10 units, up to 10px), which is still moving
      const top = (bar && getComputedStyle(bar).position === 'fixed' ? bar.getBoundingClientRect().bottom : 0) + 18;
      const bottom = window.innerHeight - 8;
      const s = segs[cur].getBoundingClientRect();
      let dy = 0;
      if (stacked.matches) {
        const p = panel.getBoundingClientRect();
        if (p.bottom > bottom) dy = p.bottom - bottom;
      }
      dy = Math.min(Math.max(dy, s.bottom - bottom), s.top - top);
      if (Math.abs(dy) < 1) return;
      window.scrollTo({ top: window.scrollY + dy, behavior: calm.matches ? 'auto' : 'smooth' });
    }

    // go live
    root.classList.add('ob-wheel--live');
    group.setAttribute('role', 'tablist');
    group.setAttribute('aria-label', 'The ten core areas');
    list.setAttribute('role', 'none');
    segs.forEach((s, i) => {
      s.setAttribute('role', 'tab');
      s.setAttribute('aria-controls', items[i].id);
    });
    items.forEach((it, i) => {
      it.setAttribute('role', 'tabpanel');
      it.setAttribute('aria-labelledby', segs[i].id);
      it.setAttribute('tabindex', '0'); // the panel has no focusable content of its own; hidden panels drop out of the tab order
    });
    nav.hidden = false;
    const fromHash = items.findIndex((it) => '#' + it.id === location.hash);
    select(fromHash > -1 ? fromHash : 0);
    list.setAttribute('aria-live', 'polite'); // after the first choice, so only later changes (prev and next too) are announced
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('ob-wheel--ready')));

    const fit = () => svg.setAttribute('viewBox', phone.matches ? RING : FULL);
    fit();
    phone.addEventListener('change', fit);

    segs.forEach((s, i) => {
      s.addEventListener('click', (e) => {
        e.preventDefault();
        select(i);
        reveal();
      });
      s.addEventListener('focus', () => {
        if (i !== cur) select(i);
        reveal();
      });
    });

    group.addEventListener('keydown', (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return; // leave browser shortcuts (Alt+Left, Cmd+Up) alone
      const map = { ArrowRight: cur + 1, ArrowDown: cur + 1, ArrowLeft: cur - 1, ArrowUp: cur - 1, Home: 0, End: segs.length - 1, ' ': cur, Enter: cur };
      if (!(e.key in map)) return;
      e.preventDefault(); // Space would otherwise scroll the page; SVG links do not activate on it
      select(map[e.key], true);
      reveal();
    });
    prev.addEventListener('click', () => select(cur - 1));
    next.addEventListener('click', () => select(cur + 1));
  });
})();
